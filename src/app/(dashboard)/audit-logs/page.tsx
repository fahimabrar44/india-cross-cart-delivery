'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  formatDateTime,
} from '@/lib/utils'
import {
  History,
  Search,
  ChevronDown,
  ChevronUp,
  FileText,
  User,
  Package,
  ShoppingBag,
  Building2,
  Settings,
} from 'lucide-react'
import { toast } from 'sonner'
import { useBrandStore } from '@/store/useBrandStore'

interface AuditLog {
  _id: string
  user: { _id: string; name: string; email: string }
  action: string
  entity: string
  entityId: string
  before?: Record<string, unknown>
  after?: Record<string, unknown>
  createdAt: string
}

const entityIcons: Record<string, typeof FileText> = {
  Order: ShoppingBag,
  Product: Package,
  Brand: Building2,
  User: User,
  Settings: Settings,
}

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [entityFilter, setEntityFilter] = useState('')
  const selectedBrand = useBrandStore((s) => s.selectedBrand)

  useEffect(() => {
    ;(async () => {
      setLoading(true)
      try {
        const params = new URLSearchParams()
        if (entityFilter) params.set('entity', entityFilter)
        if (selectedBrand) params.set('brand', selectedBrand)
        if (search) params.set('user', search)
        params.set('page', String(page))
        params.set('limit', '30')

        const res = await fetch(`/api/audit-logs?${params}`)
        const json = await res.json()
        setLogs(json.data || [])
        setTotalPages(json.totalPages || 1)
      } catch {
        toast.error('Failed to fetch audit logs')
      } finally {
        setLoading(false)
      }
    })()
  }, [page, entityFilter, selectedBrand, search])

  const entityTypes = ['Order', 'Product', 'Brand', 'User', 'Customer', 'Supplier', 'Purchase', 'Settings']

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Audit Logs</h1>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by user name..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            className="pl-10"
          />
        </div>
        <Select value={entityFilter} onValueChange={(v) => { setEntityFilter(v || ''); setPage(1) }}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Entity type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All entities</SelectItem>
            {entityTypes.map((type) => (
              <SelectItem key={type} value={type}>{type}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="space-y-2 p-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : logs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <History className="h-12 w-12 mb-3 opacity-30" />
              <p className="text-lg font-medium">No audit logs found</p>
            </div>
          ) : (
            <div className="divide-y">
              {logs.map((log) => {
                const isExpanded = expandedId === log._id
                const Icon = entityIcons[log.entity] || FileText

                return (
                  <div key={log._id}>
                    <div
                      className="flex items-start gap-4 p-4 hover:bg-muted/50 cursor-pointer"
                      onClick={() => setExpandedId(isExpanded ? null : log._id)}
                    >
                      <div className="rounded-full bg-primary/10 p-2 shrink-0">
                        <Icon className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-medium">{log.user?.name || 'Unknown'}</span>
                          <Badge variant="outline" className="text-xs">{log.action}</Badge>
                          <Badge className="text-xs bg-muted text-muted-foreground">{log.entity}</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {formatDateTime(log.createdAt)} &middot; ID: {log.entityId}
                        </p>
                      </div>
                      {isExpanded ? (
                        <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0 mt-1" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0 mt-1" />
                      )}
                    </div>
                    {isExpanded && (log.before || log.after) && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 px-4 pb-4">
                        {log.before && (
                          <div>
                            <p className="text-xs font-medium text-muted-foreground mb-1">Before</p>
                            <pre className="text-xs bg-muted rounded-md p-3 overflow-auto max-h-40">
                              {JSON.stringify(log.before, null, 2)}
                            </pre>
                          </div>
                        )}
                        {log.after && (
                          <div>
                            <p className="text-xs font-medium text-muted-foreground mb-1">After</p>
                            <pre className="text-xs bg-muted rounded-md p-3 overflow-auto max-h-40">
                              {JSON.stringify(log.after, null, 2)}
                            </pre>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  )
}
