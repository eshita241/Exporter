import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET() {
  try {
    const skus = await prisma.sKU.findMany({
      include: {
        recipeItems: {
          include: {
            rawMaterial: true
          }
        }
      }
    })
    return NextResponse.json(skus)
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch SKUs' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const { name, code, description } = await request.json()

    if (!name || !code) {
      return NextResponse.json(
        { error: 'Name and code are required' },
        { status: 400 }
      )
    }

    const sku = await prisma.sKU.create({
      data: {
        name,
        code,
        description: description || ''
      }
    })

    return NextResponse.json(sku, { status: 201 })
  } catch (error) {
    console.error(error)
    return NextResponse.json(
      { error: 'Failed to create SKU' },
      { status: 500 }
    )
  }
}