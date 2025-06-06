"use client"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "./theme-toggle"
import { MessageSquarePlus, User } from "lucide-react"

interface CustomHeaderProps {
  title: string
  onProfileClick: () => void
  onCreateChannelClick: () => void
}

export default function CustomHeader({ title, onProfileClick, onCreateChannelClick }: CustomHeaderProps) {
  return (
    <div className="flex items-center justify-between p-4 border-b">
      <h1 className="text-lg font-semibold">{title}</h1>
      <div className="flex items-center space-x-2">
        <Button
          variant="outline"
          size="icon"
          className="rounded-full cursor-pointer"
          onClick={onCreateChannelClick}
          title="Create new chat"
        >
          <MessageSquarePlus className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="rounded-full cursor-pointer"
          onClick={onProfileClick}
          title="Edit profile"
        >
          <User className="h-4 w-4" />
        </Button>
        <ThemeToggle />
      </div>
    </div>
  )
}
