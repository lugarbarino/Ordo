import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function stripHtml(str: string) {
  return (str || '').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim().slice(0, 200)
}

// ── MercadoLibre ──────────────────────────────────────────────
async function importML(nickname: string) {
  // Get seller ID
  const userRes = await fetch(`https://api.mercadolibre.com/users/search?nickname=${encodeURIComponent(nickname)}`)
  const userData = await userRes.json()
  if (!userData.results?.length) throw new Error(`Vendedor "${nickname}" no encontrado en MercadoLibre`)
  const sellerId = userData.results[0].id

  const productos: any[] = []
  let offset = 0

  while (true) {
    const res = await fetch(`https://api.mercadolibre.com/sites/MLA/search?seller_id=${sellerId}&limit=50&offset=${offset}`)
    const data = await res.json()
    const items: any[] = data.results || []
    if (!items.length) break

    for (const item of items) {
      productos.push({
        nombre: item.title,
        descripcion: '',
        categoria: '',
        codigo: item.id,
        precio: `$${item.price}`,
        stock: (item.available_quantity || 0) > 0 ? 'Disponible' : 'Sin stock',
        imagen_url: (item.thumbnail || '').replace('-I.jpg', '-O.jpg'),
      })
    }

    if (items.length < 50) break
    offset += 50
    if (offset >= 500) break
  }

  return productos
}

// ── Tiendanube ────────────────────────────────────────────────
async function importTiendanube(storeId: string, token: string) {
  const productos: any[] = []
  let page = 1

  while (true) {
    const res = await fetch(
      `https://api.tiendanube.com/v1/${storeId}/products?per_page=200&page=${page}`,
      { headers: { 'Authentication': `bearer ${token}`, 'User-Agent': 'Ordo/1.0' } }
    )
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err.description || `Error Tiendanube: ${res.status}`)
    }
    const items: any[] = await res.json()
    if (!items.length) break

    for (const item of items) {
      const nombre = typeof item.name === 'object'
        ? (item.name.es || item.name.pt || Object.values(item.name)[0] || '')
        : (item.name || '')
      const desc = typeof item.description === 'object'
        ? (item.description.es || item.description.pt || Object.values(item.description)[0] || '')
        : (item.description || '')
      const cat = item.categories?.[0]?.name
      const catNombre = typeof cat === 'object'
        ? (cat.es || cat.pt || Object.values(cat)[0] || '')
        : (cat || '')

      productos.push({
        nombre,
        descripcion: stripHtml(desc),
        categoria: catNombre,
        codigo: item.sku || '',
        precio: item.price ? `$${item.price}` : 'Consultar',
        stock: item.stock !== null && item.stock !== undefined ? (item.stock > 0 ? 'Disponible' : 'Sin stock') : 'Disponible',
        imagen_url: item.images?.[0]?.src || '',
      })
    }

    if (items.length < 200) break
    page++
    if (page > 5) break
  }

  return productos
}

// ── WooCommerce ───────────────────────────────────────────────
async function importWooCommerce(url: string, consumerKey: string, consumerSecret: string) {
  const base = url.replace(/\/$/, '')
  const productos: any[] = []
  let page = 1

  while (true) {
    const apiUrl = `${base}/wp-json/wc/v3/products?per_page=100&page=${page}&status=publish&consumer_key=${consumerKey}&consumer_secret=${consumerSecret}`
    const res = await fetch(apiUrl)
    if (!res.ok) throw new Error(`Error WooCommerce: ${res.status}. Verificá la URL y las credenciales.`)
    const items: any[] = await res.json()
    if (!items.length) break

    for (const item of items) {
      productos.push({
        nombre: item.name,
        descripcion: stripHtml(item.short_description || item.description),
        categoria: item.categories?.[0]?.name || '',
        codigo: item.sku || '',
        precio: item.price ? `$${item.price}` : 'Consultar',
        stock: item.stock_status === 'instock' ? 'Disponible' : 'Sin stock',
        imagen_url: item.images?.[0]?.src || '',
      })
    }

    if (items.length < 100) break
    page++
    if (page > 10) break
  }

  return productos
}

// ── Shopify ───────────────────────────────────────────────────
async function importShopify(shop: string, token: string) {
  const base = shop.startsWith('http') ? shop.replace(/\/$/, '') : `https://${shop.replace(/\/$/, '')}`
  const productos: any[] = []
  let pageInfo = ''

  while (true) {
    const url = pageInfo
      ? `${base}/admin/api/2024-01/products.json?limit=250&page_info=${pageInfo}`
      : `${base}/admin/api/2024-01/products.json?limit=250`

    const res = await fetch(url, { headers: { 'X-Shopify-Access-Token': token } })
    if (!res.ok) throw new Error(`Error Shopify: ${res.status}. Verificá la URL y el token.`)
    const data = await res.json()
    const items: any[] = data.products || []

    for (const item of items) {
      const variant = item.variants?.[0]
      productos.push({
        nombre: item.title,
        descripcion: stripHtml(item.body_html),
        categoria: item.product_type || '',
        codigo: variant?.sku || '',
        precio: variant?.price ? `$${variant.price}` : 'Consultar',
        stock: (variant?.inventory_quantity || 0) > 0 ? 'Disponible' : 'Sin stock',
        imagen_url: item.images?.[0]?.src || '',
      })
    }

    const link = res.headers.get('Link') || ''
    const next = link.match(/<[^>]*page_info=([^>&"]+)[^>]*>;\s*rel="next"/)
    if (!next || items.length < 250) break
    pageInfo = next[1]
    if (productos.length >= 1000) break
  }

  return productos
}

// ── Main handler ──────────────────────────────────────────────
serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) return new Response(JSON.stringify({ error: 'No autorizado' }), {
      status: 401, headers: { ...cors, 'Content-Type': 'application/json' }
    })

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    )
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return new Response(JSON.stringify({ error: 'No autorizado' }), {
      status: 401, headers: { ...cors, 'Content-Type': 'application/json' }
    })

    const body = await req.json()
    const { platform } = body
    let productos: any[] = []

    switch (platform) {
      case 'mercadolibre':
        if (!body.nickname) throw new Error('Falta el nickname del vendedor')
        productos = await importML(body.nickname)
        break
      case 'tiendanube':
        if (!body.store_id || !body.token) throw new Error('Faltan store_id y token')
        productos = await importTiendanube(body.store_id, body.token)
        break
      case 'woocommerce':
        if (!body.url || !body.consumer_key || !body.consumer_secret) throw new Error('Faltan URL y credenciales')
        productos = await importWooCommerce(body.url, body.consumer_key, body.consumer_secret)
        break
      case 'shopify':
        if (!body.shop || !body.token) throw new Error('Faltan URL de tienda y token')
        productos = await importShopify(body.shop, body.token)
        break
      default:
        return new Response(JSON.stringify({ error: 'Plataforma no soportada' }), {
          status: 400, headers: { ...cors, 'Content-Type': 'application/json' }
        })
    }

    return new Response(JSON.stringify({ productos }), {
      headers: { ...cors, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...cors, 'Content-Type': 'application/json' }
    })
  }
})
