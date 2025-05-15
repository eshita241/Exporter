import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const sku = await prisma.sKU.findUnique({
      where: { id: params.id },
      include: {
        recipeItems: {
          include: {
            rawMaterial: true
          }
        }
      }
    })

    if (!sku) {
      return NextResponse.json(
        { error: 'SKU not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(sku)
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch SKU' },
      { status: 500 }
    )
  }
}