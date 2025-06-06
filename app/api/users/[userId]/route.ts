import { type NextRequest, NextResponse } from "next/server"
import pool from "@/lib/db"

interface Params {
  userId: string
}

export async function PUT(request: NextRequest, { params }: { params: Params }) {
  try {
    const { nickname, profile_url } = await request.json()
    const userId = params.userId

    const query = `
      UPDATE users 
      SET nickname = $1, profile_url = $2, updated_at = CURRENT_TIMESTAMP
      WHERE user_id = $3 AND deleted = FALSE
      RETURNING *
    `

    const result = await pool.query(query, [nickname, profile_url, userId])

    if (result.rows.length === 0) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      user: result.rows[0],
    })
  } catch (error) {
    console.error("Error updating user:", error)
    return NextResponse.json({ success: false, error: "Failed to update user" }, { status: 500 })
  }
}

export async function GET(request: NextRequest, { params }: { params: Params }) {
  try {
    const userId = params.userId

    const query = `
      SELECT * FROM users 
      WHERE user_id = $1 AND deleted = FALSE
    `

    const result = await pool.query(query, [userId])

    if (result.rows.length === 0) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      user: result.rows[0],
    })
  } catch (error) {
    console.error("Error fetching user:", error)
    return NextResponse.json({ success: false, error: "Failed to fetch user" }, { status: 500 })
  }
}
