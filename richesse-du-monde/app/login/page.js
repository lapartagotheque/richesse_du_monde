'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleLogin() {
    setLoading(true)
    setError('')
    const res = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    })
    const data = await res.json()
    if (data.success) {
      localStorage.setItem('rdm_user', JSON.stringify(data.user))
      router.push('/game')
    } else {
      setError('Identifiants incorrects')
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #1a0a00 0%, #3d1a00 50%, #1a0a00 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'Georgia, serif'
    }}>
      <div style={{
        background: 'rgba(255,255,255,0.05)',
        border: '2px solid #c8962a',
        borderRadius: '16px',
        padding: '48px',
        width: '360px',
        textAlign: 'center'
      }}>
        <h1 style={{ color: '#c8962a', fontSize: '28px', marginBottom: '8px' }}>
          🌍 Richesses du Monde
        </h1>
        <p style={{ color: '#888', marginBottom: '32px', fontSize: '14px' }}>
          Connectez-vous pour jouer
        </p>

        <input
          type="text"
          placeholder="Nom d'utilisateur"
          value={username}
          onChange={e => setUsername(e.target.value)}
          style={{
            width: '100%', padding: '12px', marginBottom: '12px',
            background: 'rgba(255,255,255,0.1)', border: '1px solid #555',
            borderRadius: '8px', color: 'white', fontSize: '16px',
            boxSizing: 'border-box'
          }}
        />
        <input
          type="password"
          placeholder="Mot de passe"
          value={password}
          onChange={e => setPassword(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleLogin()}
          style={{
            width: '100%', padding: '12px', marginBottom: '20px',
            background: 'rgba(255,255,255,0.1)', border: '1px solid #555',
            borderRadius: '8px', color: 'white', fontSize: '16px',
            boxSizing: 'border-box'
          }}
        />

        {error && <p style={{ color: '#ff6b6b', marginBottom: '16px' }}>{error}</p>}

        <button
          onClick={handleLogin}
          disabled={loading}
          style={{
            width: '100%', padding: '14px',
            background: loading ? '#555' : '#c8962a',
            border: 'none', borderRadius: '8px',
            color: 'white', fontSize: '18px',
            cursor: loading ? 'not-allowed' : 'pointer',
            fontFamily: 'Georgia, serif', fontWeight: 'bold'
          }}
        >
          {loading ? 'Connexion...' : 'Se connecter'}
        </button>
      </div>
    </div>
  )
}