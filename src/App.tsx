import { useState, useRef, useEffect } from 'react'
import { Plus, Trash2, Copy } from 'lucide-react'
import { calculateBill, type BillInput } from './lib/calculate'

const STORAGE_KEY = 'splits-data'

interface Dish {
  id: string
  name: string
  quantity: number
  priceCents: number
  priceMode: 'total' | 'each'
  diners: number[]
}

interface StoredData {
  diners: string[]
  dishes: Dish[]
  taxCents: number
  tipCents: number
  totalCents: number | null
}

function loadData(): StoredData {
  const defaultDish = (): Dish => ({
    id: crypto.randomUUID(),
    name: '',
    quantity: 1,
    priceCents: 0,
    priceMode: 'total',
    diners: [],
  })

  const stored = localStorage.getItem(STORAGE_KEY)
  if (!stored) {
    return {
      diners: [],
      dishes: [defaultDish()],
      taxCents: 0,
      tipCents: 0,
      totalCents: null,
    }
  }
  try {
    const data = JSON.parse(stored) as StoredData
    // Migrate old dishes without priceMode
    data.dishes = data.dishes.map(d => ({
      ...d,
      priceMode: d.priceMode ?? 'total',
    }))
    return data
  } catch {
    return {
      diners: [],
      dishes: [defaultDish()],
      taxCents: 0,
      tipCents: 0,
      totalCents: null,
    }
  }
}

function formatCents(cents: number): string {
  return '$' + (cents / 100).toFixed(2)
}

function parseDollars(value: string): number {
  const parsed = parseFloat(value)
  return isNaN(parsed) ? 0 : Math.round(parsed * 100)
}

export default function App() {
  const [dishes, setDishes] = useState<Dish[]>([])
  const [diners, setDiners] = useState<string[]>([])
  const [taxCents, setTaxCents] = useState(0)
  const [tipCents, setTipCents] = useState(0)
  const [totalCents, setTotalCents] = useState<number | null>(null)
  const [isLoaded, setIsLoaded] = useState(false)
  const [showBreakdowns, setShowBreakdowns] = useState(false)
  const [copyFeedback, setCopyFeedback] = useState(false)
  const nextDinerRef = useRef<HTMLInputElement>(null)

  // Load data on mount
  useEffect(() => {
    const data = loadData()
    setDishes(data.dishes)
    setDiners(data.diners)
    setTaxCents(data.taxCents)
    setTipCents(data.tipCents)
    setTotalCents(data.totalCents)
    setIsLoaded(true)
  }, [])

  // Save data when it changes
  useEffect(() => {
    if (!isLoaded) return
    const data: StoredData = { dishes, diners, taxCents, tipCents, totalCents }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  }, [dishes, diners, taxCents, tipCents, totalCents, isLoaded])

  const namedDiners = diners.map((name, idx) => ({ name, idx })).filter(d => d.name.trim())

  const addDish = () => {
    setDishes([...dishes, { id: crypto.randomUUID(), name: '', quantity: 1, priceCents: 0, priceMode: 'total', diners: [] }])
  }

  const addDiner = () => {
    setDiners([...diners, ''])
    setTimeout(() => nextDinerRef.current?.focus(), 0)
  }

  const removeDish = (index: number) => {
    setDishes(dishes.filter((_, i) => i !== index))
  }

  const removeDiner = (index: number) => {
    setDiners(diners.filter((_, i) => i !== index))
    setDishes(dishes.map(dish => ({
      ...dish,
      diners: dish.diners.filter(d => d !== index).map(d => d > index ? d - 1 : d)
    })))
  }

  const updateDish = (index: number, field: keyof Dish, value: Dish[keyof Dish]) => {
    const newDishes = [...dishes]
    const dish = newDishes[index]
    if (dish) {
      newDishes[index] = { ...dish, [field]: value }
      setDishes(newDishes)
    }
  }

  const toggleDiner = (dishIndex: number, dinerIndex: number) => {
    const newDishes = [...dishes]
    const dish = newDishes[dishIndex]
    if (!dish) return

    const dinerSet = new Set(dish.diners)
    if (dinerSet.has(dinerIndex)) {
      dinerSet.delete(dinerIndex)
    } else {
      dinerSet.add(dinerIndex)
    }
    dish.diners = Array.from(dinerSet)
    setDishes(newDishes)
  }

  const toggleAllDiners = (dishIndex: number) => {
    const newDishes = [...dishes]
    const dish = newDishes[dishIndex]
    if (!dish) return

    const allDinerIndices = namedDiners.map(d => d.idx)
    const allSelected = allDinerIndices.every(idx => dish.diners.includes(idx))
    dish.diners = allSelected ? [] : allDinerIndices
    setDishes(newDishes)
  }

  const togglePriceMode = (dishIndex: number) => {
    const newDishes = [...dishes]
    const dish = newDishes[dishIndex]
    if (!dish) return

    const newMode = dish.priceMode === 'total' ? 'each' : 'total'

    // Convert price when toggling
    if (dish.priceCents > 0 && dish.quantity > 1) {
      if (newMode === 'each') {
        // Converting from total to each: divide
        dish.priceCents = Math.round(dish.priceCents / dish.quantity)
      } else {
        // Converting from each to total: multiply
        dish.priceCents = dish.priceCents * dish.quantity
      }
    }

    dish.priceMode = newMode
    setDishes(newDishes)
  }

  // Get total cents for a dish based on its price mode
  const getDishTotalCents = (dish: Dish): number => {
    if (dish.priceMode === 'each') {
      return dish.priceCents * dish.quantity
    }
    return dish.priceCents
  }

  // Build bill input for calculation
  const buildBillInput = (): BillInput | null => {
    const namedDishes = dishes.filter(d => d.name.trim())
    if (namedDiners.length === 0 || namedDishes.length === 0) return null

    const participants = namedDiners.map(d => d.name)

    return {
      items: namedDishes.map(d => ({
        id: d.id,
        name: d.name,
        amountCents: getDishTotalCents(d),
        assignedTo: d.diners
          .filter(idx => diners[idx]?.trim())
          .map(idx => diners[idx]!)
      })),
      taxCents,
      tipCents,
      feesCents: 0,
      participants,
    }
  }

  const billInput = buildBillInput()
  const result = billInput ? calculateBill(billInput) : null

  const subtotalCents = dishes.reduce((sum, dish) => sum + getDishTotalCents(dish), 0)
  const calculatedTotalCents = subtotalCents + taxCents + tipCents
  const hasMismatch = totalCents !== null && totalCents !== calculatedTotalCents

  const generateSummary = (): string => {
    if (!result) return 'No bill to summarize'

    const lines: string[] = []
    lines.push('Bill Split Summary')
    lines.push('==================')
    lines.push('')

    for (const share of result.shares) {
      lines.push(`${share.personId}: ${formatCents(share.totalCents)}`)
      for (const item of share.items) {
        const dish = dishes.find(d => d.id === item.itemId)
        const splitCount = dish?.diners.filter(idx => diners[idx]?.trim()).length ?? 1
        const splitNote = splitCount > 1 ? ` (split ${splitCount} ways)` : ''
        lines.push(`  - ${item.itemName}${splitNote}: ${formatCents(item.shareCents)}`)
      }
      if (share.taxCents > 0) lines.push(`  Tax: ${formatCents(share.taxCents)}`)
      if (share.tipCents > 0) lines.push(`  Tip: ${formatCents(share.tipCents)}`)
      lines.push('')
    }

    lines.push(`Total: ${formatCents(result.totalCents)}`)
    return lines.join('\n')
  }

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generateSummary()).then(() => {
      setCopyFeedback(true)
      setTimeout(() => setCopyFeedback(false), 2000)
    })
  }

  if (!isLoaded) return null

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-2xl mx-auto space-y-4">
        {/* Diners Section */}
        <section className="bg-white p-4 rounded-lg shadow-sm">
          <h2 className="text-lg font-semibold mb-3">Diners</h2>
          <div className="space-y-2">
            {diners.map((diner, index) => (
              <div key={index} className="flex gap-2">
                <input
                  type="text"
                  value={diner}
                  ref={index === diners.length - 1 ? nextDinerRef : null}
                  onChange={(e) => {
                    const newDiners = [...diners]
                    newDiners[index] = e.target.value
                    setDiners(newDiners)
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      addDiner()
                    }
                  }}
                  placeholder="Name"
                  className="border rounded px-3 py-2 flex-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={() => removeDiner(index)}
                  className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                >
                  <Trash2 size={20} />
                </button>
              </div>
            ))}
            <button
              onClick={addDiner}
              className="flex items-center gap-2 text-blue-600 hover:bg-blue-50 rounded px-3 py-2"
            >
              <Plus size={20} /> Add Diner
            </button>
          </div>
        </section>

        {/* Dishes Section */}
        <section className="bg-white p-4 rounded-lg shadow-sm">
          <h2 className="text-lg font-semibold mb-3">Dishes</h2>
          <div className="space-y-3">
            {dishes.map((dish, dishIndex) => {
              const hasNoDiners = dish.diners.length === 0 && (dish.name || dish.priceCents > 0)
              return (
                <div
                  key={dish.id}
                  className={`p-3 border rounded-lg space-y-2 ${
                    hasNoDiners ? 'border-yellow-500 bg-yellow-50' : 'border-gray-200'
                  }`}
                >
                  <div className="flex gap-2 flex-wrap">
                    <input
                      type="text"
                      value={dish.name}
                      onChange={(e) => updateDish(dishIndex, 'name', e.target.value)}
                      placeholder="Item name"
                      className="border rounded px-3 py-2 flex-1 min-w-[120px] focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <input
                      type="number"
                      value={dish.quantity}
                      onChange={(e) => updateDish(dishIndex, 'quantity', parseInt(e.target.value) || 1)}
                      onKeyDown={(e) => {
                        if (e.key === 'ArrowUp' || e.key === 'ArrowDown') e.preventDefault()
                      }}
                      placeholder="Qty"
                      className="border rounded px-3 py-2 w-16 text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
                      min="1"
                    />
                    <div className="flex items-center gap-1">
                      <div className="relative w-24">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">$</span>
                        <input
                          type="number"
                          value={dish.priceCents > 0 ? (dish.priceCents / 100).toFixed(2) : ''}
                          onChange={(e) => updateDish(dishIndex, 'priceCents', parseDollars(e.target.value))}
                          onKeyDown={(e) => {
                            if (e.key === 'ArrowUp' || e.key === 'ArrowDown') e.preventDefault()
                          }}
                          placeholder="0.00"
                          className="border rounded px-3 py-2 pl-7 w-full text-right focus:outline-none focus:ring-2 focus:ring-blue-500"
                          step="0.01"
                        />
                      </div>
                      <button
                        onClick={() => togglePriceMode(dishIndex)}
                        className="px-2 py-1 text-xs rounded bg-gray-200 hover:bg-gray-300 whitespace-nowrap"
                      >
                        {dish.priceMode === 'total' ? 'total' : 'each'}
                      </button>
                      {dish.priceCents > 0 && dish.quantity > 1 && (
                        <span className="text-sm text-gray-400 whitespace-nowrap">
                          {dish.priceMode === 'total'
                            ? `${(dish.priceCents / dish.quantity / 100).toFixed(2)} ea`
                            : `${(dish.priceCents * dish.quantity / 100).toFixed(2)} tot`
                          }
                        </span>
                      )}
                    </div>
                    <span className="py-2 w-20 text-right font-semibold">
                      {formatCents(getDishTotalCents(dish))}
                    </span>
                    <button
                      onClick={() => removeDish(dishIndex)}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                    >
                      <Trash2 size={20} />
                    </button>
                  </div>
                  {hasNoDiners && (
                    <div className="text-sm text-yellow-700">
                      No diners assigned to this dish
                    </div>
                  )}
                  <div className="flex flex-wrap gap-2">
                    {namedDiners.length > 0 && (
                      <button
                        onClick={() => toggleAllDiners(dishIndex)}
                        className="px-3 py-1 rounded-full bg-gray-200 text-gray-700 font-medium text-sm"
                      >
                        All
                      </button>
                    )}
                    {namedDiners.map(({ name, idx }) => (
                      <button
                        key={idx}
                        onClick={() => toggleDiner(dishIndex, idx)}
                        className={`px-3 py-1 rounded-full text-sm transition-colors ${
                          dish.diners.includes(idx)
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {name}
                      </button>
                    ))}
                  </div>
                </div>
              )
            })}
            <button
              onClick={addDish}
              className="flex items-center gap-2 text-blue-600 hover:bg-blue-50 rounded px-3 py-2"
            >
              <Plus size={20} /> Add Dish
            </button>
          </div>
        </section>

        {/* Bill Totals Section */}
        <section className="bg-white p-4 rounded-lg shadow-sm">
          <h2 className="text-lg font-semibold mb-3">Bill Totals</h2>
          <div className="bg-gray-50 rounded p-3 mb-4 flex gap-6 flex-wrap text-sm">
            <div>
              <span className="text-gray-500">Subtotal:</span>
              <span className="ml-2 font-semibold">{formatCents(subtotalCents)}</span>
            </div>
            <div>
              <span className="text-gray-500">Calculated Total:</span>
              <span className="ml-2 font-semibold">{formatCents(calculatedTotalCents)}</span>
            </div>
          </div>
          <div className="flex gap-4 flex-wrap">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-500">Tax</label>
              <div className="relative w-24">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">$</span>
                <input
                  type="number"
                  value={taxCents > 0 ? (taxCents / 100).toFixed(2) : ''}
                  onChange={(e) => setTaxCents(parseDollars(e.target.value))}
                  onKeyDown={(e) => {
                    if (e.key === 'ArrowUp' || e.key === 'ArrowDown') e.preventDefault()
                  }}
                  placeholder="0.00"
                  className="border rounded px-3 py-2 pl-7 w-full text-right focus:outline-none focus:ring-2 focus:ring-blue-500"
                  step="0.01"
                />
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-500">Tip</label>
              <div className="relative w-24">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">$</span>
                <input
                  type="number"
                  value={tipCents > 0 ? (tipCents / 100).toFixed(2) : ''}
                  onChange={(e) => setTipCents(parseDollars(e.target.value))}
                  onKeyDown={(e) => {
                    if (e.key === 'ArrowUp' || e.key === 'ArrowDown') e.preventDefault()
                  }}
                  placeholder="0.00"
                  className="border rounded px-3 py-2 pl-7 w-full text-right focus:outline-none focus:ring-2 focus:ring-blue-500"
                  step="0.01"
                />
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-500">Total (from receipt)</label>
              <div className="relative w-28">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">$</span>
                <input
                  type="number"
                  value={totalCents !== null ? (totalCents / 100).toFixed(2) : ''}
                  onChange={(e) => {
                    const val = e.target.value
                    setTotalCents(val === '' ? null : parseDollars(val))
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'ArrowUp' || e.key === 'ArrowDown') e.preventDefault()
                  }}
                  placeholder="0.00"
                  className={`border rounded px-3 py-2 pl-7 w-full text-right focus:outline-none focus:ring-2 ${
                    hasMismatch ? 'border-yellow-500 bg-yellow-50 focus:ring-yellow-500' : 'focus:ring-blue-500'
                  }`}
                  step="0.01"
                />
              </div>
              {hasMismatch && totalCents !== null && (
                <div className="text-xs text-yellow-700">
                  Off by {formatCents(Math.abs(totalCents - calculatedTotalCents))}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Individual Shares Section */}
        <section className="bg-white p-4 rounded-lg shadow-sm">
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-lg font-semibold">Individual Shares</h2>
            {result && (
              <button
                onClick={() => setShowBreakdowns(!showBreakdowns)}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                {showBreakdowns ? 'Hide Details' : 'Show Details'}
              </button>
            )}
          </div>
          {!result ? (
            <p className="text-gray-400 italic">
              {namedDiners.length === 0 ? 'Add diners to see shares' : 'Add dishes to see shares'}
            </p>
          ) : (
            <>
              {/* Summary Table */}
              <div className="border rounded-lg mb-4 overflow-hidden">
                {result.shares.map((share, index) => (
                  <div
                    key={share.personId}
                    className={`flex justify-between items-center p-3 ${
                      index !== result.shares.length - 1 ? 'border-b' : ''
                    }`}
                  >
                    <span className="font-medium">{share.personId}</span>
                    <span className="font-semibold text-blue-600">
                      {formatCents(share.totalCents)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Detailed Breakdowns */}
              {showBreakdowns && (
                <div className="space-y-3 mb-4">
                  <h3 className="font-semibold text-gray-700">Detailed Breakdowns</h3>
                  {result.shares.map((share) => (
                    <div key={share.personId} className="border rounded-lg p-3 bg-gray-50">
                      <div className="flex justify-between font-semibold text-lg mb-2">
                        <span>{share.personId}</span>
                        <span>{formatCents(share.totalCents)}</span>
                      </div>
                      <div className="text-sm text-gray-600 space-y-1 pl-4">
                        {share.items.map((item) => {
                          const dish = dishes.find(d => d.id === item.itemId)
                          const dishTotal = dish ? getDishTotalCents(dish) : item.shareCents
                          const splitCount = dish?.diners.filter(idx => diners[idx]?.trim()).length ?? 1
                          return (
                            <div key={item.itemId} className="flex justify-between">
                              <span>
                                {item.itemName}
                                {splitCount > 1 && (
                                  <span className="text-gray-400 text-xs ml-1">
                                    ({formatCents(dishTotal)} ÷ {splitCount})
                                  </span>
                                )}
                              </span>
                              <span>{formatCents(item.shareCents)}</span>
                            </div>
                          )
                        })}
                        <div className="flex justify-between border-t pt-1">
                          <span>Food Subtotal</span>
                          <span>{formatCents(share.subtotalCents)}</span>
                        </div>
                        {share.taxCents > 0 && (
                          <div className="flex justify-between">
                            <span>Tax Share</span>
                            <span>{formatCents(share.taxCents)}</span>
                          </div>
                        )}
                        {share.tipCents > 0 && (
                          <div className="flex justify-between">
                            <span>Tip Share</span>
                            <span>{formatCents(share.tipCents)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex justify-between items-center pt-3 border-t font-semibold">
                <span>Total:</span>
                <span>{formatCents(result.totalCents)}</span>
              </div>
              <button
                onClick={copyToClipboard}
                className={`mt-4 flex items-center gap-2 px-4 py-2 rounded transition-colors ${
                  copyFeedback
                    ? 'bg-green-500 text-white'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                <Copy size={18} />
                {copyFeedback ? 'Copied!' : 'Copy Summary'}
              </button>
            </>
          )}
        </section>
      </div>
    </div>
  )
}
