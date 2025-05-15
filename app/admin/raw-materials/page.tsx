'use client'
import { useState, useEffect } from 'react'
import { RawMaterial } from '@prisma/client'

interface NewMaterial {
  name: string
  unit: string
  description: string
}

export default function RawMaterialsAdmin() {
  const [materials, setMaterials] = useState<RawMaterial[]>([])
  const [newMaterial, setNewMaterial] = useState<NewMaterial>({
    name: '',
    unit: '',
    description: ''
  })
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    const fetchMaterials = async () => {
      try {
        const response = await fetch('/api/raw-materials')
        if (!response.ok) throw new Error('Failed to fetch materials')
        const data = await response.json()
        setMaterials(data)
      } catch (error) {
        console.error('Error fetching materials:', error)
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
    try {
      const response = await fetch('/api/raw-materials', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newMaterial),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to add material')
      }

      const addedMaterial = await response.json()
      setMaterials([...materials, addedMaterial])
      setNewMaterial({ name: '', unit: '', description: '' })
    } catch (error) {
      console.error('Error:', error)
      alert(error instanceof Error ? error.message : 'Failed to add material')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-bold mb-4">Raw Materials Management</h1>
        <p>Loading...</p>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Raw Materials Management</h1>
      
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-2">Add New Raw Material</h2>
        <div className="flex gap-4 flex-wrap">
          <input
            type="text"
            placeholder="Name*"
            className="border rounded py-2 px-3 flex-1 min-w-[200px]"
            value={newMaterial.name}
            onChange={(e) => setNewMaterial({...newMaterial, name: e.target.value})}
            required
          />
          <input
            type="text"
            placeholder="Unit* (kg, g, etc.)"
            className="border rounded py-2 px-3 flex-1 min-w-[200px]"
            value={newMaterial.unit}
            onChange={(e) => setNewMaterial({...newMaterial, unit: e.target.value})}
            required
          />
          <input
            type="text"
            placeholder="Description"
            className="border rounded py-2 px-3 flex-1 min-w-[200px]"
            value={newMaterial.description}
            onChange={(e) => setNewMaterial({...newMaterial, description: e.target.value})}
          />
          <button
            onClick={handleAddMaterial}
            disabled={isSubmitting}
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
          >
            {isSubmitting ? 'Adding...' : 'Add Material'}
          </button>
        </div>
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-2">Existing Raw Materials</h2>
        {materials.length === 0 ? (
          <p className="text-white-500">No raw materials found</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unit</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                </tr>
              </thead>
              <tbody className=" divide-y divide-gray-200">
                {materials.map((material) => (
                  <tr key={material.id}>
                    <td className="px-6 py-4 whitespace-nowrap">{material.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{material.unit}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{material.description || '-'}</td>
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