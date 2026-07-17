export const runtime = 'nodejs'

import { NextResponse } from 'next/server'
import { connectDB } from '@/config/db'
import { auth } from '@/lib/auth'
import * as XLSX from 'xlsx'
import Product from '@/models/Product'
import Customer from '@/models/Customer'
import Order from '@/models/Order'
import Brand from '@/models/Brand'
import { generateOrderNumber, generateSku } from '@/lib/utils'

interface RowData {
  [key: string]: string | number
}

function normalizeKeys(row: Record<string, unknown>): RowData {
  const normalized: RowData = {}
  for (const [key, val] of Object.entries(row)) {
    const k = key.toLowerCase().replace(/[\s_-]+/g, '')
    normalized[k] = (val ?? '') as string | number
  }
  return normalized
}

export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const entityType = formData.get('entityType') as string

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    let rows: Record<string, unknown>[]

    if (file.name.endsWith('.csv')) {
      const text = buffer.toString('utf-8')
      const workbook = XLSX.read(text, { type: 'string' })
      const sheet = workbook.Sheets[workbook.SheetNames[0]]
      rows = XLSX.utils.sheet_to_json(sheet)
    } else {
      const workbook = XLSX.read(buffer, { type: 'buffer' })
      const sheet = workbook.Sheets[workbook.SheetNames[0]]
      rows = XLSX.utils.sheet_to_json(sheet)
    }

    if (!rows || rows.length === 0) {
      return NextResponse.json({ error: 'File is empty' }, { status: 400 })
    }

    await connectDB()
    const errors: string[] = []
    let created = 0

    const brandAccess = session.user.brandAccess
    const isSuperAdmin = session.user.role === 'super_admin'

    if (entityType === 'products') {
      for (const [i, row] of rows.entries()) {
        try {
          const d = normalizeKeys(row)
          const brandSlug = (d.brandslug || '') as string

          let brand
          if (brandSlug) {
            brand = await Brand.findOne({ slug: brandSlug })
            if (!brand) {
              errors.push(`Row ${i + 2}: Brand "${brandSlug}" not found`)
              continue
            }
          } else if (!isSuperAdmin) {
            brand = await Brand.findOne({ _id: { $in: brandAccess } })
          } else {
            brand = await Brand.findOne()
          }
          if (!brand) {
            errors.push(`Row ${i + 2}: No brand available`)
            continue
          }

          const name = (d.name || d.productname || '') as string
          const sellingPrice = parseFloat((d.sellingprice || d.price || '0') as string)
          const purchasePrice = parseFloat((d.purchaseprice || d.costprice || '0') as string)
          const sku = (d.sku || generateSku(brand.slug, name)) as string
          const stock = parseInt((d.stock || d.currentstock || '0') as string, 10) || 0

          await Product.create({
            name,
            sku,
            brand: brand._id,
            sellingPrice,
            purchasePrice,
            stockAlertLimit: parseInt((d.stockalertlimit || d.alertlimit || '10') as string, 10),
            isActive: true,
          })
          created++
        } catch (err) {
          errors.push(`Row ${i + 2}: ${err instanceof Error ? err.message : 'Unknown error'}`)
        }
      }
    } else if (entityType === 'customers') {
      for (const [i, row] of rows.entries()) {
        try {
          const d = normalizeKeys(row)

          let brand
          const brandSlug = (d.brandslug || '') as string
          if (brandSlug) {
            brand = await Brand.findOne({ slug: brandSlug })
            if (!brand) {
              errors.push(`Row ${i + 2}: Brand "${brandSlug}" not found`)
              continue
            }
          } else if (!isSuperAdmin) {
            brand = await Brand.findOne({ _id: { $in: brandAccess } })
          } else {
            brand = await Brand.findOne()
          }
          if (!brand) {
            errors.push(`Row ${i + 2}: No brand available`)
            continue
          }

          const phone = (d.phone || d.mobile || d.whatsapp || '') as string
          if (!phone) {
            errors.push(`Row ${i + 2}: Phone is required`)
            continue
          }

          const existing = await Customer.findOne({ phone, brand: brand._id })
          if (existing) {
            errors.push(`Row ${i + 2}: Customer with phone ${phone} already exists for this brand`)
            continue
          }

          await Customer.create({
            name: (d.name || d.customername || '') as string,
            phone,
            whatsapp: (d.whatsapp || phone) as string,
            email: (d.email || '') as string,
            address: (d.address || '') as string,
            district: (d.district || d.city || '') as string,
            brand: brand._id,
            isBlacklisted: false,
          })
          created++
        } catch (err) {
          errors.push(`Row ${i + 2}: ${err instanceof Error ? err.message : 'Unknown error'}`)
        }
      }
    } else if (entityType === 'orders') {
      for (const [i, row] of rows.entries()) {
        try {
          const d = normalizeKeys(row)

          let brand
          const brandSlug = (d.brandslug || '') as string
          if (brandSlug) {
            brand = await Brand.findOne({ slug: brandSlug })
            if (!brand) {
              errors.push(`Row ${i + 2}: Brand "${brandSlug}" not found`)
              continue
            }
          } else if (!isSuperAdmin) {
            brand = await Brand.findOne({ _id: { $in: brandAccess } })
          } else {
            brand = await Brand.findOne()
          }
          if (!brand) {
            errors.push(`Row ${i + 2}: No brand available`)
            continue
          }

          const customerPhone = (d.customerphone || d.phone || '') as string
          let customer
          if (customerPhone) {
            customer = await Customer.findOne({ phone: customerPhone, brand: brand._id })
          }
          if (!customer) {
            customer = await Customer.findOne({ brand: brand._id })
          }
          if (!customer) {
            errors.push(`Row ${i + 2}: No customer found for this brand`)
            continue
          }

          const prefix = brand.invoiceSettings?.prefix || 'INV'
          const nextNum = brand.invoiceSettings?.nextNumber || 1000
          const total = parseFloat((d.total || d.amount || '0') as string)
          const subtotal = parseFloat((d.subtotal || total.toString()) as string)

          const doc = await Order.create({
            orderNumber: generateOrderNumber(prefix, nextNum),
            brand: brand._id,
            customer: customer._id,
            items: [],
            subtotal,
            discount: parseFloat((d.discount || '0') as string),
            shipping: parseFloat((d.shipping || '0') as string),
            total,
            codAmount: total,
            paidAmount: 0,
            paymentStatus: 'pending',
            status: 'new',
            shippingAddress: {
              name: customer.name,
              phone: customer.phone,
              address: customer.address || 'Imported order',
              district: customer.district || 'Unknown',
              country: 'Bangladesh',
            },
          })

          doc.orderNumber = generateOrderNumber(prefix, nextNum + doc.__v)
          await doc.save()
          created++
        } catch (err) {
          errors.push(`Row ${i + 2}: ${err instanceof Error ? err.message : 'Unknown error'}`)
        }
      }
    }

    return NextResponse.json({ created, errors })
  } catch (error) {
    console.error('Import error:', error)
    return NextResponse.json({ error: 'Import failed' }, { status: 500 })
  }
}

