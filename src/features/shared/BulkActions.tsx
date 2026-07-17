'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { ChevronDown, Trash2, Download, RefreshCw } from 'lucide-react'

interface BulkActionsProps {
  selectedIds: string[]
  onAction: (action: string) => void
}

export function BulkActions({ selectedIds, onAction }: BulkActionsProps) {
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [pendingAction, setPendingAction] = useState<string | null>(null)

  const count = selectedIds.length

  function handleSelect(action: string) {
    if (action === 'delete') {
      setPendingAction(action)
      setConfirmOpen(true)
    } else {
      onAction(action)
    }
  }

  function handleConfirm() {
    setConfirmOpen(false)
    if (pendingAction) {
      onAction(pendingAction)
      setPendingAction(null)
    }
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger render={<Button disabled={count === 0} />}>
          Bulk Actions ({count})
          <ChevronDown />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onSelect={() => handleSelect('delete')}>
            <Trash2 />
            Delete Selected
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => handleSelect('update_status')}>
            <RefreshCw />
            Update Status
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => handleSelect('export')}>
            <Download />
            Export Selected
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Delete</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {count} selected item{count !== 1 ? 's' : ''}? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleConfirm}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
