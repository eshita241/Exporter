import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import * as XLSX from 'xlsx'

const prisma = new PrismaClient()

export async function POST(request: Request) {
  try {
    const { batchData } = await request.json()

    if (!batchData || !Array.isArray(batchData)) {
      return NextResponse.json(
        { error: 'Invalid batch data format' }, 
        { status: 400 }
      )
    }

    const batchesMap = new Map()
    batchData.forEach(item => {
      if (item.skuId && typeof item.batches === 'number') {
        batchesMap.set(item.skuId, item.batches)
      }
    })

    const skus = await prisma.sKU.findMany({
      where: {
        id: { in: Array.from(batchesMap.keys()) }
      }
    })

    const rawMaterials = await prisma.rawMaterial.findMany()

    const recipeItems = await prisma.recipeItem.findMany({
      where: {
        skuId: { in: Array.from(batchesMap.keys()) }
      },
      include: {
        sku: true,
        rawMaterial: true
      }
    })

    const headers = ['Raw Material', 'Unit']
    skus.forEach(sku => {
      headers.push(`${sku.name} (${sku.code})`)
    })
    headers.push('Total')
    headers.push('Closing')

    // we create a map to store material requirements
    // Format: Map<rawMaterialId, Map<skuId, quantity>>
    const materialRequirements = new Map()

    rawMaterials.forEach(material => {
      materialRequirements.set(material.id, new Map())
    })

    recipeItems.forEach(item => {
      const batches = batchesMap.get(item.skuId) || 0
      if (batches > 0) {
        const materialMap = materialRequirements.get(item.rawMaterialId)
        const requirement = item.quantity * batches
        materialMap.set(item.skuId, requirement)
      }
    })

    const worksheet_data = [headers]

    // for adding rows for each raw material
    rawMaterials.forEach(material => {
      const materialMap = materialRequirements.get(material.id)
      const rowData = [material.name, material.unit]
      
      let totalRequirement = 0
      skus.forEach(sku => {
        const requirement = materialMap.get(sku.id) || 0
        // Add requirement or empty string if zero
        rowData.push(requirement > 0 ? requirement : '')
        totalRequirement += requirement
      })

      rowData.push(totalRequirement > 0 ? totalRequirement.toString() : '')
      worksheet_data.push(rowData)
    })

    // creating worksheet
    const worksheet = XLSX.utils.aoa_to_sheet(worksheet_data)

    const columnWidths = worksheet_data[0].map((_, i) => {
      let maxWidth = 0
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
        'Content-Disposition': 'attachment; filename=material_requirements.xlsx'
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