import { WarehouseDetail } from '@/features/warehouses/WarehouseDetail'

export default async function WarehouseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <WarehouseDetail warehouseId={id} />
}
