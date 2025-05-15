import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { SKU, RawMaterial, RecipeItem } from '@prisma/client'
import Link from 'next/link'

interface RecipeFormData {
  rawMaterialId: string
  quantity: string
}

export default function RecipeManagement() {
  const router = useRouter()
  const { skuId } = useParams()
  const [sku, setSku] = useState<SKU & { recipeItems: (RecipeItem & { rawMaterial: RawMaterial })[] }>()
  const [rawMaterials, setRawMaterials] = useState<RawMaterial[]>([])
  const [newRecipeItem, setNewRecipeItem] = useState<RecipeFormData>({
    rawMaterialId: '',
    quantity: ''
  })
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [skuResponse, materialsResponse] = await Promise.all([
          fetch(`/api/skus/${skuId}`),
          fetch('/api/raw-materials')
        ])

        if (!skuResponse.ok || !materialsResponse.ok) {
          throw new Error('Failed to fetch data')
        }

        const [skuData, materialsData] = await Promise.all([
          skuResponse.json(),
          materialsResponse.json()
        ])

        setSku(skuData)
        setRawMaterials(materialsData)
      } catch (error) {
        console.error('Error fetching data:', error)
        router.push('/admin/skus')
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [skuId, router])

  const handleAddRecipeItem = async () => {
    if (!newRecipeItem.rawMaterialId || !newRecipeItem.quantity) {
      alert('Please select a raw material and enter quantity')
      return
    }

    setIsSubmitting(true)
    try {
      const response = await fetch('/api/recipes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          skuId,
          rawMaterialId: newRecipeItem.rawMaterialId,
          quantity: newRecipeItem.quantity
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to add recipe item')
      }

      const updatedRecipeItem = await response.json()
      
      // Update local state
      if (sku) {
        const existingIndex = sku.recipeItems.findIndex(
          item => item.rawMaterialId === updatedRecipeItem.rawMaterialId
        )
        
        if (existingIndex >= 0) {
          const updatedRecipeItems = [...sku.recipeItems]
          updatedRecipeItems[existingIndex] = {
            ...updatedRecipeItems[existingIndex],
            quantity: updatedRecipeItem.quantity
          }
          setSku({
            ...sku,
            recipeItems: updatedRecipeItems
          })
        } else {
          const rawMaterial = rawMaterials.find(
            rm => rm.id === updatedRecipeItem.rawMaterialId
          )
          if (rawMaterial) {
            setSku({
              ...sku,
              recipeItems: [
                ...sku.recipeItems,
                {
                  ...updatedRecipeItem,
                  rawMaterial
                }
              ]
            })
          }
        }
      }

      setNewRecipeItem({
        rawMaterialId: '',
        quantity: ''
      })
    } catch (error) {
      console.error('Error:', error)
      alert(error instanceof Error ? error.message : 'Failed to add recipe item')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-bold mb-4">Recipe Management</h1>
        <p>Loading...</p>
      </div>
    )
  }

  if (!sku) {
    return (
      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-bold mb-4">Recipe Management</h1>
        <p>SKU not found</p>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-4">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Recipe for {sku.name}</h1>
        <Link href="/admin/skus" className="text-blue-600 hover:text-blue-900">
          Back to SKUs
        </Link>
      </div>
      
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-2">Add/Update Recipe Item</h2>
        <div className="flex gap-4 flex-wrap items-end">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium mb-1">Raw Material</label>
            <select
              className="border rounded py-2 px-3 w-full"
              value={newRecipeItem.rawMaterialId}
              onChange={(e) => setNewRecipeItem({
                ...newRecipeItem,
                rawMaterialId: e.target.value
              })}
            >
              <option value="">Select Raw Material</option>
              {rawMaterials.map((material) => (
                <option key={material.id} value={material.id}>
                  {material.name} ({material.unit})
                </option>
              ))}
            </select>
          </div>
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium mb-1">Quantity</label>
            <input
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              className="border rounded py-2 px-3 w-full"
              value={newRecipeItem.quantity}
              onChange={(e) => setNewRecipeItem({
                ...newRecipeItem,
                quantity: e.target.value
              })}
            />
          </div>
          <button
            onClick={handleAddRecipeItem}
            disabled={isSubmitting}
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
          >
            {isSubmitting ? 'Saving...' : 'Save Recipe Item'}
          </button>
        </div>
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-2">Current Recipe</h2>
        {sku.recipeItems.length === 0 ? (
          <p className="text-gray-500">No recipe items found</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Raw Material</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unit</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sku.recipeItems.map((item) => (
                  <tr key={item.id}>
                    <td className="px-6 py-4 whitespace-nowrap">{item.rawMaterial.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{item.rawMaterial.unit}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{item.quantity}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}