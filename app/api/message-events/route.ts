import { type NextRequest, NextResponse } from "next/server"
import pool from "@/lib/db"

export async function POST(request: NextRequest) {
  try {
    const { channel_url, user_id, message_type = "user" } = await request.json()

    const query = `
      INSERT INTO message_events (channel_url, user_id, message_type)
      VALUES ($1, $2, $3)
      RETURNING *
    `

    const result = await pool.query(query, [channel_url, user_id, message_type])

    return NextResponse.json({
      success: true,
      event: result.rows[0],
    })
  } catch (error) {
    console.error("Error creating message event:", error)
    return NextResponse.json({ success: false, error: "Failed to create message event" }, { status: 500 })
  }
}

export async function GET() {
  try {
    const query = `
      SELECT me.*, u.nickname as user_nickname, c.created_by
      FROM message_events me
      LEFT JOIN users u ON me.user_id = u.user_id
      LEFT JOIN channels c ON me.channel_url = c.channel_url
      ORDER BY me.created_at DESC
      LIMIT 100
    `

    const result = await pool.query(query)

    return NextResponse.json({
      success: true,
      events: result.rows,
    })
  } catch (error) {
    console.error("Error fetching message events:", error)
    return NextResponse.json({ success: false, error: "Failed to fetch message events" }, { status: 500 })
  }
}
