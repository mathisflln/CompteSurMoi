import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import ProtectedRoute from './components/ProtectedRoute'
import Accueil from './pages/Accueil'
import Connexion from './pages/Connexion'
import Inscription from './pages/Inscription'
import Groupes from './pages/Groupes'
import Groupe from './pages/Groupe'
import Comptes from './pages/Comptes'
import NouveauGroupe from './pages/NouveauGroupe'


export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Accueil />} />
        <Route path="/connexion" element={<Connexion />} />
        <Route path="/inscription" element={<Inscription />} />
        <Route path="/groupes" element={
          <ProtectedRoute><Groupes /></ProtectedRoute>
        } />
        <Route path="/groupe/:id" element={
          <ProtectedRoute><Groupe /></ProtectedRoute>
        } />
        <Route path="/groupe/:id/comptes" element={
          <ProtectedRoute><Comptes /></ProtectedRoute>
        } />
        <Route path="/nouveau-groupe" element={
          <ProtectedRoute><NouveauGroupe /></ProtectedRoute>
        } />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  )
}