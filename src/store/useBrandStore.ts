import { create } from 'zustand'

interface BrandState {
  selectedBrand: string | null
  setSelectedBrand: (id: string | null) => void
  clearBrand: () => void
}

export const useBrandStore = create<BrandState>((set) => ({
  selectedBrand: null,
  setSelectedBrand: (id) => set({ selectedBrand: id }),
  clearBrand: () => set({ selectedBrand: null }),
}))
