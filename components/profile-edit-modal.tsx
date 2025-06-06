/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { X, Upload } from "lucide-react"

interface ProfileEditModalProps {
    currentUser: any
    onClose: () => void
    onUpdate: (nickname: string, profileUrl: string) => void
}

export default function ProfileEditModal({ currentUser, onClose, onUpdate }: ProfileEditModalProps) {
    const [nickname, setNickname] = useState(currentUser?.nickname || "")
    const [profileUrl, setProfileUrl] = useState(currentUser?.profileUrl || "")
    const [isUploading, setIsUploading] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0]
        if (!file) return

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            alert("File size must be less than 5MB")
            return
        }

        // Validate file type
        if (!file.type.startsWith("image/")) {
            alert("Please select an image file")
            return
        }

        setIsUploading(true)

        try {
            const formData = new FormData()
            formData.append("file", file)

            const response = await fetch("/api/upload", {
                method: "POST",
                body: formData,
            })

            if (response.ok) {
                const data = await response.json()
                setProfileUrl(data.url)
            } else {
                alert("Failed to upload image")
            }
        } catch (error) {
            console.error("Error uploading image:", error)
            alert("Failed to upload image")
        } finally {
            setIsUploading(false)
        }
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()

        // Validate nickname (3-20 characters, alphanumeric and spaces only)
        if (nickname.length < 3 || nickname.length > 20) {
            alert("Nickname must be between 3 and 20 characters")
            return
        }

        if (!/^[a-zA-Z0-9\s]+$/.test(nickname)) {
            alert("Nickname can only contain letters, numbers, and spaces")
            return
        }

        onUpdate(nickname, profileUrl)
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <Card className="w-full max-w-md mx-4">
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Edit Profile</CardTitle>
                    <Button variant="ghost" size="sm" onClick={onClose}>
                        <X className="h-4 w-4" />
                    </Button>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="flex flex-col items-center space-y-4">
                            <Avatar className="w-20 h-20">
                                <AvatarImage src={profileUrl || "/placeholder.svg"} alt={nickname} />
                                <AvatarFallback>{nickname.charAt(0).toUpperCase()}</AvatarFallback>
                            </Avatar>

                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => fileInputRef.current?.click()}
                                disabled={isUploading}
                            >
                                <Upload className="h-4 w-4 mr-2" />
                                {isUploading ? "Uploading..." : "Change Photo"}
                            </Button>

                            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="nickname">Nickname</Label>
                            <Input
                                id="nickname"
                                value={nickname}
                                onChange={(e) => setNickname(e.target.value)}
                                placeholder="Enter your nickname"
                                maxLength={20}
                                required
                            />
                            <p className="text-sm text-gray-500">3-20 characters, letters, numbers, and spaces only</p>
                        </div>

                        <div className="flex space-x-2">
                            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
                                Cancel
                            </Button>
                            <Button type="submit" className="flex-1">
                                Save Changes
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}
