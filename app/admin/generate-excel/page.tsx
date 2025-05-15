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
    <main className="p-6 max-w-md mx-auto space-y-4">
      <h1 className="text-2xl font-semibold">Generate Excel Report</h1>

      <label className="block">
        <span className="text-sm text-gray-700">Select Date (optional)</span>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="mt-1 block w-full border rounded-md p-2"
        />
      </label>

      <button
        onClick={handleDownload}
        disabled={loading}
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? 'Generating...' : 'Download Excel'}
      </button>
    </main>
  )
}
