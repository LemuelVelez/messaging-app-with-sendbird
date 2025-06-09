/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { X, Camera, Upload, Loader2 } from "lucide-react"

interface ProfileEditModalProps {
    currentUser: any
    onClose: () => void
    onUpdate: (nickname: string, profileUrl: string) => void
    isLoading?: boolean
}

export default function ProfileEditModal({ currentUser, onClose, onUpdate, isLoading = false }: ProfileEditModalProps) {
    const [nickname, setNickname] = useState(currentUser?.nickname || "")
    const [profileUrl, setProfileUrl] = useState(currentUser?.profileUrl || "")
    const [isUploading, setIsUploading] = useState(false)
    const [uploadProgress, setUploadProgress] = useState("")
    const [isUpdating, setIsUpdating] = useState(false)
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
        setUploadProgress("Uploading...")

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
                setUploadProgress("Upload successful!")
                setTimeout(() => setUploadProgress(""), 2000)
            } else {
                const errorData = await response.json()
                alert(`Failed to upload image: ${errorData.error || "Unknown error"}`)
                setUploadProgress("")
            }
        } catch (error) {
            console.error("Error uploading image:", error)
            alert("Failed to upload image")
            setUploadProgress("")
        } finally {
            setIsUploading(false)
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
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

        setIsUpdating(true)
        try {
            await onUpdate(nickname, profileUrl)
        } catch (error) {
            console.error("Error updating profile:", error)
            alert("Failed to update profile. Please try again.")
        } finally {
            setIsUpdating(false)
        }
    }

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-md mx-auto shadow-lg">
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Edit Profile</CardTitle>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={onClose}
                        className="rounded-full cursor-pointer"
                        disabled={isUpdating || isLoading}
                    >
                        <X className="h-4 w-4" />
                    </Button>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="flex flex-col items-center space-y-4">
                            <div className="relative">
                                <Avatar className="w-24 h-24 border-2 border-primary">
                                    <AvatarImage src={profileUrl || "/placeholder.svg?height=96&width=96"} alt={nickname} />
                                    <AvatarFallback className="text-xl">{nickname.charAt(0).toUpperCase()}</AvatarFallback>
                                </Avatar>
                                <Button
                                    type="button"
                                    variant="secondary"
                                    size="icon"
                                    className="absolute bottom-0 right-0 rounded-full shadow-md cursor-pointer"
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={isUploading || isUpdating || isLoading}
                                >
                                    {isUploading ? <Upload className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
                                </Button>
                            </div>

                            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />

                            {uploadProgress && (
                                <div
                                    className={`text-sm ${uploadProgress.includes("successful") ? "text-green-600" : "text-muted-foreground"}`}
                                >
                                    {uploadProgress}
                                </div>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="nickname" className="text-sm font-medium">
                                Nickname
                            </Label>
                            <Input
                                id="nickname"
                                value={nickname}
                                onChange={(e) => setNickname(e.target.value)}
                                placeholder="Enter your nickname"
                                maxLength={20}
                                required
                                className="rounded-md"
                                disabled={isUpdating || isLoading}
                            />
                            <p className="text-xs text-muted-foreground">3-20 characters, letters, numbers, and spaces only</p>
                        </div>
                    </form>
                </CardContent>
                <CardFooter className="flex justify-end space-x-2 border-t pt-4">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={onClose}
                        className="cursor-pointer"
                        disabled={isUpdating || isLoading}
                    >
                        Cancel
                    </Button>
                    <Button
                        type="submit"
                        onClick={handleSubmit}
                        className="cursor-pointer"
                        disabled={isUpdating || isUploading || isLoading}
                    >
                        {isUpdating || isLoading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Saving...
                            </>
                        ) : (
                            "Save Changes"
                        )}
                    </Button>
                </CardFooter>
            </Card>
        </div>
    )
}
