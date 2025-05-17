import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { startOfDay, endOfDay } from 'date-fns'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const dateParam = searchParams.get('date')
    const targetDate = dateParam ? new Date(dateParam) : new Date()

    const skus = await prisma.sKU.findMany({
      include: {
        recipeItems: {
          include: {
            rawMaterial: true
          }
        },
        dailyBatches: {
          where: {
            date: {
              gte: startOfDay(targetDate),
              lt: endOfDay(targetDate)
            }
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    })

    return NextResponse.json(skus)
  } catch {
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
  } catch {
    return NextResponse.json(
      { error: 'Failed to create SKU' },
      { status: 500 }
    )
  }
}