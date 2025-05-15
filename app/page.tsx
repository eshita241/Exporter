'use client'
import { useState, useEffect } from 'react'
import { SKU } from '@prisma/client'

interface SKUWithBatches extends SKU {
  batches: number
}

export default function BatchEntryPage() {
  const [skus, setSkus] = useState<SKUWithBatches[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)

  useEffect(() => {
    const fetchSKUs = async () => {
      try {
        setIsLoading(true)
        setError(null)
        
        const response = await fetch('/api/skus')
        
        if (!response.ok) {
          throw new Error(`Failed to fetch SKUs: ${response.status}`)
        }

        const data: SKU[] = await response.json()
        // Initialize with batches set to 0
        setSkus(data.map(sku => ({ ...sku, batches: 0 })))
      } catch (err) {
        console.error('Failed to fetch SKUs:', err)
        setError('Failed to load SKUs. Please try again.')
      } finally {
        setIsLoading(false)
      }
    }

    fetchSKUs()
  }, [])

  const handleBatchChange = (skuId: string, value: string) => {
    const batches = parseInt(value) || 0
    setSkus(prevSkus => 
      prevSkus.map(sku => 
        sku.id === skuId ? { ...sku, batches } : sku
      )
    )
  }

  const handleSaveBatches = async () => {
    setIsSaving(true)
    setSaveSuccess(false)
    
    try {
      const response = await fetch('/api/batches', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          batchData: skus
            .filter(sku => sku.batches > 0) // Only save SKUs with batches > 0
            .map(sku => ({
              skuId: sku.id,
              batches: sku.batches,
              date: new Date().toISOString().split('T')[0] // Get current date in YYYY-MM-DD format
            }))
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to save batches')
      }

      setSaveSuccess(true)
      
      // Auto-hide success message after 3 seconds
      setTimeout(() => {
        setSaveSuccess(false)
      }, 3000)
      
    } catch (err) {
      console.error('Error saving batches:', err)
      setError('Failed to save batches. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleGenerateExcel = async () => {
    setIsGenerating(true)
    try {
      const response = await fetch('/api/generate-excel', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          batchData: skus.map(sku => ({
            skuId: sku.id,
            batches: sku.batches
          }))
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to generate Excel')
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'material_requirements.xlsx'
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      a.remove()
    } catch (err) {
      console.error('Error generating Excel:', err)
      alert('Failed to generate Excel file. Please try again.')
    } finally {
      setIsGenerating(false)
    }
  }

  if (isLoading) {
    return (
      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-bold mb-4">Batch Entry</h1>
        <div className="flex justify-center items-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-bold mb-4">Batch Entry</h1>
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
        <button
          onClick={() => {
            setError(null)
            window.location.reload()
          }}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        >
          Retry
        </button>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Batch Entry</h1>
      
      {saveSuccess && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
          Batches saved successfully!
        </div>
      )}
      
      {skus.length === 0 ? (
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded">
          No SKUs found. Please add SKUs in the admin section first.
        </div>
      ) : (
        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">SKU</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Code</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Batches</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {skus.map((sku) => (
                  <tr key={sku.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-gray-900">{sku.name}</div>
                      {sku.description && (
                        <div className="text-sm text-gray-500">{sku.description}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {sku.code}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="number"
                        min="0"
                        className="border rounded py-2 px-3 w-24 focus:ring-blue-500 text-black focus:border-blue-500"
                        value={sku.batches}
                        onChange={(e) => handleBatchChange(sku.id, e.target.value)}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-6 py-4 bg-gray-50 flex justify-between">
            <button
              onClick={handleSaveBatches}
              disabled={isSaving || skus.every(sku => sku.batches === 0)}
              className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 ${
                isSaving || skus.every(sku => sku.batches === 0) ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {isSaving ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Saving...
                </>
              ) : (
                'Save Batches'
              )}
            </button>
            
            <button
              onClick={handleGenerateExcel}
              disabled={isGenerating || skus.length === 0}
              className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                isGenerating || skus.length === 0 ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {isGenerating ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-black" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Generating...
                </>
              ) : (
                'Generate Excel Report'
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}