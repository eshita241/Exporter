'use client'

import { useEffect, useState } from 'react'

interface RawMaterial {
  name: string
}

interface RecipeItem {
  id: string
  rawMaterial?: RawMaterial
}

interface SKU {
  id: string
  name: string
  code: string
  description?: string
  recipeItems?: RecipeItem[]
}


export default function SKUPage() {
  const [skus, setSkus] = useState<SKU[]>([])
  const [name, setName] = useState('')
  const [code, setCode] = useState('')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Fetch SKUs on load
  useEffect(() => {
    fetch('/api/skus')
      .then(res => res.json())
      .then(data => setSkus(data))
      .catch(() => setError('Failed to load SKUs'))
  }, [])

  // Handle form submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const res = await fetch('/api/skus', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name, code, description }),
    })

    const data = await res.json()

    if (res.ok) {
      setSkus(prev => [...prev, data])
      setName('')
      setCode('')
      setDescription('')
    } else {
      setError(data.error || 'Failed to create SKU')
    }

    setLoading(false)
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-4">SKUs</h1>

      <form onSubmit={handleSubmit} className="space-y-4 mb-6">
        <input
          type="text"
          placeholder="Name"
          value={name}
          onChange={e => setName(e.target.value)}
          className="w-full p-2 border rounded"
          required
        />
        <input
          type="text"
          placeholder="Code"
          value={code}
          onChange={e => setCode(e.target.value)}
          className="w-full p-2 border rounded"
          required
        />
        <textarea
          placeholder="Description (optional)"
          value={description}
          onChange={e => setDescription(e.target.value)}
          className="w-full p-2 border rounded"
        />
        <button
          type="submit"
          disabled={loading}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Creating...' : 'Create SKU'}
        </button>
        {error && <p className="text-red-600">{error}</p>}
      </form>

      <ul className="space-y-2">
        {skus.map(sku => (
          <li key={sku.id} className="border p-4 rounded">
            <h2 className="font-semibold">{sku.name} ({sku.code})</h2>
            <p>{sku.description}</p>
            {sku.recipeItems && sku.recipeItems?.length > 0 && (
              <div className="mt-2">
                <p className="font-medium">Recipe Items:</p>
                <ul className="ml-4 list-disc">
                  {sku.recipeItems?.map((item: RecipeItem) => (
                    <li key={item.id}>
                      {item.rawMaterial?.name || 'Unnamed Raw Material'}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}
