import { CustomerForm } from '@/features/customers/CustomerForm'

export default async function EditCustomerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <CustomerForm customerId={id} />
}
