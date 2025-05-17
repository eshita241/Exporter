'use client'
import { useState, useEffect } from 'react'
import { RawMaterial } from '@prisma/client'

interface NewMaterial {
  name: string
  unit: string
  description: string
  quantity?: number
}

export default function RawMaterialsAdmin() {
  const [materials, setMaterials] = useState<RawMaterial[]>([])
  const [newMaterial, setNewMaterial] = useState<NewMaterial>({
    name: '',
    unit: '',
    description: '',
    quantity:0
  })
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [editingMaterial, setEditingMaterial] = useState<RawMaterial | null>(null)
  const [quantityUpdate, setQuantityUpdate] = useState<{id:string, value:string}> ({id:'',value:'0'})

  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  useEffect(() => {
    const fetchMaterials = async () => {
      try {
        const response = await fetch('/api/raw-materials')
        if (!response.ok) throw new Error('Failed to fetch materials')
        const data = await response.json()
        setMaterials(data)
      } catch (error) {
        console.error('Error fetching materials:', error)
        setError('Failed to load materials')
      } finally {
        setIsLoading(false)
      }
    }

    fetchMaterials()
  }, [])

  const handleAddMaterial = async () => {
    if (!newMaterial.name || !newMaterial.unit) {
      alert('Name and unit are required')
      return
    }

    setIsSubmitting(true)
    setError(null)
    try {
      const response = await fetch('/api/raw-materials', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...newMaterial,
          quantity: newMaterial.quantity || 0
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to add material')
      }

      const addedMaterial = await response.json()
      setMaterials([...materials, addedMaterial])
      setNewMaterial({ name: '', unit: '', description: '', quantity:0 })
    } catch (error) {
      console.error('Error:', error)
      alert(error instanceof Error ? error.message : 'Failed to add material')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleUpdateQuantity = async (materialId: string) => {
    if (!quantityUpdate.value || isNaN(Number(quantityUpdate.value))) {
      setError('Please enter a valid quantity')
      return
    }

    try {
      const response = await fetch('/api/raw-materials/quantity', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          materialId,
          quantity: Number(quantityUpdate.value),
          action: 'set'
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update quantity')
      }

      const updatedMaterial = await response.json()
      setMaterials(materials.map(m => 
        m.id === updatedMaterial.id ? updatedMaterial : m
      ))
      setQuantityUpdate({id: '', value: '0'})
      setSuccessMessage('Quantity updated successfully!')
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (error) {
      console.error('Error:', error)
      setError(error instanceof Error ? error.message : 'Failed to update quantity')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Fixed header */}
      <header className="fixed top-0 left-0 right-0 bg-white shadow-sm z-10">
        <div className="px-4 py-4">
          <h1 className="text-xl font-bold text-blue-700">Raw Materials RMFPL</h1>
        </div>
      </header>
      
      <main className="pt-16 px-4 pb-6 max-w-lg mx-auto">
        {/* Error/Success messages */}
        {error && (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-lg mb-4 mt-2">
            <div className="flex">
              <svg className="h-5 w-5 text-red-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <span>{error}</span>
            </div>
          </div>
        )}
        
        {successMessage && (
          <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 rounded-lg mb-4 mt-2">
            <div className="flex">
              <svg className="h-5 w-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>{successMessage}</span>
            </div>
          </div>
        )}
        
        {/* Add New Material Form */}
        <div className="bg-white shadow rounded-lg p-5 mt-4">
          <h2 className="text-lg font-semibold text-black mb-4">Add New Raw Material</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Name*
              </label>
              <input
                type="text"
                placeholder="Enter material name"
                className="w-full border rounded-lg p-3 text-black focus:ring-blue-500 focus:border-blue-500"
                value={newMaterial.name}
                onChange={(e) => setNewMaterial({...newMaterial, name: e.target.value})}
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Unit* (kg, g, etc.)
              </label>
              <input
                type="text"
                placeholder="Enter unit of measurement"
                className="w-full border rounded-lg p-3 text-black focus:ring-blue-500 focus:border-blue-500"
                value={newMaterial.unit}
                onChange={(e) => setNewMaterial({...newMaterial, unit: e.target.value})}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Initial Quantity
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                placeholder="Enter initial quantity"
                className="w-full border rounded-lg p-3 text-black focus:ring-blue-500 focus:border-blue-500"
                value={newMaterial.quantity}
                onChange={(e) => setNewMaterial({
                  ...newMaterial, 
                  quantity: parseFloat(e.target.value) || 0
                })}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description (optional)
              </label>
              <input
                type="text"
                placeholder="Enter description"
                className="w-full border rounded-lg p-3 text-black focus:ring-blue-500 focus:border-blue-500"
                value={newMaterial.description}
                onChange={(e) => setNewMaterial({...newMaterial, description: e.target.value})}
              />
            </div>
            
            <button
              onClick={handleAddMaterial}
              disabled={isSubmitting}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <div className="flex justify-center items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Adding...
                </div>
              ) : (
                'Add Material'
              )}
            </button>
          </div>
        </div>
        
        {/* Existing Raw Materials */}
        <div className="bg-white shadow rounded-lg overflow-hidden mt-6">
          <div className="px-4 py-3 border-b">
            <h2 className="font-semibold text-gray-800">Existing Raw Materials</h2>
          </div>
          
          {isLoading ? (
            <div className="flex justify-center items-center p-8">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 text-black border-blue-500"></div>
            </div>
          ) : materials.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              No raw materials found
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">Name</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">Unit</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">Current Qty</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider">Update Qty</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-900 uppercase tracking-wider hidden sm:table-cell">Description</th>
                  </tr>
                </thead>
               <tbody className="divide-y divide-gray-200 text-black">
                  {materials.map((material) => (
                    <tr key={material.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 whitespace-nowrap">{material.name}</td>
                      <td className="px-4 py-3 whitespace-nowrap">{material.unit}</td>
                      <td className="px-4 py-3 whitespace-nowrap">{material.quantity}</td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {quantityUpdate.id === material.id ? (
                          <div className="flex space-x-2">
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              className="w-20 border rounded p-1"
                              value={quantityUpdate.value}
                              onChange={(e) => setQuantityUpdate({
                                id: material.id,
                                value: e.target.value
                              })}
                            />
                            <button
                              onClick={() => handleUpdateQuantity(material.id)}
                              className="bg-blue-500 text-white px-2 py-1 rounded text-sm"
                            >
                              Save
                            </button>
                            <button
                              onClick={() => setQuantityUpdate({id: '', value: '0'})}
                              className="bg-gray-500 text-white px-2 py-1 rounded text-sm"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setQuantityUpdate({
                              id: material.id,
                              value: material.quantity.toString()
                            })}
                            className="bg-green-500 text-white px-2 py-1 rounded text-sm"
                          >
                            Update
                          </button>
                        )}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap hidden sm:table-cell">
                        {material.description || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}