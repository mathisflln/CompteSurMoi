import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function NouvelleTransaction() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [membres, setMembres] = useState([])
  const [nom, setNom] = useState('')
  const [montant, setMontant] = useState('')
  const [payeurId, setPayeurId] = useState(null)
  const [participants, setParticipants] = useState({})
  const [personnalise, setPersonnalise] = useState(false)
  const [erreur, setErreur] = useState(null)
  const [chargement, setChargement] = useState(false)

  useEffect(() => {
    chargerMembres()
  }, [])

  async function chargerMembres() {
    const { data: { user } } = await supabase.auth.getUser()

    const { data } = await supabase
      .from('membres')
      .select('id, profils(pseudo)')
      .eq('id_groupe', id)

    if (data) {
      setMembres(data)
      // Par défaut : l'utilisateur connecté est le payeur
      const moi = data.find(m => m.profils)
      if (moi) setPayeurId(moi.id)
      // Par défaut : tous les membres participent à parts égales
      const parts = {}
      data.forEach(m => { parts[m.id] = true })
      setParticipants(parts)
    }
  }

  function partParticipant() {
    const nbParticipants = Object.values(participants).filter(Boolean).length
    if (!montant || nbParticipants === 0) return 0
    return (parseFloat(montant) / nbParticipants).toFixed(2)
  }

  function toggleParticipant(membreId) {
    setParticipants(prev => ({ ...prev, [membreId]: !prev[membreId] }))
  }

  async function handleAjouter() {
    if (!nom.trim()) { setErreur('Le nom est obligatoire.'); return }
    if (!montant || parseFloat(montant) <= 0) { setErreur('Le montant est invalide.'); return }
    if (!payeurId) { setErreur('Sélectionne le payeur.'); return }

    const participantsActifs = Object.entries(participants)
      .filter(([, actif]) => actif)
      .map(([membreId]) => membreId)

    if (participantsActifs.length === 0) { setErreur('Au moins un participant est requis.'); return }

    setChargement(true)
    setErreur(null)

    // 1. Insérer la transaction
    const { data: tx, error: erreurTx } = await supabase
      .from('transactions')
      .insert({
        nom: nom.trim(),
        montant: parseFloat(montant),
        id_membre_payeur: payeurId,
        id_groupe: id
      })
      .select()
      .single()

    if (erreurTx) {
      setErreur('Erreur lors de la création de la transaction.')
      console.log(erreurTx)
      setChargement(false)
      return
    }

    // 2. Insérer les répartitions
    const part = parseFloat((parseFloat(montant) / participantsActifs.length).toFixed(2))
    const repartitions = participantsActifs.map(membreId => ({
      id_transaction: tx.id,
      id_membre: membreId,
      montant: part
    }))

    const { error: erreurRep } = await supabase
      .from('repartitions')
      .insert(repartitions)

    if (erreurRep) {
      setErreur('Erreur lors de la répartition.')
      console.log(erreurRep)
      setChargement(false)
      return
    }

    navigate(`/groupe/${id}`)
  }

  return (
    <div className="min-h-screen flex flex-col p-6 gap-5">
      <button onClick={() => navigate(-1)} className="text-sm text-muted-foreground">← Annuler</button>
      <h1 className="text-2xl font-medium">Nouvelle dépense</h1>

      <div className="flex flex-col gap-1.5">
        <Label>Nom de la dépense</Label>
        <Input
          placeholder="Ex : courses, resto, essence..."
          value={nom}
          onChange={e => setNom(e.target.value)}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label>Montant</Label>
        <Input
          type="number"
          placeholder="0.00"
          value={montant}
          onChange={e => setMontant(e.target.value)}
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label>Payé par</Label>
        <div className="flex gap-2 flex-wrap">
          {membres.map(m => (
            <div
              key={m.id}
              onClick={() => setPayeurId(m.id)}
              className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 cursor-pointer border text-sm font-medium transition-colors ${
                payeurId === m.id
                  ? 'bg-foreground text-background border-foreground'
                  : 'bg-muted border-border'
              }`}
            >
              <div className="w-5 h-5 rounded-full bg-background/20 flex items-center justify-center text-xs">
                {m.profils.pseudo.slice(0, 2).toUpperCase()}
              </div>
              {m.profils.pseudo}
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex justify-between items-center">
          <Label>Participants</Label>
          <div
            onClick={() => setPersonnalise(!personnalise)}
            className="flex items-center gap-2 cursor-pointer"
          >
            <span className="text-xs text-muted-foreground">Personnaliser</span>
            <div className={`w-9 h-5 rounded-full transition-colors ${personnalise ? 'bg-foreground' : 'bg-muted border border-border'}`}>
              <div className={`w-4 h-4 rounded-full bg-background mt-0.5 transition-all ${personnalise ? 'ml-4' : 'ml-0.5'}`} />
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          {membres.map(m => (
            <div key={m.id} className="flex items-center gap-3 bg-muted rounded-lg px-3 py-2.5">
              <div
                onClick={() => toggleParticipant(m.id)}
                className={`w-5 h-5 rounded-full border flex items-center justify-center cursor-pointer flex-shrink-0 ${
                  participants[m.id] ? 'bg-foreground border-foreground' : 'border-border bg-background'
                }`}
              >
                {participants[m.id] && <div className="w-2 h-2 rounded-full bg-background" />}
              </div>
              <div className="w-7 h-7 rounded-full bg-background flex items-center justify-center text-xs font-medium flex-shrink-0">
                {m.profils.pseudo.slice(0, 2).toUpperCase()}
              </div>
              <span className={`flex-1 text-sm ${!participants[m.id] ? 'text-muted-foreground' : ''}`}>
                {m.profils.pseudo}
              </span>
              {personnalise ? (
                <Input
                  type="number"
                  className="w-20 text-right text-sm h-8"
                  value={participants[m.id] ? partParticipant() : '0.00'}
                  disabled={!participants[m.id]}
                />
              ) : (
                <span className="text-sm text-muted-foreground">
                  {participants[m.id] ? `${partParticipant()}€` : '—'}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      {erreur && <p className="text-sm text-destructive">{erreur}</p>}

      <Button onClick={handleAjouter} disabled={chargement} className="mt-auto">
        {chargement ? 'Ajout...' : 'Ajouter la dépense'}
      </Button>
    </div>
  )
}