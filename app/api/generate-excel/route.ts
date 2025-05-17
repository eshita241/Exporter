import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import * as XLSX from 'xlsx'
import {format} from 'date-fns'

const prisma = new PrismaClient()

export async function POST(request: Request) {
  try {
    const { batchData, date } = await request.json()

    if (!batchData || !Array.isArray(batchData)) {
      return NextResponse.json(
        { error: 'Invalid batch data format' }, 
        { status: 400 }
      )
    }

    const reportDate = date ? new Date(date):new Date()
    const formattedDate = format(reportDate, 'yyyy-MM-dd')

    const batchesMap = new Map()
    batchData.forEach(item => {
      if (item.skuId && typeof item.batches === 'number') {
        batchesMap.set(item.skuId, item.batches)
      }
    })

    const [skus, rawMaterials, recipeItems, previousDayBatches] = await Promise.all([
      prisma.sKU.findMany({
      where: {
        id: { in: Array.from(batchesMap.keys()) }
      }
    }),
    prisma.rawMaterial.findMany(),
    prisma.recipeItem.findMany({
      where:{skuId:{in: Array.from(batchesMap.keys())}},
      include: {sku:true, rawMaterial:true}
    }),
prisma.dailyBatch.findMany({
        where: {
          date: {
            lt: new Date(reportDate.setHours(0, 0, 0, 0)),
            gte: new Date(new Date(reportDate).setDate(reportDate.getDate() - 1))
          }
        },
        include: {
          sku: {
            include: {
              recipeItems: {
                include: {
                  rawMaterial: true
                }
              }
            }
          }
        }
      })
    ])

    const headers = ['Raw Material', 'Unit', 'Current Quantity']
    skus.forEach(sku => {
      headers.push(`${sku.name} (${sku.code})`)
    })
    headers.push('Total Consumption')
    headers.push('Closing Quantity')

    // we create a map to store material requirements
    // Format: Map<rawMaterialId, Map<skuId, quantity>>
    const materialRequirements = new Map()
    const previousDayConsumption = new Map()

    rawMaterials.forEach(material => {
      materialRequirements.set(material.id, {
        requirements: new Map(),
        currentQuantity: material.quantity || 0
      })
      previousDayConsumption.set(material.id, 0)
    })

    previousDayBatches.forEach(batch => {
      batch.sku.recipeItems.forEach(recipe => {
        const materialId = recipe.rawMaterialId
        const consumption = recipe.quantity * batch.batches
        previousDayConsumption.set(
          materialId, 
          (previousDayConsumption.get(materialId) || 0) + consumption
        )
      })
    })

    recipeItems.forEach(item => {
      const batches = batchesMap.get(item.skuId) || 0
      if (batches > 0) {
        const materialData = materialRequirements.get(item.rawMaterialId)
        const requirement = item.quantity * batches
        materialData.requirements.set(item.skuId, requirement)
      }
    })

    const worksheet_data = [headers]

    // for adding rows for each raw material
    rawMaterials.forEach(material => {
      const materialData = materialRequirements.get(material.id)
      const prevConsumption = previousDayConsumption.get(material.id) || 0
      
      const currentQty = Math.max(0, materialData.currentQuantity - prevConsumption)
      const rowData = [material.name, material.unit,currentQty.toString()]
      
      let totalRequirement = 0
      skus.forEach(sku => {
        const requirement = materialData.requirements.get(sku.id) || 0
        // Add requirement or empty string if zero
        rowData.push(requirement > 0 ? requirement.toString() : '')
        totalRequirement += requirement
      })

      rowData.push(totalRequirement > 0 ? totalRequirement.toString() : '')
      const closingQty = Math.max(0, currentQty - totalRequirement)
      rowData.push(closingQty.toString())
      worksheet_data.push(rowData)
    })

    // creating worksheet
    const worksheet = XLSX.utils.aoa_to_sheet(worksheet_data)

    const columnWidths = worksheet_data[0].map((_, i) => {
      let maxWidth = 10
      worksheet_data.forEach(row => {
        const cellValue = row[i]?.toString() || '';
        if (cellValue.length > maxWidth) {
          maxWidth = cellValue.length
        }
      })
      return { wch: Math.min(Math.max(10, maxWidth + 2), 50) }
    })

    worksheet['!cols'] = columnWidths

    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Material Requirements')
   
    if (!worksheet['!rows']) worksheet['!rows'] = []
    worksheet['!rows'][0] = { hpt: 24, hpx: 24 }

    const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' })

    return new NextResponse(excelBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename=material_requirements_${formattedDate}.xlsx`
      }
    })
  } catch (error) {
    console.error('Error generating Excel:', error)
    return NextResponse.json(
      { error: 'Failed to generate Excel' },
      { status: 500 }
    )
  }
}