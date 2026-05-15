export const FIRMA_TEMPLATES = [
  { key: 'clasica',     label: 'Clásica'     },
  { key: 'apilada',     label: 'Apilada'     },
  { key: 'minimalista', label: 'Minimalista' },
  { key: 'compacta',    label: 'Compacta'    },
]

export function generarHtmlFirma({ firma, logoUrl, logoSize = 80, acento, template = 'clasica' }) {
  const email    = firma.email    || ''
  const web      = (firma.web || '').replace(/^https?:\/\//, '')
  const webHref  = web ? `https://${web}` : ''
  const wpNum    = (firma.telefono || '').replace(/\D/g, '')
  const wpHref   = wpNum ? `https://wa.me/${wpNum}` : ''
  const nombre   = firma.nombre   || ''
  const cargo    = firma.cargo    || ''
  const telefono = firma.telefono || ''
  const direccion= firma.direccion|| ''

  const ini  = (l) => `<span style="font-family:Arial,sans-serif;font-size:13px;font-weight:700;color:${acento};">${l}.</span>`
  const link = (href, txt, target='_blank') => `<a href="${href}" target="${target}" style="font-family:Arial,sans-serif;font-size:13px;color:#666666;text-decoration:none;">${txt}</a>`
  const txt  = (t) => `<span style="font-family:Arial,sans-serif;font-size:13px;color:#666666;">${t}</span>`
  const logoImg = (size = logoSize) => logoUrl
    ? `<div style="display:inline-block;background-color:#ffffff;border-radius:8px;padding:4px;"><img src="${logoUrl}" alt="logo" width="${size}" style="display:block;max-width:100%;height:auto;" /></div>`
    : ''

  if (template === 'clasica') {
    const filas = [
      nombre    ? `<tr><td colspan="2" style="font-family:Arial,sans-serif;font-size:15px;font-weight:700;color:#1c1c1c;padding-bottom:2px;">${nombre}</td></tr>` : '',
      cargo     ? `<tr><td colspan="2" style="font-family:Arial,sans-serif;font-size:13px;font-weight:600;color:${acento};padding-bottom:8px;">${cargo}</td></tr>` : '',
      telefono  ? `<tr><td style="padding-right:8px;padding-bottom:4px;">${ini('T')}</td><td style="padding-bottom:4px;">${wpHref ? link(wpHref, telefono) : txt(telefono)}</td></tr>` : '',
      email     ? `<tr><td style="padding-right:8px;padding-bottom:4px;">${ini('M')}</td><td style="padding-bottom:4px;">${link(`mailto:${email}`, email, '_self')}</td></tr>` : '',
      direccion ? `<tr><td style="padding-right:8px;padding-bottom:4px;">${ini('D')}</td><td style="padding-bottom:4px;">${txt(direccion)}</td></tr>` : '',
      webHref   ? `<tr><td style="padding-right:8px;padding-bottom:4px;">${ini('W')}</td><td style="padding-bottom:4px;">${link(webHref, web)}</td></tr>` : '',
    ].join('')
    const logoTd = logoUrl ? `<td style="padding-right:20px;border-right:2px solid ${acento};vertical-align:middle;">${logoImg()}</td><td style="width:20px;"></td>` : ''
    return `<table cellpadding="0" cellspacing="0" border="0" ><tr>${logoTd}<td style="vertical-align:middle;"><table cellpadding="0" cellspacing="0" border="0">${filas}</table></td></tr></table>`
  }

  if (template === 'apilada') {
    const filaItem = (letra, texto, href = '') => {
      const contenido = href
        ? `<a href="${href}" target="_blank" style="font-family:Arial,sans-serif;font-size:13px;color:#666666;text-decoration:none;">${texto}</a>`
        : `<span style="font-family:Arial,sans-serif;font-size:13px;color:#666666;">${texto}</span>`
      return `<tr>
        <td style="padding-right:8px;padding-bottom:4px;vertical-align:middle;">${ini(letra)}</td>
        <td style="padding-bottom:4px;vertical-align:middle;">${contenido}</td>
      </tr>`
    }
    const items = [
      telefono  ? filaItem('T', telefono, wpHref) : '',
      email     ? filaItem('M', email, `mailto:${email}`) : '',
      direccion ? filaItem('D', direccion) : '',
      webHref   ? filaItem('W', web, webHref) : '',
    ].join('')
    return `<table cellpadding="0" cellspacing="0" border="0" >
      ${logoUrl ? `<tr><td colspan="2" style="padding-bottom:12px;">${logoImg()}</td></tr>` : ''}
      ${nombre  ? `<tr><td colspan="2" style="font-family:Arial,sans-serif;font-size:15px;font-weight:700;color:#1c1c1c;padding-bottom:2px;">${nombre}</td></tr>` : ''}
      ${cargo   ? `<tr><td colspan="2" style="font-family:Arial,sans-serif;font-size:13px;font-weight:600;color:${acento};padding-bottom:8px;">${cargo}</td></tr>` : ''}
      ${items}
    </table>`
  }

  if (template === 'minimalista') {
    const datos = [
      telefono  ? (wpHref ? link(wpHref, `${ini('T')} ${telefono}`) : `${ini('T')} ${txt(telefono)}`) : '',
      email     ? link(`mailto:${email}`, `${ini('M')} ${email}`, '_self') : '',
      direccion ? `${ini('D')} ${txt(direccion)}` : '',
      webHref   ? link(webHref, `${ini('W')} ${web}`) : '',
    ].filter(Boolean).join(`<span style="color:#ccc;padding:0 8px;">|</span>`)
    return `<table cellpadding="0" cellspacing="0" border="0" >
      ${nombre ? `<tr><td style="font-family:Arial,sans-serif;font-size:18px;font-weight:700;color:#1c1c1c;padding-bottom:2px;">${nombre}</td></tr>` : ''}
      ${cargo  ? `<tr><td style="font-family:Arial,sans-serif;font-size:13px;font-weight:600;color:${acento};padding-bottom:10px;">${cargo}</td></tr>` : ''}
      ${datos  ? `<tr><td style="border-top:2px solid ${acento};padding-top:8px;">${datos}</td></tr>` : ''}
    </table>`
  }

  if (template === 'compacta') {
    const datos = [
      telefono  ? (wpHref ? link(wpHref, `${ini('T')} ${telefono}`) : `${ini('T')} ${txt(telefono)}`) : '',
      email     ? link(`mailto:${email}`, `${ini('M')} ${email}`, '_self') : '',
      direccion ? `${ini('D')} ${txt(direccion)}` : '',
      webHref   ? link(webHref, `${ini('W')} ${web}`) : '',
    ].filter(Boolean).join(`<span style="color:#ccc;padding:0 8px;">|</span>`)
    const contenido = `<table cellpadding="0" cellspacing="0" border="0">
      ${nombre ? `<tr><td style="font-family:Arial,sans-serif;font-size:18px;font-weight:700;color:#1c1c1c;padding-bottom:2px;">${nombre}</td></tr>` : ''}
      ${cargo  ? `<tr><td style="font-family:Arial,sans-serif;font-size:13px;font-weight:600;color:${acento};padding-bottom:10px;">${cargo}</td></tr>` : ''}
      ${datos  ? `<tr><td style="border-top:2px solid ${acento};padding-top:8px;">${datos}</td></tr>` : ''}
    </table>`
    const logoTd = logoUrl ? `<td style="padding-right:16px;vertical-align:middle;">${logoImg()}</td>` : ''
    return `<table cellpadding="0" cellspacing="0" border="0"><tr>${logoTd}<td style="vertical-align:middle;">${contenido}</td></tr></table>`
  }

  return ''
}
