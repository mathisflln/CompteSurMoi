import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { supabase } from '@/lib/supabase'
import { useLocation } from 'react-router-dom'


export default function Inscription() {
  const navigate = useNavigate()
  const [pseudo, setPseudo] = useState('')
  const [email, setEmail] = useState('')
  const [motDePasse, setMotDePasse] = useState('')
  const [erreur, setErreur] = useState(null)
  const [chargement, setChargement] = useState(false)
  const location = useLocation()

  async function handleInscription() {
    setChargement(true)
    setErreur(null)

    const { data, error } = await supabase.auth.signUp({
      email,
      password: motDePasse,
    })

    if (error) {
      setErreur(error.message)
      setChargement(false)
      return
    }

    // On crée le profil dans notre table profils
    const { error: erreurProfil } = await supabase
      .from('profils')
      .insert({ id: data.user.id, pseudo })

    if (erreurProfil) {
      setErreur('Erreur lors de la création du profil.')
      setChargement(false)
      return
    }

    const params = new URLSearchParams(location.search)
    const redirect = params.get('redirect')
    navigate(redirect || '/groupes')
    
    setChargement(false)
  }

  return (
    <div className="min-h-screen flex flex-col p-6">
      <button onClick={() => navigate(-1)} className="text-sm text-muted-foreground mb-6">← Retour</button>

      <h1 className="text-2xl font-medium mb-1">Créer un compte</h1>
      <p className="text-sm text-muted-foreground mb-8">Rejoignez CompteSurMoi gratuitement.</p>

      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <Label>Pseudo</Label>
          <Input
            placeholder="Ton prénom ou surnom"
            value={pseudo}
            onChange={(e) => setPseudo(e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>Adresse e-mail</Label>
          <Input
            type="email"
            placeholder="exemple@mail.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>Mot de passe</Label>
          <Input
            type="password"
            placeholder="••••••••"
            value={motDePasse}
            onChange={(e) => setMotDePasse(e.target.value)}
          />
        </div>

        {erreur && <p className="text-sm text-destructive">{erreur}</p>}

        <Button onClick={handleInscription} disabled={chargement}>
          {chargement ? 'Création...' : 'Créer mon compte'}
        </Button>
      </div>

      <div className="mt-auto text-center">
        <p className="text-sm text-muted-foreground">
          Déjà un compte ?{' '}
          <span onClick={() => navigate('/connexion')} className="text-foreground font-medium cursor-pointer">
            Se connecter
          </span>
        </p>
      </div>
    </div>
  )
}