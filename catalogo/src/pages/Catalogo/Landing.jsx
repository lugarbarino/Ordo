import { useState, useEffect } from 'react'
import { db } from '../../lib/supabase'
import { Landing } from '../../components/Landing'

export default function CatalogoLanding() {
  const [checked, setChecked] = useState(false)

  useEffect(() => {
    db.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        window.location.href = '/catalogo/admin'
      } else {
        setChecked(true)
      }
    })
  }, [])

  if (!checked) return null
  return <Landing />
}
