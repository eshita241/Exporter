// app/api/verify-credentials/route.ts
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { userId, password } = await request.json()

    //getting creds from the env
    const validUserId = process.env.AUTH_USER_ID
    const validPassword = process.env.AUTH_PASSWORD

    if (!validUserId || !validPassword) {
      return NextResponse.json(
        { error: 'Authentication not configured' },
        { status: 500 }
      )
    }

    const isValid = userId === validUserId && password === validPassword

    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error(error)
    return NextResponse.json(
      { error: 'Authentication failed' },
      { status: 500 }
    )
  }
}