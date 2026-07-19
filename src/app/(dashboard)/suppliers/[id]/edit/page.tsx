import { SupplierForm } from '@/features/suppliers/SupplierForm'

export default async function EditSupplierPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <SupplierForm supplierId={id} />
}
