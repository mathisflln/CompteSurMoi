import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { supabase } from '@/lib/supabase'

export default function Connexion() {
  const navigate = useNavigate()
  const location = useLocation()
  const [email, setEmail] = useState('')
  const [motDePasse, setMotDePasse] = useState('')
  const [erreur, setErreur] = useState(null)
  const [chargement, setChargement] = useState(false)

  async function handleConnexion() {
    setChargement(true)
    setErreur(null)

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password: motDePasse,
    })

    if (error) {
      setErreur('Email ou mot de passe incorrect.')
    } else {
      const params = new URLSearchParams(location.search)
      const redirect = params.get('redirect')
      navigate(redirect || '/groupes')
    }

    setChargement(false)
  }

  return (
    <div className="min-h-screen flex flex-col p-6">
      <button onClick={() => navigate(-1)} className="text-sm text-muted-foreground mb-6">← Retour</button>

      <h1 className="text-2xl font-medium mb-1">Connexion</h1>
      <p className="text-sm text-muted-foreground mb-8">Bon retour parmi nous.</p>

      <div className="flex flex-col gap-4">
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

        <Button onClick={handleConnexion} disabled={chargement}>
          {chargement ? 'Connexion...' : 'Se connecter'}
        </Button>
      </div>

      <div className="mt-auto flex flex-col gap-2 text-center">
        <p className="text-sm text-muted-foreground">
          Mot de passe oublié ? <span className="text-foreground font-medium cursor-pointer">Réinitialiser</span>
        </p>
        <p className="text-sm text-muted-foreground">
        Pas de compte ?{' '}
        <span 
            onClick={() => {
            const params = new URLSearchParams(location.search)
            const redirect = params.get('redirect')
            navigate(`/inscription${redirect ? `?redirect=${redirect}` : ''}`)
            }} 
            className="text-foreground font-medium cursor-pointer"
        >
            S'inscrire
        </span>
        </p>
      </div>
    </div>
  )
}