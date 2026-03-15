import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '@/lib/supabase'

export default function Comptes() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [soldes, setSoldes] = useState([])
  const [remboursements, setRemboursements] = useState([])
  const [chargement, setChargement] = useState(true)

  useEffect(() => {
    chargerComptes()
  }, [])

  async function chargerComptes() {
    // 1. Récupérer tous les membres du groupe
    const { data: membres } = await supabase
      .from('membres')
      .select('id, profils(pseudo)')
      .eq('id_groupe', id)

    // 2. Récupérer toutes les transactions du groupe
    const { data: transactions } = await supabase
      .from('transactions')
      .select('id, montant, id_membre_payeur')
      .eq('id_groupe', id)

    // 3. Récupérer toutes les répartitions
    const { data: repartitions } = await supabase
      .from('repartitions')
      .select('id_membre, montant')

    if (!membres || !transactions || !repartitions) {
      setChargement(false)
      return
    }

    // 4. Calculer les soldes
    const soldesMap = {}
    membres.forEach(m => {
      soldesMap[m.id] = { pseudo: m.profils.pseudo, solde: 0 }
    })

    // Ce qu'on a payé
    transactions.forEach(tx => {
      if (soldesMap[tx.id_membre_payeur]) {
        soldesMap[tx.id_membre_payeur].solde += tx.montant
      }
    })

    // Ce qu'on doit
    repartitions.forEach(r => {
      if (soldesMap[r.id_membre]) {
        soldesMap[r.id_membre].solde -= r.montant
      }
    })

    const soldesListe = Object.entries(soldesMap).map(([membreId, data]) => ({
      id: membreId,
      pseudo: data.pseudo,
      solde: Math.round(data.solde * 100) / 100
    }))

    setSoldes(soldesListe)
    setRemboursements(calculerRemboursements(soldesListe))
    setChargement(false)
  }

  function calculerRemboursements(soldesListe) {
    // Copie pour ne pas modifier l'original
    const liste = soldesListe.map(s => ({ ...s }))
    const remboursements = []

    while (liste.some(s => Math.abs(s.solde) > 0.01)) {
      const debiteurs = liste.filter(s => s.solde < -0.01).sort((a, b) => a.solde - b.solde)
      const crediteurs = liste.filter(s => s.solde > 0.01).sort((a, b) => b.solde - a.solde)

      if (debiteurs.length === 0 || crediteurs.length === 0) break

      const debiteur = debiteurs[0]
      const crediteur = crediteurs[0]
      const montant = Math.min(Math.abs(debiteur.solde), crediteur.solde)

      remboursements.push({
        de: debiteur.pseudo,
        a: crediteur.pseudo,
        montant: Math.round(montant * 100) / 100
      })

      debiteur.solde += montant
      crediteur.solde -= montant
    }

    return remboursements
  }

  if (chargement) return <div className="p-6 text-sm text-muted-foreground">Chargement...</div>

  return (
    <div className="min-h-screen flex flex-col p-6 gap-5">
      <button onClick={() => navigate(-1)} className="text-sm text-muted-foreground">← Retour</button>

      <div>
        <h1 className="text-2xl font-medium">Comptes</h1>
      </div>

      <div className="flex flex-col gap-2">
        <p className="text-xs text-muted-foreground uppercase tracking-wider">Solde de chacun</p>
        {soldes.map(s => (
          <div key={s.id} className="flex items-center gap-3 bg-muted rounded-lg px-3 py-2.5">
            <div className="w-8 h-8 rounded-full bg-background flex items-center justify-center text-xs font-medium flex-shrink-0">
              {s.pseudo.slice(0, 2).toUpperCase()}
            </div>
            <span className="flex-1 text-sm">{s.pseudo}</span>
            <span className="text-sm font-medium">
              {s.solde > 0 ? '+' : ''}{s.solde}€
            </span>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-2">
        <p className="text-xs text-muted-foreground uppercase tracking-wider">Pour solder les comptes</p>
        {remboursements.length === 0 && (
          <p className="text-sm text-muted-foreground">Tout le monde est quitte 🎉</p>
        )}
        {remboursements.map((r, i) => (
          <div key={i} className="flex items-center gap-2 bg-muted rounded-lg px-3 py-2.5">
            <span className="text-sm font-medium">{r.de}</span>
            <span className="text-xs text-muted-foreground">verse</span>
            <span className="text-sm font-medium">{r.montant}€</span>
            <span className="text-xs text-muted-foreground">à</span>
            <span className="text-sm font-medium">{r.a}</span>
          </div>
        ))}
      </div>
    </div>
  )
}