import { createContext, useContext, useEffect, useMemo, useState } from 'react'

const TOKEN_KEY = 'pf4p1w.token'
const API_BASE_URL = import.meta.env.VITE_AUTH_API_BASE_URL ?? 'http://localhost:5001'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY))
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function hydrateUser() {
      if (!token) {
        setUser(null)
        setLoading(false)
        return
      }

      try {
        const response = await fetch(`${API_BASE_URL}/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
        })

        if (!response.ok) {
          throw new Error('Session expired')
        }

        const data = await response.json()
        setUser(data)
      } catch {
        localStorage.removeItem(TOKEN_KEY)
        setToken(null)
        setUser(null)
      } finally {
        setLoading(false)
      }
    }

    hydrateUser()
  }, [token])

  async function login(email, password) {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })

    if (!response.ok) {
      throw new Error('Login failed')
    }

    const data = await response.json()
    localStorage.setItem(TOKEN_KEY, data.token)
    setToken(data.token)
    setUser(data.user)
  }

  async function register(email, password, role = 'player') {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, role }),
    })

    if (!response.ok) {
      throw new Error('Registration failed')
    }
  }

  function logout() {
    localStorage.removeItem(TOKEN_KEY)
    setToken(null)
    setUser(null)
  }

  const value = useMemo(
    () => ({
      token,
      user,
      loading,
      isAuthenticated: Boolean(token && user),
      login,
      register,
      logout,
    }),
    [token, user, loading],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider')
  }
  return context
}
