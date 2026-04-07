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
          <Route path="/admin/images" element={<AdminImagesPage />} />
          <Route path="/admin/tags" element={<AdminTagsPage />} />
          <Route path="/admin/puzzles" element={<AdminPuzzlesPage />} />
          <Route path="/admin/packs" element={<AdminPacksPage />} />
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

function AdminImagesPage() {
  const { token } = useAuth()
  const [images, setImages] = useState([])
  const [url, setUrl] = useState('')
  const [fileName, setFileName] = useState('')
  const [tagFilter, setTagFilter] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  async function loadImages() {
    setLoading(true)
    setError('')
    try {
      const params = new URLSearchParams()
      if (tagFilter) {
        params.set('tag', tagFilter)
      }

      const response = await fetch(`${RESOURCE_API_BASE_URL}/cms/images?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!response.ok) {
        throw new Error('Failed to load images.')
      }
      const data = await response.json()
      setImages(data)
    } catch (err) {
      setError(err.message || 'Failed to load images.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (token) {
      loadImages()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token])

  async function handleCreate(event) {
    event.preventDefault()
    setError('')
    try {
      const response = await fetch(`${RESOURCE_API_BASE_URL}/cms/images`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          url: url || null,
          fileName: fileName || null,
        }),
      })
      if (!response.ok) {
        const body = await response.json().catch(() => null)
        throw new Error(body?.message || 'Failed to create image.')
      }
      setUrl('')
      setFileName('')
      await loadImages()
    } catch (err) {
      setError(err.message || 'Failed to create image.')
    }
  }

  async function handleDelete(id) {
    if (!window.confirm('Delete this image? It will be removed from any puzzles.')) {
      return
    }
    setError('')
    try {
      const response = await fetch(`${RESOURCE_API_BASE_URL}/cms/images/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!response.ok && response.status !== 404) {
        throw new Error('Failed to delete image.')
      }
      await loadImages()
    } catch (err) {
      setError(err.message || 'Failed to delete image.')
    }
  }

  return (
    <AppShell title="Images CMS">
      <form className="form" onSubmit={handleCreate}>
        <label>
          Image URL
          <input
            value={url}
            onChange={(event) => setUrl(event.target.value)}
            placeholder="https://..."
          />
        </label>
        <label>
          File name (for uploads)
          <input
            value={fileName}
            onChange={(event) => setFileName(event.target.value)}
            placeholder="dog.png"
          />
        </label>
        <p className="muted">
          Provide either a URL, or a file name (for future file uploads). Supported types: .png, .jpg, .jpeg,
          .webp.
        </p>
        <button type="submit">Create image entry</button>
      </form>

      <div className="actions-row">
        <label>
          Filter by tag
          <input
            value={tagFilter}
            onChange={(event) => setTagFilter(event.target.value)}
            placeholder="animal"
          />
        </label>
        <button type="button" onClick={loadImages}>
          Apply filter
        </button>
      </div>

      {loading && <p>Loading images...</p>}
      {error && <p className="error">{error}</p>}

      {!loading && images.length === 0 && <p className="muted">No images yet.</p>}

      <div className="grid images-grid">
        {images.map((image) => (
          <article key={image.id} className="card image-card">
            <div>
              <p className="muted">{image.fileName || 'no file name'}</p>
              <p className="muted" style={{ wordBreak: 'break-all' }}>
                {image.url}
              </p>
            </div>
            <div className="actions-row">
              <button type="button" onClick={() => handleDelete(image.id)}>
                Delete
              </button>
            </div>
          </article>
        ))}
      </div>
    </AppShell>
  )
}

function AdminTagsPage() {
  const { token } = useAuth()
  const [tags, setTags] = useState([])
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  async function loadTags() {
    setLoading(true)
    setError('')
    try {
      const response = await fetch(`${RESOURCE_API_BASE_URL}/cms/tags`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!response.ok) {
        throw new Error('Failed to load tags.')
      }
      const data = await response.json()
      setTags(data)
    } catch (err) {
      setError(err.message || 'Failed to load tags.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (token) {
      loadTags()
    }
  }, [token])

  async function handleCreate(event) {
    event.preventDefault()
    setError('')
    try {
      const response = await fetch(`${RESOURCE_API_BASE_URL}/cms/tags`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name }),
      })
      if (!response.ok) {
        const body = await response.json().catch(() => null)
        throw new Error(body?.message || 'Failed to create tag.')
      }
      setName('')
      await loadTags()
    } catch (err) {
      setError(err.message || 'Failed to create tag.')
    }
  }

  async function handleDelete(tagName) {
    if (!window.confirm(`Delete tag "${tagName}"? It will be removed from images.`)) {
      return
    }
    setError('')
    try {
      const response = await fetch(`${RESOURCE_API_BASE_URL}/cms/tags/${encodeURIComponent(tagName)}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!response.ok && response.status !== 404) {
        throw new Error('Failed to delete tag.')
      }
      await loadTags()
    } catch (err) {
      setError(err.message || 'Failed to delete tag.')
    }
  }

  return (
    <AppShell title="Tags CMS">
      <form className="form" onSubmit={handleCreate}>
        <label>
          Tag name
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="animal"
            required
          />
        </label>
        <button type="submit">Create tag</button>
      </form>

      {loading && <p>Loading tags...</p>}
      {error && <p className="error">{error}</p>}

      {!loading && tags.length === 0 && <p className="muted">No tags yet.</p>}

      {tags.length > 0 && (
        <ul className="recent-list">
          {tags.map((tag) => (
            <li key={tag.name} className="card recent-item">
              <span>{tag.name}</span>
              <button type="button" onClick={() => handleDelete(tag.name)}>
                Delete
              </button>
            </li>
          ))}
        </ul>
      )}
    </AppShell>
  )
}

function AdminPuzzlesPage() {
  const { token } = useAuth()
  const [puzzles, setPuzzles] = useState([])
  const [images, setImages] = useState([])
  const [answer, setAnswer] = useState('')
  const [hint, setHint] = useState('')
  const [difficulty, setDifficulty] = useState('easy')
  const [selectedImageIds, setSelectedImageIds] = useState([])
  const [tagFilter, setTagFilter] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  async function loadData() {
    setLoading(true)
    setError('')
    try {
      const [puzzlesResponse, imagesResponse] = await Promise.all([
        fetch(`${RESOURCE_API_BASE_URL}/cms/puzzles`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${RESOURCE_API_BASE_URL}/cms/images`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ])
      if (!puzzlesResponse.ok || !imagesResponse.ok) {
        throw new Error('Failed to load puzzles or images.')
      }
      setPuzzles(await puzzlesResponse.json())
      setImages(await imagesResponse.json())
    } catch (err) {
      setError(err.message || 'Failed to load puzzles.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (token) {
      loadData()
    }
  }, [token])

  function toggleImageSelection(id) {
    setSelectedImageIds((prev) =>
      prev.includes(id) ? prev.filter((value) => value !== id) : [...prev, id],
    )
  }

  async function handleCreate(event) {
    event.preventDefault()
    setError('')
    try {
      const response = await fetch(`${RESOURCE_API_BASE_URL}/cms/puzzles`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          answer,
          hint: hint || null,
          difficulty,
          imageIds: selectedImageIds,
          acceptableVariants: [],
        }),
      })
      if (!response.ok) {
        const body = await response.json().catch(() => null)
        throw new Error(body?.message || 'Failed to create puzzle.')
      }
      setAnswer('')
      setHint('')
      setDifficulty('easy')
      setSelectedImageIds([])
      await loadData()
    } catch (err) {
      setError(err.message || 'Failed to create puzzle.')
    }
  }

  async function handleDelete(id) {
    if (!window.confirm('Delete this puzzle?')) {
      return
    }
    setError('')
    try {
      const response = await fetch(`${RESOURCE_API_BASE_URL}/cms/puzzles/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!response.ok && response.status !== 404) {
        throw new Error('Failed to delete puzzle.')
      }
      await loadData()
    } catch (err) {
      setError(err.message || 'Failed to delete puzzle.')
    }
  }

  const filteredImages = images.filter((image) =>
    tagFilter ? image.tags?.some((tag) => tag.toLowerCase().includes(tagFilter.toLowerCase())) : true,
  )

  return (
    <AppShell title="Puzzles CMS">
      <form className="form" onSubmit={handleCreate}>
        <label>
          Answer word
          <input
            value={answer}
            onChange={(event) => setAnswer(event.target.value)}
            placeholder="ANIMAL"
            required
          />
        </label>
        <label>
          Hint (optional)
          <input
            value={hint}
            onChange={(event) => setHint(event.target.value)}
            placeholder="Living creature"
          />
        </label>
        <label>
          Difficulty
          <select value={difficulty} onChange={(event) => setDifficulty(event.target.value)}>
            <option value="easy">easy</option>
            <option value="medium">medium</option>
            <option value="hard">hard</option>
          </select>
        </label>
        <label>
          Filter images by tag
          <input
            value={tagFilter}
            onChange={(event) => setTagFilter(event.target.value)}
            placeholder="animal"
          />
        </label>
        <p className="muted">
          Select exactly 4 images below. Validation on the server requires 4 unique image IDs.
        </p>
        <div className="grid images-grid">
          {filteredImages.map((image) => (
            <button
              key={image.id}
              type="button"
              className="card image-card"
              onClick={() => toggleImageSelection(image.id)}
              style={{
                outline: selectedImageIds.includes(image.id) ? '2px solid #1976d2' : 'none',
              }}
            >
              <p className="muted">{image.fileName}</p>
              <p className="muted" style={{ wordBreak: 'break-all' }}>
                {image.url}
              </p>
              {image.tags && image.tags.length > 0 && (
                <p className="muted">
                  {image.tags.map((tag) => (
                    <span key={tag} className="pill">
                      {tag}
                    </span>
                  ))}
                </p>
              )}
            </button>
          ))}
        </div>
        <button type="submit" disabled={selectedImageIds.length !== 4}>
          Create puzzle
        </button>
      </form>

      {loading && <p>Loading puzzles...</p>}
      {error && <p className="error">{error}</p>}

      {!loading && puzzles.length === 0 && <p className="muted">No puzzles yet.</p>}

      {puzzles.length > 0 && (
        <table className="table-like">
          <thead>
            <tr>
              <th>Answer</th>
              <th>Difficulty</th>
              <th>Images</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {puzzles.map((puzzle) => (
              <tr key={puzzle.id}>
                <td>{puzzle.answer}</td>
                <td>{puzzle.difficulty}</td>
                <td>{puzzle.imageIds.length}</td>
                <td>
                  <button type="button" onClick={() => handleDelete(puzzle.id)}>
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </AppShell>
  )
}

function AdminPacksPage() {
  const { token } = useAuth()
  const [packs, setPacks] = useState([])
  const [puzzles, setPuzzles] = useState([])
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [order, setOrder] = useState('')
  const [isVisible, setIsVisible] = useState(true)
  const [selectedPuzzleIds, setSelectedPuzzleIds] = useState([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  async function loadData() {
    setLoading(true)
    setError('')
    try {
      const [packsResponse, puzzlesResponse] = await Promise.all([
        fetch(`${RESOURCE_API_BASE_URL}/cms/packs`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${RESOURCE_API_BASE_URL}/cms/puzzles`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ])
      if (!packsResponse.ok || !puzzlesResponse.ok) {
        throw new Error('Failed to load packs or puzzles.')
      }
      setPacks(await packsResponse.json())
      setPuzzles(await puzzlesResponse.json())
    } catch (err) {
      setError(err.message || 'Failed to load packs.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (token) {
      loadData()
    }
  }, [token])

  function togglePuzzleSelection(id) {
    setSelectedPuzzleIds((prev) =>
      prev.includes(id) ? prev.filter((value) => value !== id) : [...prev, id],
    )
  }

  async function handleCreate(event) {
    event.preventDefault()
    setError('')
    try {
      const response = await fetch(`${RESOURCE_API_BASE_URL}/cms/packs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name,
          description,
          isVisible,
          order: order ? Number(order) : null,
          puzzleIds: selectedPuzzleIds,
        }),
      })
      if (!response.ok) {
        const body = await response.json().catch(() => null)
        throw new Error(body?.message || 'Failed to create pack.')
      }
      setName('')
      setDescription('')
      setOrder('')
      setIsVisible(true)
      setSelectedPuzzleIds([])
      await loadData()
    } catch (err) {
      setError(err.message || 'Failed to create pack.')
    }
  }

  async function handlePublish(packId, published) {
    setError('')
    try {
      const response = await fetch(`${RESOURCE_API_BASE_URL}/cms/packs/${packId}/publish`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ published }),
      })
      if (!response.ok) {
        const body = await response.json().catch(() => null)
        throw new Error(body?.message || 'Failed to change publish status.')
      }
      await loadData()
    } catch (err) {
      setError(err.message || 'Failed to change publish status.')
    }
  }

  async function handleDelete(id) {
    if (!window.confirm('Delete this pack?')) {
      return
    }
    setError('')
    try {
      const response = await fetch(`${RESOURCE_API_BASE_URL}/cms/packs/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!response.ok && response.status !== 404) {
        throw new Error('Failed to delete pack.')
      }
      await loadData()
    } catch (err) {
      setError(err.message || 'Failed to delete pack.')
    }
  }

  return (
    <AppShell title="Packs CMS">
      <form className="form" onSubmit={handleCreate}>
        <label>
          Name
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Starter Pack"
            required
          />
        </label>
        <label>
          Description
          <input
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Short description"
          />
        </label>
        <label>
          Display order (optional)
          <input
            type="number"
            value={order}
            onChange={(event) => setOrder(event.target.value)}
            placeholder="1"
          />
        </label>
        <label>
          Visible
          <input
            type="checkbox"
            checked={isVisible}
            onChange={(event) => setIsVisible(event.target.checked)}
          />
        </label>
        <p className="muted">Select puzzles for this pack:</p>
        <div className="grid">
          {puzzles.map((puzzle) => (
            <button
              key={puzzle.id}
              type="button"
              className="card"
              onClick={() => togglePuzzleSelection(puzzle.id)}
              style={{
                outline: selectedPuzzleIds.includes(puzzle.id) ? '2px solid #1976d2' : 'none',
              }}
            >
              <strong>{puzzle.answer}</strong> <span className="muted">({puzzle.difficulty})</span>
            </button>
          ))}
        </div>
        <button type="submit">Create pack</button>
      </form>

      {loading && <p>Loading packs...</p>}
      {error && <p className="error">{error}</p>}

      {!loading && packs.length === 0 && <p className="muted">No packs yet.</p>}

      {packs.length > 0 && (
        <table className="table-like">
          <thead>
            <tr>
              <th>Name</th>
              <th>Order</th>
              <th>Visible</th>
              <th>Published</th>
              <th>Puzzles</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {packs.map((pack) => (
              <tr key={pack.id}>
                <td>{pack.name}</td>
                <td>{pack.order}</td>
                <td>{pack.isVisible ? 'yes' : 'no'}</td>
                <td>{pack.published ? 'published' : 'draft'}</td>
                <td>{pack.puzzleIds.length}</td>
                <td>
                  <button type="button" onClick={() => handlePublish(pack.id, !pack.published)}>
                    {pack.published ? 'Unpublish' : 'Publish'}
                  </button>{' '}
                  <button type="button" onClick={() => handleDelete(pack.id)}>
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
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
