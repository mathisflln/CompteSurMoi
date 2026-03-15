import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'

export default function Groupes() {
  const navigate = useNavigate()
  const [groupes, setGroupes] = useState([])
  const [chargement, setChargement] = useState(true)

  useEffect(() => {
    chargerGroupes()
  }, [])

  async function chargerGroupes() {
    const { data: { user } } = await supabase.auth.getUser()

    const { data, error } = await supabase
      .from('membres')
      .select('id_groupe, groupes(*)')
      .eq('id_profil', user.id)

    if (!error) {
      setGroupes(data.map(m => m.groupes))
    }

    setChargement(false)
  }

  async function handleDeconnexion() {
    await supabase.auth.signOut()
    navigate('/')
  }

  if (chargement) return <div className="p-6 text-sm text-muted-foreground">Chargement...</div>

  return (
    <div className="min-h-screen flex flex-col p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-medium">Mes groupes</h1>
        <button onClick={handleDeconnexion} className="text-sm text-muted-foreground">
          Déconnexion
        </button>
      </div>

      <div className="flex flex-col gap-3 flex-1">
        {groupes.length === 0 && (
          <p className="text-sm text-muted-foreground">Tu n'as pas encore de groupe.</p>
        )}
        {groupes.map(groupe => (
          <div
            key={groupe.id}
            onClick={() => navigate(`/groupe/${groupe.id}`)}
            className="p-4 rounded-xl border border-border cursor-pointer"
          >
            <p className="font-medium">{groupe.nom}</p>
          </div>
        ))}
      </div>

      <Button onClick={() => navigate('/nouveau-groupe')} className="mt-4">
        + Nouveau groupe
      </Button>
    </div>
  )
}