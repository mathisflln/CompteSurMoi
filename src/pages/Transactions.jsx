import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '@/lib/supabase'

export default function Transactions() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [transactions, setTransactions] = useState([])
  const [chargement, setChargement] = useState(true)

  useEffect(() => {
    chargerTransactions()
  }, [])

  async function chargerTransactions() {
    const { data } = await supabase
      .from('transactions')
      .select('*, membres(profils(pseudo))')
      .eq('id_groupe', id)
      .order('created_at', { ascending: false })

    setTransactions(data || [])
    setChargement(false)
  }

  if (chargement) return <div className="p-6 text-sm text-muted-foreground">Chargement...</div>

  return (
    <div className="min-h-screen flex flex-col p-6 gap-4">
      <button onClick={() => navigate(-1)} className="text-sm text-muted-foreground">← Retour</button>
      <h1 className="text-2xl font-medium">Toutes les dépenses</h1>

      <div className="flex flex-col">
        {transactions.length === 0 && (
          <p className="text-sm text-muted-foreground">Aucune dépense pour l'instant.</p>
        )}
        {transactions.map((tx, i) => (
          <div key={tx.id}>
            {i > 0 && <div className="h-px bg-border" />}
            <div className="flex items-center gap-3 py-3">
              <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center text-base flex-shrink-0">
                💸
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">{tx.nom}</p>
                <p className="text-xs text-muted-foreground">
                  Payé par {tx.membres?.profils?.pseudo} · {new Date(tx.created_at).toLocaleDateString('fr-FR')}
                </p>
              </div>
              <p className="text-sm font-medium">{tx.montant}€</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}