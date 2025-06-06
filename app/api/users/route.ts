import { type NextRequest, NextResponse } from "next/server"
import pool from "@/lib/db"

export async function POST(request: NextRequest) {
  try {
    const { user_id, nickname, profile_url } = await request.json()

    const query = `
      INSERT INTO users (user_id, nickname, profile_url)
      VALUES ($1, $2, $3)
      ON CONFLICT (user_id) DO UPDATE SET
        nickname = EXCLUDED.nickname,
        profile_url = EXCLUDED.profile_url,
        updated_at = CURRENT_TIMESTAMP
      RETURNING *
    `

    const result = await pool.query(query, [user_id, nickname, profile_url])

    return NextResponse.json({
      success: true,
      user: result.rows[0],
    })
  } catch (error) {
    console.error("Error creating/updating user:", error)
    return NextResponse.json({ success: false, error: "Failed to create/update user" }, { status: 500 })
  }
}
