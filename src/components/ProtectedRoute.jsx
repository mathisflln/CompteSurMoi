import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'

export default function ProtectedRoute({ children }) {
  const navigate = useNavigate()
  const [verif, setVerif] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate('/')
      } else {
        setVerif(false)
      }
    })
  }, [])

  if (verif) return null

  return children
}