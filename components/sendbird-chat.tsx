/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import { useState, useEffect, useCallback } from "react"
import { SendBirdProvider } from "@sendbird/uikit-react"
import { GroupChannelList } from "@sendbird/uikit-react/GroupChannelList"
import { GroupChannel } from "@sendbird/uikit-react/GroupChannel"
import ChannelSettings from "@sendbird/uikit-react/ChannelSettings"
import "@sendbird/uikit-react/dist/index.css"
import ProfileEditModal from "./profile-edit-modal"
import CustomHeader from "./custom-header"
import type { User } from "@sendbird/chat"

export default function SendbirdChat() {
    const [showProfileModal, setShowProfileModal] = useState(false)
    const [currentUser, setCurrentUser] = useState<User | null>(null)
    const [currentChannel, setCurrentChannel] = useState<string | null>(null)
    const [showSettings, setShowSettings] = useState(false)
    const [isConnected, setIsConnected] = useState(false)
    const [showCreateChannel, setShowCreateChannel] = useState(false)
    const [isLoading, setIsLoading] = useState(false)

    const appId = process.env.NEXT_PUBLIC_SENDBIRD_APP_ID || "295F96EE-5F91-4352-BF0E-DE1823C8A496"
    const userId = process.env.NEXT_PUBLIC_SENDBIRD_USER_ID || "John Doe"
    const accessToken = process.env.NEXT_PUBLIC_SENDBIRD_ACCESS_TOKEN || "4a5acb402901976e94f1835c930198e210c9cb4f"

    // Create user in database when component mounts
    useEffect(() => {
        const createUserInDatabase = async () => {
            if (!isConnected) return

            setIsLoading(true)
            try {
                const response = await fetch("/api/users", {
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

                if (!response.ok) {
                    throw new Error("Failed to create user in database")
                }

                console.log("User created/updated in database")
            } catch (error) {
                console.error("Error creating user in database:", error)
            } finally {
                setIsLoading(false)
            }
        }

        if (isConnected) {
            createUserInDatabase()
        }
    }, [userId, isConnected])

    const handleProfileClick = useCallback(() => {
        setShowProfileModal(true)
    }, [])

    const handleProfileUpdate = useCallback(
        async (nickname: string, profileUrl: string) => {
            setIsLoading(true)
            try {
                // Update in database first
                const response = await fetch(`/api/users/${encodeURIComponent(userId)}`, {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        nickname,
                        profile_url: profileUrl,
                    }),
                })

                if (!response.ok) {
                    throw new Error("Failed to update user in database")
                }

                // Update SendBird user profile
                if (currentUser) {
                    try {
                        // Access SendBird SDK to update user profile
                        const { default: SendBird } = await import("@sendbird/chat")
                        const sb = SendBird.instance

                        if (sb) {
                            await sb.updateCurrentUserInfo({
                                nickname,
                                profileUrl,
                            })
                            console.log("SendBird profile updated successfully")
                        }
                    } catch (sbError) {
                        console.error("Error updating SendBird profile:", sbError)
                    }
                }

                setShowProfileModal(false)
                // Force a page refresh to see the updated profile
                window.location.reload()
            } catch (error) {
                console.error("Error updating user profile:", error)
                alert("Failed to update profile. Please try again.")
            } finally {
                setIsLoading(false)
            }
        },
        [userId, currentUser],
    )

    // Enhanced channel select handler with better error handling
    const handleChannelSelect = useCallback((channel: any) => {
        console.log("Channel select called with:", channel)

        // Handle null/undefined channel (common during initialization)
        if (!channel) {
            console.log("Channel is null/undefined - likely initialization call")
            setCurrentChannel(null)
            return
        }

        // Validate channel object structure
        if (typeof channel !== "object") {
            console.warn("Invalid channel type:", typeof channel)
            return
        }

        // Check if channel has required properties
        if (!channel.url) {
            console.warn("Channel missing URL property:", channel)
            return
        }

        console.log("Setting current channel to:", channel.url)
        setCurrentChannel(channel.url)
        setShowCreateChannel(false)
    }, [])

    const handleChannelCreated = useCallback(
        async (channel: any) => {
            console.log("Channel created:", channel)

            if (!channel || !channel.url) {
                console.error("Invalid channel created:", channel)
                return
            }

            setIsLoading(true)
            // Save channel to database with proper error handling
            try {
                // Safely extract chatmate ID with null checks
                let chatmateId = null
                if (channel.members && Array.isArray(channel.members)) {
                    const chatmate = channel.members.find((member: any) => member?.userId && member.userId !== userId)
                    chatmateId = chatmate?.userId || null
                }

                const response = await fetch("/api/channels", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        channel_url: channel.url,
                        created_by: userId,
                        chatmate_id: chatmateId,
                        message_count: 0,
                    }),
                })

                if (response.ok) {
                    console.log("Channel saved to database successfully")
                } else {
                    const errorData = await response.json()
                    console.error("Failed to save channel to database:", errorData)
                }
            } catch (error) {
                console.error("Error saving channel to database:", error)
            } finally {
                setIsLoading(false)
            }
        },
        [userId],
    )

    // Enhanced message tracking through Sendbird events with better error handling
    const handleSendbirdEvents = useCallback(() => {
        return {
            onMessageReceived: async (channel: any, message: any) => {
                console.log("Message received:", { channel: channel?.url, message })

                // Validate inputs
                if (!channel?.url || !message) {
                    console.warn("Invalid message received event data")
                    return
                }

                try {
                    // Update message count in database using the fixed route
                    const countResponse = await fetch(`/api/channels/${encodeURIComponent(channel.url)}/increment-message`, {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                        },
                    })

                    if (!countResponse.ok) {
                        console.warn("Failed to update message count")
                    }

                    // Track message event
                    const eventResponse = await fetch("/api/message-events", {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify({
                            channel_url: channel.url,
                            user_id: message.sender?.userId || userId,
                            message_type: message.messageType || "user",
                        }),
                    })

                    if (!eventResponse.ok) {
                        console.warn("Failed to track message event")
                    }
                } catch (error) {
                    console.error("Error tracking received message:", error)
                }
            },
            onMessageUpdated: async (channel: any, message: any) => {
                console.log("Message updated:", { channel: channel?.url, message })
                // Track message updates if needed
            },
            onChannelDeleted: async (channelUrl: string) => {
                console.log("Channel deleted:", channelUrl)

                // Clear current channel if it's the one being deleted
                if (currentChannel === channelUrl) {
                    setCurrentChannel(null)
                    setShowSettings(false)
                }

                // Mark channel as deleted in database
                try {
                    await fetch(`/api/channels/${encodeURIComponent(channelUrl)}`, {
                        method: "DELETE",
                    })
                } catch (error) {
                    console.error("Error marking channel as deleted:", error)
                }
            },
            onUserLeft: async (channel: any, user: any) => {
                console.log("User left channel:", { channel: channel?.url, user })

                // If current user left, clear the channel
                if (user?.userId === userId && currentChannel === channel?.url) {
                    setCurrentChannel(null)
                    setShowSettings(false)
                }
            },
        }
    }, [userId, currentChannel])

    const handleCreateChannelClick = useCallback(() => {
        setShowCreateChannel(true)
        setCurrentChannel(null)
        setShowSettings(false)
    }, [])

    const renderHeader = useCallback(() => {
        return (
            <CustomHeader
                title="Conversations"
                onProfileClick={handleProfileClick}
                onCreateChannelClick={handleCreateChannelClick}
            />
        )
    }, [handleProfileClick, handleCreateChannelClick])

    // Enhanced connection event handlers
    const connectionHandlers = {
        onConnected: (user: User) => {
            console.log("User connected:", user)
            setCurrentUser(user)
            setIsConnected(true)
        },
        onDisconnected: () => {
            console.log("User disconnected")
            setIsConnected(false)
            setCurrentChannel(null) // Clear channel on disconnect
        },
        onReconnectStarted: () => {
            console.log("Reconnection started")
        },
        onReconnectSucceeded: () => {
            console.log("Reconnection succeeded")
            setIsConnected(true)
        },
        onReconnectFailed: () => {
            console.log("Reconnection failed")
            setIsConnected(false)
            setCurrentChannel(null) // Clear channel on failed reconnect
        },
    }

    return (
        <>
            <div className="w-full h-screen flex bg-background">
                <SendBirdProvider
                    appId={appId}
                    userId={userId}
                    accessToken={accessToken}
                    theme="light"
                    colorSet={{
                        "--sendbird-light-primary-500": "hsl(var(--color-primary))",
                        "--sendbird-light-primary-400": "hsl(var(--color-primary))",
                        "--sendbird-light-primary-300": "hsl(var(--color-primary))",
                        "--sendbird-light-primary-200": "hsl(var(--color-primary))",
                        "--sendbird-light-primary-100": "hsl(var(--color-primary))",
                    }}
                    eventHandlers={{
                        connection: connectionHandlers,
                        ...handleSendbirdEvents(),
                    }}
                >
                    <div className="w-full md:w-80 h-full border-r border-border">
                        <GroupChannelList
                            renderHeader={renderHeader}
                            onChannelSelect={handleChannelSelect}
                            onChannelCreated={handleChannelCreated}
                            allowProfileEdit={true}
                            disableAutoSelect={showCreateChannel}
                        />
                    </div>

                    {showCreateChannel ? (
                        <div className="flex-1 h-full flex flex-col items-center justify-center bg-background">
                            <div className="text-center p-6">
                                <h2 className="text-xl font-semibold mb-4">Create New Channel</h2>
                                <p className="text-muted-foreground mb-6">
                                    Click on &quot;Create channel&quot; in the channel list to start a new conversation
                                </p>
                                <button
                                    onClick={() => setShowCreateChannel(false)}
                                    className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors cursor-pointer"
                                >
                                    Back to Channels
                                </button>
                            </div>
                        </div>
                    ) : currentChannel ? (
                        <div className="flex-1 h-full">
                            <GroupChannel
                                channelUrl={currentChannel}
                                onChatHeaderActionClick={() => setShowSettings(true)}
                                onBackClick={() => setCurrentChannel(null)}
                            />
                        </div>
                    ) : (
                        <div className="flex-1 h-full flex flex-col items-center justify-center bg-background text-muted-foreground">
                            <div className="text-center p-6">
                                <h2 className="text-xl font-semibold mb-2">Welcome to SendBird Chat</h2>
                                <p className="mb-6">
                                    {isConnected
                                        ? "Select a conversation or create a new one to start chatting"
                                        : "Connecting to chat service..."}
                                </p>
                                {(!isConnected || isLoading) && (
                                    <div className="loading-animation">
                                        <div></div>
                                        <div></div>
                                        <div></div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {showSettings && currentChannel && (
                        <div className="w-full md:w-80 h-full border-l border-border">
                            <ChannelSettings channelUrl={currentChannel} onCloseClick={() => setShowSettings(false)} />
                        </div>
                    )}
                </SendBirdProvider>
            </div>

            {showProfileModal && (
                <ProfileEditModal
                    currentUser={currentUser}
                    onClose={() => setShowProfileModal(false)}
                    onUpdate={handleProfileUpdate}
                    isLoading={isLoading}
                />
            )}
        </>
    )
}
