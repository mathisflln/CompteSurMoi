import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'

export default function Rejoindre() {
  const { token } = useParams()
  const navigate = useNavigate()
  const [groupe, setGroupe] = useState(null)
  const [membres, setMembres] = useState([])
  const [erreur, setErreur] = useState(null)
  const [chargement, setChargement] = useState(true)
  const [rejoindreChargement, setRejoindreChargement] = useState(false)

  useEffect(() => {
    chargerInvitation()
  }, [])

  async function chargerInvitation() {
    // 1. Vérifier que l'invitation existe et n'est pas expirée
    const { data: invitation, error } = await supabase
      .from('invitations')
      .select('id_groupe, expires_at')
      .eq('id', token)
      .single()

    if (error || !invitation) {
      setErreur('Ce lien d\'invitation est invalide ou a expiré.')
      setChargement(false)
      return
    }

    if (new Date(invitation.expires_at) < new Date()) {
      setErreur('Ce lien d\'invitation a expiré.')
      setChargement(false)
      return
    }

    // 2. Charger les infos du groupe
    const { data: groupeData } = await supabase
      .from('groupes')
      .select('*')
      .eq('id', invitation.id_groupe)
      .single()

    // 3. Charger les membres
    const { data: membresData } = await supabase
      .from('membres')
      .select('id, profils(pseudo)')
      .eq('id_groupe', invitation.id_groupe)

    setGroupe({ ...groupeData, invitationId: invitation.id_groupe })
    setMembres(membresData || [])
    setChargement(false)
  }

  async function handleRejoindre() {
    setRejoindreChargement(true)

    const { data: { user } } = await supabase.auth.getUser()

    // Vérifier si déjà membre
    const { data: dejaMembre } = await supabase
      .from('membres')
      .select('id')
      .eq('id_groupe', groupe.id)
      .eq('id_profil', user.id)
      .single()

    if (dejaMembre) {
      navigate(`/groupe/${groupe.id}`)
      return
    }

    const { error } = await supabase
      .from('membres')
      .insert({ id_profil: user.id, id_groupe: groupe.id })

    if (error) {
      setErreur('Erreur lors de l\'ajout au groupe.')
      setRejoindreChargement(false)
      return
    }

    navigate(`/groupe/${groupe.id}`)
  }

  if (chargement) return <div className="p-6 text-sm text-muted-foreground">Chargement...</div>

  if (erreur) return (
    <div className="min-h-screen flex flex-col p-6 gap-4">
      <p className="text-sm text-destructive">{erreur}</p>
      <Button variant="outline" onClick={() => navigate('/')}>Retour à l'accueil</Button>
    </div>
  )

  return (
    <div className="min-h-screen flex flex-col p-6 gap-5">
      <button onClick={() => navigate('/')} className="text-sm text-muted-foreground">← Retour</button>

      <div>
        <h1 className="text-2xl font-medium">Tu as été invité</h1>
        <p className="text-sm text-muted-foreground mt-1">Rejoins ce groupe pour partager les dépenses.</p>
      </div>

      <div className="bg-muted rounded-xl p-4 flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <span className="text-3xl">💸</span>
          <div>
            <p className="font-medium">{groupe.nom}</p>
            <p className="text-sm text-muted-foreground">{membres.length} membres</p>
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          {membres.slice(0, 3).map(m => (
            <div key={m.id} className="flex items-center gap-1.5 bg-background rounded-full px-3 py-1">
              <div className="w-5 h-5 rounded-full bg-muted flex items-center justify-center text-xs font-medium">
                {m.profils.pseudo.slice(0, 2).toUpperCase()}
              </div>
              <span className="text-xs">{m.profils.pseudo}</span>
            </div>
          ))}
          {membres.length > 3 && (
            <div className="flex items-center bg-background rounded-full px-3 py-1">
              <span className="text-xs text-muted-foreground">+{membres.length - 3}</span>
            </div>
          )}
        </div>
      </div>

      <div className="mt-auto flex flex-col gap-3">
        <Button onClick={handleRejoindre} disabled={rejoindreChargement}>
          {rejoindreChargement ? 'Rejoindre...' : 'Rejoindre le groupe'}
        </Button>
        <Button variant="outline" onClick={() => navigate('/')}>Refuser</Button>
      </div>
    </div>
  )
}