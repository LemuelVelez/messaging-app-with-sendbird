"use client"

import { useState, useEffect } from "react"
import dynamic from "next/dynamic"
import { ThemeToggle } from "./theme-toggle"

const SendbirdChat = dynamic(() => import("./sendbird-chat"), {
  ssr: false,
  loading: () => (
    <div className="flex flex-col items-center justify-center h-screen bg-background">
      <div className="mb-4 text-lg font-medium text-foreground">Loading chat...</div>
      <div className="loading-animation">
        <div></div>
        <div></div>
        <div></div>
      </div>
    </div>
  ),
})

export default function SendbirdWrapper() {
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  if (!isMounted) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-background">
        <div className="mb-4 text-lg font-medium text-foreground">Loading chat...</div>
        <div className="loading-animation">
          <div></div>
          <div></div>
          <div></div>
        </div>
      </div>
    )
  }

  return (
    <div className="relative">
      <div className="absolute top-4 right-4 z-50">
        <ThemeToggle />
      </div>
      <SendbirdChat />
    </div>
  )
}
