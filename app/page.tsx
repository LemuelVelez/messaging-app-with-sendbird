"use client"

import { App as SendbirdApp } from "@sendbird/uikit-react"
import "@sendbird/uikit-react/dist/index.css"
import { useTheme } from "next-themes"
import { useEffect, useState } from "react"
import { AuthProvider, useAuth } from "@/components/auth-wrapper"

function ChatApp() {
  const [mounted, setMounted] = useState(false)
  const { resolvedTheme } = useTheme()
  const { user } = useAuth()

  const appId = process.env.NEXT_PUBLIC_SENDBIRD_APP_ID || ""
  const accessToken = process.env.NEXT_PUBLIC_SENDBIRD_ACCESS_TOKEN || ""

  useEffect(() => {
    setMounted(true)
  }, [])

  // Create user in database when component mounts
  useEffect(() => {
    const createUserInDatabase = async () => {
      if (!user) return

      try {
        await fetch("/api/users", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            user_id: user.id,
            nickname: user.nickname,
            profile_url: "",
          }),
        })
        console.log("User created/updated in database")
      } catch (error) {
        console.error("Error creating user in database:", error)
      }
    }

    if (mounted && user) {
      createUserInDatabase()
    }
  }, [user, mounted])

  if (!mounted || !user) {
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
    <div className="relative w-full h-screen overflow-hidden">
      {/* SendBird App */}
      <div className="w-full h-full">
        <SendbirdApp
          appId={appId}
          userId={user.id}
          accessToken={accessToken}
          theme={resolvedTheme === "dark" ? "dark" : "light"}
          showSearchIcon={true}
          allowProfileEdit={true}
          config={{
            logLevel: "debug",
            userMention: {
              maxMentionCount: 10,
              maxSuggestionCount: 15,
            },
          }}
        />
      </div>
    </div>
  )
}

export default function Page() {
  return (
    <AuthProvider>
      <ChatApp />
    </AuthProvider>
  )
}
