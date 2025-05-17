'use client'

import { useState, useEffect } from 'react'
import { SKU, DailyBatch } from '@prisma/client'

interface SKUWithBatches extends SKU {
  batches: number
  dailyBatches: DailyBatch[]
}
interface AuthCredentials {
  userId: string
  password: string
}

export default function BatchEntryPage() {
  const [skus, setSkus] = useState<SKUWithBatches[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [selectedDate] = useState(new Date().toISOString().split('T')[0])

  const [showAuthModal, setShowAuthModal] = useState(false)
  const [authCredentials, setAuthCredentials] = useState<AuthCredentials>({
    userId: '',
    password: ''
  })
  const [authError, setAuthError] = useState<string | null>(null)
  const handleAuthInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  const { name, value } = e.target
  setAuthCredentials(prev => ({
    ...prev,
    [name]: value
  }))
}
const handleGenerateClick = () => {
  setShowAuthModal(true)
}

const handleAuthSubmit = async (e: React.FormEvent) => {
  e.preventDefault()
  setAuthError(null)
  
  if (!authCredentials.userId || !authCredentials.password) {
    setAuthError('Both user ID and password are required')
    return
  }

  try {
    const response = await fetch('/api/verify-creds', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(authCredentials),
    })

    if (!response.ok) {
      throw new Error('Invalid credentials')
    }

    setShowAuthModal(false)
    await handleGenerateExcel()
  } catch (err) {
    console.error('Authentication error:', err)
    setAuthError('Invalid credentials. Please try again.')
  }
}
  useEffect(() => {
    const fetchSKUs = async () => {
      try {
        setIsLoading(true)
        setError(null)
        
        const response = await fetch('/api/skus')
        
        if (!response.ok) {
          throw new Error(`Failed to fetch SKUs: ${response.status}`)
        }

        const data: (SKU & {dailyBatches:DailyBatch[]})[] = await response.json()
        setSkus(data.map(sku => ({ ...sku, batches: sku.dailyBatches[0]?.batches || 0 })))
      } catch (err) {
        console.error('Failed to fetch SKUs:', err)
        setError('Failed to load SKUs. Please try again.')
      } finally {
        setIsLoading(false)
      }
    }

    fetchSKUs()
  }, [selectedDate])

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
            .filter(sku => sku.batches > 0)
            .map(sku => ({
              skuId: sku.id,
              batches: sku.batches,
              date: selectedDate
            }))
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to save batches')
      }

      setSaveSuccess(true)
      
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
        'Authorization': `Basic ${btoa(`${authCredentials.userId}:${authCredentials.password}`)}`
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
      <div className="min-h-screen bg-gray-50 pb-20">
        <header className="fixed top-0 left-0 right-0 bg-white shadow-sm z-10">
          <div className="px-4 py-4">
            <h1 className="text-xl font-bold text-blue-700">Batch Entry</h1>
          </div>
        </header>
        
        <main className="pt-16 px-4 pb-24">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-blue-500"></div>
          </div>
        </main>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 pb-20">
        <header className="fixed top-0 left-0 right-0 bg-white shadow-sm z-10">
          <div className="px-4 py-4">
            <h1 className="text-xl font-bold text-blue-700">Batch Entry</h1>
          </div>
        </header>
        
        <main className="pt-20 px-4 pb-24">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
          <button
            onClick={() => {
              setError(null)
              window.location.reload()
            }}
            className="w-full bg-blue-500 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg shadow-sm"
          >
            Retry
          </button>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="fixed top-0 left-0 right-0 bg-white shadow-sm z-10">
        <div className="px-4 py-4">
          <h1 className="text-xl font-bold text-blue-700">Batch Entry</h1>
        </div>
      </header>
      
      <main className="pt-16 px-4 pb-24 max-w-lg mx-auto">
        {saveSuccess && (
          <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 rounded-lg mb-4 mt-2 flex items-center">
            <svg className="h-5 w-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span>Batches saved successfully!</span>
          </div>
        )}
        
        {skus.length === 0 ? (
          <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 rounded-lg mt-4">
            <div className="flex">
              <svg className="h-5 w-5 text-yellow-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <span>No SKUs found. Please add SKUs in the admin section first.</span>
            </div>
          </div>
        ) : (
          <div className="bg-white shadow-md rounded-lg overflow-hidden mt-4">
            <div className="p-4 border-b">
              <h2 className="font-medium text-gray-700">Enter Batch Quantities</h2>
            </div>
            
            <ul className="divide-y divide-gray-200">
              {skus.map((sku) => (
                <li key={sku.id} className="p-4 hover:bg-gray-50">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                    <div className="mb-2 sm:mb-0">
                      <h3 className="font-medium text-gray-900">{sku.name}</h3>
                      <div className="text-sm text-gray-500">{sku.code}</div>
                      {sku.description && (
                        <div className="text-sm text-gray-500 mt-1">{sku.description}</div>
                      )}
                    </div>
                    <div className="flex items-center">
                      <label className="mr-2 text-sm text-gray-600">Batches:</label>
                      <input
                        type="number"
                        min="0"
                        className="border rounded-lg py-2 px-3 w-20 focus:ring-blue-500 text-black focus:border-blue-500 text-center"
                        value={sku.batches || ""}
                        onChange={(e) => handleBatchChange(sku.id, e.target.value)}
                      />
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </main>
      
      <footer className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4">
        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 max-w-lg mx-auto">
          <button
            onClick={handleSaveBatches}
            disabled={isSaving || skus.every(sku => sku.batches === 0)}
            className="flex-1 flex justify-center items-center px-4 py-3 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
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
  onClick={handleGenerateClick}
  disabled={isGenerating || skus.length === 0}
  className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
    isGenerating || skus.length === 0 ? 'opacity-50 cursor-not-allowed' : ''
  }`}
>
  Generate Excel Report
</button>
        </div>
      </footer>
      {showAuthModal && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
    <div className="bg-white rounded-lg p-6 w-full max-w-md">
      <h2 className="text-xl font-bold text-black mb-4">Authentication Required</h2>
      <form onSubmit={handleAuthSubmit}>
        <div className="mb-4">
          <label className="block text-sm text-black font-medium mb-1">User ID</label>
          <input
            type="text"
            name="userId"
            value={authCredentials.userId}
            onChange={handleAuthInputChange}
            className="border rounded py-2 px-3 w-full text-black"
            required
          />
        </div>
        <div className="mb-4">
          <label className="block text-sm text-black font-medium mb-1">Password</label>
          <input
            type="password"
            name="password"
            value={authCredentials.password}
            onChange={handleAuthInputChange}
            className="border rounded py-2 px-3 w-full text-black"
            required
          />
        </div>
        {authError && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {authError}
          </div>
        )}
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={() => setShowAuthModal(false)}
            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isGenerating}
            className={`px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 ${
              isGenerating ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {isGenerating ? 'Verifying...' : 'Generate Excel'}
          </button>
        </div>
      </form>
    </div>
  </div>
)}

    </div>
  )
}