'use client'
import { useState, useEffect, useRef } from 'react'

// ── CSS injecté dans le <head> ──
const GLOBAL_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@400;600;700;800&family=Oswald:wght@400;600;700&display=swap');
@keyframes pionBounce {
  0%   { transform: translateY(-6px) scale(0.8); opacity: 0.4; }
  60%  { transform: translateY(2px) scale(1.1);  opacity: 1; }
  80%  { transform: translateY(-1px) scale(1); }
  100% { transform: translateY(0) scale(1); }
}
@keyframes diceSpin {
  0%   { transform: rotate(0deg)   scale(1); }
  25%  { transform: rotate(90deg)  scale(0.88); }
  50%  { transform: rotate(180deg) scale(1.08); }
  75%  { transform: rotate(270deg) scale(0.92); }
  100% { transform: rotate(360deg) scale(1); }
}
@keyframes diceLand {
  0%   { transform: scale(1.4) rotate(-14deg); opacity: 0.5; }
  40%  { transform: scale(0.88) rotate(6deg); }
  70%  { transform: scale(1.1) rotate(-3deg); }
  100% { transform: scale(1) rotate(0deg); opacity: 1; }
}
@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(-8px); }
  to   { opacity: 1; transform: translateY(0); }
}
* { box-sizing: border-box; }
body { background: #0d0700; color: white; font-family: 'Barlow Condensed', 'Arial Narrow', Arial, sans-serif; }
.header { background: #1a0800; border-bottom: 3px solid #c8962a; padding: 10px 20px; display: flex; justify-content: space-between; align-items: center; }
.header-title { color: #c8962a; margin: 0; font-size: 24px; font-family: 'Oswald', sans-serif; font-weight: 700; letter-spacing: 0.05em; text-shadow: 0 0 16px rgba(200,150,42,0.5); }
.board-wrapper { background: #b8a878; border: 4px solid #5a3a00; border-radius: 4px; padding: 4px; display: inline-block; }
.pion { animation: pionBounce 0.35s cubic-bezier(0.22, 0.61, 0.36, 1); }
.roll-button { padding: 12px 32px; background: #c8962a; border: none; border-radius: 10px; color: white; cursor: pointer; font-size: 18px; font-family: 'Oswald', sans-serif; font-weight: 600; letter-spacing: 0.05em; transition: background 0.15s, transform 0.1s; box-shadow: 0 4px 16px rgba(200,150,42,0.4); }
.roll-button:hover { background: #d4a438; transform: translateY(-1px); }
.roll-button:active { transform: translateY(1px); }
.roll-button:disabled { background: #444; cursor: not-allowed; transform: none; box-shadow: none; }
.sidebar { background: #0d0500; border-left: 2px solid #2a1a00; padding: 14px; overflow-y: auto; font-family: 'Barlow Condensed', sans-serif; }
.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.88); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 20px; animation: fadeInUp 0.2s ease; }
.modal-box { background: #1a0a00; border: 2px solid #c8962a; border-radius: 16px; padding: 28px; max-width: 620px; width: 100%; max-height: 82vh; overflow-y: auto; font-family: 'Barlow Condensed', sans-serif; }
.card-flip-wrapper { perspective: 400px; }
.card-flip-inner { width:100%; height:100%; position:relative; transform-style:preserve-3d; transition:transform 0.7s cubic-bezier(0.4,0.2,0.2,1); }
.card-flip-inner.is-flipped { transform: rotateY(180deg); }
.card-face { position:absolute; inset:0; backface-visibility:hidden; -webkit-backface-visibility:hidden; border-radius:4px; overflow:hidden; }
.card-face-back { transform:rotateY(180deg); background:#1a0a00; border:1px solid #c8962a; display:flex; align-items:center; justify-content:center; padding:5px; }
@media (max-width: 767px) {
  .header { padding: 8px 12px; }
  .header-title { font-size: 17px; letter-spacing: 0.02em; }
  .roll-button { padding: 14px 20px; font-size: 16px; min-height: 52px; }
  .modal-overlay { padding: 0; align-items: flex-end; }
  .modal-box { border-radius: 16px 16px 0 0; max-width: 100%; max-height: 90vh; padding: 20px 16px; }
  .sidebar { border-left: none; padding: 12px; }
  input[type=number], input[type=text], select { font-size: 16px !important; }
}
`

function GlobalStyles() {
  useEffect(() => {
    const style = document.createElement('style')
    style.textContent = GLOBAL_CSS
    document.head.appendChild(style)
    return () => document.head.removeChild(style)
  }, [])
  return null
}
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'


// ============================================================
// DONNÉES DU JEU
// ============================================================
const PRODUCTIONS = [
  'Pétrole','Houille','Acier','Coton brut','Fer','Laine brute',
  'Cuivre','Café','Cobalt','Or','Tungstène','Sucre',
  'Argent','Riz','Construction automobile','Blé','Construction navale','Thé',
  'Aluminium','Cacao','Plomb','Caoutchouc naturel','Uranium','Nickel'
]

const ROYALTY_SCALE = {
  'Pétrole':                  [1200000,  6000000, 12000000, 24000000],
  'Or':                       [1000000,  5000000, 10000000, 20000000],
  'Houille':                  [1100000,  5500000, 11000000, 22000000],
  'Fer':                      [1000000,  5000000, 10000000, 20000000],
  'Blé':                      [1000000,  5000000, 10000000, 20000000],
  'Acier':                    [1100000,  5500000, 11000000, 22000000],
  'Sucre':                    [ 900000,  4500000,  9000000, 18000000],
  'Aluminium':                [ 900000,  4500000,  9000000, 18000000],
  'Cuivre':                   [ 900000,  4500000,  9000000, 18000000],
  'Uranium':                  [ 800000,  4000000,  8000000, 16000000],
  'Nickel':                   [ 800000,  4000000,  8000000, 16000000],
  'Construction automobile':  [ 800000,  4000000,  8000000, 16000000],
  'Construction navale':      [ 700000,  3500000,  7000000, 14000000],
  'Argent':                   [ 700000,  3500000,  7000000, 14000000],
  'Riz':                      [ 700000,  3500000,  7000000, 14000000],
  'Cobalt':                   [ 600000,  3000000,  6000000, 12000000],
  'Plomb':                    [ 600000,  3000000,  6000000, 12000000],
  'Tungstène':                [ 600000,  3000000,  6000000, 12000000],
  'Laine brute':              [ 500000,  2500000,  5000000, 10000000],
  'Thé':                      [ 500000,  2500000,  5000000, 10000000],
  'Coton brut':               [ 500000,  2500000,  5000000, 10000000],
  'Café':                     [ 400000,  2000000,  4000000,  8000000],
  'Cacao':                    [ 400000,  2000000,  4000000,  8000000],
  'Caoutchouc naturel':       [ 400000,  2000000,  4000000,  8000000],
}

function getRoyaltyAmount(production, pct) {
  if (pct < 30) return 0
  const scale = ROYALTY_SCALE[production] || [900000, 4500000, 9000000, 18000000]
  if (pct < 50) return scale[0]
  if (pct < 70) return scale[1]
  if (pct < 90) return scale[2]
  return scale[3]
}

// ============================================================
// PLATEAU 11x9 — ordre validé avec toi
// ============================================================
const NCOLS = 11
const NROWS = 9
const TOTAL_CASES = 65 // 65 entrées, case idx 36 et 64 = même cellule physique

// Les 65 cases dans l'ordre de parcours
// Les 65 cases dans l'ordre de parcours
const LISTE = [
  {label:'DÉPART',           type:'depart'},                                   // —
  {label:'Scandinavie',      type:'europe',   continent:'Europe'},             // Thé
  {label:'Allemagne Féd.',   type:'europe',   continent:'Europe'},             // Houille
  {label:'Choix Europe-1',   type:'choix',    continent:'Europe'},             // Tungstène
  {label:'Royaume-Uni',      type:'europe',   continent:'Europe'},             // Nickel
  {label:'France',           type:'europe',   continent:'Europe'},             // Thé
  {label:'Europe Médit.',    type:'europe',   continent:'Europe'},             // Aluminium
  {label:'Choix Europe-2',   type:'choix',    continent:'Europe'},             // Nickel
  {label:'Europe Danub.',    type:'europe',   continent:'Europe'},             // Construction navale
  {label:'Europe Balkan.',   type:'europe',   continent:'Europe'},             // Argent
  {label:'Enchères-1',       type:'encheres'},                                 // —
  {label:'Recevez 500k-1',   type:'500k'},                                     // Laine Mohair
  {label:'Actualité-1',      type:'actualite'},                                // —
  {label:'U.R.S.S.-1',       type:'pays',     continent:'URSS'},               // Café
  {label:'U.R.S.S.-2',       type:'pays',     continent:'URSS'},               // Pétrole
  {label:'U.R.S.S.-3',       type:'pays',     continent:'URSS'},               // Uranium
  {label:'Actualité-2',      type:'actualite'},                                // —
  {label:'Recevez 500k-2',   type:'500k'},                                     // Coton Brut
  {label:'Joker-1',          type:'joker'},                                    // —
  {label:'Canada',           type:'pays',     continent:'Amérique'},           // Riz
  {label:'Mexique',          type:'pays',     continent:'Amérique'},           // Plomb
  {label:'Choix Cont.-1',    type:'choix',    continent:'Amérique'},           // Aluminium
  {label:'Antilles',         type:'pays',     continent:'Amérique'},           // Cobalt
  {label:'Venezuela',        type:'pays',     continent:'Amérique'},           // Houille
  {label:'Pays Andins',      type:'pays',     continent:'Amérique'},           // Blé
  {label:'Choix Cont.-2',    type:'choix',    continent:'Amérique'},           // Caoutchouc naturel
  {label:'Brésil',           type:'pays',     continent:'Amérique'},           // Construction navale
  {label:'Argentine',        type:'pays',     continent:'Amérique'},           // Tungstène
  {label:'Enchères-2',       type:'encheres'},                                 // —
  {label:'Recevez 500k-3',   type:'500k'},                                     // Riz
  {label:'Actualité-3',      type:'actualite'},                                // —
  {label:'États-Unis-1',     type:'pays',     continent:'USA'},                // Or
  {label:'États-Unis-2',     type:'pays',     continent:'USA'},                // Construction automobile
  {label:'États-Unis-3',     type:'pays',     continent:'USA'},                // Acier
  {label:'Actualité-4',      type:'actualite'},                                // —
  {label:'Recevez 500k-4',   type:'500k'},                                     // Uranium
  {label:'Enchères',         type:'encheres'}, // idx 36 = même cellule que idx 64
  {label:'Maghreb',          type:'pays',     continent:'Afrique'},            // Cobalt
  {label:'Afrique Nord-Est', type:'pays',     continent:'Afrique'},            // Sucre
  {label:'Afrique Occid.',   type:'pays',     continent:'Afrique'},            // Cuivre
  {label:'Choix Afrique',    type:'choix',    continent:'Afrique'},            // Coton brut
  {label:'Afrique Centrale', type:'pays',     continent:'Afrique'},            // Laine brute
  {label:'Afrique GrdsLacs', type:'pays',     continent:'Afrique'},            // Argent
  {label:'Afrique du Sud',   type:'pays',     continent:'Afrique'},            // Cuivre
  {label:'Joker-2',          type:'joker'},                                    // —
  {label:'Recevez 500k-5',   type:'500k'},                                     // Cacao
  {label:'Choix Mondial-1',  type:'choix'},                                    // —
  {label:'Océanie-1',        type:'pays',     continent:'Océanie'},            // Café
  {label:'Actualité-5',      type:'actualite'},                                // —
  {label:'Recevez 500k-6',   type:'500k'},                                     // Or
  {label:'Enchères-4',       type:'encheres'},                                 // —
  {label:'Moyen-Orient',     type:'pays',     continent:'Asie'},               // Pétrole
  {label:'Péninsule Ind.',   type:'pays',     continent:'Asie'},               // Fer
  {label:'Péninsule Indoch.',type:'pays',     continent:'Asie'},               // Blé
  {label:'Choix Asie-Océ.',  type:'choix',    continent:'Asie'},               // Construction automobile
  {label:'Japon',            type:'pays',     continent:'Asie'},               // Acier
  {label:'Chine',            type:'pays',     continent:'Asie'},               // Fer
  {label:'Indonésie',        type:'pays',     continent:'Asie'},               // Caoutchouc naturel
  {label:'Joker-3',          type:'joker'},                                    // —
  {label:'Recevez 500k-7',   type:'500k'},                                     // Sucre
  {label:'Choix Mondial-2',  type:'choix'},                                    // —
  {label:'Océanie-2',        type:'pays',     continent:'Océanie'},            // Plomb
  {label:'Actualité-6',      type:'actualite'},                                // —
  {label:'Recevez 500k-8',   type:'500k'},                                     // Cacao
  {label:'Enchères',         type:'encheres'}, // idx 64 = même cellule physique que idx 36
]

// 64 positions physiques dans la grille 11x9
function buildPositions() {
  const pos = []
  for (let c = 0; c < 11; c++) pos.push([c, 0])       // haut ext →
  for (let r = 1; r < 9; r++)  pos.push([10, r])       // droite ext ↓
  for (let c = 9; c >= 0; c--) pos.push([c, 8])        // bas ext ←
  for (let r = 7; r >= 1; r--) pos.push([0, r])        // gauche ext ↑
  for (let c = 1; c < 10; c++) pos.push([c, 1])        // haut int →
  for (let r = 2; r < 8; r++)  pos.push([9, r])        // droite int ↓
  for (let c = 8; c >= 1; c--) pos.push([c, 7])        // bas int ←
  for (let r = 6; r >= 2; r--) pos.push([1, r])        // gauche int ↑
  pos.push(pos[36])                                     // idx 64 = même cellule que idx 36
  return pos
}
const POSITIONS = buildPositions()

// Ressource associée à chaque case (par idx dans LISTE)
const FIXED_ROYALTY_TILES = {
  1:'Thé',
  2:'Houille',
  3:'Tungstène',
  4:'Nickel',
  5:'Thé',  
  6:'Aluminium', 
  7:'Nickel',
  8:'Construction navale', 
  9:'Argent',///
  11:'Laine brute',
  13:'Café', 
  14:'Pétrole', 
  15:'Uranium', 
  17:'Coton brut',
  19:'Riz', 
  20:'Plomb', 
  21:'Aluminium', 
  22:'Cobalt', 
  23:'Houille', ///
  24:'Blé',
  25:'Caoutchouc naturel', 
  26:'Construction navale', 
  27:'Tungstène', 
  29:'Riz',
  31:'Or', 
  32:'Construction automobile', 
  33:'Acier',
  35:'Uranium', 
  37:'Cobalt', 
  38:'Sucre', 
  39:'Cuivre', 
  40:'Coton brut',
  41:'Laine brute', 
  42:'Argent', 
  43:'Cuivre',
  45:'Cacao', 
  47:'Café', 
  49:'Or',
  51:'Pétrole', 
  52:'Fer', 
  53:'Blé', 
  54:'Construction automobile',
  55:'Acier', 
  56:'Fer', 
  57:'Caoutchouc naturel', 
  59:'Sucre', 
  61:'Plomb', 
  63:'Cacao',
}


// ── CARTES ACTUALITÉ ────────────────────────────────────────────
// Deux formats possibles :
//
// Format ressource :
//   { text, resource, gain_holder, gain_other }
//   • resource    : nom exact de la ressource (doit correspondre à PRODUCTIONS)
//   • gain_holder : montant reçu si le joueur POSSÈDE la ressource  (toujours positif)
//   • gain_other  : montant reçu si le joueur NE possède PAS la ressource (toujours positif)
//   → Bonne nouvelle pour le détenteur  : gain_holder > gain_other
//   → Mauvaise nouvelle pour le détenteur : gain_holder < gain_other
//
// Format global :
//   { text, all_gain }   → tout le monde reçoit all_gain
//   { text, all_perte }  → tout le monde perd all_perte
// ────────────────────────────────────────────────────────────────
const ACTUALITE_CARDS = [
  // Bonnes nouvelles pour les détenteurs
  { text: "Splendides récoltes de blé ! Recevez 7M si vous possédez du blé, sinon 1M.", resource: 'Blé', gain_holder: 7000000, gain_other: 1000000 },
  { text: "Tension internationale ! Recevez 5M si vous possédez de l'uranium, sinon 1M.", resource: 'Uranium', gain_holder: 5000000, gain_other: 1000000 },
  { text: "Boom pétrolier mondial ! Recevez 10M si vous possédez du pétrole, sinon 2M.", resource: 'Pétrole', gain_holder: 10000000, gain_other: 2000000 },
  { text: "Récolte exceptionnelle de riz ! Recevez 8M si vous possédez du riz, sinon 1M.", resource: 'Riz', gain_holder: 8000000, gain_other: 1000000 },
  { text: "Découverte de gisements de nickel ! Recevez 6M si vous possédez du nickel, sinon 1M.", resource: 'Nickel', gain_holder: 6000000, gain_other: 1000000 },
  { text: "Essor de la construction automobile ! Recevez 9M si vous la possédez, sinon 2M.", resource: 'Construction automobile', gain_holder: 9000000, gain_other: 2000000 },
  { text: "Boom du caoutchouc ! Recevez 7M si vous possédez du caoutchouc naturel, sinon 1M.", resource: 'Caoutchouc naturel', gain_holder: 7000000, gain_other: 1000000 },
  { text: "Récolte de thé exceptionnelle ! Recevez 5M si vous possédez du thé, sinon 1M.", resource: 'Thé', gain_holder: 5000000, gain_other: 1000000 },
  // Mauvaises nouvelles pour les détenteurs
  { text: "Surproduction de café ! Cours en chute : recevez 1M si vous possédez du café, sinon 4M.", resource: 'Café', gain_holder: 1000000, gain_other: 4000000 },
  { text: "Incidents au Zaïre ! Crise du cuivre : recevez 1M si vous possédez du cuivre, sinon 4M.", resource: 'Cuivre', gain_holder: 1000000, gain_other: 4000000 },
  { text: "Crise de l'acier ! Recevez 1M si vous possédez de l'acier, sinon 2M.", resource: 'Acier', gain_holder: 1000000, gain_other: 2000000 },
  { text: "Effondrement du cours de l'or ! Recevez 1M si vous possédez de l'or, sinon 3M.", resource: 'Or', gain_holder: 1000000, gain_other: 3000000 },
  { text: "Grève dans les mines de houille ! Recevez 1M si vous possédez de la houille, sinon 4M.", resource: 'Houille', gain_holder: 1000000, gain_other: 4000000 },
  { text: "Mauvaise récolte de cacao ! Recevez 1M si vous possédez du cacao, sinon 4M.", resource: 'Cacao', gain_holder: 1000000, gain_other: 4000000 },
  { text: "Crise du cobalt ! Recevez 1M si vous possédez du cobalt, sinon 3M.", resource: 'Cobalt', gain_holder: 1000000, gain_other: 3000000 },
  { text: "Crise du sucre mondial ! Recevez 1M si vous possédez du sucre, sinon 3M.", resource: 'Sucre', gain_holder: 1000000, gain_other: 3000000 },
  // Cartes globales
  { text: "Krach boursier ! Tous les joueurs perdent 3M.", all_perte: 3000000 },
  { text: "Fête mondiale ! Tous les joueurs reçoivent 2M.", all_gain: 2000000 },
]

const PLAYER_COLORS = {
  orange: '#e67e22', red: '#e74c3c', yellow: '#f1c40f',
  blue: '#3498db', green: '#27ae60', teal: '#1abc9c'
}

const PION_IMAGES = {
  red:    '/pions/rouge.png',
  orange: '/pions/orange.png',
  yellow: '/pions/jaune.png',
  green:  '/pions/vert.png',
  blue:   '/pions/bleu_fonce.png',
  teal:   '/pions/bleu_claire.png',
}

function formatMoney(n) {
  if (!n && n !== 0) return '0 F'
  return n.toLocaleString('fr-FR') + ' F'
}

// ============================================================
// COMPOSANT PRINCIPAL
// ============================================================
export default function GamePage() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [game, setGame] = useState(null)
  const [players, setPlayers] = useState([])
  const [myPlayer, setMyPlayer] = useState(null)
  const [titles, setTitles] = useState([])
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [phase, setPhase] = useState('lobby')
  const [diceResult, setDiceResult] = useState(null)
  const [diceRed, setDiceRed] = useState(null)
  const [message, setMessage] = useState('')
  const [modal, setModal] = useState(null)
  const [rolling, setRolling] = useState(false)
  const [animDice, setAnimDice] = useState(null)
  const [animPositions, setAnimPositions] = useState({})
  const [teleportPos, setTeleportPos] = useState('0')
  const [viewResourcesPlayerId, setViewResourcesPlayerId] = useState(null)
  const [showTradeModal, setShowTradeModal] = useState(false)
  const [boardZoom, setBoardZoom] = useState(1)
  const [showMarket, setShowMarket] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [mobileTab, setMobileTab] = useState('board')

  const reloadRef = useRef(null)
  reloadRef.current = {
    game:   (id) => loadGame(id),
    titles: (id) => loadTitles(id),
    logs:   (id) => loadLogs(id),
  }

  useEffect(() => {
    const u = localStorage.getItem('rdm_user')
    if (!u) { router.push('/login'); return }
    setUser(JSON.parse(u))
  }, [router])

  useEffect(() => {
    const check = () => {
      const mobile = window.innerWidth < 768
      setIsMobile(mobile)
      if (mobile) setBoardZoom(0.45)
    }
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  useEffect(() => {
    if (!user) return
    loadOrCreateGame()
  }, [user])

  useEffect(() => {
    if (isMobile && game?.current_player_id && String(game.current_player_id) === String(user?.id)) {
      setMobileTab('actions')
    }
  }, [game?.current_player_id, isMobile])

  useEffect(() => {
    if (!game?.id) return
    const gid = game.id
    const reload       = () => reloadRef.current.game(gid)
    const reloadTitles = () => reloadRef.current.titles(gid)
    const reloadLogs   = () => reloadRef.current.logs(gid)
    const channel = supabase
      .channel('game-' + gid)
      .on('postgres_changes', { event: '*', table: 'games',        filter: `id=eq.${gid}` }, reload)
      .on('postgres_changes', { event: '*', table: 'game_players', filter: `game_id=eq.${gid}` }, reload)
      .on('postgres_changes', { event: '*', table: 'player_titles',filter: `game_id=eq.${gid}` }, reloadTitles)
      .on('postgres_changes', { event: '*', table: 'game_log',     filter: `game_id=eq.${gid}` }, reloadLogs)
      .subscribe()
    const poll = setInterval(reload, 2000)
    return () => { supabase.removeChannel(channel); clearInterval(poll) }
  }, [game?.id])

  async function loadOrCreateGame() {
    setLoading(true)
    const { data: games } = await supabase.from('games').select('*').neq('status', 'finished').order('created_at', { ascending: false }).limit(1)
    if (games && games.length > 0) {
      await loadGame(games[0].id)
    } else {
      const { data: newGame } = await supabase.from('games').insert({ status: 'waiting', game_state: {} }).select().single()
      if (newGame) await loadGame(newGame.id)
    }
    setLoading(false)
  }

  async function loadGame(gameId) {
    const { data: g } = await supabase.from('games').select('*').eq('id', gameId).single()
    if (!g) return
    setGame(g)
    setPhase(g.status)
    const { data: ps } = await supabase.from('game_players').select('*, users(username, color)').eq('game_id', gameId).order('turn_order')
    if (ps) {
      setPlayers(ps)
      const me = ps.find(p => p.user_id === user?.id)
      setMyPlayer(me || null)
      if (g.status === 'playing' && ps.filter(p => !p.bankrupt).length <= 1) {
        await supabase.from('games').update({ status: 'finished' }).eq('id', gameId)
        setPhase('finished')
      }
    }
    await loadTitles(gameId)
    await loadLogs(gameId)
  }

  async function loadTitles(gameId) {
    const { data } = await supabase.from('player_titles').select('*, users(username,color)').eq('game_id', gameId)
    const seen = new Set()
    const deduped = (data || []).filter(t => {
      const key = `${t.user_id}|${t.production}|${t.region}`
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
    setTitles(deduped)
  }

  async function loadLogs(gameId) {
    const { data } = await supabase.from('game_log').select('*, users(username,color)').eq('game_id', gameId).order('created_at', { ascending: false }).limit(20)
    setLogs(data || [])
  }

  async function joinGame() {
    if (!game || !user) return
    const { data: existing } = await supabase.from('game_players').select('*').eq('game_id', game.id).eq('user_id', user.id).single()
    if (existing) { setMessage('Vous êtes déjà dans cette partie !'); return }
    const { data: allPlayers } = await supabase.from('game_players').select('*').eq('game_id', game.id)
    if (allPlayers && allPlayers.length >= 6) { setMessage('La partie est complète (6 joueurs max)'); return }
    const turnOrder = allPlayers ? allPlayers.length : 0
    await supabase.from('game_players').insert({
      game_id: game.id, user_id: user.id,
      position: 0, money: 33333333,
      has_joker: false, laps_done: 0,
      bankrupt: false, turn_order: turnOrder
    })
    await addLog('a rejoint la partie', 0)
    await loadGame(game.id)
  }

  async function startGame() {
    if (!game) return
    const { data: freshPlayers } = await supabase.from('game_players').select('*').eq('game_id', game.id)
    if (!freshPlayers || freshPlayers.length < 2) { setMessage('Il faut au moins 2 joueurs'); return }
    const shuffled = [...freshPlayers].sort(() => Math.random() - 0.5)
    for (let i = 0; i < shuffled.length; i++) {
      await supabase.from('game_players').update({ turn_order: i }).eq('id', shuffled[i].id)
    }
    const first = shuffled[0]
    await supabase.from('games').update({ status: 'playing', current_player_id: first.user_id }).eq('id', game.id)
    await addLog('La partie commence !', 0)
  }

  async function setPendingAction(action) {
    await supabase.from('games')
      .update({ game_state: { ...(game?.game_state || {}), pending_action: action } })
      .eq('id', game.id)
  }

  async function clearPendingAction(extraState = {}) {
    const { pending_action, ...rest } = game?.game_state || {}
    await supabase.from('games').update({ game_state: { ...rest, ...extraState } }).eq('id', game.id)
  }

  async function clearTradeProposal() {
    const { trade_proposal, ...rest } = game?.game_state || {}
    await supabase.from('games').update({ game_state: rest }).eq('id', game.id)
  }

  async function proposeTrade(proposal) {
    const state = game?.game_state || {}
    await supabase.from('games').update({ game_state: { ...state, trade_proposal: proposal } }).eq('id', game.id)
    await addLog(`a proposé un échange à ${proposal.to_username}`, 0)
  }

  async function acceptTrade() {
    const tp = game?.game_state?.trade_proposal
    if (!tp) return
    const fromPlayer = players.find(p => String(p.user_id) === String(tp.from_user_id))
    const toPlayer   = players.find(p => String(p.user_id) === String(tp.to_user_id))
    if (!fromPlayer || !toPlayer) return
    const fromNewMoney = fromPlayer.money - (tp.offer.money || 0) + (tp.request.money || 0)
    const toNewMoney   = toPlayer.money   - (tp.request.money || 0) + (tp.offer.money || 0)
    await supabase.from('game_players').update({ money: fromNewMoney }).eq('id', fromPlayer.id)
    await supabase.from('game_players').update({ money: toNewMoney }).eq('id', toPlayer.id)
    for (const t of (tp.offer.titles || [])) {
      const { data: row } = await supabase.from('player_titles').select('id')
        .eq('game_id', game.id).eq('user_id', tp.from_user_id).eq('production', t.production).eq('region', t.region).maybeSingle()
      if (row) await supabase.from('player_titles').update({ user_id: tp.to_user_id }).eq('id', row.id)
    }
    for (const t of (tp.request.titles || [])) {
      const { data: row } = await supabase.from('player_titles').select('id')
        .eq('game_id', game.id).eq('user_id', tp.to_user_id).eq('production', t.production).eq('region', t.region).maybeSingle()
      if (row) await supabase.from('player_titles').update({ user_id: tp.from_user_id }).eq('id', row.id)
    }
    if (tp.offer.joker) {
      await supabase.from('game_players').update({ has_joker: false }).eq('id', fromPlayer.id)
      if (!toPlayer.has_joker) await supabase.from('game_players').update({ has_joker: true }).eq('id', toPlayer.id)
    }
    if (tp.request.joker) {
      await supabase.from('game_players').update({ has_joker: false }).eq('id', toPlayer.id)
      if (!fromPlayer.has_joker) await supabase.from('game_players').update({ has_joker: true }).eq('id', fromPlayer.id)
    }
    await clearTradeProposal()
    await addLog(`a accepté l'échange de ${tp.from_username}`, 0)
  }

  async function sellTitlesToBankLastChance(titlesToSell) {
    if (!myPlayer || !titlesToSell.length) return
    let earned = 0
    for (const t of titlesToSell) {
      const sellPrice = Math.floor((t.buy_price || 0) / 2)
      earned += sellPrice
      await supabase.from('player_titles').delete().eq('id', t.id)
    }
    if (earned > 0) await updateMoney(myPlayer.id, earned)
    await addLog(`vend ${titlesToSell.length} titre(s) à la banque pour ${formatMoney(earned)}`, earned)
    await loadTitles(game.id)
  }

  async function declareForfeit() {
    if (!myPlayer) return
    await supabase.from('game_players').update({ bankrupt: true, money: 0 }).eq('id', myPlayer.id)
    await addLog('déclare forfait — en FAILLITE !', 0)
    const { pending_bankruptcy, ...rest } = game?.game_state || {}
    await supabase.from('games').update({ game_state: rest }).eq('id', game.id)
    await nextTurn()
    await loadGame(game.id)
  }

  async function surviveBankruptcy() {
    const bp = game?.game_state?.pending_bankruptcy
    if (!myPlayer || !bp) return
    const { data: freshPlayers } = await supabase.from('game_players').select('*').eq('game_id', game.id)
    const freshMe = freshPlayers?.find(p => p.user_id === user.id)
    if (!freshMe) return
    let moneyLeft = freshMe.money
    for (const c of (bp.creditors || [])) {
      const toPay = Math.min(moneyLeft, c.amount)
      if (toPay > 0) {
        moneyLeft -= toPay
        const creditor = freshPlayers?.find(p => p.id === c.player_id)
        if (creditor) await supabase.from('game_players').update({ money: creditor.money + toPay }).eq('id', creditor.id)
        await addLog(`rembourse ${formatMoney(toPay)} de royalties à ${c.player_name}`, toPay)
      }
    }
    await supabase.from('game_players').update({ money: moneyLeft }).eq('id', freshMe.id)
    await addLog('a remboursé ses dettes et survit !', 0)
    const { pending_bankruptcy, ...rest } = game?.game_state || {}
    await supabase.from('games').update({ game_state: rest }).eq('id', game.id)
    await nextTurn()
    await loadGame(game.id)
  }

  async function declineTrade() {
    const tp = game?.game_state?.trade_proposal
    if (!tp) return
    await clearTradeProposal()
    await addLog(`a refusé l'échange de ${tp.from_username}`, 0)
  }

  async function rollDice() {
    if (rolling) return
    if (!isMyTurn()) { setMessage("Ce n'est pas votre tour !"); return }
    setRolling(true)
    setDiceResult(null)
    setMessage('')

    const finalD1 = Math.ceil(Math.random() * 6)
    const finalD2 = Math.ceil(Math.random() * 6)
    const dr = Math.ceil(Math.random() * 6)

    await new Promise(resolve => {
      let count = 0
      const interval = setInterval(() => {
        count++
        setAnimDice({ d1: Math.ceil(Math.random() * 6), d2: Math.ceil(Math.random() * 6) })
        if (count >= 18) { clearInterval(interval); resolve() }
      }, 80)
    })

    setAnimDice(null)
    const total = finalD1 + finalD2
    setDiceResult({ d1: finalD1, d2: finalD2, total })
    setDiceRed(dr)
    await new Promise(r => setTimeout(r, 1500))

    const oldPos = myPlayer.position
    const rawNew = oldPos + total
    const newPos = rawNew % 65
    const physNewPos = newPos === 64 ? 36 : newPos
    const newLaps = myPlayer.laps_done + Math.floor(rawNew / 65)
    const landedCase = LISTE[physNewPos]
    const caseResource = FIXED_ROYALTY_TILES[physNewPos] || null
    const isDouble = finalD1 === finalD2
    const doublesCountsMap = game?.game_state?.doubles_counts || {}
    const currentDoublesCount = doublesCountsMap[user.id] || 0
    const newDoublesCount = isDouble ? currentDoublesCount + 1 : currentDoublesCount
    const doublePenalty = isDouble && newDoublesCount > 2 ? (newDoublesCount - 2) * 1000000 : null

    const royaltyPayments = []
    if (caseResource) {
      for (const p of players) {
        if (p.user_id === user.id || p.bankrupt) continue
        const pct = titles
          .filter(t => t.user_id === p.user_id && t.production === caseResource)
          .reduce((sum, t) => sum + t.percentage, 0)
        const royalty = getRoyaltyAmount(caseResource, pct)
        if (royalty > 0) royaltyPayments.push({ to_id: p.id, to_name: p.users?.username, amount: royalty, resource: caseResource, current_money: p.money })
      }
    }

    const playerName = myPlayer.users?.username
    const lines = [`${playerName} avance de ${total} case${total > 1 ? 's' : ''} et tombe sur : ${landedCase.label}`]
    if (isDouble && newDoublesCount <= 2) lines.push(`⚠️ Double ${finalD1} ! (${newDoublesCount}/2 doubles gratuits — pas de pénalité)`)
    if (doublePenalty) lines.push(`⚠️ Double ${finalD1} ! (${newDoublesCount}ème double) — pénalité : ${formatMoney(doublePenalty)}`)
    if (caseResource) lines.push(`Ressource : ${caseResource}`)
    royaltyPayments.forEach(r => lines.push(`Royalties ${r.resource} → ${r.to_name} : ${formatMoney(r.amount)}`))

    let actualiteCard = null
    if (landedCase.type === 'actualite') {
      actualiteCard = ACTUALITE_CARDS[Math.floor(Math.random() * ACTUALITE_CARDS.length)]
      lines.push(`Carte Actualité : ${actualiteCard.text}`)
      const myTitlesNow = titles.filter(t => t.user_id === user.id)
      let amount = 0
      if (actualiteCard.all_gain) { amount = actualiteCard.all_gain }
      else if (actualiteCard.all_perte) { amount = -actualiteCard.all_perte }
      else if (actualiteCard.resource) {
        const has = myTitlesNow.some(t => t.production === actualiteCard.resource)
        amount = has ? actualiteCard.gain_holder : actualiteCard.gain_other
      }
      actualiteCard = { ...actualiteCard, computed_amount: amount }
    }
    if (landedCase.type === '500k') lines.push(`Vous recevez ${formatMoney(total * 500000)} de la banque !`)
    if (landedCase.type === 'joker') lines.push('Vous pouvez acheter un Joker pour 3 000 000 F.')
    if (landedCase.type === 'encheres') lines.push('Case neutre — aucun effet.')

    // Animation pion case par case
    setAnimPositions(prev => ({ ...prev, [user.id]: oldPos }))
    for (let step = 1; step <= total; step++) {
      await new Promise(r => setTimeout(r, 280))
      const stepPos = (oldPos + step) % 65
      setAnimPositions(prev => ({ ...prev, [user.id]: stepPos === 64 ? 36 : stepPos }))
    }
    await new Promise(r => setTimeout(r, 200))
    setAnimPositions(prev => { const n = { ...prev }; delete n[user.id]; return n })

    await setPendingAction({
      player_id: user.id,
      player_name: playerName,
      player_color: myPlayer.users?.color,
      lines,
      data: { newPos: physNewPos, newLaps, diceRed: dr, total, doublePenalty, isDouble, newDoublesCount, royaltyPayments, landingType: landedCase.type, cas: landedCase, actualiteCard }
    })

    setRolling(false)
    await loadGame(game.id)
  }

  async function confirmPendingAction(useJoker = false) {
    const pa = game?.game_state?.pending_action
    if (!pa || pa.player_id !== user.id) return
    const { data: d } = pa

    const { data: freshPlayers } = await supabase.from('game_players').select('*, users(username,color)').eq('game_id', game.id)
    const freshMe = freshPlayers?.find(p => p.user_id === user.id)
    if (!freshMe) return

    let myMoney = freshMe.money
    await supabase.from('game_players').update({ position: d.newPos, laps_done: d.newLaps }).eq('id', freshMe.id)
    await addLog(`avance de ${d.total} cases → ${d.cas.label}`, 0)

    if (d.newLaps > freshMe.laps_done) {
      myMoney += 5000000
      await addLog('passe par DÉPART — reçoit 5 000 000 F', 5000000)
    }

    let debtAmount = 0

    if (d.doublePenalty) {
      const paid = Math.min(myMoney, d.doublePenalty)
      debtAmount += d.doublePenalty - paid
      myMoney = Math.max(0, myMoney - d.doublePenalty)
      await addLog(`a fait double — paie ${formatMoney(d.doublePenalty)} à la banque`, d.doublePenalty)
    }

    const creditorDebts = []
    if (d.royaltyPayments?.length > 0) {
      for (const r of d.royaltyPayments) {
        const amount = useJoker ? Math.floor(r.amount / 2) : r.amount
        const paid = Math.min(myMoney, amount)
        const unpaid = amount - paid
        debtAmount += unpaid
        myMoney = Math.max(0, myMoney - paid)
        const creditor = freshPlayers?.find(p => p.id === r.to_id)
        if (creditor && paid > 0) await supabase.from('game_players').update({ money: creditor.money + paid }).eq('id', r.to_id)
        if (unpaid > 0) creditorDebts.push({ player_id: r.to_id, player_name: r.to_name, amount: unpaid })
        await addLog(`paie ${formatMoney(paid)}${unpaid > 0 ? ` (manque ${formatMoney(unpaid)})` : ''} de royalties à ${r.to_name} (${r.resource})${useJoker ? ' 🃏 Joker' : ''}`, paid)
      }
      if (useJoker) {
        await supabase.from('game_players').update({ has_joker: false }).eq('id', freshMe.id)
        await addLog('a utilisé son Joker — royalties réduites de moitié', 0)
      }
    }

    let nextModal = null
    switch (d.landingType) {
      case '500k': {
        const gain500 = d.total * 500000
        myMoney += gain500
        await addLog(`reçoit ${formatMoney(gain500)} (case 500.000 F)`, gain500)
        break
      }
      case 'actualite': {
        if (d.actualiteCard) {
          myMoney = Math.max(0, myMoney + d.actualiteCard.computed_amount)
          await addLog(`carte Actualité : ${d.actualiteCard.computed_amount >= 0 ? '+' : ''}${formatMoney(d.actualiteCard.computed_amount)}`, Math.abs(d.actualiteCard.computed_amount))
          if (d.actualiteCard.all_gain || d.actualiteCard.all_perte) {
            const delta = d.actualiteCard.all_gain ? d.actualiteCard.all_gain : -d.actualiteCard.all_perte
            for (const p of (freshPlayers || [])) {
              if (p.user_id === user.id || p.bankrupt) continue
              await supabase.from('game_players').update({ money: Math.max(0, p.money + delta) }).eq('id', p.id)
            }
          }
        }
        break
      }
      case 'pays':
      case 'europe': nextModal = { type: 'buy', data: { cas: d.cas, laps: d.newLaps } }; break
      case 'choix':  nextModal = { type: 'buy', data: { cas: d.cas, laps: d.newLaps } }; break
      case 'joker':  nextModal = { type: 'joker', data: {} }; break
      case 'encheres':
        break
    }

    await supabase.from('game_players').update({ money: myMoney }).eq('id', freshMe.id)
    const updatedDoubles = { ...(game?.game_state?.doubles_counts || {}), [user.id]: d.isDouble ? d.newDoublesCount : 0 }

    if (myMoney === 0 && debtAmount > 0) {
      await addLog(`ne peut pas payer ${formatMoney(debtAmount)} — dernière chance !`, debtAmount)
      const { pending_action, ...rest } = game?.game_state || {}
      await supabase.from('games').update({ game_state: {
        ...rest,
        doubles_counts: updatedDoubles,
        pending_bankruptcy: { player_id: user.id, player_name: freshMe.users?.username, player_color: freshMe.users?.color, debt: debtAmount, creditors: creditorDebts }
      }}).eq('id', game.id)
    } else {
      await clearPendingAction({ doubles_counts: updatedDoubles })
      if (nextModal) setModal({ ...nextModal, isDouble: d.isDouble })
      else if (d.isDouble) setDiceResult(null)
      else await nextTurn()
    }
    await loadGame(game.id)
  }

  async function buyTitles(selectedTitles) {
    if (!selectedTitles || selectedTitles.length === 0) { setModal(null); if (modal?.isDouble) setDiceResult(null); else await nextTurn(); return }
    let totalCost = 0
    let bought = 0
    for (const t of selectedTitles) {
      const { data: existing } = await supabase.from('player_titles')
        .select('id').eq('game_id', game.id).eq('production', t.production).eq('region', t.region).maybeSingle()
      if (existing) continue
      totalCost += t.price
      bought++
      await supabase.from('player_titles').insert({
        game_id: game.id, user_id: user.id,
        production: t.production, region: t.region,
        percentage: t.percentage, buy_price: t.price
      })
    }
    if (totalCost > 0) await updateMoney(myPlayer.id, -totalCost)
    if (bought > 0) await addLog(`achète ${bought} titre(s) pour ${formatMoney(totalCost)}`, totalCost)
    setModal(null)
    if (modal?.isDouble) setDiceResult(null); else await nextTurn()
  }

  async function handleActualite(card) {
    const myTitles = titles.filter(t => t.user_id === user.id)
    let amount = 0
    if (card.all_gain) { amount = card.all_gain }
    else if (card.all_perte) { amount = -card.all_perte }
    else if (card.resource) {
      const has = myTitles.some(t => t.production === card.resource)
      amount = has ? card.gain_holder : card.gain_other
    }
    await updateMoney(myPlayer.id, amount)
    await addLog(`carte Actualité : ${amount >= 0 ? '+' : ''}${formatMoney(amount)}`, Math.abs(amount))
    setModal(null)
    if (modal?.isDouble) setDiceResult(null); else await nextTurn()
  }

  async function buyJoker() {
    if (myPlayer.money < 3000000) { setMessage("Pas assez d'argent pour acheter un Joker (3M)"); setModal(null); return }
    await supabase.from('game_players').update({ has_joker: true }).eq('id', myPlayer.id)
    await updateMoney(myPlayer.id, -3000000)
    await addLog('achète un Joker pour 3.000.000 F', 3000000)
    setModal(null)
    if (modal?.isDouble) setDiceResult(null); else await nextTurn()
  }

  async function updateMoney(playerId, delta) {
    const p = players.find(pl => pl.id === playerId) || myPlayer
    if (!p) return
    const newMoney = Math.max(0, p.money + delta)
    await supabase.from('game_players').update({ money: newMoney }).eq('id', playerId)
    if (newMoney === 0 && delta < 0) {
      await supabase.from('game_players').update({ bankrupt: true }).eq('id', playerId)
      await addLog('est en FAILLITE !', 0)
    }
  }

  async function nextTurn() {
    if (!game) return
    const { data: freshPs } = await supabase.from('game_players').select('*').eq('game_id', game.id)
    if (!freshPs?.length) return
    const activePlayers = freshPs.filter(p => !p.bankrupt)
    if (activePlayers.length <= 1) {
      await supabase.from('games').update({ status: 'finished' }).eq('id', game.id)
      setPhase('finished')
      return
    }
    const currentIdx = activePlayers.findIndex(p => p.user_id === game.current_player_id)
    const nextIdx = (currentIdx + 1) % activePlayers.length
    const nextPlayer = activePlayers[nextIdx]
    await supabase.from('games').update({ current_player_id: nextPlayer.user_id }).eq('id', game.id)
  }

  async function addLog(action, amount) {
    if (!game || !user) return
    await supabase.from('game_log').insert({ game_id: game.id, user_id: user.id, action, amount })
  }

  function isMyTurn() { return game?.current_player_id === user?.id && phase === 'playing' }
  function isInGame() { return players.some(p => p.user_id === user?.id) }
  function getMyTitles() { return titles.filter(t => t.user_id === user?.id) }
  function getTotalPercentage(production) { return getMyTitles().filter(t => t.production === production).reduce((sum, t) => sum + t.percentage, 0) }
  function getRoyalties(production) { return getRoyaltyAmount(production, getTotalPercentage(production)) }
  function logout() { localStorage.removeItem('rdm_user'); router.push('/login') }

  async function teleport(pos) {
    if (!myPlayer) return
    await supabase.from('game_players').update({ position: parseInt(pos) || 0 }).eq('id', myPlayer.id)
    await loadGame(game.id)
  }

  async function resetGame() {
    if (!game) return
    await supabase.from('game_log').delete().eq('game_id', game.id)
    await supabase.from('player_titles').delete().eq('game_id', game.id)
    await supabase.from('game_players').delete().eq('game_id', game.id)
    await supabase.from('games').delete().eq('id', game.id)
    await loadOrCreateGame()
  }

  if (loading) return (
    <div style={{ minHeight:'100vh', background:'#1a0a00', display:'flex', alignItems:'center', justifyContent:'center', color:'#c8962a', fontSize:'24px', fontFamily:'Georgia,serif' }}>
      Chargement du jeu...
    </div>
  )

  return (
    <div style={{ minHeight:'100vh', background:'#0d0700', color:'white', fontFamily:"'Barlow Condensed',Arial,sans-serif" }}>
      <GlobalStyles />
      <div className="header">
        <h1 className="header-title">🌍 {isMobile ? 'Richesses' : 'Richesses du Monde'}</h1>
        <div style={{ display:'flex', gap: isMobile ? '6px' : '12px', alignItems:'center' }}>
          {!isMobile && <span style={{ color:'#aaa', fontSize:'14px' }}>Connecté : <strong style={{ color:'#c8962a' }}>{user?.username}</strong></span>}
          <button onClick={() => setShowMarket(true)} style={{ padding: isMobile ? '6px 10px' : '6px 14px', background:'#1a4a6b', border:'1px solid #2980b9', borderRadius:'6px', color:'#3498db', cursor:'pointer', fontSize:'13px', fontWeight:'600' }}>📦 {!isMobile && 'Ressources'}</button>
          {phase === 'playing' && (
            <button
              onClick={() => { if (isMyTurn() && !modal && !diceResult && !rolling && !game?.game_state?.trade_proposal) setShowTradeModal(true) }}
              disabled={!(isMyTurn() && !modal && !diceResult && !rolling && !game?.game_state?.trade_proposal)}
              style={{ padding: isMobile ? '6px 10px' : '6px 14px', background: (isMyTurn() && !modal && !diceResult && !rolling && !game?.game_state?.trade_proposal) ? '#0d2a1a' : 'transparent', border: `1px solid ${(isMyTurn() && !modal && !diceResult && !rolling && !game?.game_state?.trade_proposal) ? '#27ae60' : '#333'}`, borderRadius:'6px', color: (isMyTurn() && !modal && !diceResult && !rolling && !game?.game_state?.trade_proposal) ? '#27ae60' : '#444', cursor: (isMyTurn() && !modal && !diceResult && !rolling && !game?.game_state?.trade_proposal) ? 'pointer' : 'not-allowed', fontSize:'13px', fontWeight:'600', transition:'all 0.2s' }}
            >🤝 {!isMobile && 'Échange'}</button>
          )}
          {user?.role === 'admin' && (
            <button onClick={resetGame} style={{ padding: isMobile ? '6px 10px' : '6px 14px', background:'#c0392b', border:'none', borderRadius:'6px', color:'white', cursor:'pointer', fontSize:'13px' }}>🔄</button>
          )}
          <button onClick={logout} style={{ padding: isMobile ? '6px 10px' : '6px 14px', background:'transparent', border:'1px solid #555', borderRadius:'6px', color:'#aaa', cursor:'pointer', fontSize:'13px' }}>{isMobile ? '↩' : 'Déconnexion'}</button>
        </div>
      </div>

      <div style={{ display:'grid', gridTemplateColumns: isMobile ? '1fr' : '260px 1fr 240px', minHeight: isMobile ? 'calc(100vh - 116px)' : 'calc(100vh - 60px)' }}>

        {/* PANNEAU GAUCHE */}
        <div style={{ background:'#0d0500', borderRight: isMobile ? 'none' : '2px solid #2a1a00', padding:'16px', overflowY:'auto', display: (!isMobile || mobileTab === 'actions') ? 'flex' : 'none', flexDirection:'column', gap:'12px' }}>

          {phase === 'waiting' && (
            <div style={{ textAlign:'center', padding:'20px 10px' }}>
              <h2 style={{ color:'#c8962a', fontSize:'22px', marginBottom:'16px', fontFamily:"'Oswald',sans-serif" }}>Salle d'attente</h2>
              <p style={{ color:'#aaa', marginBottom:'20px', fontSize:'13px' }}>{players.length} joueur(s)</p>
              <div style={{ display:'flex', flexDirection:'column', gap:'8px', marginBottom:'20px' }}>
                {players.map(p => (
                  <div key={p.id} style={{ background:'rgba(255,255,255,0.05)', border:`2px solid ${PLAYER_COLORS[p.users?.color]||'#555'}`, borderRadius:'8px', padding:'10px' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
                      <div style={{ width:'14px', height:'14px', borderRadius:'50%', background:PLAYER_COLORS[p.users?.color]||'#555' }}/>
                      <span style={{ color:'white', fontWeight:'bold', fontSize:'14px' }}>{p.users?.username}</span>
                    </div>
                    <div style={{ color:'#27ae60', fontSize:'12px', marginTop:'4px' }}>{formatMoney(p.money)}</div>
                  </div>
                ))}
              </div>
              {!isInGame() && <button onClick={joinGame} className="roll-button" style={{ width:'100%', marginBottom:'10px' }}>Rejoindre</button>}
              {isInGame() && user?.role === 'admin' && players.length >= 2 && (
                <button onClick={startGame} className="roll-button" style={{ width:'100%', background:'#27ae60' }}>🎮 Lancer la partie !</button>
              )}
              {isInGame() && user?.role !== 'admin' && <p style={{ color:'#27ae60', fontSize:'13px' }}>✓ En attente du lancement...</p>}
              {message && <p style={{ color:'#e74c3c', fontSize:'13px' }}>{message}</p>}
            </div>
          )}

          {phase === 'playing' && (
            <>
              <div style={{ background:'rgba(200,150,42,0.1)', border:'1px solid #c8962a44', borderRadius:'8px', padding:'12px', textAlign:'center' }}>
                <div style={{ color:'#c8962a', fontFamily:"'Oswald',sans-serif", fontSize:'14px', fontWeight:'600', marginBottom:'4px' }}>
                  {isMyTurn() ? '🎲 VOTRE TOUR' : '⏳ TOUR DE'}
                </div>
                {!isMyTurn() && <div style={{ color:'white', fontSize:'13px', fontWeight:'bold' }}>{players.find(p => p.user_id === game?.current_player_id)?.users?.username || '...'}</div>}
              </div>

              {isMyTurn() && !modal && (
                <button onClick={rollDice} disabled={rolling} className="roll-button" style={{ width:'100%' }}>
                  {rolling ? '🎲 ...' : '🎲 Lancer les dés'}
                </button>
              )}

              {(animDice || diceResult) && (
                <div style={{ background:'rgba(255,255,255,0.04)', border:'1px solid #333', borderRadius:'10px', padding:'14px', textAlign:'center' }}>
                  <div style={{ display:'flex', gap:'10px', justifyContent:'center', marginBottom:'10px' }}>
                    <DiceFace value={animDice ? animDice.d1 : diceResult.d1} spinning={!!animDice}/>
                    <DiceFace value={animDice ? animDice.d2 : diceResult.d2} spinning={!!animDice}/>
                  </div>
                  {!animDice && diceResult && (
                    <div style={{ display:'flex', flexDirection:'column', gap:'4px', alignItems:'center' }}>
                      <span style={{ color:'#c8962a', fontSize:'20px', fontWeight:'bold', fontFamily:"'Oswald',sans-serif" }}>= {diceResult.total} cases</span>
                      {diceRed && <span style={{ color:'#888', fontSize:'12px' }}>Dé rouge : {diceRed}</span>}
                      {diceResult.d1 === diceResult.d2 && <span style={{ color:'#e74c3c', fontSize:'13px', fontWeight:'bold' }}>⚠️ Double ! Pénalité !</span>}
                    </div>
                  )}
                  {animDice && <span style={{ color:'#c8962a', fontSize:'16px' }}>🎲 En cours...</span>}
                </div>
              )}

              {message && <div style={{ color:'#e74c3c', fontSize:'13px', padding:'8px', background:'rgba(231,76,60,0.1)', border:'1px solid #e74c3c44', borderRadius:'6px' }}>{message}</div>}

              {isInGame() && (
                <div style={{ padding:'8px', background:'rgba(231,76,60,0.08)', border:'1px solid #e74c3c44', borderRadius:'6px' }}>
                  <div style={{ color:'#e74c3c', fontSize:'11px', fontWeight:700, marginBottom:'6px' }}>🛠 TÉLÉPORTEUR DEBUG</div>
                  <div style={{ display:'flex', gap:'6px', alignItems:'center' }}>
                    <input
                      type="number" min="0" max="63"
                      value={teleportPos}
                      onChange={e => setTeleportPos(e.target.value)}
                      style={{ width:'55px', padding:'4px 6px', background:'#0a0000', border:'1px solid #555', borderRadius:'4px', color:'white', fontSize:'13px' }}
                    />
                    <button
                      onClick={() => teleport(teleportPos)}
                      style={{ padding:'4px 12px', background:'#e74c3c', border:'none', borderRadius:'4px', color:'white', cursor:'pointer', fontSize:'13px', fontWeight:700 }}
                    >Aller</button>
                  </div>
                </div>
              )}

              <div style={{ borderTop:'1px solid #2a1a00', paddingTop:'12px' }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'10px' }}>
                  <h3 style={{ color:'#c8962a', margin:0, fontSize:'14px', fontFamily:"'Oswald',sans-serif", fontWeight:'600' }}>📋 RESSOURCES</h3>
                  <select
                    value={String(viewResourcesPlayerId ?? user?.id ?? '')}
                    onChange={e => setViewResourcesPlayerId(e.target.value)}
                    style={{ background:'#1a0a00', border:'1px solid #c8962a55', borderRadius:'4px', color:'#c8962a', fontSize:'11px', padding:'2px 6px', cursor:'pointer' }}
                  >
                    {players.filter(p => p.user_id).map(p => (
                      <option key={p.user_id} value={String(p.user_id)}>
                        {p.users?.username || p.user_id}{String(p.user_id) === String(user?.id) ? ' (moi)' : ''}
                      </option>
                    ))}
                  </select>
                </div>
                {(() => {
                  const vid = String(viewResourcesPlayerId ?? user?.id ?? '')
                  const vTitles = titles.filter(t => String(t.user_id) === vid)
                  const vGetPct = prod => vTitles.filter(t => t.production === prod).reduce((s, t) => s + t.percentage, 0)
                  const vGetRoyalties = prod => getRoyaltyAmount(prod, vGetPct(prod))
                  return <MyTitles titles={vTitles} getRoyalties={vGetRoyalties} getTotalPercentage={vGetPct}/>
                })()}
              </div>
            </>
          )}

          {phase === 'finished' && (
            <div style={{ textAlign:'center', padding:'20px 10px' }}>
              <h2 style={{ color:'#c8962a', fontSize:'24px', fontFamily:"'Oswald',sans-serif" }}>🏆 Fin !</h2>
              <div style={{ marginTop:'16px' }}>
                {[...players].sort((a,b) => b.money - a.money).map((p, i) => (
                  <div key={p.id} style={{ padding:'10px', margin:'6px 0', background: i===0?'rgba(200,150,42,0.2)':'rgba(255,255,255,0.04)', border: i===0?'2px solid #c8962a':'1px solid #333', borderRadius:'8px' }}>
                    <span style={{ color: i===0?'#c8962a':'#aaa', fontSize:'13px' }}>{i===0?'🥇':i===1?'🥈':'🥉'} {p.users?.username}</span>
                    <div style={{ color:'#27ae60', fontSize:'12px' }}>{formatMoney(p.money)}</div>
                  </div>
                ))}
              </div>
              {user?.role === 'admin' && (
                <button onClick={resetGame} className="roll-button" style={{ marginTop:'16px', width:'100%' }}>🔄 Nouvelle partie</button>
              )}
            </div>
          )}
        </div>

        {/* PLATEAU CENTRAL */}
        <div style={{ display: (!isMobile || mobileTab === 'board') ? 'flex' : 'none', flexDirection:'column', minWidth:0, overflow:'hidden' }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:'6px', padding:'6px 12px 0', flexShrink:0 }}>
            <button onClick={() => setBoardZoom(z => Math.max(0.3, +(z - 0.1).toFixed(1)))} style={{ width:32, height:32, background:'#1a0a00', border:'1px solid #c8962a55', borderRadius:'6px', color:'#c8962a', cursor:'pointer', fontSize:'18px', lineHeight:1 }}>−</button>
            <span style={{ color:'#555', fontSize:'12px', minWidth:'36px', textAlign:'center' }}>{Math.round(boardZoom * 100)}%</span>
            <button onClick={() => setBoardZoom(z => Math.min(1.5, +(z + 0.1).toFixed(1)))} style={{ width:32, height:32, background:'#1a0a00', border:'1px solid #c8962a55', borderRadius:'6px', color:'#c8962a', cursor:'pointer', fontSize:'18px', lineHeight:1 }}>+</button>
            {!isMobile && <button onClick={() => setBoardZoom(1)} style={{ padding:'0 8px', height:28, background:'#1a0a00', border:'1px solid #2a1a00', borderRadius:'4px', color:'#555', cursor:'pointer', fontSize:'11px' }}>100%</button>}
          </div>
          <div style={{ padding: isMobile ? '8px' : '12px', overflow:'auto', flex:1 }}>
          <div style={{ zoom: boardZoom, display:'inline-block' }}>
          {(phase === 'playing' || phase === 'finished') && (
            <Board
              players={players}
              myPlayer={myPlayer}
              currentPlayerId={game?.current_player_id}
              animPositions={animPositions}
              flippedCard={(() => {
                const pa = game?.game_state?.pending_action
                if (pa?.data?.landingType === 'actualite') return { type:'actualite', text: pa.data.actualiteCard?.text, amount: pa.data.actualiteCard?.computed_amount }
                if (pa?.data?.landingType === 'joker') return { type:'joker' }
                return null
              })()}
            />
          )}
          {phase === 'waiting' && (
            <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100%', color:'#444', fontSize:'18px', fontFamily:"'Oswald',sans-serif" }}>
              En attente des joueurs...
            </div>
          )}
          </div>
          </div>
        </div>

        {/* SIDEBAR DROITE */}
        <div className="sidebar" style={{ display: (!isMobile || mobileTab === 'players') ? 'block' : 'none' }}>
          <h3 style={{ color:'#c8962a', margin:'0 0 12px', fontSize:'16px' }}>👥 Joueurs</h3>
          {players.map(p => (
            <div key={p.id} style={{ padding:'10px', marginBottom:'8px', background:'rgba(255,255,255,0.03)', border:`1px solid ${game?.current_player_id===p.user_id?'#c8962a':'#2a1a00'}`, borderRadius:'8px', opacity:p.bankrupt?0.4:1 }}>
              <div style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'4px' }}>
                <div style={{ width:'12px', height:'12px', borderRadius:'50%', background:PLAYER_COLORS[p.users?.color]||'#555' }}/>
                <span style={{ fontWeight:'bold', color:game?.current_player_id===p.user_id?'#c8962a':'white', fontSize:'14px' }}>
                  {p.users?.username} {p.bankrupt?'💀':''} {p.has_joker?'🃏':''}
                </span>
              </div>
              <div style={{ color:'#aaa', fontSize:'12px' }}>Case {p.position} — Tour {p.laps_done}</div>
              <div style={{ color:'#27ae60', fontSize:'13px', fontWeight:'bold' }}>{formatMoney(p.money)}</div>
            </div>
          ))}
          <h3 style={{ color:'#c8962a', margin:'16px 0 12px', fontSize:'16px' }}>📜 Historique</h3>
          <div style={{ fontSize:'12px' }}>
            {logs.map(l => (
              <div key={l.id} style={{ padding:'6px 0', borderBottom:'1px solid #1a0a00', color:'#aaa' }}>
                <span style={{ color:PLAYER_COLORS[l.users?.color]||'#c8962a' }}>{l.users?.username}</span> {l.action}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* BARRE DE NAVIGATION MOBILE */}
      {isMobile && (
        <div style={{ position:'fixed', bottom:0, left:0, right:0, height:'56px', background:'#1a0800', borderTop:'2px solid #c8962a', display:'flex', zIndex:500 }}>
          {[
            { id:'actions', icon: isMyTurn() && !diceResult && !modal ? '🎲' : '⚙️', label:'Actions' },
            { id:'board',   icon:'🗺️', label:'Plateau' },
            { id:'players', icon:'👥', label:'Joueurs' },
          ].map(tab => (
            <button key={tab.id} onClick={() => setMobileTab(tab.id)} style={{ flex:1, background: mobileTab===tab.id ? 'rgba(200,150,42,0.18)' : 'transparent', border:'none', color: mobileTab===tab.id ? '#c8962a' : '#666', fontSize:'11px', cursor:'pointer', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:'2px', position:'relative' }}>
              <span style={{ fontSize:'20px', lineHeight:1 }}>{tab.icon}</span>
              {tab.label}
              {tab.id === 'actions' && isMyTurn() && !diceResult && !modal && mobileTab !== 'actions' && (
                <span style={{ position:'absolute', top:'4px', right:'calc(50% - 18px)', width:'8px', height:'8px', background:'#e74c3c', borderRadius:'50%' }}/>
              )}
            </button>
          ))}
        </div>
      )}

      {/* OVERLAY */}
      <PendingActionOverlay
        pendingAction={game?.game_state?.pending_action}
        currentUserId={user?.id}
        onConfirm={confirmPendingAction}
        hasJoker={myPlayer?.has_joker}
      />

      {/* MODALS */}
      {modal && (
        <Modal modal={modal} myPlayer={myPlayer} titles={titles} players={players} user={user}
          onBuy={buyTitles} onActualite={handleActualite} onJoker={buyJoker}
          onClose={() => { setModal(null); if (modal?.isDouble) setDiceResult(null); else nextTurn() }}
          formatMoney={formatMoney}
        />
      )}

      {showMarket && (
        <MarketModal titles={titles} onClose={() => setShowMarket(false)} />
      )}

      {showTradeModal && (
        <TradeModal
          players={players} myPlayer={myPlayer} titles={titles} user={user}
          onClose={() => setShowTradeModal(false)}
          onSend={proposeTrade}
        />
      )}

      <TradeOverlay
        proposal={game?.game_state?.trade_proposal}
        players={players} myPlayer={myPlayer} user={user}
        onAccept={acceptTrade}
        onDecline={declineTrade}
        onCancel={clearTradeProposal}
        formatMoney={formatMoney}
      />

      <BankruptcyOverlay
        bankruptcy={game?.game_state?.pending_bankruptcy}
        players={players} myPlayer={myPlayer} titles={titles} user={user}
        onForfeit={declareForfeit}
        onSurvive={surviveBankruptcy}
        onProposeTrade={proposeTrade}
        onSellTitles={sellTitlesToBankLastChance}
        formatMoney={formatMoney}
      />

      {phase === 'finished' && (() => {
        const winner = players.find(p => !p.bankrupt)
        const isWinner = winner && String(winner.user_id) === String(user?.id)
        const winnerColor = PLAYER_COLORS[winner?.users?.color] || '#c8962a'
        const sorted = [...players].sort((a, b) => b.money - a.money)
        return (
          <div style={{ position:'fixed', inset:0, zIndex:3000, background:'rgba(0,0,0,0.96)', display:'flex', alignItems:'center', justifyContent:'center', padding:'20px' }}>
            <div style={{ background:'#1a0a00', border:`3px solid ${isWinner ? '#c8962a' : '#333'}`, borderRadius:'20px', padding:'40px 36px', maxWidth:'480px', width:'100%', textAlign:'center', boxShadow: isWinner ? '0 0 80px #c8962a66' : 'none' }}>
              {isWinner ? (
                <>
                  <div style={{ fontSize:'64px', marginBottom:'8px' }}>🏆</div>
                  <div style={{ color:'#c8962a', fontSize:'36px', fontWeight:900, fontFamily:"'Oswald',sans-serif", letterSpacing:'0.06em', textShadow:'0 0 30px #c8962a88' }}>VICTOIRE !</div>
                  <div style={{ color:'#aaa', fontSize:'15px', marginTop:'8px' }}>Tu as dominé toutes les richesses du monde.</div>
                </>
              ) : (
                <>
                  <div style={{ fontSize:'52px', marginBottom:'8px' }}>💀</div>
                  <div style={{ color:'#888', fontSize:'28px', fontWeight:700, fontFamily:"'Oswald',sans-serif" }}>DÉFAITE</div>
                  <div style={{ color:'#555', fontSize:'14px', marginTop:'8px' }}>
                    <span style={{ color:winnerColor }}>{winner?.users?.username}</span> remporte la partie.
                  </div>
                </>
              )}

              <div style={{ marginTop:'28px', display:'flex', flexDirection:'column', gap:'8px' }}>
                {sorted.map((p, i) => {
                  const col = PLAYER_COLORS[p.users?.color] || '#888'
                  return (
                    <div key={p.id} style={{ display:'flex', alignItems:'center', gap:'12px', padding:'10px 14px', background: i===0?'rgba(200,150,42,0.12)':'rgba(255,255,255,0.03)', border:`1px solid ${i===0?'#c8962a44':'#2a1a00'}`, borderRadius:'10px' }}>
                      <span style={{ fontSize:'18px' }}>{i===0?'🥇':i===1?'🥈':i===2?'🥉':'💀'}</span>
                      <div style={{ flex:1, textAlign:'left' }}>
                        <div style={{ color:col, fontSize:'14px', fontWeight:700 }}>{p.users?.username}{String(p.user_id)===String(user?.id)?' (moi)':''}</div>
                        <div style={{ color:'#555', fontSize:'12px' }}>{formatMoney(p.money)}</div>
                      </div>
                      {p.bankrupt && <span style={{ color:'#e74c3c', fontSize:'11px' }}>faillite</span>}
                    </div>
                  )
                })}
              </div>

              {user?.role === 'admin' && (
                <button onClick={resetGame} style={{ marginTop:'24px', width:'100%', padding:'12px', background:'#c8962a', border:'none', borderRadius:'10px', color:'white', cursor:'pointer', fontSize:'16px', fontFamily:"'Oswald',sans-serif", fontWeight:700 }}>
                  🔄 Nouvelle partie
                </button>
              )}
            </div>
          </div>
        )
      })()}
    </div>
  )
}

// ============================================================
// BANKRUPTCY OVERLAY
// ============================================================
function BankruptcyOverlay({ bankruptcy, players, myPlayer, titles, user, onForfeit, onSurvive, onProposeTrade, onSellTitles, formatMoney }) {
  const [showTrade, setShowTrade] = useState(false)
  const [showSell, setShowSell]   = useState(false)
  const [toSell, setToSell]       = useState([])

  if (!bankruptcy) return null
  const isVictim    = String(bankruptcy.player_id) === String(user?.id)
  const victimColor = PLAYER_COLORS[bankruptcy.player_color] || '#e74c3c'
  const currentMoney = myPlayer?.money || 0
  const myTitles = titles.filter(t => String(t.user_id) === String(user?.id))
  const creditorDebts = bankruptcy.creditors || []
  const creditorsTotal = creditorDebts.reduce((s, c) => s + c.amount, 0)
  const bankDebt = Math.max(0, bankruptcy.debt - creditorsTotal)
  const sellTotal = toSell.reduce((s, t) => s + Math.floor((t.buy_price || 0) / 2), 0)

  function toggleSell(t) {
    if (toSell.some(s => s.id === t.id)) setToSell(toSell.filter(s => s.id !== t.id))
    else setToSell([...toSell, t])
  }

  if (!isVictim) {
    return (
      <div style={{ position:'fixed', bottom:0, left:0, right:0, zIndex:1800, display:'flex', justifyContent:'center', padding:'12px', pointerEvents:'none' }}>
        <div style={{ background:'#1a0a00', border:'1px solid #e74c3c55', borderRadius:'10px', padding:'12px 24px', color:'#888', fontSize:'13px', fontFamily:"'Oswald',sans-serif", pointerEvents:'auto' }}>
          ⏳ <span style={{ color:victimColor }}>{bankruptcy.player_name}</span> cherche une solution — en attente...
        </div>
      </div>
    )
  }

  return (
    <>
      <div style={{ position:'fixed', inset:0, zIndex:2200, background:'rgba(0,0,0,0.94)', display:'flex', alignItems:'center', justifyContent:'center', padding:'20px', overflowY:'auto' }}>
        <div style={{ background:'#1a0a00', border:'2px solid #e74c3c', borderRadius:'16px', padding:'28px', maxWidth:'500px', width:'100%', boxShadow:'0 0 60px #e74c3c44' }}>

          <div style={{ textAlign:'center', marginBottom:'16px' }}>
            <div style={{ fontSize:'48px', marginBottom:'8px' }}>💸</div>
            <div style={{ color:'#e74c3c', fontSize:'28px', fontWeight:900, fontFamily:"'Oswald',sans-serif" }}>DERNIÈRE CHANCE</div>
            <div style={{ color:'#aaa', fontSize:'13px', marginTop:'4px' }}>Vous n'avez plus d'argent.</div>
          </div>

          {/* Détail des dettes */}
          <div style={{ display:'flex', flexDirection:'column', gap:'6px', marginBottom:'16px' }}>
            {creditorDebts.map((c, i) => (
              <div key={i} style={{ padding:'10px 14px', background:'rgba(231,76,60,0.1)', border:'1px solid #e74c3c44', borderRadius:'8px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <span style={{ color:'#aaa', fontSize:'12px' }}>Vous devez encore à <strong style={{ color:'#fff' }}>{c.player_name}</strong></span>
                <span style={{ color:'#e74c3c', fontSize:'16px', fontWeight:700 }}>{formatMoney(c.amount)}</span>
              </div>
            ))}
            {bankDebt > 0 && (
              <div style={{ padding:'10px 14px', background:'rgba(231,76,60,0.1)', border:'1px solid #e74c3c44', borderRadius:'8px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <span style={{ color:'#aaa', fontSize:'12px' }}>Vous devez encore à <strong style={{ color:'#fff' }}>la banque</strong></span>
                <span style={{ color:'#e74c3c', fontSize:'16px', fontWeight:700 }}>{formatMoney(bankDebt)}</span>
              </div>
            )}
            {currentMoney > 0 && (
              <div style={{ color:'#27ae60', fontSize:'12px', textAlign:'center', marginTop:'2px' }}>
                En caisse : {formatMoney(currentMoney)}
              </div>
            )}
          </div>

          {/* Échange */}
          <button onClick={() => setShowTrade(true)}
            style={{ width:'100%', padding:'12px', marginBottom:'8px', background:'#0d2a1a', border:'2px solid #27ae6055', borderRadius:'8px', color:'#27ae60', cursor:'pointer', fontSize:'14px', fontFamily:"'Oswald',sans-serif", fontWeight:'600' }}>
            🤝 Proposer un échange
          </button>

          {/* Vendre ressources */}
          <button onClick={() => setShowSell(!showSell)}
            style={{ width:'100%', padding:'12px', marginBottom:'8px', background:'#1a1000', border:`2px solid ${showSell ? '#c8962a99' : '#c8962a44'}`, borderRadius:'8px', color:'#c8962a', cursor:'pointer', fontSize:'14px', fontFamily:"'Oswald',sans-serif", fontWeight:'600' }}>
            💰 Vendre des ressources à la banque (50% du prix) {showSell ? '▲' : '▼'}
          </button>

          {showSell && (
            <div style={{ background:'rgba(0,0,0,0.3)', border:'1px solid #c8962a33', borderRadius:'8px', padding:'12px', marginBottom:'8px' }}>
              {myTitles.length === 0
                ? <div style={{ color:'#555', fontSize:'12px', textAlign:'center', padding:'8px 0' }}>Aucune ressource à vendre</div>
                : (
                  <>
                    <div style={{ display:'flex', flexDirection:'column', gap:'5px', maxHeight:'180px', overflowY:'auto', marginBottom:'8px' }}>
                      {myTitles.map((t, i) => {
                        const sellPrice = Math.floor((t.buy_price || 0) / 2)
                        const selected  = toSell.some(s => s.id === t.id)
                        return (
                          <label key={i} style={{ display:'flex', alignItems:'center', gap:'8px', cursor:'pointer', padding:'5px 8px', background: selected ? 'rgba(200,150,42,0.1)' : 'transparent', borderRadius:'5px' }}>
                            <input type='checkbox' checked={selected} onChange={() => toggleSell(t)} />
                            <span style={{ flex:1, color:'#ccc', fontSize:'12px' }}>{t.production} · {t.region} ({t.percentage}%)</span>
                            <span style={{ color:'#c8962a', fontSize:'12px', fontWeight:'bold', whiteSpace:'nowrap' }}>{formatMoney(sellPrice)}</span>
                          </label>
                        )
                      })}
                    </div>
                    {toSell.length > 0 && (
                      <button onClick={() => { onSellTitles(toSell); setToSell([]) }}
                        style={{ width:'100%', padding:'9px', background:'#c8962a', border:'none', borderRadius:'6px', color:'white', cursor:'pointer', fontSize:'13px', fontFamily:"'Oswald',sans-serif", fontWeight:'700' }}>
                        Vendre {toSell.length} titre(s) — +{formatMoney(sellTotal)}
                      </button>
                    )}
                  </>
                )
              }
            </div>
          )}

          {/* Continuer si assez */}
          {currentMoney >= bankruptcy.debt && (
            <button onClick={onSurvive}
              style={{ width:'100%', padding:'12px', marginBottom:'8px', background:'#27ae60', border:'none', borderRadius:'8px', color:'white', cursor:'pointer', fontSize:'15px', fontFamily:"'Oswald',sans-serif", fontWeight:'700' }}>
              ✅ Payer et continuer ({formatMoney(bankruptcy.debt)})
            </button>
          )}

          <div style={{ display:'flex', justifyContent:'flex-end', marginTop:'4px' }}>
            <button onClick={onForfeit}
              style={{ padding:'10px 20px', background:'#2a0a0a', border:'1px solid #e74c3c66', borderRadius:'8px', color:'#e74c3c', cursor:'pointer', fontSize:'14px', fontFamily:"'Oswald',sans-serif" }}>
              🏳️ Déclarer forfait
            </button>
          </div>
        </div>
      </div>
      {showTrade && (
        <TradeModal players={players} myPlayer={myPlayer} titles={titles} user={user}
          onClose={() => setShowTrade(false)} onSend={onProposeTrade} />
      )}
    </>
  )
}

// ============================================================
// TRADE MODAL
// ============================================================
function TradeModal({ players, myPlayer, titles, user, onClose, onSend }) {
  const [targetUserId, setTargetUserId] = useState('')
  const [offerMoney, setOfferMoney] = useState('')
  const [offerTitles, setOfferTitles] = useState([])
  const [offerJoker, setOfferJoker] = useState(false)
  const [requestMoney, setRequestMoney] = useState('')
  const [requestTitles, setRequestTitles] = useState([])
  const [requestJoker, setRequestJoker] = useState(false)

  const otherPlayers = players.filter(p => String(p.user_id) !== String(user?.id))
  const targetPlayer = players.find(p => String(p.user_id) === targetUserId)
  const myTitles     = titles.filter(t => String(t.user_id) === String(user?.id))
  const targetTitles = titles.filter(t => String(t.user_id) === targetUserId)

  function toggleTitle(arr, setArr, t) {
    const key = `${t.production}|${t.region}`
    if (arr.some(x => `${x.production}|${x.region}` === key))
      setArr(arr.filter(x => `${x.production}|${x.region}` !== key))
    else
      setArr([...arr, { production: t.production, region: t.region, percentage: t.percentage }])
  }

  function send() {
    if (!targetUserId) return
    onSend({
      from_user_id: user.id,
      from_username: myPlayer?.users?.username || String(user.id),
      from_color: myPlayer?.users?.color,
      to_user_id: targetUserId,
      to_username: targetPlayer?.users?.username || targetUserId,
      offer:   { money: parseInt(offerMoney)   || 0, titles: offerTitles,   joker: offerJoker },
      request: { money: parseInt(requestMoney) || 0, titles: requestTitles, joker: requestJoker },
    })
    onClose()
  }

  const inp = { background:'#0a0000', border:'1px solid #c8962a55', borderRadius:'4px', color:'white', fontSize:'12px', padding:'4px 8px', width:'100%' }

  return (
    <div style={{ position:'fixed', inset:0, zIndex:2500, background:'rgba(0,0,0,0.92)', display:'flex', alignItems:'center', justifyContent:'center', padding:'20px' }}>
      <div style={{ background:'#1a0a00', border:'2px solid #c8962a', borderRadius:'16px', padding:'24px', maxWidth:'700px', width:'100%', maxHeight:'88vh', overflowY:'auto' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'16px' }}>
          <h2 style={{ margin:0, color:'#c8962a', fontFamily:"'Oswald',sans-serif" }}>🤝 Proposer un échange</h2>
          <button onClick={onClose} style={{ background:'none', border:'none', color:'#888', fontSize:'20px', cursor:'pointer' }}>✕</button>
        </div>

        <div style={{ marginBottom:'16px' }}>
          <label style={{ color:'#aaa', fontSize:'12px' }}>Proposer à :</label>
          <select value={targetUserId} onChange={e => { setTargetUserId(e.target.value); setRequestTitles([]); setRequestJoker(false) }}
            style={{ ...inp, marginTop:'4px' }}>
            <option value=''>-- Choisir un joueur --</option>
            {otherPlayers.map(p => (
              <option key={p.user_id} value={String(p.user_id)}>{p.users?.username || p.user_id}</option>
            ))}
          </select>
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'16px' }}>
          {/* Offre */}
          <div style={{ background:'rgba(39,174,96,0.06)', border:'1px solid #27ae6033', borderRadius:'8px', padding:'12px' }}>
            <div style={{ color:'#27ae60', fontSize:'12px', fontWeight:'bold', fontFamily:"'Oswald',sans-serif", marginBottom:'10px' }}>✅ JE PROPOSE</div>
            <label style={{ color:'#aaa', fontSize:'11px' }}>Argent (F)</label>
            <input type='number' min='0' value={offerMoney} onChange={e => setOfferMoney(e.target.value)} placeholder='0' style={{ ...inp, marginBottom:'10px', marginTop:'3px' }} />
            {myPlayer?.has_joker && (
              <label style={{ display:'flex', alignItems:'center', gap:'6px', marginBottom:'10px', cursor:'pointer', color:'#aaa', fontSize:'11px' }}>
                <input type='checkbox' checked={offerJoker} onChange={e => setOfferJoker(e.target.checked)} />
                🃏 Mon Joker
              </label>
            )}
            <div style={{ color:'#aaa', fontSize:'11px', marginBottom:'6px' }}>Mes titres :</div>
            {myTitles.length === 0 && <div style={{ color:'#555', fontSize:'11px' }}>Aucun titre</div>}
            {myTitles.map((t, i) => {
              const key = `${t.production}|${t.region}`
              const checked = offerTitles.some(x => `${x.production}|${x.region}` === key)
              return (
                <label key={i} style={{ display:'flex', alignItems:'center', gap:'6px', marginBottom:'4px', cursor:'pointer' }}>
                  <input type='checkbox' checked={checked} onChange={() => toggleTitle(offerTitles, setOfferTitles, t)} />
                  <span style={{ color:'#ccc', fontSize:'11px' }}>{t.production} · {t.region} ({t.percentage}%)</span>
                </label>
              )
            })}
          </div>

          {/* Demande */}
          <div style={{ background:'rgba(231,76,60,0.06)', border:'1px solid #e74c3c33', borderRadius:'8px', padding:'12px' }}>
            <div style={{ color:'#e74c3c', fontSize:'12px', fontWeight:'bold', fontFamily:"'Oswald',sans-serif", marginBottom:'10px' }}>📋 JE DEMANDE</div>
            <label style={{ color:'#aaa', fontSize:'11px' }}>Argent (F)</label>
            <input type='number' min='0' value={requestMoney} onChange={e => setRequestMoney(e.target.value)} placeholder='0' style={{ ...inp, marginBottom:'10px', marginTop:'3px' }} />
            {targetPlayer?.has_joker && (
              <label style={{ display:'flex', alignItems:'center', gap:'6px', marginBottom:'10px', cursor:'pointer', color:'#aaa', fontSize:'11px' }}>
                <input type='checkbox' checked={requestJoker} onChange={e => setRequestJoker(e.target.checked)} />
                🃏 Son Joker
              </label>
            )}
            {!targetUserId && <div style={{ color:'#555', fontSize:'11px' }}>Sélectionnez un joueur</div>}
            {targetUserId && (
              <>
                <div style={{ color:'#aaa', fontSize:'11px', marginBottom:'6px' }}>Titres de {targetPlayer?.users?.username} :</div>
                {targetTitles.length === 0 && <div style={{ color:'#555', fontSize:'11px' }}>Ce joueur n'a aucun titre</div>}
                {targetTitles.map((t, i) => {
                  const key = `${t.production}|${t.region}`
                  const checked = requestTitles.some(x => `${x.production}|${x.region}` === key)
                  return (
                    <label key={i} style={{ display:'flex', alignItems:'center', gap:'6px', marginBottom:'4px', cursor:'pointer' }}>
                      <input type='checkbox' checked={checked} onChange={() => toggleTitle(requestTitles, setRequestTitles, t)} />
                      <span style={{ color:'#ccc', fontSize:'11px' }}>{t.production} · {t.region} ({t.percentage}%)</span>
                    </label>
                  )
                })}
              </>
            )}
          </div>
        </div>

        <button onClick={send} disabled={!targetUserId}
          style={{ width:'100%', marginTop:'16px', padding:'12px', background: targetUserId ? '#c8962a' : '#333', border:'none', borderRadius:'8px', color:'white', cursor: targetUserId ? 'pointer' : 'not-allowed', fontSize:'15px', fontFamily:"'Oswald',sans-serif", fontWeight:'600' }}>
          📨 Envoyer la proposition
        </button>
      </div>
    </div>
  )
}

// ============================================================
// TRADE OVERLAY
// ============================================================
function TradeOverlay({ proposal, players, myPlayer, user, onAccept, onDecline, onCancel, formatMoney }) {
  if (!proposal) return null
  const isRecipient = String(proposal.to_user_id)   === String(user?.id)
  const isProposer  = String(proposal.from_user_id)  === String(user?.id)
  if (!isRecipient && !isProposer) return null
  const fromColor = PLAYER_COLORS[proposal.from_color] || '#c8962a'

  function SideBox({ side, label, color }) {
    const has = side.money > 0 || side.titles?.length > 0 || side.joker
    return (
      <div style={{ background:`rgba(0,0,0,0.2)`, border:`1px solid ${color}33`, borderRadius:'8px', padding:'12px', flex:1 }}>
        <div style={{ color, fontSize:'11px', fontWeight:'bold', fontFamily:"'Oswald',sans-serif", marginBottom:'8px' }}>{label}</div>
        {!has && <div style={{ color:'#555', fontSize:'12px' }}>Rien</div>}
        {side.money > 0 && <div style={{ color:'#27ae60', fontSize:'13px', marginBottom:'4px' }}>💰 {formatMoney(side.money)}</div>}
        {side.joker && <div style={{ color:'#c8962a', fontSize:'13px', marginBottom:'4px' }}>🃏 Joker</div>}
        {(side.titles || []).map((t, i) => (
          <div key={i} style={{ color:'#ccc', fontSize:'12px', marginBottom:'3px' }}>• {t.production} · {t.region} ({t.percentage}%)</div>
        ))}
      </div>
    )
  }

  return (
    <div style={{ position:'fixed', inset:0, zIndex:1900, background:'rgba(0,0,0,0.90)', display:'flex', alignItems:'center', justifyContent:'center', padding:'20px' }}>
      <div style={{ background:'#1a0a00', border:`2px solid ${fromColor}`, borderRadius:'16px', padding:'28px', maxWidth:'520px', width:'100%', boxShadow:`0 0 40px ${fromColor}44` }}>
        <div style={{ textAlign:'center', marginBottom:'16px' }}>
          <div style={{ color:fromColor, fontSize:'20px', fontWeight:700, fontFamily:"'Oswald',sans-serif" }}>🤝 Proposition d'échange</div>
          <div style={{ color:'#aaa', fontSize:'13px', marginTop:'4px' }}>
            {isRecipient ? `${proposal.from_username} vous propose un échange` : `En attente de réponse de ${proposal.to_username}...`}
          </div>
        </div>

        {isRecipient && (
          <>
            <div style={{ display:'flex', gap:'12px', marginBottom:'20px', alignItems:'stretch' }}>
              <SideBox side={proposal.offer}   label="IL OFFRE"   color="#27ae60" />
              <div style={{ color:'#555', fontSize:'24px', alignSelf:'center' }}>⇄</div>
              <SideBox side={proposal.request} label="IL DEMANDE" color="#e74c3c" />
            </div>
            <div style={{ display:'flex', gap:'12px' }}>
              <button onClick={onDecline} style={{ flex:1, padding:'12px', background:'#2a1010', border:'1px solid #e74c3c55', borderRadius:'8px', color:'#e74c3c', cursor:'pointer', fontSize:'14px', fontFamily:"'Oswald',sans-serif", fontWeight:'600' }}>
                ❌ Refuser
              </button>
              <button onClick={onAccept} style={{ flex:1, padding:'12px', background:'#27ae60', border:'none', borderRadius:'8px', color:'white', cursor:'pointer', fontSize:'14px', fontFamily:"'Oswald',sans-serif", fontWeight:'600' }}>
                ✅ Accepter
              </button>
            </div>
          </>
        )}

        {isProposer && (
          <div style={{ textAlign:'center' }}>
            <button onClick={onCancel} style={{ padding:'10px 28px', background:'#2a1010', border:'1px solid #e74c3c55', borderRadius:'8px', color:'#e74c3c', cursor:'pointer', fontSize:'14px', fontFamily:"'Oswald',sans-serif" }}>
              Annuler la proposition
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// ============================================================
// OVERLAY
// ============================================================
function PendingActionOverlay({ pendingAction, currentUserId, onConfirm, hasJoker }) {
  const [useJoker, setUseJoker] = useState(false)
  useEffect(() => { setUseJoker(false) }, [pendingAction])
  if (!pendingAction) return null
  const isMyAction = pendingAction.player_id === currentUserId
  const color = PLAYER_COLORS[pendingAction.player_color] || '#c8962a'
  const hasRoyalties = pendingAction.data?.royaltyPayments?.length > 0
  return (
    <div style={{ position:'fixed', inset:0, zIndex:2000, background:'rgba(0,0,0,0.92)', display:'flex', alignItems:'center', justifyContent:'center', padding:'20px' }}>
      <div style={{ background:'#1a0a00', border:`2px solid ${color}`, borderRadius:'16px', padding:'32px 36px', maxWidth:'540px', width:'100%', textAlign:'center', boxShadow:`0 0 40px ${color}44` }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:'10px', marginBottom:'20px' }}>
          <div style={{ width:'14px', height:'14px', borderRadius:'50%', background:color }}/>
          <span style={{ color, fontSize:'20px', fontWeight:700, fontFamily:"'Oswald',sans-serif" }}>{pendingAction.player_name}</span>
        </div>
        <div style={{ display:'flex', flexDirection:'column', gap:'10px', marginBottom:'28px' }}>
          {pendingAction.lines.map((line, i) => (
            <p key={i} style={{ margin:0, color:i===0?'white':'#c8962a', fontSize:i===0?'17px':'15px', fontWeight:i===0?700:400, lineHeight:1.4, borderTop:i>0?'1px solid #2a1a00':'none', paddingTop:i>0?'10px':0 }}>{line}</p>
          ))}
        </div>
        {isMyAction && hasJoker && hasRoyalties && (
          <label style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:'10px', marginBottom:'20px', cursor:'pointer', color:'#9b59b6', fontSize:'15px', fontWeight:'600' }}>
            <input type="checkbox" checked={useJoker} onChange={e => setUseJoker(e.target.checked)} style={{ width:18, height:18, cursor:'pointer' }} />
            🃏 Utiliser mon Joker (payer moitié des royalties)
          </label>
        )}
        {isMyAction ? (
          <button onClick={() => onConfirm(useJoker)} style={{ padding:'12px 48px', background:color, border:'none', borderRadius:'10px', color:'white', fontSize:'18px', fontWeight:700, fontFamily:"'Oswald',sans-serif", cursor:'pointer' }}>OK</button>
        ) : (
          <p style={{ color:'#555', fontSize:'15px', margin:0 }}>En attente de <strong style={{ color }}>{pendingAction.player_name}</strong>...</p>
        )}
      </div>
    </div>
  )
}

// ============================================================
// PLATEAU 11x9
// ============================================================
function Board({ players, myPlayer, currentPlayerId, animPositions, flippedCard }) {
  const CS = 86 // taille d'une case en px

  // Construire la map col,row → case
  const cellMap = {}
  // Centre
  for (let r = 2; r <= 6; r++)
    for (let c = 2; c <= 8; c++)
      cellMap[`${c},${r}`] = { type: 'centre' }

  // Remplir les cases (idx 64 = même cellule que idx 36, on skip)
  LISTE.forEach((cas, idx) => {
    if (idx === 64) return
    const [col, row] = POSITIONS[idx]
    cellMap[`${col},${row}`] = { ...cas, idx }
  })

  function pionsOnCell(col, row) {
    return players.filter(p => {
      const raw = animPositions?.[p.user_id] !== undefined ? animPositions[p.user_id] : p.position
      const phys = raw === 64 ? 36 : raw
      const [pc, pr] = POSITIONS[phys] || [0, 0]
      return pc === col && pr === row
    })
  }

  function CaseCell({ cas, col, row }) {
    const pions = pionsOnCell(col, row)
    const myPhys = myPlayer ? (myPlayer.position === 64 ? 36 : myPlayer.position) : -1
    const isActive = cas.idx === myPhys && cas.idx !== undefined

    if (cas.type === 'centre') {
      return (
        <div style={{ width: CS, height: CS, background: '#0a0a2a' }}/>
      )
    }

    return (
      <div style={{
        width: CS, height: CS,
        outline: isActive ? '3px solid #ffff00' : 'none',
        outlineOffset: -3,
        position: 'relative',
        overflow: 'hidden',
        boxSizing: 'border-box',
        filter: isActive ? 'brightness(1.3)' : 'none',
        transition: 'filter 0.12s',
      }}>
        <img
          src={`/plateau_case/cases-${cas.idx}.png`}
          alt={cas.label}
          style={{ width: '100%', height: '100%', objectFit: 'fill', display: 'block', pointerEvents: 'none' }}
        />
        {pions.length > 0 && (
          <div style={{
            position: 'absolute', bottom: 2, left: 0, right: 0,
            display: 'flex', flexWrap: 'wrap', gap: 2, justifyContent: 'center',
          }}>
            {pions.map(p => (
              <img key={p.id} className="pion" title={p.users?.username}
                src={PION_IMAGES[p.users?.color] || '/pions/rouge.png'}
                style={{
                  width: 48, height: 48,
                  objectFit: 'contain',
                  flexShrink: 0,
                  filter: currentPlayerId === p.user_id
                    ? 'drop-shadow(0 0 4px white) drop-shadow(0 0 2px white)'
                    : 'drop-shadow(0 1px 2px rgba(0,0,0,0.7))',
                }}
              />
            ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="board-wrapper">
      <div style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${NCOLS}, ${CS}px)`,
        gridTemplateRows: `repeat(${NROWS}, ${CS}px)`,
        gap: 4,
        background: '#b8a878',
        padding: 3,
        position: 'relative',
      }}>
        {Array.from({ length: NROWS }, (_, row) =>
          Array.from({ length: NCOLS }, (_, col) => {
            const cas = cellMap[`${col},${row}`] || { type: 'vide' }
            if (cas.type === 'vide') return <div key={`${col},${row}`} style={{ width: CS, height: CS, background: '#b8a878' }}/>
            return <CaseCell key={`${col},${row}`} cas={cas} col={col} row={row}/>
          })
        )}
        <img
          src="/carte-monde.png"
          alt=""
          style={{
            position: 'absolute',
            top:    3 + 2 * (CS + 4),
            left:   3 + 2 * (CS + 4),
            width:  7 * CS + 24,
            height: 5 * CS + 16,
            objectFit: 'cover',
            opacity: 1,
            pointerEvents: 'none',
          }}
        />
        {/* Actualité — flip 3D */}
        <div className="card-flip-wrapper" style={{
          position: 'absolute',
          top:  3 + 7*(CS+4) - 4 - 180 - 20,
          left: 3 + 2*(CS+4) + 48,
          width: 240, height: 180, pointerEvents: 'none',
        }}>
          <div className={flippedCard?.type === 'actualite' ? 'card-flip-inner is-flipped' : 'card-flip-inner'}>
            <div className="card-face">
              <img src="/actualite.png" alt="Actualité" style={{
                position: 'absolute', top: '50%', left: '50%',
                width: 90, height: 120,
                transform: 'translate(-50%,-50%) rotate(-90deg)',
                objectFit: 'cover',
              }}/>
            </div>
            <div className="card-face card-face-back">
              <div style={{ textAlign:'center', fontFamily:"'Barlow Condensed',sans-serif", lineHeight:1.3 }}>
                <div style={{ color:'#c8962a', fontSize:9, fontWeight:700, marginBottom:3 }}>📰 ACTUALITÉ</div>
                {flippedCard?.text && <div style={{ color:'white', fontSize:7 }}>{flippedCard.text.slice(0,50)}</div>}
                {flippedCard?.amount !== undefined && (
                  <div style={{ color: flippedCard.amount >= 0 ? '#27ae60' : '#e74c3c', fontSize:8, fontWeight:700, marginTop:3 }}>
                    {flippedCard.amount >= 0 ? '+' : ''}{formatMoney(flippedCard.amount)}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        {/* Nathan — flip 3D */}
        <div className="card-flip-wrapper" style={{
          position: 'absolute',
          top:  3 + 7*(CS+4) - 4 - 180 - 20,
          left: 3 + 2*(CS+4) + 48 + 240 + 50,
          width: 240, height: 180, pointerEvents: 'none',
        }}>
          <div className={flippedCard?.type === 'joker' ? 'card-flip-inner is-flipped' : 'card-flip-inner'}>
            <div className="card-face">
              <img src="/nathan.png" alt="Joker" style={{
                position: 'absolute', top: '50%', left: '50%',
                width: 90, height: 120,
                transform: 'translate(-50%,-50%) rotate(-90deg)',
                objectFit: 'cover',
              }}/>
            </div>
            <div className="card-face card-face-back">
              <div style={{ textAlign:'center', fontFamily:"'Barlow Condensed',sans-serif" }}>
                <div style={{ color:'#8e44ad', fontSize:11, fontWeight:700 }}>🃏 JOKER</div>
                <div style={{ color:'white', fontSize:8, marginTop:3 }}>Achetez un Joker ?</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ============================================================
// DÉ
// ============================================================
function DiceFace({ value, spinning }) {
  const dots = {
    1:[[50,50]], 2:[[25,25],[75,75]], 3:[[25,25],[50,50],[75,75]],
    4:[[25,25],[75,25],[25,75],[75,75]],
    5:[[25,25],[75,25],[50,50],[25,75],[75,75]],
    6:[[25,25],[75,25],[25,50],[75,50],[25,75],[75,75]]
  }
  return (
    <svg width="64" height="64" viewBox="0 0 100 100" style={{
      background: 'white', borderRadius: '14px',
      border: spinning ? '3px solid #c8962a' : '2px solid #555',
      boxShadow: spinning ? '0 0 20px #c8962a88' : '4px 4px 12px rgba(0,0,0,0.5)',
      animation: spinning ? 'diceSpin 0.15s linear infinite' : 'diceLand 0.3s ease',
    }}>
      {(dots[value] || []).map(([cx, cy], i) => <circle key={i} cx={cx} cy={cy} r="9" fill="#222"/>)}
    </svg>
  )
}

// ============================================================
// MES TITRES
// ============================================================
function MyTitles({ titles, getRoyalties, getTotalPercentage }) {
  const [expanded, setExpanded] = useState(null)
  const byProd = {}
  titles.forEach(t => { if (!byProd[t.production]) byProd[t.production] = []; byProd[t.production].push(t) })
  if (!Object.keys(byProd).length) return <div style={{ color:'#555', textAlign:'center', padding:'12px 0', fontSize:'12px' }}>Aucun titre possédé</div>
  const sortedEntries = Object.entries(byProd).sort(([,a],[,b]) => b.reduce((s,t)=>s+t.percentage,0) - a.reduce((s,t)=>s+t.percentage,0))
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:'6px' }}>
      {sortedEntries.map(([prod, ts]) => {
        const pct = getTotalPercentage(prod)
        const royalties = getRoyalties(prod)
        const pctColor = pct >= 70?'#27ae60':pct >= 50?'#f39c12':pct >= 30?'#e67e22':'#e74c3c'
        const isOpen = expanded === prod
        return (
          <div key={prod} style={{ background:'rgba(255,255,255,0.05)', border:`1px solid ${isOpen?'#c8962a66':'#2a1a00'}`, borderRadius:'6px', overflow:'hidden' }}>
            <div
              onClick={() => setExpanded(isOpen ? null : prod)}
              style={{ padding:'8px 10px', cursor:'pointer' }}
            >
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'3px' }}>
                <span style={{ color:'#c8962a', fontWeight:'bold', fontSize:'11px', textTransform:'uppercase' }}>{prod}</span>
                <div style={{ display:'flex', alignItems:'center', gap:'6px' }}>
                  <span style={{ color:pctColor, fontSize:'11px', fontWeight:'bold' }}>{pct}%</span>
                  <span style={{ color:'#555', fontSize:'10px' }}>{isOpen ? '▲' : '▼'}</span>
                </div>
              </div>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <span style={{ color:'#aaa', fontSize:'10px' }}>{ts.length} région{ts.length > 1 ? 's' : ''}</span>
                <span style={{ color:royalties>0?'#3498db':'#555', fontSize:'10px', fontWeight:'bold' }}>
                  {royalties > 0 ? (royalties/1000000).toFixed(1)+'M F' : '< 30%'}
                </span>
              </div>
              <div style={{ marginTop:'4px', height:'3px', background:'#1a0a00', borderRadius:'2px', overflow:'hidden' }}>
                <div style={{ width:Math.min(pct,100)+'%', height:'100%', background:pctColor, borderRadius:'2px', transition:'width 0.3s' }}/>
              </div>
            </div>
            {isOpen && (
              <div style={{ borderTop:'1px solid #2a1a00', padding:'6px 10px', display:'flex', flexDirection:'column', gap:'4px' }}>
                {ts.map((t, i) => {
                  const caseLabel = AVAILABLE_TITLES.find(a => a.production === t.production && a.region === t.region)?.country || t.region
                  return (
                    <div key={i} style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                      <span style={{ color:'#ccc', fontSize:'10px' }}>{caseLabel}</span>
                      <span style={{ color:pctColor, fontSize:'10px', fontWeight:'bold' }}>{t.percentage}%</span>
                    </div>
                  )
                })}
                <div style={{ borderTop:'1px solid #2a1a00', marginTop:'4px', paddingTop:'6px', display:'flex', flexDirection:'column', gap:'3px' }}>
                  <div style={{ color:'#555', fontSize:'9px', textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:'2px' }}>Royalties par palier</div>
                  {[
                    { label:'30%', threshold:30 },
                    { label:'50%', threshold:50 },
                    { label:'70%', threshold:70 },
                    { label:'90%', threshold:90 },
                  ].map(({ label, threshold }) => {
                    const amount = getRoyaltyAmount(prod, threshold)
                    const isCurrent = (threshold === 30 && pct >= 30 && pct < 50)
                                   || (threshold === 50 && pct >= 50 && pct < 70)
                                   || (threshold === 70 && pct >= 70 && pct < 90)
                                   || (threshold === 90 && pct >= 90)
                    const isPast   = pct >= threshold && !isCurrent
                    const isFuture = pct < threshold
                    return (
                      <div key={label} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', opacity: isFuture ? 0.45 : 1 }}>
                        <span style={{ fontSize:'10px', color: isCurrent ? '#c8962a' : isPast ? '#555' : '#888' }}>
                          {isCurrent ? '▶ ' : isPast ? '✓ ' : '  '}{label}
                        </span>
                        <span style={{ fontSize:'10px', fontWeight: isCurrent ? 'bold' : 'normal', color: isCurrent ? '#c8962a' : isPast ? '#555' : '#888' }}>
                          {amount > 0 ? (amount/1000000).toFixed(1)+'M F' : '–'}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

// ============================================================
// MODAL
// ============================================================
const AVAILABLE_TITLES = [
  {production:'Cobalt',                region:'Finlande',           percentage:5,  price:500000,  country:'Scandinavie'},
  {production:'Construction navale',   region:'Suède',              percentage:20, price:1500000, country:'Scandinavie'},
  {production:'Acier',                 region:'Allemagne Fédérale', percentage:10, price:1000000, country:'Allemagne Féd.'},
  {production:'Construction automobile',region:'Allemagne Fédérale',percentage:15, price:1500000, country:'Allemagne Féd.'},
  {production:'Construction automobile',region:'Royaume-Uni',       percentage:5,  price:500000,  country:'Royaume-Uni'},
  {production:'Construction navale',   region:'Royaume-Uni',        percentage:10, price:1000000, country:'Royaume-Uni'},
  {production:'Houille',               region:'Royaume-Uni',        percentage:10, price:1000000, country:'Royaume-Uni'},
  {production:'Blé',                   region:'France',             percentage:10, price:500000,  country:'France'},
  {production:'Construction automobile',region:'France',            percentage:10, price:1000000, country:'France'},
  {production:'Uranium',               region:'France',             percentage:10, price:1000000, country:'France'},
  {production:'Cobalt',                region:'France',             percentage:5,  price:500000,  country:'France'},
  {production:'Construction navale',   region:'France',             percentage:5,  price:500000,  country:'France'},
  {production:'Construction automobile',region:'Italie',            percentage:10, price:1000000, country:'Europe Médit.'},
  {production:'Tungstène',             region:'Espagne',            percentage:5,  price:500000,  country:'Europe Médit.'},
  {production:'Tungstène',             region:'Portugal',           percentage:10, price:1000000, country:'Europe Médit.'},
  {production:'Acier',                 region:'Italie',             percentage:5,  price:500000,  country:'Europe Médit.'},
  {production:'Aluminium',             region:'Hongrie',            percentage:5,  price:500000,  country:'Europe Danub.'},
  {production:'Houille',               region:'Pologne',            percentage:15, price:1500000, country:'Europe Danub.'},
  {production:'Coton brut',            region:'Turquie',            percentage:5,  price:500000,  country:'Europe Balkan.'},
  {production:'Nickel',                region:'Grèce',              percentage:5,  price:500000,  country:'Europe Balkan.'},
  {production:'Houille',               region:'U.R.S.S.',           percentage:20, price:2000000, country:'U.R.S.S.-1'},
  {production:'Pétrole',               region:'U.R.S.S.',           percentage:30, price:3000000, country:'U.R.S.S.-1'},
  {production:'Blé',                   region:'U.R.S.S.',           percentage:30, price:3000000, country:'U.R.S.S.-1'},
  {production:'Plomb',                 region:'U.R.S.S.',           percentage:20, price:1500000, country:'U.R.S.S.-1'},
  {production:'Acier',                 region:'U.R.S.S.',           percentage:25, price:2500000, country:'U.R.S.S.-1'},
  {production:'Fer',                   region:'U.R.S.S.',           percentage:30, price:3500000, country:'U.R.S.S.-2'},
  {production:'Or',                    region:'U.R.S.S.',           percentage:30, price:2500000, country:'U.R.S.S.-2'},
  {production:'Sucre',                 region:'U.R.S.S.',           percentage:20, price:2000000, country:'U.R.S.S.-2'},
  {production:'Cuivre',                region:'U.R.S.S.',           percentage:20, price:2000000, country:'U.R.S.S.-2'},
  {production:'Coton brut',            region:'U.R.S.S.',           percentage:25, price:2000000, country:'U.R.S.S.-3'},
  {production:'Nickel',                region:'U.R.S.S.',           percentage:25, price:2500000, country:'U.R.S.S.-3'},
  {production:'Laine brute',           region:'U.R.S.S.',           percentage:20, price:1500000, country:'U.R.S.S.-3'},
  {production:'Thé',                   region:'U.R.S.S.',           percentage:5,  price:500000,  country:'U.R.S.S.-3'},
  {production:'Blé',                   region:'Canada',             percentage:10, price:500000,  country:'Canada'},
  {production:'Uranium',               region:'Canada',             percentage:20, price:2000000, country:'Canada'},
  {production:'Or',                    region:'Canada',             percentage:10, price:1000000, country:'Canada'},
  {production:'Cuivre',                region:'Canada',             percentage:15, price:1500000, country:'Canada'},
  {production:'Nickel',                region:'Canada',             percentage:25, price:2500000, country:'Canada'},
  {production:'Argent',                region:'Canada',             percentage:15, price:1500000, country:'Canada'},
  {production:'Cobalt',                region:'Canada',             percentage:15, price:1500000, country:'Canada'},
  {production:'Plomb',                 region:'Canada',             percentage:15, price:1000000, country:'Canada'},
  {production:'Argent',                region:'Mexique',            percentage:20, price:2000000, country:'Mexique'},
  {production:'Café',                  region:'Mexique',            percentage:15, price:500000,  country:'Mexique'},
  {production:'Plomb',                 region:'Mexique',            percentage:10, price:500000,  country:'Mexique'},
  {production:'Aluminium',             region:'Jamaïque',           percentage:20, price:2000000, country:'Antilles'},
  {production:'Sucre',                 region:'Cuba',               percentage:15, price:1500000, country:'Antilles'},
  {production:'Nickel',                region:'Cuba',               percentage:10, price:1000000, country:'Antilles'},
  {production:'Cacao',                 region:'Equateur',           percentage:5,  price:500000,  country:'Pays Andins'},
  {production:'Café',                  region:'Colombie',           percentage:15, price:500000,  country:'Pays Andins'},
  {production:'Cuivre',                region:'Chili',              percentage:20, price:2000000, country:'Pays Andins'},
  {production:'Argent',                region:'Pérou',              percentage:15, price:1500000, country:'Pays Andins'},
  {production:'Plomb',                 region:'Bolivie',            percentage:10, price:500000,  country:'Pays Andins'},
  {production:'Tungstène',             region:'Bolivie',            percentage:10, price:1000000, country:'Pays Andins'},
  {production:'Pétrole',               region:'Venezuela',          percentage:5,  price:500000,  country:'Venezuela'},
  {production:'Aluminium',             region:'Surinam',            percentage:10, price:1000000, country:'Venezuela'},
  {production:'Aluminium',             region:'Guyana',             percentage:5,  price:500000,  country:'Venezuela'},
  {production:'Café',                  region:'Brésil',             percentage:35, price:2000000, country:'Brésil'},
  {production:'Sucre',                 region:'Brésil',             percentage:20, price:2500000, country:'Brésil'},
  {production:'Fer',                   region:'Brésil',             percentage:15, price:1500000, country:'Brésil'},
  {production:'Cacao',                 region:'Brésil',             percentage:20, price:1000000, country:'Brésil'},
  {production:'Construction navale',   region:'Brésil',             percentage:5,  price:500000,  country:'Brésil'},
  {production:'Laine brute',           region:'Argentine',          percentage:10, price:500000,  country:'Argentine'},
  {production:'Laine brute',           region:'Uruguay',            percentage:5,  price:500000,  country:'Argentine'},
  {production:'Houille',               region:'États-Unis',         percentage:25, price:3000000, country:'États-Unis-1'},
  {production:'Construction automobile',region:'États-Unis',        percentage:30, price:3500000, country:'États-Unis-1'},
  {production:'Tungstène',             region:'États-Unis',         percentage:20, price:2000000, country:'États-Unis-1'},
  {production:'Sucre',                 region:'États-Unis',         percentage:10, price:500000,  country:'États-Unis-1'},
  {production:'Construction navale',   region:'États-Unis',         percentage:15, price:1500000, country:'États-Unis-1'},
  {production:'Uranium',               region:'États-Unis',         percentage:40, price:3000000, country:'États-Unis-2'},
  {production:'Pétrole',               region:'États-Unis',         percentage:25, price:2500000, country:'États-Unis-2'},
  {production:'Cuivre',                region:'États-Unis',         percentage:25, price:2500000, country:'États-Unis-2'},
  {production:'Or',                    region:'États-Unis',         percentage:5,  price:500000,  country:'États-Unis-2'},
  {production:'Fer',                   region:'États-Unis',         percentage:15, price:1500000, country:'États-Unis-2'},
  {production:'Blé',                   region:'États-Unis',         percentage:15, price:1000000, country:'États-Unis-3'},
  {production:'Coton brut',            region:'États-Unis',         percentage:25, price:2000000, country:'États-Unis-3'},
  {production:'Acier',                 region:'États-Unis',         percentage:25, price:3000000, country:'États-Unis-3'},
  {production:'Plomb',                 region:'États-Unis',         percentage:20, price:2000000, country:'États-Unis-3'},
  {production:'Argent',                region:'États-Unis',         percentage:15, price:1500000, country:'États-Unis-3'},
  {production:'Cobalt',                region:'Maroc',              percentage:10, price:500000,  country:'Maghreb'},
  {production:'Café',                  region:'Ethiopie',           percentage:10, price:500000,  country:'Afrique Nord-Est'},
  {production:'Cacao',                 region:'Ghana',              percentage:20, price:1000000, country:'Afrique Occid.'},
  {production:'Aluminium',             region:'Guinée',             percentage:20, price:2000000, country:'Afrique Occid.'},
  {production:'Cacao',                 region:'Côte d\'Ivoire',     percentage:10, price:500000,  country:'Afrique Occid.'},
  {production:'Cacao',                 region:'Cameroun',           percentage:15, price:1000000, country:'Afrique Occid.'},
  {production:'Cacao',                 region:'Nigeria',            percentage:20, price:1000000, country:'Afrique Occid.'},
  {production:'Uranium',               region:'Niger',              percentage:5,  price:500000,  country:'Afrique Occid.'},
  {production:'Café',                  region:'Sierra Leone',       percentage:10, price:500000,  country:'Afrique Occid.'},
  {production:'Caoutchouc naturel',    region:'Libéria',            percentage:5,  price:500000,  country:'Afrique Occid.'},
  {production:'Cobalt',                region:'Zaïre',              percentage:40, price:2000000, country:'Afrique Centrale'},
  {production:'Cuivre',                region:'Zaïre',              percentage:5,  price:500000,  country:'Afrique Centrale'},
  {production:'Uranium',               region:'Centrafrique',       percentage:5,  price:500000,  country:'Afrique Centrale'},
  {production:'Cuivre',                region:'Angola',             percentage:10, price:1000000, country:'Afrique Centrale'},
  {production:'Thé',                   region:'Kenya',              percentage:5,  price:500000,  country:'Afrique GrdsLacs'},
  {production:'Cobalt',                region:'Zambie',             percentage:20, price:1500000, country:'Afrique GrdsLacs'},
  {production:'Or',                    region:'Afrique du Sud',     percentage:40, price:4500000, country:'Afrique du Sud'},
  {production:'Uranium',               region:'Afrique du Sud',     percentage:15, price:1500000, country:'Afrique du Sud'},
  {production:'Nickel',                region:'Afrique du Sud',     percentage:10, price:1000000, country:'Afrique du Sud'},
  {production:'Laine brute',           region:'Afrique du Sud',     percentage:5,  price:500000,  country:'Afrique du Sud'},
  {production:'Laine brute',           region:'Australie',          percentage:35, price:2000000, country:'Océanie-1'},
  {production:'Aluminium',             region:'Australie',          percentage:35, price:3500000, country:'Océanie-1'},
  {production:'Laine brute',           region:'Nouvelle-Zélande',   percentage:15, price:1500000, country:'Océanie-1'},
  {production:'Plomb',                 region:'Australie',          percentage:15, price:1500000, country:'Océanie-1'},
  {production:'Nickel',                region:'Nouvelle-Calédonie', percentage:15, price:1500000, country:'Océanie-2'},
  {production:'Or',                    region:'Australie',          percentage:5,  price:500000,  country:'Océanie-2'},
  {production:'Fer',                   region:'Australie',          percentage:20, price:2000000, country:'Océanie-2'},
  {production:'Argent',                region:'Australie',          percentage:15, price:1500000, country:'Océanie-2'},
  {production:'Pétrole',               region:'Arabie Saoudite',    percentage:20, price:2000000, country:'Moyen-Orient'},
  {production:'Pétrole',               region:'Iran/Irak',          percentage:10, price:1000000, country:'Moyen-Orient'},
  {production:'Pétrole',               region:'Koweït',             percentage:5,  price:500000,  country:'Moyen-Orient'},
  {production:'Riz',                   region:'Inde',               percentage:20, price:2000000, country:'Péninsule Ind.'},
  {production:'Thé',                   region:'Inde',               percentage:35, price:2500000, country:'Péninsule Ind.'},
  {production:'Coton brut',            region:'Inde',               percentage:15, price:1000000, country:'Péninsule Ind.'},
  {production:'Houille',               region:'Inde',               percentage:5,  price:500000,  country:'Péninsule Ind.'},
  {production:'Caoutchouc naturel',    region:'Inde',               percentage:5,  price:500000,  country:'Péninsule Ind.'},
  {production:'Caoutchouc naturel',    region:'Ceylan',             percentage:10, price:1000000, country:'Péninsule Ind.'},
  {production:'Blé',                   region:'Inde',               percentage:15, price:1000000, country:'Péninsule Ind.'},
  {production:'Fer',                   region:'Inde',               percentage:5,  price:500000,  country:'Péninsule Ind.'},
  {production:'Sucre',                 region:'Inde',               percentage:15, price:1000000, country:'Péninsule Ind.'},
  {production:'Thé',                   region:'Ceylan',             percentage:15, price:1000000, country:'Péninsule Ind.'},
  {production:'Coton brut',            region:'Pakistan',           percentage:5,  price:500000,  country:'Péninsule Ind.'},
  {production:'Caoutchouc naturel',    region:'Malaisie',           percentage:35, price:1500000, country:'Péninsule Indoch.'},
  {production:'Riz',                   region:'Thaïlande',          percentage:10, price:1000000, country:'Péninsule Indoch.'},
  {production:'Caoutchouc naturel',    region:'Viêt-Nam',           percentage:15, price:1000000, country:'Péninsule Indoch.'},
  {production:'Riz',                   region:'Cambodge',           percentage:10, price:1000000, country:'Péninsule Indoch.'},
  {production:'Construction automobile',region:'Japon',             percentage:20, price:2000000, country:'Japon'},
  {production:'Construction navale',   region:'Japon',              percentage:40, price:3000000, country:'Japon'},
  {production:'Acier',                 region:'Japon',              percentage:20, price:2000000, country:'Japon'},
  {production:'Riz',                   region:'Japon',              percentage:10, price:500000,  country:'Japon'},
  {production:'Tungstène',             region:'Japon',              percentage:5,  price:500000,  country:'Japon'},
  {production:'Thé',                   region:'Japon',              percentage:10, price:500000,  country:'Japon'},
  {production:'Argent',                region:'Japon',              percentage:10, price:500000,  country:'Japon'},
  {production:'Or',                    region:'Japon',              percentage:5,  price:500000,  country:'Japon'},
  {production:'Houille',               region:'Chine',              percentage:20, price:2000000, country:'Chine'},
  {production:'Tungstène',             region:'Chine',              percentage:45, price:2000000, country:'Chine'},
  {production:'Riz',                   region:'Chine',              percentage:35, price:2500000, country:'Chine'},
  {production:'Blé',                   region:'Chine',              percentage:15, price:1000000, country:'Chine'},
  {production:'Fer',                   region:'Chine',              percentage:10, price:1000000, country:'Chine'},
  {production:'Acier',                 region:'Chine',              percentage:5,  price:500000,  country:'Chine'},
  {production:'Sucre',                 region:'Chine',              percentage:10, price:500000,  country:'Chine'},
  {production:'Coton brut',            region:'Chine',              percentage:20, price:1500000, country:'Chine'},
  {production:'Thé',                   region:'Chine',              percentage:25, price:1500000, country:'Chine'},
  {production:'Café',                  region:'Indonésie',          percentage:10, price:500000,  country:'Indonésie'},
  {production:'Caoutchouc naturel',    region:'Indonésie',          percentage:25, price:1000000, country:'Indonésie'},
  {production:'Riz',                   region:'Indonésie',          percentage:10, price:500000,  country:'Indonésie'},
]

function Modal({ modal, myPlayer, titles, players, user, onBuy, onActualite, onJoker, onClose, formatMoney }) {
  const [selected, setSelected] = useState([])
  const [viewPlayerId, setViewPlayerId] = useState(String(user?.id ?? ''))
  const myTitles = titles.filter(t => t.user_id === user?.id)
  const totalSelected = selected.reduce((s, t) => s + t.price, 0)
  const canAfford = myPlayer && totalSelected <= myPlayer.money

  const viewTitles = titles.filter(t => String(t.user_id) === viewPlayerId)
  const viewByProd = {}
  viewTitles.forEach(t => { viewByProd[t.production] = (viewByProd[t.production] || 0) + t.percentage })

  function toggleTitle(t) {
    const key = t.production + t.region
    if (selected.find(s => s.production + s.region === key)) setSelected(selected.filter(s => s.production + s.region !== key))
    else if (selected.length < 6) setSelected([...selected, t])
  }

  const availableForCase = modal.type === 'buy'
    ? AVAILABLE_TITLES.filter(t => {
        if (titles.find(owned => owned.production === t.production && owned.region === t.region)) return false
        const cas = modal.data.cas
        if (cas?.type === 'pays' || cas?.type === 'europe') {
          const baseLabel = cas.label.replace(/-\d+$/, '')
          if (baseLabel !== cas.label) return t.country.replace(/-\d+$/, '') === baseLabel
          return t.country === cas.label
        }
        if (cas?.type === 'choix') {
          if (!cas.continent) return true
          const continents = cas.continent === 'Asie' ? ['Asie','Océanie'] : [cas.continent]
          const validCountries = new Set(LISTE.filter(c => (c.type==='pays' || c.type==='europe') && continents.includes(c.continent)).map(c => c.label))
          return validCountries.has(t.country)
        }
        return true
      })
    : []

  if (modal.type === 'buy') return (
    <div className="modal-overlay">
      <div className="modal-box" style={{ maxWidth:'780px' }}>
        <h3 style={{ color:'#c8962a', margin:'0 0 4px', fontFamily:"'Oswald',sans-serif" }}>Titres d'exploitation — {modal.data.cas.label}</h3>
        <p style={{ color:'#aaa', fontSize:'12px', margin:'0 0 12px' }}>Choisissez jusqu'à 6 titres</p>
        <p style={{ color:'#27ae60', margin:'0 0 16px', fontSize:'14px' }}>Votre argent : {formatMoney(myPlayer?.money)}</p>

        <div style={{ display:'grid', gridTemplateColumns:'1fr 280px', gap:'16px', alignItems:'start' }}>
          {/* Titres disponibles */}
          <div>
            {availableForCase.length === 0
              ? <p style={{ color:'#e74c3c' }}>Aucun titre disponible</p>
              : <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'8px', maxHeight:'320px', overflowY:'auto' }}>
                  {availableForCase.map((t, i) => {
                    const isSelected = !!selected.find(s => s.production + s.region === t.production + t.region)
                    return (
                      <div key={i} onClick={() => toggleTitle(t)} style={{ padding:'10px', background:isSelected?'rgba(200,150,42,0.2)':'rgba(255,255,255,0.04)', border:`1px solid ${isSelected?'#c8962a':'#333'}`, borderRadius:'8px', cursor:'pointer', fontSize:'12px' }}>
                        <div style={{ color:'#c8962a', fontWeight:'bold' }}>{t.production}</div>
                        <div style={{ color:'#aaa' }}>{t.region} — {t.percentage}%</div>
                        <div style={{ color:'#27ae60' }}>{formatMoney(t.price)}</div>
                      </div>
                    )
                  })}
                </div>
            }
          </div>

          {/* Panneau ressources joueur */}
          <div style={{ background:'rgba(255,255,255,0.03)', border:'1px solid #2a1a00', borderRadius:'10px', padding:'10px' }}>
            <div style={{ marginBottom:'8px' }}>
              <select
                value={viewPlayerId}
                onChange={e => setViewPlayerId(e.target.value)}
                style={{ width:'100%', padding:'5px 8px', background:'#1a0a00', border:'1px solid #555', borderRadius:'6px', color:'white', fontSize:'13px', cursor:'pointer' }}
              >
                {(players || []).map(p => (
                  <option key={p.user_id} value={String(p.user_id)}>
                    {p.users?.username}{String(p.user_id) === String(user?.id) ? ' (moi)' : ''}
                  </option>
                ))}
              </select>
            </div>
            <div style={{ maxHeight:'300px', overflowY:'auto', display:'flex', flexDirection:'column', gap:'4px' }}>
              {Object.keys(viewByProd).length === 0
                ? <p style={{ color:'#555', fontSize:'12px', textAlign:'center', margin:'20px 0' }}>Aucune ressource</p>
                : Object.entries(viewByProd).sort(([a],[b]) => a.localeCompare(b)).map(([prod, pct]) => {
                    const royalty = getRoyaltyAmount(prod, pct)
                    const pctColor = pct >= 70 ? '#27ae60' : pct >= 50 ? '#f39c12' : pct >= 30 ? '#e67e22' : '#e74c3c'
                    return (
                      <div key={prod} style={{ padding:'5px 8px', background:'rgba(255,255,255,0.04)', borderRadius:'5px' }}>
                        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                          <span style={{ color:'white', fontSize:'12px', fontWeight:'600' }}>{prod}</span>
                          <span style={{ color:pctColor, fontSize:'12px', fontWeight:'bold' }}>{pct}%</span>
                        </div>
                        <div style={{ marginTop:'3px', height:'3px', background:'#1a0a00', borderRadius:'2px' }}>
                          <div style={{ width:Math.min(pct,100)+'%', height:'100%', background:pctColor, borderRadius:'2px' }}/>
                        </div>
                        {royalty > 0 && <div style={{ color:'#3498db', fontSize:'11px', marginTop:'2px' }}>{formatMoney(royalty)}/passage</div>}
                      </div>
                    )
                  })
              }
            </div>
          </div>
        </div>

        <div style={{ borderTop:'1px solid #333', paddingTop:'16px', marginTop:'16px', display:'flex', gap:'12px', alignItems:'center', flexWrap:'wrap' }}>
          <span style={{ color:canAfford?'#27ae60':'#e74c3c', fontSize:'14px' }}>Total : {formatMoney(totalSelected)}</span>
          <button onClick={() => onBuy(selected)} disabled={!canAfford && selected.length > 0}
            style={{ padding:'10px 24px', background:canAfford||selected.length===0?'#c8962a':'#555', border:'none', borderRadius:'8px', color:'white', cursor:'pointer', fontSize:'15px' }}>
            {selected.length === 0 ? 'Passer' : `Acheter (${selected.length})`}
          </button>
          <button onClick={onClose} style={{ padding:'10px 24px', background:'transparent', border:'1px solid #555', borderRadius:'8px', color:'#aaa', cursor:'pointer' }}>Annuler</button>
        </div>
      </div>
    </div>
  )

  if (modal.type === 'actualite') return (
    <div className="modal-overlay">
      <div className="modal-box" style={{ textAlign:'center' }}>
        <h3 style={{ color:'#1abc9c', margin:'0 0 20px', fontSize:'20px' }}>📰 Carte Actualité</h3>
        <p style={{ color:'white', fontSize:'16px', lineHeight:'1.6', marginBottom:'24px' }}>{modal.data.text}</p>
        <button onClick={() => onActualite(modal.data)} style={{ padding:'12px 32px', background:'#1abc9c', border:'none', borderRadius:'10px', color:'white', cursor:'pointer', fontSize:'16px' }}>OK</button>
      </div>
    </div>
  )

  if (modal.type === 'joker') return (
    <div className="modal-overlay">
      <div className="modal-box" style={{ textAlign:'center' }}>
        <h3 style={{ color:'#9b59b6', margin:'0 0 16px', fontSize:'20px' }}>🃏 Case Joker</h3>
        <p style={{ color:'white', marginBottom:'8px' }}>Acheter un Joker pour <strong style={{ color:'#c8962a' }}>3.000.000 F</strong> ?</p>
        <p style={{ color:'#27ae60', marginBottom:'20px' }}>Votre argent : {formatMoney(myPlayer?.money)}</p>
        <div style={{ display:'flex', gap:'12px', justifyContent:'center' }}>
          {!myPlayer?.has_joker && myPlayer?.money >= 3000000 && (
            <button onClick={onJoker} style={{ padding:'12px 24px', background:'#9b59b6', border:'none', borderRadius:'10px', color:'white', cursor:'pointer', fontSize:'15px' }}>Acheter le Joker</button>
          )}
          <button onClick={onClose} style={{ padding:'12px 24px', background:'transparent', border:'1px solid #555', borderRadius:'10px', color:'#aaa', cursor:'pointer', fontSize:'15px' }}>Passer</button>
        </div>
      </div>
    </div>
  )

  if (modal.type === 'encheres') return (
    <div className="modal-overlay">
      <div className="modal-box" style={{ textAlign:'center' }}>
        <h3 style={{ color:'#e67e22', margin:'0 0 16px', fontSize:'20px' }}>🔨 Case Enchères</h3>
        <p style={{ color:'white', marginBottom:'8px' }}>Dé rouge : <strong style={{ color:'#e74c3c', fontSize:'24px' }}>{modal.data.diceRed}</strong></p>
        <p style={{ color:'#aaa', fontSize:'13px', marginBottom:'24px' }}>
          {myPlayer?.has_joker ? 'Utilisez votre Joker pour éviter cette enchère.' : `Mettez ${modal.data.diceRed} titre(s) aux enchères.`}
        </p>
        <div style={{ display:'flex', gap:'12px', justifyContent:'center' }}>
          {myPlayer?.has_joker && (
            <button onClick={async () => {
              await supabase.from('game_players').update({ has_joker: false }).eq('id', myPlayer.id)
              onClose()
            }} style={{ padding:'12px 24px', background:'#9b59b6', border:'none', borderRadius:'10px', color:'white', cursor:'pointer' }}>🃏 Utiliser le Joker</button>
          )}
          <button onClick={onClose} style={{ padding:'12px 24px', background:'#e67e22', border:'none', borderRadius:'10px', color:'white', cursor:'pointer' }}>Procéder aux enchères</button>
        </div>
      </div>
    </div>
  )

  return null
}

// ============================================================
// MARCHÉ DES RESSOURCES
// ============================================================
function MarketModal({ titles, onClose }) {
  const [filter, setFilter] = useState('')
  const [onlyAvailable, setOnlyAvailable] = useState(false)
  const [byCountry, setByCountry] = useState(false)

  // Ordre des cases du plateau (uniquement celles qui ont des ressources)
  const caseOrder = []
  const seenCases = new Set()
  LISTE.forEach(cas => {
    if (cas.label && !seenCases.has(cas.label) && AVAILABLE_TITLES.some(t => t.country === cas.label)) {
      seenCases.add(cas.label)
      caseOrder.push(cas.label)
    }
  })

  const rows = []
  const lf = filter.toLowerCase()

  if (byCountry) {
    caseOrder.forEach(caseName => {
      const caseTitles = AVAILABLE_TITLES.filter(t => t.country === caseName)
      const visible = caseTitles.filter(t => {
        const owned = titles.find(o => o.production === t.production && o.region === t.region)
        if (onlyAvailable && owned) return false
        if (filter && !t.production.toLowerCase().includes(lf) && !caseName.toLowerCase().includes(lf)) return false
        return true
      })
      if (!visible.length) return
      rows.push({ isHeader: true, prod: caseName })
      visible.forEach(t => {
        const owned = titles.find(o => o.production === t.production && o.region === t.region)
        rows.push({ isHeader: false, ...t, owner: owned?.users || null, label: t.production })
      })
    })
  } else {
    let lastProd = null
    const sorted = [...AVAILABLE_TITLES].sort((a, b) => a.production.localeCompare(b.production))
    sorted.forEach(t => {
      const owned = titles.find(o => o.production === t.production && o.region === t.region)
      const owner = owned ? owned.users : null
      if (filter && !t.production.toLowerCase().includes(lf)) return
      if (onlyAvailable && owner) return
      if (t.production !== lastProd) { rows.push({ isHeader: true, prod: t.production }); lastProd = t.production }
      rows.push({ isHeader: false, ...t, owner })
    })
  }

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.88)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:3000, padding:'20px' }} onClick={onClose}>
      <div style={{ background:'#1a0a00', border:'2px solid #c8962a', borderRadius:'16px', width:'100%', maxWidth:'700px', maxHeight:'88vh', display:'flex', flexDirection:'column', overflow:'hidden' }} onClick={e => e.stopPropagation()}>

        <div style={{ padding:'16px 20px', borderBottom:'1px solid #2a1400' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'12px' }}>
            <span style={{ color:'#c8962a', fontSize:'20px', fontWeight:'bold' }}>📦 Marché des ressources</span>
            <button onClick={onClose} style={{ background:'#2a1400', border:'1px solid #555', borderRadius:'6px', color:'white', cursor:'pointer', padding:'4px 10px', fontSize:'15px' }}>✕</button>
          </div>
          <div style={{ display:'flex', gap:'10px', alignItems:'center', flexWrap:'wrap' }}>
            <input placeholder="Filtrer..." value={filter} onChange={e => setFilter(e.target.value)}
              style={{ flex:1, minWidth:'120px', padding:'6px 12px', background:'#2a1400', border:'1px solid #555', borderRadius:'6px', color:'white', fontSize:'14px' }} />
            <label style={{ color:'white', fontSize:'13px', cursor:'pointer', display:'flex', gap:'6px', alignItems:'center' }}>
              <input type="checkbox" checked={onlyAvailable} onChange={e => setOnlyAvailable(e.target.checked)} />
              Disponibles seulement
            </label>
            <label style={{ color:'#c8962a', fontSize:'13px', cursor:'pointer', display:'flex', gap:'6px', alignItems:'center' }}>
              <input type="checkbox" checked={byCountry} onChange={e => setByCountry(e.target.checked)} />
              Par pays
            </label>
          </div>
        </div>

        <div style={{ overflowY:'auto', flex:1, padding:'0 0 8px' }}>
          {rows.length === 0 && <p style={{ color:'#888', textAlign:'center', padding:'30px' }}>Aucune ressource trouvée</p>}
          {rows.map((row, i) => row.isHeader
            ? (
              <div key={'h' + i + row.prod} style={{ padding:'8px 20px', background:'#2a1200', marginTop: i > 0 ? '6px' : 0 }}>
                <span style={{ color:'#c8962a', fontWeight:'bold', fontSize:'15px' }}>{row.prod}</span>
              </div>
            ) : byCountry ? (
              <div key={row.production + row.region} style={{ padding:'6px 20px 6px 30px', borderBottom:'1px solid #1e0a00' }}>
                <span style={{ color:'white', fontSize:'13px' }}>{row.production}</span>
                <span style={{ color:'#999', fontSize:'12px' }}> · {row.region} · {row.percentage}% · </span>
                {row.owner
                  ? <span style={{ color: PLAYER_COLORS[row.owner.color] || '#c8962a', fontSize:'13px', fontWeight:'bold' }}>● {row.owner.username}</span>
                  : <span style={{ color:'#27ae60', fontSize:'13px', fontWeight:'bold' }}>✔ Disponible</span>
                }
              </div>
            ) : (
              <div key={row.production + row.region} style={{ padding:'6px 20px 6px 30px', borderBottom:'1px solid #1e0a00' }}>
                <span style={{ color:'white', fontSize:'13px' }}>{row.region}</span>
                <span style={{ color:'#999', fontSize:'12px' }}> · {row.country} · {row.percentage}% · </span>
                {row.owner
                  ? <span style={{ color: PLAYER_COLORS[row.owner.color] || '#c8962a', fontSize:'13px', fontWeight:'bold' }}>● {row.owner.username}</span>
                  : <span style={{ color:'#27ae60', fontSize:'13px', fontWeight:'bold' }}>✔ Disponible</span>
                }
              </div>
            )
          )}
        </div>
      </div>
    </div>
  )
}