/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import { useState, useEffect, useCallback } from "react"
import { SendBirdProvider } from "@sendbird/uikit-react"
import { GroupChannelList } from "@sendbird/uikit-react/GroupChannelList"
import { GroupChannel } from "@sendbird/uikit-react/GroupChannel"
import ChannelSettings from "@sendbird/uikit-react/ChannelSettings"
import "@sendbird/uikit-react/dist/index.css"
import ProfileEditModal from "./profile-edit-modal"
import type { User } from "@sendbird/chat"

export default function SendbirdChat() {
    const [showProfileModal, setShowProfileModal] = useState(false)
    const [currentUser, setCurrentUser] = useState<User | null>(null)
    const [currentChannel, setCurrentChannel] = useState<string | null>(null)
    const [showSettings, setShowSettings] = useState(false)

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

        createUserInDatabase()
    }, [userId])

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

                setShowProfileModal(false)
            } catch (error) {
                console.error("Error updating user profile:", error)
            }
        },
        [userId],
    )

    const handleChannelSelect = (channel: any) => {
        setCurrentChannel(channel.url)
    }

    const renderHeader = () => {
        return (
            <div className="sendbird-channel-list__header">
                <div className="sendbird-channel-list__header-title">Channels</div>
                <button className="sendbird-channel-list__header-button" onClick={handleProfileClick}>
                    Profile
                </button>
            </div>
        )
    }

    return (
        <>
            <div style={{ width: "100vw", height: "100vh", display: "flex" }}>
                <SendBirdProvider
                    appId={appId}
                    userId={userId}
                    accessToken={accessToken}
                    eventHandlers={{
                        connection: {
                            onConnected: (user: User) => {
                                setCurrentUser(user)
                                console.log("User connected:", user)
                            },
                        },
                    }}
                >
                    <div style={{ width: "320px", height: "100%", borderRight: "1px solid #e2e2e2" }}>
                        <GroupChannelList
                            renderHeader={renderHeader}
                            onChannelSelect={handleChannelSelect}
                            onChannelCreated={async (channel) => {
                                console.log("Channel created:", channel)

                                // Save channel to database
                                try {
                                    const chatmateId = channel.members.find((member: any) => member.userId !== userId)?.userId || null

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
                            }}
                        />
                    </div>

                    {currentChannel && (
                        <div style={{ flex: 1, height: "100%" }}>
                            <GroupChannel channelUrl={currentChannel} onChatHeaderActionClick={() => setShowSettings(true)} />
                        </div>
                    )}

                    {showSettings && currentChannel && (
                        <div style={{ width: "320px", height: "100%", borderLeft: "1px solid #e2e2e2" }}>
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
