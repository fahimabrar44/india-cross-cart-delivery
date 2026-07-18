'use client'

import { useState, useEffect } from 'react'
import { useBrandStore } from '@/store/useBrandStore'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { Building2, Check, ChevronDown } from 'lucide-react'

interface Brand {
  _id: string
  name: string
  slug: string
}

export function BrandSwitcher() {
  const { selectedBrand, setSelectedBrand } = useBrandStore()
  const [brands, setBrands] = useState<Brand[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchBrands()
  }, [])

  async function fetchBrands() {
    try {
      const res = await fetch('/api/brands')
      const data = await res.json()
      setBrands(data.data || [])
    } catch {
      // silent fail
    } finally {
      setLoading(false)
    }
  }

  const selected = brands.find((b) => b._id === selectedBrand)

  return (
    <DropdownMenu>
      <DropdownMenuTrigger>
        <Button variant="outline" size="sm" className="gap-2 w-[180px] justify-start">
          <Building2 className="h-4 w-4 shrink-0" />
          <span className="truncate">{selected?.name || 'All Brands'}</span>
          <ChevronDown className="h-3 w-3 ml-auto shrink-0" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-[180px]">
        <DropdownMenuGroup>
          <DropdownMenuItem onClick={() => setSelectedBrand(null)}>
            <Check className={`mr-2 h-4 w-4 ${!selectedBrand ? 'opacity-100' : 'opacity-0'}`} />
            All Brands
          </DropdownMenuItem>
          {brands.map((brand) => (
            <DropdownMenuItem key={brand._id} onClick={() => setSelectedBrand(brand._id)}>
              <Check className={`mr-2 h-4 w-4 ${selectedBrand === brand._id ? 'opacity-100' : 'opacity-0'}`} />
              {brand.name}
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
