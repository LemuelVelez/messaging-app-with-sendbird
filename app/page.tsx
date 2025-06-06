"use client"

import { App as SendbirdApp } from "@sendbird/uikit-react"
import "@sendbird/uikit-react/dist/index.css"
import { useTheme } from "next-themes"
import { useEffect, useState } from "react"

export default function Page() {
  const [mounted, setMounted] = useState(false)
  const { resolvedTheme } = useTheme()

  const appId = process.env.NEXT_PUBLIC_SENDBIRD_APP_ID || ""
  const userId = process.env.NEXT_PUBLIC_SENDBIRD_USER_ID || ""
  const accessToken = process.env.NEXT_PUBLIC_SENDBIRD_ACCESS_TOKEN || ""

  useEffect(() => {
    setMounted(true)
  }, [])

  // Create user in database when component mounts
  useEffect(() => {
    const createUserInDatabase = async () => {
      try {
        await fetch("/api/users", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            user_id: userId,
            nickname: userId,
            profile_url: "",
          }),
        })
        console.log("User created/updated in database")
      } catch (error) {
        console.error("Error creating user in database:", error)
      }
    }

    if (mounted && userId) {
      createUserInDatabase()
    }
  }, [userId, mounted])

  return (
    <div className="relative w-full h-screen overflow-hidden">

      {/* SendBird App */}
      <div className="w-full h-full">
        <SendbirdApp
          appId={appId}
          userId={userId}
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
