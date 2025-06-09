import { type NextRequest, NextResponse } from "next/server"
import pool from "@/lib/db"

interface Params {
  channelUrl: string
}

export async function POST(request: NextRequest, { params }: { params: Promise<Params> }) {
  try {
    const { channelUrl } = await params
    const decodedChannelUrl = decodeURIComponent(channelUrl)

    const query = `
      UPDATE channels 
      SET message_count = message_count + 1, updated_at = CURRENT_TIMESTAMP
      WHERE channel_url = $1 AND deleted = FALSE
      RETURNING *
    `

    const result = await pool.query(query, [decodedChannelUrl])

    if (result.rows.length === 0) {
      return NextResponse.json({ success: false, error: "Channel not found" }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      channel: result.rows[0],
    })
  } catch (error) {
    console.error("Error incrementing message count:", error)
    return NextResponse.json({ success: false, error: "Failed to increment message count" }, { status: 500 })
  }
}
