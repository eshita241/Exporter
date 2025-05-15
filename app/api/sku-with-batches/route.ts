// app/api/skus-with-batches/route.ts
import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { startOfDay } from 'date-fns'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const dateParam = searchParams.get('date')
    const date = dateParam ? new Date(dateParam) : new Date()

    const startDate = startOfDay(date)
    const endDate = new Date(startDate.getTime() + 24 * 60 * 60 * 1000)

    const skus = await prisma.sKU.findMany({
      include: {
        dailyBatches: {
          where: {
            date: {
              gte: startDate,
              lt: endDate
            }
          }
        },
        recipeItems: {
          include: {
            rawMaterial: true
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    })

    return NextResponse.json(skus)
  } catch (error) {
    console.error(error)
    return NextResponse.json(
      { error: 'Failed to fetch SKUs with batches' },
      { status: 500 }
    )
  }
}