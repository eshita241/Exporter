'use client'

import { useState } from 'react'

export default function GenerateExcelPage() {
  const [date, setDate] = useState('')
  const [loading, setLoading] = useState(false)

  const handleDownload = async () => {
    try {
      setLoading(true)

      const response = await fetch('/api/generate-excel', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ date }),
      })

      if (!response.ok) throw new Error('Failed to download Excel')

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url

      const formattedDate = date || new Date().toISOString().split('T')[0]
      a.download = `material_requirements_${formattedDate}.xlsx`
      a.click()

      window.URL.revokeObjectURL(url)
    } catch (err) {
      console.error(err)
      alert('Failed to generate Excel file')
    } finally {
      setLoading(false)
    }
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
                If no date is selected, today's date will be used
              </p>
            </div>

            <button
              onClick={handleDownload}
              disabled={loading}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium shadow-sm hover:bg-blue-700 active:bg-blue-800 disabled:opacity-50 transition duration-150"
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Generating...
                </span>
              ) : (
                'Download Excel'
              )}
            </button>
          </div>
        </div>
      </main>

      {/* Footer for PWA */}
      <footer className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200">
        <div className="px-4 py-3 flex items-center justify-center text-sm text-gray-600">
          Material Requirements Generator v1.0
        </div>
      </footer>
    </div>
  )
}