'use client'
import { useState, useEffect } from 'react'
import { SKU, RawMaterial, RecipeItem } from '@prisma/client'

interface RecipeItemWithRawMaterial extends RecipeItem {
  rawMaterial: RawMaterial
}

export default function RecipeManagementPage() {
  const [skus, setSkus] = useState<SKU[]>([])
  const [rawMaterials, setRawMaterials] = useState<RawMaterial[]>([])
  const [selectedSkuId, setSelectedSkuId] = useState<string>('')
  const [recipeItems, setRecipeItems] = useState<RecipeItemWithRawMaterial[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  
  // Form state
  const [selectedRawMaterialId, setSelectedRawMaterialId] = useState<string>('')
  const [quantity, setQuantity] = useState<string>('')

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true)
        setError(null)
        
        // Fetch SKUs
        const skusResponse = await fetch('/api/skus')
        if (!skusResponse.ok) {
          throw new Error(`Failed to fetch SKUs: ${skusResponse.status}`)
        }
        const skusData: SKU[] = await skusResponse.json()
        setSkus(skusData)
        
        // Fetch Raw Materials
        const materialsResponse = await fetch('/api/raw-materials')
        if (!materialsResponse.ok) {
          throw new Error(`Failed to fetch raw materials: ${materialsResponse.status}`)
        }
        const materialsData: RawMaterial[] = await materialsResponse.json()
        setRawMaterials(materialsData)
        
        // Set default selected SKU if available
        if (skusData.length > 0) {
          setSelectedSkuId(skusData[0].id)
        }
      } catch (err) {
        console.error('Failed to fetch initial data:', err)
        setError('Failed to load data. Please try again.')
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [])

  // Fetch recipe items when selected SKU changes
  useEffect(() => {
    const fetchRecipeItems = async () => {
      if (!selectedSkuId) return
      
      try {
        setIsLoading(true)
        const response = await fetch(`/api/recipes?skuId=${selectedSkuId}`)
        
        if (!response.ok) {
          throw new Error(`Failed to fetch recipe items: ${response.status}`)
        }
        
        const data: RecipeItemWithRawMaterial[] = await response.json()
        setRecipeItems(data)
      } catch (err) {
        console.error('Failed to fetch recipe items:', err)
        setError('Failed to load recipe items. Please try again.')
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchRecipeItems()
  }, [selectedSkuId])

  const handleSkuChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedSkuId(e.target.value)
    // Reset form when changing SKU
    setSelectedRawMaterialId('')
    setQuantity('')
  }

  const handleAddRecipeItem = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!selectedSkuId || !selectedRawMaterialId || !quantity) {
      setError('All fields are required')
      return
    }
    
    try {
      setIsSubmitting(true)
      setError(null)
      
      const response = await fetch('/api/recipes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          skuId: selectedSkuId,
          rawMaterialId: selectedRawMaterialId,
          quantity: parseFloat(quantity)
        }),
      })
      
      if (!response.ok) {
        throw new Error(`Failed to add recipe item: ${response.status}`)
      }
            
      // Refetch recipe items to show the updated list
      const updatedRecipeResponse = await fetch(`/api/recipes?skuId=${selectedSkuId}`)
      const updatedRecipes: RecipeItemWithRawMaterial[] = await updatedRecipeResponse.json()
      setRecipeItems(updatedRecipes)
      
      // Reset form
      setSelectedRawMaterialId('')
      setQuantity('')
      
      // Show success message
      setSuccessMessage('Recipe item added successfully')
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (err) {
      console.error('Failed to add recipe item:', err)
      setError('Failed to add recipe item. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteRecipeItem = async (rawMaterialId: string) => {
    if (!confirm('Are you sure you want to delete this ingredient from the recipe?')) {
      return
    }
    
    try {
      setIsLoading(true)
      
      const response = await fetch(`/api/recipes?skuId=${selectedSkuId}&rawMaterialId=${rawMaterialId}`, {
        method: 'DELETE',
      })
      
      if (!response.ok) {
        throw new Error(`Failed to delete recipe item: ${response.status}`)
      }
      
      // Remove the deleted item from the list
      setRecipeItems(recipeItems.filter(item => item.rawMaterialId !== rawMaterialId))
      
      // Show success message
      setSuccessMessage('Recipe item deleted successfully')
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (err) {
      console.error('Failed to delete recipe item:', err)
      setError('Failed to delete recipe item. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading && skus.length === 0) {
    return (
      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-bold mb-4">Recipe Management</h1>
        <div className="flex justify-center items-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Recipe Management</h1>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      {successMessage && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
          {successMessage}
        </div>
      )}
      
      {skus.length === 0 ? (
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded">
          No SKUs found. Please add SKUs in the admin section first.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <div className="mb-4">
              <label className="block text-gray-700 font-semibold mb-2">Select SKU:</label>
              <select
                className="w-full p-2 border bg-white text-gray-900 rounded-md focus:border-blue-500 focus:outline-none"
                value={selectedSkuId}
                onChange={handleSkuChange}
              >
                {skus.map(sku => (
                  <option key={sku.id} value={sku.id}>
                    {sku.name} ({sku.code})
                  </option>
                ))}
              </select>
            </div>
            
            <div className=" shadow-md rounded-lg overflow-hidden">
              <h2 className=" px-6 py-3 text-lg font-semibold border-b">
                Recipe for {skus.find(sku => sku.id === selectedSkuId)?.name || ''}
              </h2>
              
              {isLoading ? (
                <div className="flex justify-center items-center h-32">
                  <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-blue-500"></div>
                </div>
              ) : recipeItems.length === 0 ? (
                <div className="p-6 text-gray-500 italic">
                  No ingredients added to this recipe yet.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unit</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className=" divide-y divide-gray-200">
                      {recipeItems.map((item) => (
                        <tr key={item.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="font-medium">{item.rawMaterial.name}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {item.quantity}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {item.rawMaterial.unit}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <button
                              onClick={() => handleDeleteRecipeItem(item.rawMaterialId)}
                              className="text-red-600 hover:text-red-900"
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
          
          {/* Right Column - Add Recipe Item Form */}
          <div className="bg-white shadow-md rounded-lg p-6">
            <h2 className="text-lg font-semibold mb-4 text-black">Add Ingredient</h2>
            
            <form onSubmit={handleAddRecipeItem}>
              <div className="mb-4">
                <label className="block text-gray-700 font-medium mb-2">
                  Raw Material:
                </label>
                <select
                  className="w-full p-2 border rounded-md focus:border-blue-500 text-black focus:outline-none"
                  value={selectedRawMaterialId}
                  onChange={(e) => setSelectedRawMaterialId(e.target.value)}
                  required
                >
                  <option value="">Select a raw material</option>
                  {rawMaterials.map(material => (
                    <option key={material.id} value={material.id}>
                      {material.name} ({material.unit})
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="mb-6">
                <label className="block text-gray-700 font-medium mb-2">
                  Quantity:
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.0001"
                  className="w-full p-2 border rounded-md text-black focus:border-blue-500 focus:outline-none"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  required
                  placeholder="Enter quantity"
                />
              </div>
              
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                    isSubmitting ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  {isSubmitting ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Adding...
                    </>
                  ) : (
                    'Add to Recipe'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}