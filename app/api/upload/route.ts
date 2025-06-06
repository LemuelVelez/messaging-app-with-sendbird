import { type NextRequest, NextResponse } from "next/server"
import { writeFile } from "fs/promises"
import { join } from "path"

export async function POST(request: NextRequest) {
  try {
    const data = await request.formData()
    const file: File | null = data.get("file") as unknown as File

    if (!file) {
      return NextResponse.json({ success: false, error: "No file uploaded" }, { status: 400 })
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ success: false, error: "File too large" }, { status: 400 })
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ success: false, error: "Invalid file type" }, { status: 400 })
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Generate unique filename
    const timestamp = Date.now()
    const filename = `${timestamp}-${file.name}`
    const path = join(process.cwd(), "public/uploads", filename)

    await writeFile(path, buffer)

    return NextResponse.json({
      success: true,
      url: `/uploads/${filename}`,
    })
  } catch (error) {
    console.error("Error uploading file:", error)
    return NextResponse.json({ success: false, error: "Failed to upload file" }, { status: 500 })
  }
}
