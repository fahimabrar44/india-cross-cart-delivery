import { BrandDetail } from '@/features/brands/BrandDetail'

export default async function BrandDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <BrandDetail brandId={id} />
}
