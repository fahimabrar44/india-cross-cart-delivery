import { OrderDetail } from '@/features/orders/OrderDetail'

export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <OrderDetail orderId={id} />
}
