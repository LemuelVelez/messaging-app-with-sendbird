import { type NextRequest, NextResponse } from "next/server"
import pool from "@/lib/db"

export async function POST(request: NextRequest) {
  try {
    const { channel_url, created_by, chatmate_id, message_count = 0 } = await request.json()

    const query = `
      INSERT INTO channels (channel_url, created_by, chatmate_id, message_count)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (channel_url) DO UPDATE SET
        updated_at = CURRENT_TIMESTAMP
      RETURNING *
    `

    const result = await pool.query(query, [channel_url, created_by, chatmate_id, message_count])

    return NextResponse.json({
      success: true,
      channel: result.rows[0],
    })
  } catch (error) {
    console.error("Error creating channel:", error)
    return NextResponse.json({ success: false, error: "Failed to create channel" }, { status: 500 })
  }
}

export async function GET() {
  try {
    const query = `
      SELECT c.*, 
             u1.nickname as created_by_nickname,
             u2.nickname as chatmate_nickname
      FROM channels c
      LEFT JOIN users u1 ON c.created_by = u1.user_id
      LEFT JOIN users u2 ON c.chatmate_id = u2.user_id
      WHERE c.deleted = FALSE
      ORDER BY c.created_at DESC
    `

    const result = await pool.query(query)

    return NextResponse.json({
      success: true,
      channels: result.rows,
    })
  } catch (error) {
    console.error("Error fetching channels:", error)
    return NextResponse.json({ success: false, error: "Failed to fetch channels" }, { status: 500 })
  }
}
