"use client"

import { useState, useEffect } from "react"
import dynamic from "next/dynamic"

const SendbirdChat = dynamic(() => import("./sendbird-chat"), {
    ssr: false,
    loading: () => <div>Loading...</div>,
})

export default function SendbirdWrapper() {
    const [isMounted, setIsMounted] = useState(false)

    useEffect(() => {
        setIsMounted(true)
    }, [])

    if (!isMounted) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="text-lg">Loading chat...</div>
            </div>
        )
    }

    return <SendbirdChat />
}
