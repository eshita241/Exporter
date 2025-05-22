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

export default function GenerateExcelPage() {
  const [skus, setSkus] = useState<SKUWithBatches[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedDate] = useState(new Date().toISOString().split('T')[0])
  const [date, setDate] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
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
            <h1 className="text-xl font-bold text-blue-700">GENERATE EXCEL</h1>
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
            <h1 className="text-xl font-bold text-blue-700">GENERATE EXCEL</h1>
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
        <div className="px-4 py-3 flex items-center justify-between">
          <h1 className="text-xl font-bold text-blue-700">Rajnandita Milk & Foods</h1>
          {/* Add install PWA button or other PWA controls here */}
        </div>
      </header>

      {/* Main content with padding to account for fixed header */}
      <main className="px-4 pt-16 pb-20 max-w-lg mx-auto">
        <div className="bg-white rounded-lg shadow-md p-5 mt-4">
          <h2 className="text-lg font-semibold mb-6 text-center">Generate Material Requirements Report</h2>
          
          <div className="space-y-5">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Select Date (optional)
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-gray-50 border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-500">
                If no date is selected, today&rsquo;s date will be used
              </p>
            </div>
            </div>
            </div>
<button
  onClick={handleGenerateClick}
  disabled={isGenerating}
  className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
>
  Generate Excel Report
</button>
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
      </main>
    </div>
          )
}