import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'No autorizado' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    )

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return new Response(JSON.stringify({ error: 'No autorizado' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const { pdfBase64, pageImages = [] } = await req.json()
    if (!pdfBase64) {
      return new Response(JSON.stringify({ error: 'PDF requerido' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const hasImages = pageImages.length > 0

    // Build content: PDF document first
    const content: any[] = [
      {
        type: 'document',
        source: {
          type: 'base64',
          media_type: 'application/pdf',
          data: pdfBase64,
        }
      }
    ]

    // Add page images (cap at 30 to avoid timeouts)
    const pagesToSend = pageImages.slice(0, 30)
    pagesToSend.forEach((img: string, i: number) => {
      content.push({ type: 'text', text: `--- Página ${i + 1} ---` })
      content.push({
        type: 'image',
        source: { type: 'base64', media_type: 'image/jpeg', data: img }
      })
    })

    content.push({
      type: 'text',
      text: `Analizá este catálogo de productos y extraé TODOS los productos que encuentres.

Para cada producto devolvé:
- nombre: nombre completo del producto
- descripcion: descripción breve de para qué sirve (1 oración)
- categoria: categoría o tipo de producto
- codigo: código o número de referencia si tiene, sino dejá vacío
- precio: precio si aparece, sino "Consultar"
- stock: "Disponible" por defecto
${hasImages ? `- pagina: índice de página (0 = primera) donde aparece la imagen principal del producto. Usá -1 si no tiene imagen visible.` : ''}

Devolvé SOLO un JSON válido con este formato exacto, sin texto adicional antes ni después:
{"productos": [{"nombre": "...", "descripcion": "...", "categoria": "...", "codigo": "...", "precio": "Consultar", "stock": "Disponible"${hasImages ? ', "pagina": 0' : ''}}]}`
    })

    const claudeRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': Deno.env.get('CLAUDE_API_KEY')!,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-5',
        max_tokens: 8192,
        messages: [{ role: 'user', content }]
      })
    })

    const claudeData = await claudeRes.json()

    if (!claudeRes.ok) {
      console.error('Claude error:', claudeData)
      return new Response(JSON.stringify({ error: 'Error al procesar el PDF' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const text = claudeData.content[0].text
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      return new Response(JSON.stringify({ error: 'No se pudieron extraer productos' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const productos = JSON.parse(jsonMatch[0])

    return new Response(JSON.stringify(productos), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
