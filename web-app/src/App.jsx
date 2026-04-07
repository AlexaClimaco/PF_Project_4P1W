import { useMemo, useState } from 'react'
import { Link, Navigate, Route, Routes, useNavigate } from 'react-router-dom'
import './App.css'
import { useAuth } from './auth/AuthContext.jsx'
import { AdminRoute, ProtectedRoute } from './components/RouteGuards.jsx'

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
  return (
    <AppShell title="Randomized Packs">
      <p>Iteration 2 will load real packs from GET /packs?random=true.</p>
    </AppShell>
  )
}

function PlayPage() {
  return (
    <AppShell title="Play">
      <p>Iteration 3 will show 4 images and submit guesses.</p>
    </AppShell>
  )
}

function ProfilePage() {
  return (
    <AppShell title="Profile Progress">
      <p>Iteration 3 will load solved count, attempts, and score.</p>
    </AppShell>
  )
}

function AdminPage({ title }) {
  return (
    <AppShell title={title}>
      <p>Admin CMS screen scaffolded. CRUD implementation starts in Iterations 4-5.</p>
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
