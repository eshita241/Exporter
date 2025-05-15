// File: /app/api/recipes/route.ts
import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function POST(request: Request) {
  try {
    const { skuId, rawMaterialId, quantity } = await request.json()
    const quantityNumber = parseFloat(quantity)

    if (!skuId || !rawMaterialId || isNaN(quantityNumber)) {
      return NextResponse.json(
        { error: 'SKU ID, Raw Material ID and quantity are required' },
        { status: 400 }
      )
    }

    const recipeItem = await prisma.recipeItem.upsert({
      where: {
        skuId_rawMaterialId: {
          skuId,
          rawMaterialId
        }
      },
      update: {
        quantity: quantityNumber
      },
      create: {
        skuId,
        rawMaterialId,
        quantity: quantityNumber
      }
    })

    return NextResponse.json(recipeItem, { status: 201 })
  } catch (error) {
    console.error(error)
    return NextResponse.json(
      { error: 'Failed to update recipe' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const skuId = searchParams.get('skuId')
    const rawMaterialId = searchParams.get('rawMaterialId')

    if (!skuId || !rawMaterialId) {
      return NextResponse.json(
        { error: 'SKU ID and Raw Material ID are required' },
        { status: 400 }
      )
    }

    await prisma.recipeItem.delete({
      where: {
        skuId_rawMaterialId: {
          skuId,
          rawMaterialId
        }
      }
    })

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error) {
    console.error(error)
    return NextResponse.json(
      { error: 'Failed to delete recipe item' },
      { status: 500 }
    )
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const skuId = searchParams.get('skuId')

    if (!skuId) {
      return NextResponse.json(
        { error: 'SKU ID is required' },
        { status: 400 }
      )
    }

    const recipeItems = await prisma.recipeItem.findMany({
      where: {
        skuId: skuId
      },
      include: {
        rawMaterial: true
      }
    })

    return NextResponse.json(recipeItems, { status: 200 })
  } catch (error) {
    console.error(error)
    return NextResponse.json(
      { error: 'Failed to fetch recipe items' },
      { status: 500 }
    )
  }
}