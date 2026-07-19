import { WarehouseForm } from '@/features/warehouses/WarehouseForm'

export default async function EditWarehousePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <WarehouseForm warehouseId={id} />
}
