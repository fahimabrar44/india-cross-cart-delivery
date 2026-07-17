'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { BrandSwitcher } from '@/components/layout/BrandSwitcher'
import { useBrandStore } from '@/store/useBrandStore'
import { BarChart3, DollarSign, Package, ShoppingCart, FileText, FileSpreadsheet, Table } from 'lucide-react'

const reportLinks = [
  { title: 'Sales Report', href: '/reports/sales', icon: BarChart3, color: 'text-blue-600' },
  { title: 'Profit Report', href: '#', icon: DollarSign, color: 'text-green-600' },
  { title: 'Inventory Report', href: '#', icon: Package, color: 'text-orange-600' },
  { title: 'Product Report', href: '#', icon: ShoppingCart, color: 'text-purple-600' },
]

function exportCSV() {
  const blob = new Blob([['Report data not available'].join('\n')], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = 'report.csv'
  document.body.appendChild(a); a.click(); document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

function exportExcel() {
  exportCSV()
}

function exportPDF() {
  window.print()
}

export default function ReportsPage() {
  const { selectedBrand } = useBrandStore()
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold tracking-tight">Reports</h1>
        <div className="flex items-center gap-2">
          <BrandSwitcher />
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="flex items-center gap-2">
          <label className="text-sm text-muted-foreground">From:</label>
          <Input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="w-[160px]" />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm text-muted-foreground">To:</label>
          <Input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className="w-[160px]" />
        </div>
        <div className="flex items-center gap-2 ml-auto">
          <Button variant="outline" size="sm" onClick={exportPDF}>
            <FileText className="mr-2 h-4 w-4" />PDF
          </Button>
          <Button variant="outline" size="sm" onClick={exportExcel}>
            <FileSpreadsheet className="mr-2 h-4 w-4" />Excel
          </Button>
          <Button variant="outline" size="sm" onClick={exportCSV}>
            <Table className="mr-2 h-4 w-4" />CSV
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {reportLinks.map((link) => (
          <a key={link.title} href={link.href}>
            <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
              <CardHeader className="flex flex-row items-center gap-4 pb-2">
                <link.icon className={`h-10 w-10 ${link.color}`} />
                <CardTitle className="text-lg">{link.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">View {link.title.toLowerCase()}</p>
              </CardContent>
            </Card>
          </a>
        ))}
      </div>
    </div>
  )
}
