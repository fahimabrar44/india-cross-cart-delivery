import { SupplierDetail } from '@/features/suppliers/SupplierDetail'

export default async function SupplierDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <SupplierDetail supplierId={id} />
}
