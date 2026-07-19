import { PurchaseDetail } from '@/features/purchases/PurchaseDetail'

export default async function PurchaseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <PurchaseDetail purchaseId={id} />
}
