import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'

export default function Accueil() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen flex flex-col p-6">
      <div className="flex-1 flex flex-col justify-center items-center gap-4 text-center">
        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center text-3xl">
          💸
        </div>
        <div>
          <h1 className="text-2xl font-medium">TuMeDois</h1>
          <p className="text-sm text-muted-foreground mt-1">Partagez les dépenses, simplement.</p>
        </div>
        <div className="mt-4">
          <p className="text-base font-medium">Fini les comptes flous</p>
          <p className="text-sm text-muted-foreground mt-1">Gérez vos dépenses entre amis<br />en quelques secondes.</p>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <Button onClick={() => navigate('/inscription')}>
          Créer un compte
        </Button>
        <Button variant="outline" onClick={() => navigate('/connexion')}>
          Se connecter
        </Button>
      </div>
    </div>
  )
}