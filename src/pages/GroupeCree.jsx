import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'

export default function GroupeCree() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [lien, setLien] = useState(null)
  const [groupe, setGroupe] = useState(null)
  const [copie, setCopie] = useState(false)

  useEffect(() => {
    genererLien()
  }, [])

  async function genererLien() {
    const { data: groupeData } = await supabase
      .from('groupes')
      .select('nom')
      .eq('id', id)
      .single()

    const { data: invitation } = await supabase
      .from('invitations')
      .insert({ id_groupe: id })
      .select()
      .single()

    setGroupe(groupeData)
    setLien(`${window.location.origin}/rejoindre/${invitation.id}`)
  }

  function handleCopier() {
    navigator.clipboard.writeText(lien)
    setCopie(true)
    setTimeout(() => setCopie(false), 2000)
  }

  return (
    <div className="min-h-screen flex flex-col p-6 gap-5">
      <div className="flex-1 flex flex-col justify-center items-center gap-4 text-center">
        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center text-3xl">
          🎉
        </div>
        <div>
          <h1 className="text-2xl font-medium">Groupe créé !</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Partage ce lien pour inviter des membres dans <span className="font-medium text-foreground">{groupe?.nom}</span>.
          </p>
        </div>

        {lien && (
          <div className="w-full bg-muted rounded-xl p-4 flex flex-col gap-3">
            <p className="text-xs text-muted-foreground break-all">{lien}</p>
            <Button variant="outline" onClick={handleCopier}>
              {copie ? '✓ Lien copié !' : 'Copier le lien'}
            </Button>
          </div>
        )}

        <p className="text-xs text-muted-foreground">
          Ce lien est valable 7 jours.
        </p>
      </div>

      <Button onClick={() => navigate(`/groupe/${id}`)}>
        Accéder au groupe →
      </Button>
    </div>
  )
}