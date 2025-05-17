// app/api/raw-materials/quantity/route.ts
import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

interface UpdateQuantityRequest {
  materialId: string
  quantity: number
  action: 'add' | 'subtract' | 'set'  // Define possible actions
}

export async function PUT(request: Request) {
  try {
    const { materialId, quantity, action } = await request.json() as UpdateQuantityRequest

    if (!materialId || quantity === undefined) {
      return NextResponse.json(
        { error: 'Material ID and quantity are required' },
        { status: 400 }
      )
    }

    // Find the current material
    const material = await prisma.rawMaterial.findUnique({
      where: { id: materialId }
    })

    if (!material) {
      return NextResponse.json(
        { error: 'Raw material not found' },
        { status: 404 }
      )
    }

    let newQuantity = material.quantity

    // Calculate new quantity based on action
    switch (action) {
      case 'add':
        newQuantity += quantity
        break
      case 'subtract':
        newQuantity = Math.max(0, newQuantity - quantity)  // Prevent negative quantities
        break
      case 'set':
        newQuantity = quantity
        break
      default:
        return NextResponse.json(
          { error: 'Invalid action specified' },
          { status: 400 }
        )
    }

    // Update the material
    const updatedMaterial = await prisma.rawMaterial.update({
      where: { id: materialId },
      data: { quantity: newQuantity }
    })

    return NextResponse.json(updatedMaterial)
  } catch (error) {
    console.error('Error updating raw material quantity:', error)
    return NextResponse.json(
      { error: 'Failed to update raw material quantity' },
      { status: 500 }
    )
  }
}