import { useEffect, useMemo, useState } from 'react'
import { Link, Navigate, Route, Routes, useNavigate, useParams } from 'react-router-dom'
import './App.css'
import { useAuth } from './auth/AuthContext.jsx'
import { AdminRoute, ProtectedRoute } from './components/RouteGuards.jsx'

const RESOURCE_API_BASE_URL = import.meta.env.VITE_RESOURCE_API_BASE_URL ?? 'http://localhost:5002'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/packs" replace />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      <Route element={<ProtectedRoute />}>
        <Route path="/packs" element={<PacksPage />} />
        <Route path="/play/:packId" element={<PlayPage />} />
        <Route path="/profile" element={<ProfilePage />} />

        <Route element={<AdminRoute />}>
          <Route path="/admin/images" element={<AdminPage title="Images CMS" />} />
          <Route path="/admin/tags" element={<AdminPage title="Tags CMS" />} />
          <Route path="/admin/puzzles" element={<AdminPage title="Puzzles CMS" />} />
          <Route path="/admin/packs" element={<AdminPage title="Packs CMS" />} />
        </Route>
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}

function AuthLayout({ title, children }) {
  return (
    <main className="page auth-page">
      <h1>{title}</h1>
      {children}
      <p className="muted">
        <Link to="/login">Login</Link> · <Link to="/register">Register</Link>
      </p>
    </main>
  )
}

function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    try {
      await login(email, password)
      navigate('/packs')
    } catch {
      setError('Invalid email or password.')
    }
  }

  return (
    <AuthLayout title="Login">
      <form className="card form" onSubmit={handleSubmit}>
        <label>
          Email
          <input
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            type="email"
            required
          />
        </label>
        <label>
          Password
          <input
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            type="password"
            required
          />
        </label>
        {error && <p className="error">{error}</p>}
        <button type="submit">Sign in</button>
      </form>
    </AuthLayout>
  )
}

function RegisterPage() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState('player')
  const [error, setError] = useState('')

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    try {
      await register(email, password, role)
      navigate('/login')
    } catch {
      setError('Registration failed.')
    }
  }

  return (
    <AuthLayout title="Register">
      <form className="card form" onSubmit={handleSubmit}>
        <label>
          Email
          <input
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            type="email"
            required
          />
        </label>
        <label>
          Password
          <input
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            type="password"
            required
          />
        </label>
        <label>
          Role
          <select value={role} onChange={(event) => setRole(event.target.value)}>
            <option value="player">player</option>
            <option value="admin">admin</option>
          </select>
        </label>
        {error && <p className="error">{error}</p>}
        <button type="submit">Create account</button>
      </form>
    </AuthLayout>
  )
}

function AppShell({ title, children }) {
  const { user, logout } = useAuth()
  const links = useMemo(
    () => [
      { to: '/packs', label: 'Packs' },
      { to: '/profile', label: 'Profile' },
      ...(user?.role === 'admin'
        ? [
            { to: '/admin/images', label: 'Admin Images' },
            { to: '/admin/tags', label: 'Admin Tags' },
            { to: '/admin/puzzles', label: 'Admin Puzzles' },
            { to: '/admin/packs', label: 'Admin Packs' },
          ]
        : []),
    ],
    [user?.role],
  )

  return (
    <main className="page">
      <header className="topbar">
        <div>
          <h1>{title}</h1>
          <p className="muted">
            {user?.email} ({user?.role})
          </p>
        </div>
        <button onClick={logout}>Logout</button>
      </header>
      <nav className="nav card">
        {links.map((item) => (
          <Link key={item.to} to={item.to}>
            {item.label}
          </Link>
        ))}
      </nav>
      <section className="card">{children}</section>
    </main>
  )
}

function PacksPage() {
  const { token } = useAuth()
  const [packs, setPacks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  async function loadPacks() {
    setLoading(true)
    setError('')
    try {
      const response = await fetch(`${RESOURCE_API_BASE_URL}/packs?random=true`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error('Failed to load packs.')
      }

      const data = await response.json()
      setPacks(data)
    } catch (err) {
      setError(err.message || 'Failed to load packs.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (token) {
      loadPacks()
    }
  }, [token])

  return (
    <AppShell title="Randomized Packs">
      {loading && <p>Loading packs...</p>}
      {error && <p className="error">{error}</p>}
      {!loading && !error && packs.length === 0 && <p>No packs available yet.</p>}
      <div className="grid">
        {packs.map((pack) => (
          <Link key={pack.id} to={`/play/${pack.id}`} className="card pack-card">
            <h2>{pack.name}</h2>
            <p className="muted">{pack.description}</p>
            <p>
              <strong>{pack.puzzleCount}</strong> puzzles
            </p>
          </Link>
        ))}
      </div>
      <div className="actions-row">
        <button type="button" onClick={loadPacks}>
          Shuffle packs
        </button>
      </div>
    </AppShell>
  )
}

function PlayPage() {
  const { token } = useAuth()
  const { packId } = useParams()
  const [puzzle, setPuzzle] = useState(null)
  const [status, setStatus] = useState(null)
  const [guess, setGuess] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  async function loadNextPuzzle() {
    setLoading(true)
    setError('')
    setStatus(null)
    try {
      const response = await fetch(`${RESOURCE_API_BASE_URL}/puzzles/next?packId=${packId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error('Failed to load next puzzle.')
      }

      const data = await response.json()
      if (data.completed) {
        setPuzzle(null)
        setStatus({
          message: 'You have completed this pack! You can restart after the cooldown window.',
          type: 'info',
        })
      } else {
        setPuzzle(data.puzzle)
      }
    } catch (err) {
      setError(err.message || 'Failed to load next puzzle.')
    } finally {
      setLoading(false)
      setGuess('')
    }
  }

  useEffect(() => {
    if (token && packId) {
      loadNextPuzzle()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, packId])

  async function handleSubmit(event) {
    event.preventDefault()
    if (!guess.trim() || !puzzle) return

    setSubmitting(true)
    setError('')
    try {
      const response = await fetch(`${RESOURCE_API_BASE_URL}/game/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          puzzleId: puzzle.id,
          guess,
          packId,
        }),
      })

      if (!response.ok) {
        if (response.status === 429) {
          throw new Error('Too many attempts. Please slow down a bit.')
        }

        const body = await response.json().catch(() => null)
        throw new Error(body?.message || 'Failed to submit guess.')
      }

      const result = await response.json()
      setStatus({
        type: result.correct ? 'success' : 'error',
        message: result.correct ? 'Correct! Nice work.' : 'Not quite. Try again!',
        scoreDelta: result.scoreDelta,
        nextAvailable: result.nextAvailable,
      })

      if (result.correct && result.nextAvailable) {
        await loadNextPuzzle()
      }
    } catch (err) {
      setError(err.message || 'Failed to submit guess.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AppShell title="Play">
      {loading && <p>Loading puzzle...</p>}
      {error && <p className="error">{error}</p>}
      {status && <p className={status.type === 'success' ? 'success' : status.type === 'error' ? 'error' : 'muted'}>{status.message}</p>}

      {!loading && !error && !puzzle && !status && (
        <p className="muted">No puzzle available yet. Try again in a moment.</p>
      )}

      {puzzle && (
        <>
          <p className="muted">
            Pack: <strong>{puzzle.packName}</strong> · Difficulty: <strong>{puzzle.difficulty}</strong>
          </p>
          <div className="grid images-grid">
            {puzzle.images.map((url, index) => (
              <figure key={url + index} className="card image-card">
                <img src={url} alt={`Puzzle hint ${index + 1}`} />
              </figure>
            ))}
          </div>
          {puzzle.hint && <p className="muted">Hint: {puzzle.hint}</p>}

          <form className="form" onSubmit={handleSubmit}>
            <label>
              Your guess
              <input
                value={guess}
                onChange={(event) => setGuess(event.target.value)}
                placeholder="Type the one-word answer"
                required
              />
            </label>
            <div className="actions-row">
              <button type="submit" disabled={submitting || !guess.trim()}>
                {submitting ? 'Checking...' : 'Submit guess'}
              </button>
              <button type="button" onClick={loadNextPuzzle} disabled={submitting}>
                Skip / Next puzzle
              </button>
            </div>
          </form>
        </>
      )}
    </AppShell>
  )
}

function ProfilePage() {
  const { token } = useAuth()
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function loadProfile() {
      if (!token) return
      setLoading(true)
      setError('')
      try {
        const response = await fetch(`${RESOURCE_API_BASE_URL}/profile/progress`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (!response.ok) {
          throw new Error('Failed to load profile.')
        }

        const data = await response.json()
        setSummary(data)
      } catch (err) {
        setError(err.message || 'Failed to load profile.')
      } finally {
        setLoading(false)
      }
    }

    loadProfile()
  }, [token])

  return (
    <AppShell title="Profile Progress">
      {loading && <p>Loading profile...</p>}
      {error && <p className="error">{error}</p>}
      {!loading && !error && summary && (
        <>
          <div className="stats-row">
            <div className="stat card">
              <p className="stat-label">Solved</p>
              <p className="stat-value">{summary.solved}</p>
            </div>
            <div className="stat card">
              <p className="stat-label">Attempts</p>
              <p className="stat-value">{summary.attempts}</p>
            </div>
            <div className="stat card">
              <p className="stat-label">Score</p>
              <p className="stat-value">{summary.score}</p>
            </div>
          </div>

          <h2>Recent attempts</h2>
          {summary.recent?.length === 0 && <p className="muted">No attempts yet. Go play a pack!</p>}
          {summary.recent?.length > 0 && (
            <ul className="recent-list">
              {summary.recent.map((item) => (
                <li key={`${item.puzzleId}-${item.attemptedAtUtc}`} className="card recent-item">
                  <p>
                    <strong>{item.answer}</strong> — {item.correct ? 'correct' : 'incorrect'}
                  </p>
                  <p className="muted">
                    {new Date(item.attemptedAtUtc).toLocaleString(undefined, {
                      dateStyle: 'short',
                      timeStyle: 'short',
                    })}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </AppShell>
  )
}

function AdminPage({ title }) {
  return (
    <AppShell title={title}>
      <p className="muted">
        Choose one of the Admin pages from the navigation to manage images, tags, puzzles, and packs.
      </p>
    </AppShell>
  )
}

function NotFoundPage() {
  return (
    <main className="page">
      <h1>404</h1>
      <p>
        Page not found. Go to <Link to="/packs">/packs</Link>.
      </p>
    </main>
  )
}
export default App
