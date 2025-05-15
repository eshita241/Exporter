import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET() {
  try {
    const materials = await prisma.rawMaterial.findMany()
    return NextResponse.json(materials)
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch raw materials' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const { name, unit, description } = await request.json()

    if (!name || !unit) {
      return NextResponse.json(
        { error: 'Name and unit are required' },
        { status: 400 }
      )
    }

    const material = await prisma.rawMaterial.create({
      data: {
        name,
        unit,
        description: description || ''
      }
    })

    return NextResponse.json(material, { status: 201 })
  } catch (error) {
    console.error(error)
    return NextResponse.json(
      { error: 'Failed to create raw material' },
      { status: 500 }
    )
  }
}