import { format, startOfDay } from 'date-fns'
import prisma from './prisma'
import { SKU, DailyBatch } from '@prisma/client'

export async function getTodaysBatches(): Promise<DailyBatch[]> {
  const today = startOfDay(new Date())
  
  // Get or create today's batch records for all SKUs
  const skus = await prisma.sKU.findMany()
  
  const batches = await Promise.all(
    skus.map(async (sku: SKU) => {
      let batch = await prisma.dailyBatch.findFirst({
        where: {
          skuId: sku.id,
          date: {
            gte: today,
            lt: new Date(today.getTime() + 24 * 60 * 60 * 1000)
          }
        }
      })

      if (!batch) {
        batch = await prisma.dailyBatch.create({
          data: {
            skuId: sku.id,
            date: today,
            batches: 0
          }
        })
      }

      return batch
    })
  )

  return batches
}

export async function updateBatchCount(skuId: string, batches: number): Promise<void> {
  const today = startOfDay(new Date())
  
  await prisma.dailyBatch.upsert({
    where: {
      skuId_date: {
        skuId,
        date: today
      }
    },
    update: {
      batches
    },
    create: {
      skuId,
      date: today,
      batches
    }
  })
}