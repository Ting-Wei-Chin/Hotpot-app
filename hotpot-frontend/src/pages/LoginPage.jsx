import { useState } from 'react'

const STAFF_PASSWORD = 'hotpot2024'

function LoginPage({ onLogin }) {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    if (password === STAFF_PASSWORD) {
      onLogin()
    } else {
      setError('密碼錯誤，請重試')
      setPassword('')
    }
  }

  return (
    <div style={styles.wrapper}>
      <div style={styles.card}>
        <div style={styles.logo}>🍲</div>
        <h1 style={styles.title}>光明石頭火鍋</h1>
        <p style={styles.subtitle}>員工專用系統</p>
        <form onSubmit={handleSubmit}>
          <input
            type="password"
            value={password}
            onChange={e => { setPassword(e.target.value); setError('') }}
            placeholder="輸入員工密碼"
            style={styles.input}
            autoFocus
          />
          {error && <p style={styles.error}>{error}</p>}
          <button type="submit" style={styles.btn}>進入系統</button>
        </form>
      </div>
    </div>
  )
}

const styles = {
  wrapper: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f5f5f5',
  },
  card: {
    backgroundColor: 'white',
    borderRadius: '16px',
    padding: '48px 40px',
    textAlign: 'center',
    boxShadow: '0 4px 24px rgba(0,0,0,0.1)',
    width: '320px',
  },
  logo: { fontSize: '56px', marginBottom: '12px' },
  title: { fontSize: '22px', fontWeight: 'bold', color: '#c62828', margin: '0 0 6px' },
  subtitle: { color: '#888', fontSize: '14px', marginBottom: '28px' },
  input: {
    width: '100%',
    padding: '12px 16px',
    fontSize: '16px',
    borderRadius: '8px',
    border: '1px solid #ddd',
    boxSizing: 'border-box',
    marginBottom: '12px',
    outline: 'none',
  },
  error: { color: '#e53935', fontSize: '13px', marginBottom: '8px' },
  btn: {
    width: '100%',
    padding: '12px',
    backgroundColor: '#e53935',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: 'bold',
    cursor: 'pointer',
  },
}

export default LoginPage
