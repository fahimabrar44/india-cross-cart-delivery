'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useDebounce } from '@/hooks/useDebounce'
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from '@/components/ui/command'
import { Search, ShoppingBag, Users, Package } from 'lucide-react'

interface SearchResult {
  _id: string
  type: 'order' | 'customer' | 'product'
  label: string
  subtitle: string
  href: string
}

export function GlobalSearch() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const debouncedQuery = useDebounce(query, 300)
  const router = useRouter()

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((prev) => !prev)
      }
    }
    document.addEventListener('keydown', down)
    return () => document.removeEventListener('keydown', down)
  }, [])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      if (!debouncedQuery.trim()) {
        setResults([])
        return
      }
      setLoading(true)
      try {
        const [ordersRes, customersRes, productsRes] = await Promise.all([
          fetch(`/api/orders?search=${encodeURIComponent(debouncedQuery)}&limit=5`),
          fetch(`/api/customers?search=${encodeURIComponent(debouncedQuery)}&limit=5`),
          fetch(`/api/products?search=${encodeURIComponent(debouncedQuery)}&limit=5`),
        ])

        const [orders, customers, products] = await Promise.all([
          ordersRes.json(),
          customersRes.json(),
          productsRes.json(),
        ])

        if (cancelled) return

        const all: SearchResult[] = []

        ;(orders.data || []).forEach((o: { _id: string; orderNumber: string; customer?: { name: string } }) => {
          all.push({
            _id: o._id,
            type: 'order',
            label: o.orderNumber,
            subtitle: o.customer?.name || 'Order',
            href: `/orders/${o._id}`,
          })
        })

        ;(customers.data || []).forEach((c: { _id: string; name: string; phone?: string }) => {
          all.push({
            _id: c._id,
            type: 'customer',
            label: c.name,
            subtitle: c.phone || '',
            href: `/customers/${c._id}`,
          })
        })

        ;(products.data || []).forEach((p: { _id: string; name: string; sku?: string }) => {
          all.push({
            _id: p._id,
            type: 'product',
            label: p.name,
            subtitle: p.sku || '',
            href: `/products/${p._id}`,
          })
        })

        setResults(all)
      } catch {
        setResults([])
      } finally {
        setLoading(false)
      }
    })()

    return () => { cancelled = true }
  }, [debouncedQuery])

  function handleSelect(result: SearchResult) {
    setOpen(false)
    setQuery('')
    router.push(result.href)
  }

  const orderResults = results.filter((r) => r.type === 'order')
  const customerResults = results.filter((r) => r.type === 'customer')
  const productResults = results.filter((r) => r.type === 'product')

  return (
    <>
      <div
        className="hidden md:flex items-center gap-2 text-muted-foreground border rounded-md px-3 py-1.5 w-64 cursor-pointer"
        onClick={() => setOpen(true)}
      >
        <Search className="h-4 w-4 shrink-0" />
        <span className="text-sm">Search orders, products...</span>
        <kbd className="ml-auto hidden lg:inline-flex h-5 items-center gap-1 rounded border bg-muted px-1.5 text-[10px] font-medium text-muted-foreground">
          Ctrl+K
        </kbd>
      </div>

      <CommandDialog open={open} onOpenChange={setOpen} title="Search">
        <CommandInput
          placeholder="Search orders, customers, products..."
          value={query}
          onValueChange={setQuery}
        />
        <CommandList>
          <CommandEmpty>
            {loading ? 'Searching...' : 'No results found.'}
          </CommandEmpty>
          {orderResults.length > 0 && (
            <CommandGroup heading="Orders">
              {orderResults.map((r) => (
                <CommandItem key={r._id} onSelect={() => handleSelect(r)}>
                  <ShoppingBag className="mr-2 h-4 w-4" />
                  <span>{r.label}</span>
                  <span className="ml-1 text-xs text-muted-foreground">{r.subtitle}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          )}
          {customerResults.length > 0 && (
            <CommandGroup heading="Customers">
              {customerResults.map((r) => (
                <CommandItem key={r._id} onSelect={() => handleSelect(r)}>
                  <Users className="mr-2 h-4 w-4" />
                  <span>{r.label}</span>
                  <span className="ml-1 text-xs text-muted-foreground">{r.subtitle}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          )}
          {productResults.length > 0 && (
            <CommandGroup heading="Products">
              {productResults.map((r) => (
                <CommandItem key={r._id} onSelect={() => handleSelect(r)}>
                  <Package className="mr-2 h-4 w-4" />
                  <span>{r.label}</span>
                  <span className="ml-1 text-xs text-muted-foreground">{r.subtitle}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          )}
        </CommandList>
      </CommandDialog>
    </>
  )
}
