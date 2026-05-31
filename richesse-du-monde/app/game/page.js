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


const ACTUALITE_CARDS = [
  { text: "Splendides récoltes de blé ! Recevez 7M si vous possédez du blé, sinon payez 5M.", gain_prod: 'Blé', gain: 7000000, perte: 5000000 },
  { text: "Surproduction de café ! Payez 4M si vous possédez du café, sinon recevez 5M.", perte_prod: 'Café', perte: 4000000, gain: 5000000 },
  { text: "Tension internationale ! Recevez 5M si vous possédez de l'uranium, sinon payez 4M.", gain_prod: 'Uranium', gain: 5000000, perte: 4000000 },
  { text: "Incidents au Zaïre ! Payez 9M si vous possédez du cuivre, sinon recevez 4M.", perte_prod: 'Cuivre', perte: 9000000, gain: 4000000 },
  { text: "Boom pétrolier mondial ! Recevez 10M si vous possédez du pétrole, sinon payez 3M.", gain_prod: 'Pétrole', gain: 10000000, perte: 3000000 },
  { text: "Crise de l'acier ! Payez 6M si vous possédez de l'acier, sinon recevez 2M.", perte_prod: 'Acier', perte: 6000000, gain: 2000000 },
  { text: "Récolte exceptionnelle de riz ! Recevez 8M si vous possédez du riz, sinon payez 2M.", gain_prod: 'Riz', gain: 8000000, perte: 2000000 },
  { text: "Effondrement du cours de l'or ! Payez 5M si vous possédez de l'or, sinon recevez 3M.", perte_prod: 'Or', perte: 5000000, gain: 3000000 },
  { text: "Découverte de gisements de nickel ! Recevez 6M si vous possédez du nickel, sinon payez 2M.", gain_prod: 'Nickel', gain: 6000000, perte: 2000000 },
  { text: "Grève dans les mines de houille ! Payez 7M si vous possédez de la houille, sinon recevez 4M.", perte_prod: 'Houille', perte: 7000000, gain: 4000000 },
  { text: "Essor de la construction automobile ! Recevez 9M si vous la possédez, sinon payez 3M.", gain_prod: 'Construction automobile', gain: 9000000, perte: 3000000 },
  { text: "Mauvaise récolte de cacao ! Payez 4M si vous possédez du cacao, sinon recevez 5M.", perte_prod: 'Cacao', perte: 4000000, gain: 5000000 },
  { text: "Boom du caoutchouc ! Recevez 7M si vous possédez du caoutchouc naturel, sinon payez 2M.", gain_prod: 'Caoutchouc naturel', gain: 7000000, perte: 2000000 },
  { text: "Krach boursier ! Tous les joueurs perdent 3M.", all_perte: 3000000 },
  { text: "Fête mondiale ! Tous les joueurs reçoivent 2M.", all_gain: 2000000 },
  { text: "Crise du cobalt ! Payez 8M si vous possédez du cobalt, sinon recevez 3M.", perte_prod: 'Cobalt', perte: 8000000, gain: 3000000 },
  { text: "Récolte de thé exceptionnelle ! Recevez 5M si vous possédez du thé, sinon payez 2M.", gain_prod: 'Thé', gain: 5000000, perte: 2000000 },
  { text: "Crise du sucre mondial ! Payez 4M si vous possédez du sucre, sinon recevez 3M.", perte_prod: 'Sucre', perte: 4000000, gain: 3000000 },
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
  const [showMarket, setShowMarket] = useState(false)

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
    if (!user) return
    loadOrCreateGame()
  }, [user])

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
    }
    await loadTitles(gameId)
    await loadLogs(gameId)
  }

  async function loadTitles(gameId) {
    const { data } = await supabase.from('player_titles').select('*, users(username,color)').eq('game_id', gameId)
    setTitles(data || [])
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
      else if (actualiteCard.gain_prod) {
        const has = myTitlesNow.some(t => t.production === actualiteCard.gain_prod)
        amount = has ? actualiteCard.gain : -actualiteCard.perte
      } else if (actualiteCard.perte_prod) {
        const has = myTitlesNow.some(t => t.production === actualiteCard.perte_prod)
        amount = has ? -actualiteCard.perte : actualiteCard.gain
      }
      actualiteCard = { ...actualiteCard, computed_amount: amount }
    }
    if (landedCase.type === '500k') lines.push(`Vous recevez ${formatMoney(total * 500000)} de la banque !`)
    if (landedCase.type === 'joker') lines.push('Vous pouvez acheter un Joker pour 3 000 000 F.')
    if (landedCase.type === 'encheres') lines.push(newLaps > 0 ? `Dé rouge : ${dr} — mise ${dr} titre(s) aux enchères.` : 'Enchères actives après le 1er tour complet.')

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

  async function confirmPendingAction() {
    const pa = game?.game_state?.pending_action
    if (!pa || pa.player_id !== user.id) return
    const { data: d } = pa

    const { data: freshPlayers } = await supabase.from('game_players').select('*, users(username,color)').eq('game_id', game.id)
    const freshMe = freshPlayers?.find(p => p.user_id === user.id)
    if (!freshMe) return

    let myMoney = freshMe.money
    await supabase.from('game_players').update({ position: d.newPos, laps_done: d.newLaps }).eq('id', freshMe.id)
    await addLog(`avance de ${d.total} cases → ${d.cas.label}`, 0)

    if (d.doublePenalty) {
      myMoney = Math.max(0, myMoney - d.doublePenalty)
      await addLog(`a fait double — paie ${formatMoney(d.doublePenalty)} à la banque`, d.doublePenalty)
    }

    if (d.royaltyPayments?.length > 0) {
      for (const r of d.royaltyPayments) {
        myMoney = Math.max(0, myMoney - r.amount)
        const creditor = freshPlayers?.find(p => p.id === r.to_id)
        if (creditor) await supabase.from('game_players').update({ money: creditor.money + r.amount }).eq('id', r.to_id)
        await addLog(`paie ${formatMoney(r.amount)} de royalties à ${r.to_name} (${r.resource})`, r.amount)
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
        if (d.newLaps > 0) nextModal = { type: 'encheres', data: { diceRed: d.diceRed } }
        else setMessage("Les enchères ne s'appliquent qu'après un tour complet")
        break
    }

    await supabase.from('game_players').update({ money: myMoney }).eq('id', freshMe.id)
    if (myMoney === 0) {
      await supabase.from('game_players').update({ bankrupt: true }).eq('id', freshMe.id)
      await addLog('est en FAILLITE !', 0)
    }
    const updatedDoubles = { ...(game?.game_state?.doubles_counts || {}), [user.id]: d.isDouble ? d.newDoublesCount : 0 }
    await clearPendingAction({ doubles_counts: updatedDoubles })
    if (nextModal) setModal(nextModal)
    else await nextTurn()
    await loadGame(game.id)
  }

  async function buyTitles(selectedTitles) {
    if (!selectedTitles || selectedTitles.length === 0) { await nextTurn(); setModal(null); return }
    let totalCost = 0
    for (const t of selectedTitles) {
      totalCost += t.price
      await supabase.from('player_titles').insert({
        game_id: game.id, user_id: user.id,
        production: t.production, region: t.region,
        percentage: t.percentage, buy_price: t.price
      })
    }
    await updateMoney(myPlayer.id, -totalCost)
    await addLog(`achète ${selectedTitles.length} titre(s) pour ${formatMoney(totalCost)}`, totalCost)
    setModal(null)
    await nextTurn()
  }

  async function handleActualite(card) {
    const myTitles = titles.filter(t => t.user_id === user.id)
    let amount = 0
    if (card.all_gain) { amount = card.all_gain }
    else if (card.all_perte) { amount = -card.all_perte }
    else if (card.gain_prod) {
      const has = myTitles.some(t => t.production === card.gain_prod)
      amount = has ? card.gain : -card.perte
    } else if (card.perte_prod) {
      const has = myTitles.some(t => t.production === card.perte_prod)
      amount = has ? -card.perte : card.gain
    }
    await updateMoney(myPlayer.id, amount)
    await addLog(`carte Actualité : ${amount >= 0 ? '+' : ''}${formatMoney(amount)}`, Math.abs(amount))
    setModal(null)
    await nextTurn()
  }

  async function buyJoker() {
    if (myPlayer.money < 3000000) { setMessage("Pas assez d'argent pour acheter un Joker (3M)"); setModal(null); return }
    await supabase.from('game_players').update({ has_joker: true }).eq('id', myPlayer.id)
    await updateMoney(myPlayer.id, -3000000)
    await addLog('achète un Joker pour 3.000.000 F', 3000000)
    setModal(null)
    await nextTurn()
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
    if (!game || !players.length) return
    const activePlayers = players.filter(p => !p.bankrupt)
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
        <h1 className="header-title">🌍 Richesses du Monde</h1>
        <div style={{ display:'flex', gap:'12px', alignItems:'center' }}>
          <span style={{ color:'#aaa', fontSize:'14px' }}>Connecté : <strong style={{ color:'#c8962a' }}>{user?.username}</strong></span>
          <button onClick={() => setShowMarket(true)} style={{ padding:'6px 14px', background:'#1a4a6b', border:'1px solid #2980b9', borderRadius:'6px', color:'#3498db', cursor:'pointer', fontSize:'13px', fontWeight:'600' }}>📦 Ressources</button>
          {user?.role === 'admin' && (
            <button onClick={resetGame} style={{ padding:'6px 14px', background:'#c0392b', border:'none', borderRadius:'6px', color:'white', cursor:'pointer', fontSize:'13px' }}>🔄 Reset</button>
          )}
          <button onClick={logout} style={{ padding:'6px 14px', background:'transparent', border:'1px solid #555', borderRadius:'6px', color:'#aaa', cursor:'pointer', fontSize:'13px' }}>Déconnexion</button>
        </div>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'260px 1fr 240px', minHeight:'calc(100vh - 60px)' }}>

        {/* PANNEAU GAUCHE */}
        <div style={{ background:'#0d0500', borderRight:'2px solid #2a1a00', padding:'16px', overflowY:'auto', display:'flex', flexDirection:'column', gap:'12px' }}>

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
                <h3 style={{ color:'#c8962a', margin:'0 0 10px', fontSize:'14px', fontFamily:"'Oswald',sans-serif", fontWeight:'600' }}>📋 MES RESSOURCES</h3>
                <MyTitles titles={getMyTitles()} getRoyalties={getRoyalties} getTotalPercentage={getTotalPercentage}/>
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
        <div style={{ padding:'12px', display:'flex', alignItems:'flex-start', justifyContent:'center', overflow:'hidden', minWidth:0 }}>
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

        {/* SIDEBAR DROITE */}
        <div className="sidebar">
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

      {/* OVERLAY */}
      <PendingActionOverlay
        pendingAction={game?.game_state?.pending_action}
        currentUserId={user?.id}
        onConfirm={confirmPendingAction}
      />

      {/* MODALS */}
      {modal && (
        <Modal modal={modal} myPlayer={myPlayer} titles={titles} user={user}
          onBuy={buyTitles} onActualite={handleActualite} onJoker={buyJoker}
          onClose={() => { setModal(null); nextTurn() }}
          formatMoney={formatMoney}
        />
      )}

      {showMarket && (
        <MarketModal titles={titles} onClose={() => setShowMarket(false)} />
      )}
    </div>
  )
}

// ============================================================
// OVERLAY
// ============================================================
function PendingActionOverlay({ pendingAction, currentUserId, onConfirm }) {
  if (!pendingAction) return null
  const isMyAction = pendingAction.player_id === currentUserId
  const color = PLAYER_COLORS[pendingAction.player_color] || '#c8962a'
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
        {isMyAction ? (
          <button onClick={onConfirm} style={{ padding:'12px 48px', background:color, border:'none', borderRadius:'10px', color:'white', fontSize:'18px', fontWeight:700, fontFamily:"'Oswald',sans-serif", cursor:'pointer' }}>OK</button>
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
                  width: 24, height: 24,
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
  const byProd = {}
  titles.forEach(t => { if (!byProd[t.production]) byProd[t.production] = []; byProd[t.production].push(t) })
  if (!Object.keys(byProd).length) return <div style={{ color:'#555', textAlign:'center', padding:'12px 0', fontSize:'12px' }}>Aucun titre possédé</div>
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:'6px' }}>
      {Object.entries(byProd).map(([prod, ts]) => {
        const pct = getTotalPercentage(prod)
        const royalties = getRoyalties(prod)
        const pctColor = pct >= 70?'#27ae60':pct >= 50?'#f39c12':pct >= 30?'#e67e22':'#e74c3c'
        return (
          <div key={prod} style={{ background:'rgba(255,255,255,0.05)', border:'1px solid #2a1a00', borderRadius:'6px', padding:'8px 10px' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'3px' }}>
              <span style={{ color:'#c8962a', fontWeight:'bold', fontSize:'11px', textTransform:'uppercase' }}>{prod}</span>
              <span style={{ color:pctColor, fontSize:'11px', fontWeight:'bold' }}>{pct}%</span>
            </div>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <span style={{ color:'#aaa', fontSize:'10px' }}>{ts.map(t => t.region?.split(' ')[0]).join(', ')}</span>
              <span style={{ color:royalties>0?'#3498db':'#555', fontSize:'10px', fontWeight:'bold' }}>
                {royalties > 0 ? (royalties/1000000).toFixed(1)+'M F' : '< 30%'}
              </span>
            </div>
            <div style={{ marginTop:'4px', height:'3px', background:'#1a0a00', borderRadius:'2px', overflow:'hidden' }}>
              <div style={{ width:Math.min(pct,100)+'%', height:'100%', background:pctColor, borderRadius:'2px', transition:'width 0.3s' }}/>
            </div>
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

function Modal({ modal, myPlayer, titles, user, onBuy, onActualite, onJoker, onClose, formatMoney }) {
  const [selected, setSelected] = useState([])
  const myTitles = titles.filter(t => t.user_id === user?.id)
  const totalSelected = selected.reduce((s, t) => s + t.price, 0)
  const canAfford = myPlayer && totalSelected <= myPlayer.money

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
      <div className="modal-box">
        <h3 style={{ color:'#c8962a', margin:'0 0 4px', fontFamily:"'Oswald',sans-serif" }}>Titres d'exploitation — {modal.data.cas.label}</h3>
        <p style={{ color:'#aaa', fontSize:'12px', margin:'0 0 12px' }}>Choisissez jusqu'à 6 titres</p>
        <p style={{ color:'#27ae60', margin:'0 0 16px', fontSize:'14px' }}>Votre argent : {formatMoney(myPlayer?.money)}</p>
        {availableForCase.length === 0
          ? <p style={{ color:'#e74c3c' }}>Aucun titre disponible</p>
          : <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'8px', marginBottom:'20px', maxHeight:'340px', overflowY:'auto' }}>
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
        <div style={{ borderTop:'1px solid #333', paddingTop:'16px', display:'flex', gap:'12px', alignItems:'center', flexWrap:'wrap' }}>
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

  const grouped = {}
  AVAILABLE_TITLES.forEach(t => {
    if (!grouped[t.production]) grouped[t.production] = []
    const owned = titles.find(o => o.production === t.production && o.region === t.region)
    grouped[t.production].push({ ...t, owner: owned ? owned.users : null })
  })

  const resources = Object.entries(grouped)
    .filter(([prod]) => !filter || prod.toLowerCase().includes(filter.toLowerCase()))
    .filter(([, tiles]) => !onlyAvailable || tiles.some(t => !t.owner))
    .sort(([a], [b]) => a.localeCompare(b))

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={e => e.stopPropagation()} style={{ maxWidth:'760px', width:'100%', padding:'20px' }}>

        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'16px' }}>
          <h3 style={{ color:'#c8962a', margin:0, fontFamily:"'Oswald',sans-serif", fontSize:'22px' }}>📦 Marché des ressources</h3>
          <button onClick={onClose} style={{ background:'transparent', border:'1px solid #666', borderRadius:'6px', color:'white', cursor:'pointer', padding:'6px 12px', fontSize:'16px', lineHeight:1 }}>✕</button>
        </div>

        <div style={{ display:'flex', gap:'12px', marginBottom:'16px', alignItems:'center' }}>
          <input
            placeholder="Filtrer par ressource..."
            value={filter}
            onChange={e => setFilter(e.target.value)}
            style={{ flex:1, padding:'8px 14px', background:'#2a1400', border:'1px solid #555', borderRadius:'8px', color:'white', fontSize:'15px' }}
          />
          <label style={{ display:'flex', alignItems:'center', gap:'8px', color:'white', fontSize:'14px', cursor:'pointer', whiteSpace:'nowrap' }}>
            <input type="checkbox" checked={onlyAvailable} onChange={e => setOnlyAvailable(e.target.checked)} style={{ width:16, height:16 }} />
            Disponibles seulement
          </label>
        </div>

        {resources.length === 0 && (
          <p style={{ color:'#aaa', textAlign:'center', padding:'40px 0', fontSize:'16px' }}>Aucune ressource trouvée</p>
        )}

        <div style={{ maxHeight:'60vh', overflowY:'auto', display:'flex', flexDirection:'column', gap:'12px', paddingRight:'4px' }}>
          {resources.map(([prod, tiles]) => {
            const totalPct = tiles.reduce((s, t) => s + t.percentage, 0)
            const ownedPct = tiles.filter(t => t.owner).reduce((s, t) => s + t.percentage, 0)
            const availPct = totalPct - ownedPct
            const pctColor = availPct === 0 ? '#e74c3c' : availPct < totalPct * 0.4 ? '#e67e22' : '#27ae60'
            return (
              <div key={prod} style={{ border:'1px solid #3a2000', borderRadius:'10px', overflow:'hidden' }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'10px 16px', background:'#2a1200' }}>
                  <span style={{ color:'#c8962a', fontWeight:'bold', fontSize:'16px', fontFamily:"'Oswald',sans-serif", textTransform:'uppercase' }}>{prod}</span>
                  <span style={{ color:pctColor, fontSize:'13px', fontWeight:'bold', background:'rgba(0,0,0,0.4)', padding:'3px 10px', borderRadius:'20px', border:`1px solid ${pctColor}66` }}>
                    {availPct > 0 ? `${availPct}% libre` : '✗ Épuisé'} / {totalPct}% total
                  </span>
                </div>
                {tiles.map((t, i) => (
                  <div key={i} style={{ display:'flex', alignItems:'center', padding:'9px 16px', background: i % 2 === 0 ? '#180a00' : '#1e0e00', borderTop:'1px solid #2a1400' }}>
                    <span style={{ flex:'0 0 150px', color:'white', fontSize:'14px', fontWeight:'600' }}>{t.region}</span>
                    <span style={{ flex:'0 0 140px', color:'#c8b08a', fontSize:'13px' }}>{t.country}</span>
                    <span style={{ flex:'0 0 50px', color:'#c8962a', fontSize:'13px', fontWeight:'bold' }}>{t.percentage}%</span>
                    <span style={{ flex:1, textAlign:'right', fontSize:'13px', fontWeight:'700',
                      color: t.owner ? (PLAYER_COLORS[t.owner.color] || '#c8962a') : '#27ae60'
                    }}>
                      {t.owner ? `● ${t.owner.username}` : '✔ Disponible'}
                    </span>
                  </div>
                ))}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}