import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'


export default function Groupe() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [groupe, setGroupe] = useState(null)
  const [membres, setMembres] = useState([])
  const [transactions, setTransactions] = useState([])
  const [monSolde, setMonSolde] = useState(0)
  const [chargement, setChargement] = useState(true)

  useEffect(() => {
    chargerGroupe()
  }, [])

async function genererLienInvitation() {
    const { data, error } = await supabase
      .from('invitations')
      .insert({ id_groupe: id })
      .select()
      .single()

    if (!error) {
      const lien = `${window.location.origin}/rejoindre/${data.id}`
      navigator.clipboard.writeText(lien)
      alert('Lien copié dans le presse-papier !')
    }
  }

  async function chargerGroupe() {
    const { data: { user } } = await supabase.auth.getUser()

    // 1. Infos du groupe
    const { data: groupeData } = await supabase
      .from('groupes')
      .select('*')
      .eq('id', id)
      .single()

    // 2. Membres du groupe avec leurs profils
    const { data: membresData } = await supabase
      .from('membres')
      .select('id, profils(pseudo)')
      .eq('id_groupe', id)

    // 3. Dernières transactions
    const { data: transactionsData } = await supabase
      .from('transactions')
      .select('*, membres(profils(pseudo))')
      .eq('id_groupe', id)
      .order('created_at', { ascending: false })
      .limit(3)

    setGroupe(groupeData)
    setMembres(membresData || [])
    setTransactions(transactionsData || [])
    setChargement(false)
  }

  if (chargement) return <div className="p-6 text-sm text-muted-foreground">Chargement...</div>
  if (!groupe) return <div className="p-6 text-sm text-muted-foreground">Groupe introuvable.</div>

  return (
    <div className="min-h-screen flex flex-col p-6 gap-4">
      <div className="flex justify-between items-center">
        <button onClick={() => navigate('/groupes')} className="text-sm text-muted-foreground">← Retour</button>
        <button className="text-xl text-muted-foreground">⋯</button>
      </div>

      <div>
        <h1 className="text-2xl font-medium">{groupe.nom}</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {transactions.length} dépenses
        </p>
      </div>

      <div className="flex gap-2 flex-wrap">
        {membres.filter(m => m.profils).map(m => (
          <div key={m.id} className="flex items-center gap-1.5 bg-muted rounded-full px-3 py-1">
            <div className="w-5 h-5 rounded-full bg-background flex items-center justify-center text-xs font-medium">
              {m.profils.pseudo.slice(0, 2).toUpperCase()}
            </div>
            <span className="text-xs text-muted-foreground">{m.profils.pseudo}</span>
          </div>
        ))}
        <button
            onClick={genererLienInvitation}
            className="text-xs text-muted-foreground border border-border rounded-full px-3 py-1"
        >
            + Inviter
        </button>
      </div>

      <div className="bg-muted rounded-xl p-4 flex flex-col gap-3">
        <p className="text-xs text-muted-foreground uppercase tracking-wider">Dernières dépenses</p>
        {transactions.length === 0 && (
          <p className="text-sm text-muted-foreground">Aucune dépense pour l'instant.</p>
        )}
        {transactions.map((tx, i) => (
          <div key={tx.id}>
            {i > 0 && <div className="h-px bg-border mb-3" />}
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-background flex items-center justify-center text-base">
                💸
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">{tx.nom}</p>
                <p className="text-xs text-muted-foreground">
                  Payé par {tx.membres?.profils?.pseudo}
                </p>
              </div>
              <p className="text-sm font-medium">{tx.montant}€</p>
            </div>
          </div>
        ))}
      </div>

      <div
        onClick={() => navigate(`/groupe/${id}/transactions`)}
        className="border border-border rounded-xl p-4 flex justify-between items-center cursor-pointer"
        >
        <p className="text-sm">Voir toutes les dépenses</p>
        <span className="text-muted-foreground">→</span>
    </div>

      <div
        onClick={() => navigate(`/groupe/${id}/comptes`)}
        className="bg-muted border border-border rounded-xl p-4 flex justify-between items-center cursor-pointer"
      >
        <div>
          <p className="text-sm font-medium">Comptes du groupe</p>
          <p className="text-xs text-muted-foreground">Ton solde · {monSolde}€</p>
        </div>
        <span className="text-sm text-muted-foreground">Voir →</span>
      </div>

      <Button onClick={() => navigate(`/groupe/${id}/nouvelle-transaction`)} className="mt-auto">
        + Ajouter une dépense
      </Button>
    </div>
  )
}