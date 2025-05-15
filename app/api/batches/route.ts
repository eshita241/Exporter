// File: /app/api/batches/route.ts
import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function POST(request: Request) {
  try {
    const { batchData } = await request.json()

    if (!batchData || !Array.isArray(batchData) || batchData.length === 0) {
      return NextResponse.json(
        { error: 'Invalid batch data format' }, 
        { status: 400 }
      )
    }

    // Current date in YYYY-MM-DD format
    const today = new Date()
    today.setUTCHours(0, 0, 0, 0) // Set to beginning of day in UTC

    // Process all batch entries in a transaction
    const result = await prisma.$transaction(async (tx) => {
      const results = []

      for (const item of batchData) {
        const { skuId, batches, date } = item
        
        if (!skuId || typeof batches !== 'number' || batches <= 0) {
          continue // Skip invalid entries
        }

        // Parse the date if provided, otherwise use today
        const batchDate = date ? new Date(date) : today
        batchDate.setUTCHours(0, 0, 0, 0) // Set to beginning of day in UTC

        // Try to find an existing entry for this SKU and date
        const existingBatch = await tx.dailyBatch.findUnique({
          where: {
            skuId_date: {
              skuId: skuId,
              date: batchDate
            }
          }
        })

        let result
        if (existingBatch) {
          // Update the existing entry
          result = await tx.dailyBatch.update({
            where: {
              id: existingBatch.id
            },
            data: {
              batches: batches
            }
          })
        } else {
          // Create a new entry
          result = await tx.dailyBatch.create({
            data: {
              skuId: skuId,
              batches: batches,
              date: batchDate
            }
          })
        }

        results.push(result)
      }

      return results
    })

    return NextResponse.json(
      { message: 'Batches saved successfully', data: result }, 
      { status: 200 }
    )
  } catch (error) {
    console.error('Error saving batches:', error)
    return NextResponse.json(
      { error: 'Failed to save batches' }, 
      { status: 500 }
    )
  }
}