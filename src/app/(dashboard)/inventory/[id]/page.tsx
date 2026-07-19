import { InventoryDetail } from '@/features/inventory/InventoryDetail'

export default async function InventoryDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <InventoryDetail inventoryId={id} />
}
