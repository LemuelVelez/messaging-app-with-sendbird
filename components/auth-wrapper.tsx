"use client"

import type React from "react"

import { useState, useEffect, createContext, useContext } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"

interface AuthContextType {
  user: { id: string; nickname: string } | null
  login: (userId: string, nickname: string) => void
  logout: () => void
}

const AuthContext = createContext<AuthContextType | null>(null)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider")
  }
  return context
}

interface AuthProviderProps {
  children: React.ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<{ id: string; nickname: string } | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Check for stored user session
    const storedUser = localStorage.getItem("chat-user")
    if (storedUser) {
      setUser(JSON.parse(storedUser))
    }
    setIsLoading(false)
  }, [])

  const login = (userId: string, nickname: string) => {
    const userData = { id: userId, nickname }
    setUser(userData)
    localStorage.setItem("chat-user", JSON.stringify(userData))
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem("chat-user")
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="loading-animation">
          <div></div>
          <div></div>
          <div></div>
        </div>
      </div>
    )
  }

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {user ? children : <LoginForm onLogin={login} />}
    </AuthContext.Provider>
  )
}

interface LoginFormProps {
  onLogin: (userId: string, nickname: string) => void
}

function LoginForm({ onLogin }: LoginFormProps) {
  const [userId, setUserId] = useState("")
  const [nickname, setNickname] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!userId.trim() || !nickname.trim()) {
      alert("Please fill in all fields")
      return
    }

    setIsLoading(true)

    try {
      // Create user in database
      await fetch("/api/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user_id: userId,
          nickname: nickname,
          profile_url: "",
        }),
      })

      onLogin(userId, nickname)
    } catch (error) {
      console.error("Error creating user:", error)
      alert("Failed to create user")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center">Welcome to Chat</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="userId">User ID</Label>
              <Input
                id="userId"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                placeholder="Enter your user ID"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="nickname">Nickname</Label>
              <Input
                id="nickname"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="Enter your nickname"
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Signing In..." : "Sign In"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
