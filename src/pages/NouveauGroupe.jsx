import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function NouveauGroupe() {
  const navigate = useNavigate()
  const [nom, setNom] = useState('')
  const [erreur, setErreur] = useState(null)
  const [chargement, setChargement] = useState(false)

async function handleCreer() {
    if (!nom.trim()) {
      setErreur('Le nom du groupe est obligatoire.')
      return
    }

    setChargement(true)
    setErreur(null)

    const { data, error } = await supabase.rpc('creer_groupe', {
      nom_groupe: nom.trim()
    })

    if (error) {
      setErreur('Erreur lors de la création du groupe.')
      console.log(error)
      setChargement(false)
      return
    }

    navigate(`/groupe/${data}`)
  }

  return (
    <div className="min-h-screen flex flex-col p-6">
      <button onClick={() => navigate(-1)} className="text-sm text-muted-foreground mb-6">← Retour</button>

      <h1 className="text-2xl font-medium mb-1">Nouveau groupe</h1>
      <p className="text-sm text-muted-foreground mb-8">Donnez un nom à votre groupe.</p>

      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <Label>Nom du groupe</Label>
          <Input
            placeholder="Ex : Vacances, Coloc..."
            value={nom}
            onChange={(e) => setNom(e.target.value)}
          />
        </div>

        {erreur && <p className="text-sm text-destructive">{erreur}</p>}

        <Button onClick={handleCreer} disabled={chargement}>
          {chargement ? 'Création...' : 'Créer le groupe'}
        </Button>
      </div>
    </div>
  )
}