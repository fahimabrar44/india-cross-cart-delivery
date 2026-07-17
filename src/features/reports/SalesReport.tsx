'use client'

import { useEffect, useState, useCallback } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { formatCurrency, formatDate, downloadBlob } from '@/lib/utils'
import { useBrandStore } from '@/store/useBrandStore'
import { BrandSwitcher } from '@/components/layout/BrandSwitcher'
import { Download, FileText } from 'lucide-react'

interface DailyBreakdown {
  date: string
  ordersCount: number
  totalRevenue: number
  codAmount: number
  discount: number
}

interface Summary {
  totalOrders: number
  totalRevenue: number
  totalCod: number
  totalDiscount: number
}

interface SalesData {
  daily: DailyBreakdown[]
  summary: Summary
}

export function SalesReport() {
  const { selectedBrand } = useBrandStore()
  const [data, setData] = useState<SalesData | null>(null)
  const [loading, setLoading] = useState(true)
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')

  const fetchReport = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (selectedBrand) params.set('brand', selectedBrand)
      if (fromDate) params.set('from', fromDate)
      if (toDate) params.set('to', toDate)

      const res = await fetch(`/api/reports/sales?${params}`)
      const json = await res.json()
      setData(json)
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }, [selectedBrand, fromDate, toDate])

  useEffect(() => {
    fetchReport()
  }, [fetchReport])

  function exportToCSV() {
    if (!data) return
    const headers = ['Date', 'Orders Count', 'Total Revenue', 'COD Amount', 'Discount']
    const rows = data.daily.map((d) => [
      d.date,
      d.ordersCount,
      d.totalRevenue,
      d.codAmount,
      d.discount,
    ])
    rows.push([
      'TOTAL',
      data.summary.totalOrders,
      data.summary.totalRevenue,
      data.summary.totalCod,
      data.summary.totalDiscount,
    ])
    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    downloadBlob(blob, `sales-report-${fromDate || 'all'}-${toDate || 'all'}.csv`)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold tracking-tight">Sales Report</h1>
        <div className="flex items-center gap-2">
          <BrandSwitcher />
          <Button variant="outline" size="sm" onClick={exportToCSV} disabled={!data}>
            <Download className="mr-2 h-4 w-4" />Export CSV
          </Button>
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
        <Button variant="secondary" size="sm" onClick={fetchReport}>
          <FileText className="mr-2 h-4 w-4" />Apply
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-4 space-y-3">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : !data || data.daily.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <FileText className="h-12 w-12 mb-3 opacity-30" />
              <p>No sales data found</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Orders</TableHead>
                  <TableHead className="text-right">Revenue</TableHead>
                  <TableHead className="text-right">COD Amount</TableHead>
                  <TableHead className="text-right">Discount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.daily.map((row) => (
                  <TableRow key={row.date}>
                    <TableCell>{formatDate(row.date)}</TableCell>
                    <TableCell className="text-right">{row.ordersCount}</TableCell>
                    <TableCell className="text-right font-medium">{formatCurrency(row.totalRevenue)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(row.codAmount)}</TableCell>
                    <TableCell className="text-right text-red-600">{formatCurrency(row.discount)}</TableCell>
                  </TableRow>
                ))}
                <TableRow className="font-bold bg-muted/50">
                  <TableCell>TOTAL</TableCell>
                  <TableCell className="text-right">{data.summary.totalOrders}</TableCell>
                  <TableCell className="text-right">{formatCurrency(data.summary.totalRevenue)}</TableCell>
                  <TableCell className="text-right">{formatCurrency(data.summary.totalCod)}</TableCell>
                  <TableCell className="text-right text-red-600">{formatCurrency(data.summary.totalDiscount)}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
