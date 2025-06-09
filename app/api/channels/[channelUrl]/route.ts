import { type NextRequest, NextResponse } from "next/server"
import pool from "@/lib/db"

interface Params {
  channelUrl: string
}

export async function DELETE(request: NextRequest, { params }: { params: Params }) {
  try {
    const channelUrl = decodeURIComponent(params.channelUrl)

    const query = `
      UPDATE channels 
      SET deleted = TRUE, updated_at = CURRENT_TIMESTAMP
      WHERE channel_url = $1
      RETURNING *
    `

    const result = await pool.query(query, [channelUrl])

    if (result.rows.length === 0) {
      return NextResponse.json({ success: false, error: "Channel not found" }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      channel: result.rows[0],
    })
  } catch (error) {
    console.error("Error marking channel as deleted:", error)
    return NextResponse.json({ success: false, error: "Failed to delete channel" }, { status: 500 })
  }
}

export async function GET(request: NextRequest, { params }: { params: Params }) {
  try {
    const channelUrl = decodeURIComponent(params.channelUrl)

    const query = `
      SELECT c.*, 
             u1.nickname as created_by_nickname,
             u2.nickname as chatmate_nickname
      FROM channels c
      LEFT JOIN users u1 ON c.created_by = u1.user_id
      LEFT JOIN users u2 ON c.chatmate_id = u2.user_id
      WHERE c.channel_url = $1
    `

    const result = await pool.query(query, [channelUrl])

    if (result.rows.length === 0) {
      return NextResponse.json({ success: false, error: "Channel not found" }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      channel: result.rows[0],
    })
  } catch (error) {
    console.error("Error fetching channel:", error)
    return NextResponse.json({ success: false, error: "Failed to fetch channel" }, { status: 500 })
  }
}
