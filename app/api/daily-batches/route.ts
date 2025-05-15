import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

interface DailyBatchRequest {
  skuId: string
  date: string
  batches: number
}

export async function POST(request: Request) {
  try {
    const { skuId, date, batches } = await request.json() as DailyBatchRequest

    if (!skuId || !date || batches == null) {
      return NextResponse.json(
        { error: 'SKU ID, date and batches are required' },
        { status: 400 }
      )
    }

    const batchDate = new Date(date)

    await prisma.dailyBatch.upsert({
      where: {
        skuId_date: {
          skuId,
          date: batchDate
        }
      },
      update: {
        batches
      },
      create: {
        skuId,
        date: batchDate,
        batches
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error(error)
    return NextResponse.json(
      { error: 'Failed to update daily batch' },
      { status: 500 }
    )
  }
}