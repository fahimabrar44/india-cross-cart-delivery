import { CreatePurchaseForm } from '@/features/purchases/CreatePurchaseForm'

export default async function EditPurchasePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <CreatePurchaseForm purchaseId={id} />
}
