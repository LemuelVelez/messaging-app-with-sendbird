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

    const appId = process.env.NEXT_PUBLIC_SENDBIRD_APP_ID || "295F96EE-5F91-4352-BF0E-DE1823C8A496"
    const userId = process.env.NEXT_PUBLIC_SENDBIRD_USER_ID || "John Doe"
    const accessToken = process.env.NEXT_PUBLIC_SENDBIRD_ACCESS_TOKEN || "4a5acb402901976e94f1835c930198e210c9cb4f"

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
            } catch (error) {
                console.error("Error creating user in database:", error)
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
            try {
                // Update in database
                await fetch(`/api/users/${userId}`, {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        nickname,
                        profile_url: profileUrl,
                    }),
                })

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

            // Save channel to database
            try {
                const chatmateId = channel.members?.find((member: any) => member.userId !== userId)?.userId || null

                await fetch("/api/channels", {
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
            } catch (error) {
                console.error("Error saving channel to database:", error)
            }
        },
        [userId],
    )

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

    // Connection event handlers
    const connectionHandlers = {
        onConnected: (user: User) => {
            console.log("User connected:", user)
            setCurrentUser(user)
            setIsConnected(true)
        },
        onDisconnected: () => {
            console.log("User disconnected")
            setIsConnected(false)
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
                                {!isConnected && (
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
                />
            )}
        </>
    )
}
