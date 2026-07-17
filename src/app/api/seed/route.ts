import { NextResponse } from 'next/server'
import { connectDB } from '@/config/db'
import Brand from '@/models/Brand'
import Warehouse from '@/models/Warehouse'
import Category from '@/models/Category'
import Product from '@/models/Product'
import Customer from '@/models/Customer'
import Order from '@/models/Order'
import Inventory from '@/models/Inventory'
import User from '@/models/User'
import { generateOrderNumber, generateSku, slugify } from '@/lib/utils'

const BRANDS_DATA = [
  {
    name: 'Organic Mart',
    slug: 'organic-mart',
    email: 'info@organicmart.com',
    phone: '+8801700000001',
    currency: 'BDT',
    currencySymbol: '৳',
    invoiceSettings: { prefix: 'OM', nextNumber: 1000 },
    status: 'active',
  },
  {
    name: 'Wallscape Bangladesh',
    slug: 'wallscape-bangladesh',
    email: 'info@wallscape.com',
    phone: '+8801700000002',
    currency: 'BDT',
    currencySymbol: '৳',
    invoiceSettings: { prefix: 'WB', nextNumber: 1000 },
    status: 'active',
  },
  {
    name: 'Cross Cart Global',
    slug: 'cross-cart-global',
    email: 'info@crosscart.com',
    phone: '+8801700000003',
    currency: 'USD',
    currencySymbol: '$',
    invoiceSettings: { prefix: 'CCG', nextNumber: 1000 },
    status: 'active',
  },
  {
    name: 'Future Brands',
    slug: 'future-brands',
    email: 'info@futurebrands.com',
    phone: '+8801700000004',
    currency: 'BDT',
    currencySymbol: '৳',
    invoiceSettings: { prefix: 'FB', nextNumber: 1000 },
    status: 'active',
  },
]

const CATEGORIES_PER_BRAND: Record<string, { name: string; slug: string; description: string }[]> = {
  'organic-mart': [
    { name: 'Beverages', slug: 'beverages', description: 'Organic drinks and juices' },
    { name: 'Snacks', slug: 'snacks', description: 'Healthy snacks and chips' },
    { name: 'Dairy', slug: 'dairy', description: 'Milk, cheese, and dairy products' },
    { name: 'Bakery', slug: 'bakery', description: 'Freshly baked bread and pastries' },
    { name: 'Staples', slug: 'staples', description: 'Daily essentials and pantry items' },
  ],
  'wallscape-bangladesh': [
    { name: 'Wallpaper', slug: 'wallpaper', description: 'Premium wallpaper rolls' },
    { name: 'Paint', slug: 'paint', description: 'Interior and exterior paints' },
    { name: 'Tools', slug: 'tools', description: 'Hardware and painting tools' },
    { name: 'Flooring', slug: 'flooring', description: 'Flooring tiles and wood' },
  ],
  'cross-cart-global': [
    { name: 'Electronics', slug: 'electronics', description: 'Gadgets and accessories' },
    { name: 'Clothing', slug: 'clothing', description: 'Fashion and apparel' },
    { name: 'Home & Kitchen', slug: 'home-kitchen', description: 'Home appliances and kitchenware' },
    { name: 'Beauty', slug: 'beauty', description: 'Beauty and personal care' },
    { name: 'Sports', slug: 'sports', description: 'Sports equipment and gear' },
  ],
  'future-brands': [
    { name: 'Mobile Phones', slug: 'mobile-phones', description: 'Smartphones and feature phones' },
    { name: 'Laptops', slug: 'laptops', description: 'Notebooks and ultrabooks' },
    { name: 'Accessories', slug: 'accessories', description: 'Chargers, cables, cases' },
    { name: 'Audio', slug: 'audio', description: 'Headphones, speakers, earphones' },
  ],
}

const PRODUCTS_PER_BRAND: Record<string, { name: string; categorySlug: string; purchasePrice: number; sellingPrice: number; stockAlertLimit: number }[]> = {
  'organic-mart': [
    { name: 'Organic Green Tea 100g', categorySlug: 'beverages', purchasePrice: 120, sellingPrice: 250, stockAlertLimit: 20 },
    { name: 'Mango Juice 1L', categorySlug: 'beverages', purchasePrice: 80, sellingPrice: 180, stockAlertLimit: 30 },
    { name: 'Mixed Nuts 500g', categorySlug: 'snacks', purchasePrice: 350, sellingPrice: 650, stockAlertLimit: 15 },
    { name: 'Rice Crackers 200g', categorySlug: 'snacks', purchasePrice: 60, sellingPrice: 150, stockAlertLimit: 25 },
    { name: 'Farm Fresh Milk 1L', categorySlug: 'dairy', purchasePrice: 70, sellingPrice: 140, stockAlertLimit: 40 },
    { name: 'Organic Yogurt 400g', categorySlug: 'dairy', purchasePrice: 90, sellingPrice: 200, stockAlertLimit: 20 },
    { name: 'Whole Wheat Bread', categorySlug: 'bakery', purchasePrice: 40, sellingPrice: 100, stockAlertLimit: 30 },
    { name: 'Basmati Rice 5kg', categorySlug: 'staples', purchasePrice: 450, sellingPrice: 850, stockAlertLimit: 10 },
  ],
  'wallscape-bangladesh': [
    { name: 'Textured Wallpaper Roll', categorySlug: 'wallpaper', purchasePrice: 800, sellingPrice: 1800, stockAlertLimit: 10 },
    { name: 'Vinyl Wallpaper Stripes', categorySlug: 'wallpaper', purchasePrice: 650, sellingPrice: 1500, stockAlertLimit: 10 },
    { name: 'Interior Matte Paint 5L', categorySlug: 'paint', purchasePrice: 1200, sellingPrice: 2800, stockAlertLimit: 5 },
    { name: 'Exterior Weatherproof Paint 5L', categorySlug: 'paint', purchasePrice: 1800, sellingPrice: 3800, stockAlertLimit: 5 },
    { name: 'Professional Paint Brush Set', categorySlug: 'tools', purchasePrice: 250, sellingPrice: 600, stockAlertLimit: 20 },
    { name: 'PVC Flooring Tiles 1sqm', categorySlug: 'flooring', purchasePrice: 300, sellingPrice: 750, stockAlertLimit: 15 },
    { name: 'Laminate Wood Flooring 1sqm', categorySlug: 'flooring', purchasePrice: 500, sellingPrice: 1200, stockAlertLimit: 10 },
  ],
  'cross-cart-global': [
    { name: 'Bluetooth Speaker Portable', categorySlug: 'electronics', purchasePrice: 800, sellingPrice: 2200, stockAlertLimit: 10 },
    { name: 'USB-C Hub 7-in-1', categorySlug: 'electronics', purchasePrice: 450, sellingPrice: 1200, stockAlertLimit: 15 },
    { name: 'Men Denim Jacket', categorySlug: 'clothing', purchasePrice: 900, sellingPrice: 2200, stockAlertLimit: 10 },
    { name: 'Cotton T-shirt Pack', categorySlug: 'clothing', purchasePrice: 400, sellingPrice: 1000, stockAlertLimit: 20 },
    { name: 'Stainless Steel Cookware Set', categorySlug: 'home-kitchen', purchasePrice: 1500, sellingPrice: 3500, stockAlertLimit: 5 },
    { name: 'Organic Face Cream 50ml', categorySlug: 'beauty', purchasePrice: 300, sellingPrice: 800, stockAlertLimit: 15 },
    { name: 'Yoga Mat Premium', categorySlug: 'sports', purchasePrice: 350, sellingPrice: 900, stockAlertLimit: 10 },
    { name: 'Resistance Bands Set', categorySlug: 'sports', purchasePrice: 200, sellingPrice: 550, stockAlertLimit: 20 },
  ],
  'future-brands': [
    { name: 'SmartPhone X Pro 256GB', categorySlug: 'mobile-phones', purchasePrice: 15000, sellingPrice: 25000, stockAlertLimit: 5 },
    { name: 'Feature Phone Basic', categorySlug: 'mobile-phones', purchasePrice: 800, sellingPrice: 1800, stockAlertLimit: 15 },
    { name: 'UltraBook Slim 14" 16GB', categorySlug: 'laptops', purchasePrice: 35000, sellingPrice: 55000, stockAlertLimit: 3 },
    { name: 'Laptop Sleeve 15.6"', categorySlug: 'accessories', purchasePrice: 250, sellingPrice: 700, stockAlertLimit: 20 },
    { name: 'Wireless Charger Pad', categorySlug: 'accessories', purchasePrice: 300, sellingPrice: 800, stockAlertLimit: 20 },
    { name: 'Noise Cancelling Headphones', categorySlug: 'audio', purchasePrice: 2000, sellingPrice: 4500, stockAlertLimit: 8 },
    { name: 'Portable Bluetooth Speaker', categorySlug: 'audio', purchasePrice: 600, sellingPrice: 1500, stockAlertLimit: 12 },
  ],
}

const CUSTOMERS_PER_BRAND: Record<string, { name: string; phone: string; district: string }[]> = {
  'organic-mart': [
    { name: 'Rahim Mia', phone: '+8801711000001', district: 'Dhaka' },
    { name: 'Karim Hossain', phone: '+8801711000002', district: 'Chittagong' },
    { name: 'Fatima Begum', phone: '+8801711000003', district: 'Sylhet' },
    { name: 'Rina Akter', phone: '+8801711000004', district: 'Rajshahi' },
    { name: 'Jahangir Alam', phone: '+8801711000005', district: 'Khulna' },
    { name: 'Nasrin Sultana', phone: '+8801711000006', district: 'Barisal' },
    { name: 'Shahidul Islam', phone: '+8801711000007', district: 'Rangpur' },
  ],
  'wallscape-bangladesh': [
    { name: 'Abdur Rahman', phone: '+8801722000001', district: 'Dhaka' },
    { name: 'Shamima Akhter', phone: '+8801722000002', district: 'Narayanganj' },
    { name: 'Mizanur Rahman', phone: '+8801722000003', district: 'Gazipur' },
    { name: 'Parveen Sultana', phone: '+8801722000004', district: 'Chittagong' },
    { name: 'Hasan Mahmud', phone: '+8801722000005', district: 'Dhaka' },
    { name: 'Tahmina Begum', phone: '+8801722000006', district: 'Comilla' },
  ],
  'cross-cart-global': [
    { name: 'Kamal Uddin', phone: '+8801733000001', district: 'Dhaka' },
    { name: 'Shahana Parvin', phone: '+8801733000002', district: 'Chittagong' },
    { name: 'Faruk Hossain', phone: '+8801733000003', district: 'Sylhet' },
    { name: 'Nargis Jahan', phone: '+8801733000004', district: 'Bogra' },
    { name: 'Rafiqul Islam', phone: '+8801733000005', district: 'Mymensingh' },
    { name: 'Aklima Khatun', phone: '+8801733000006', district: 'Jessore' },
    { name: 'Saiful Islam', phone: '+8801733000007', district: 'Dhaka' },
    { name: 'Julekha Begum', phone: '+8801733000008', district: 'Pabna' },
    { name: 'Nurul Absar', phone: '+8801733000009', district: 'Cox\'s Bazar' },
    { name: 'Laily Akhter', phone: '+8801733000010', district: 'Dhaka' },
  ],
  'future-brands': [
    { name: 'Tanvir Ahmed', phone: '+8801744000001', district: 'Dhaka' },
    { name: 'Sharmin Jahan', phone: '+8801744000002', district: 'Chittagong' },
    { name: 'Rashed Khan', phone: '+8801744000003', district: 'Khulna' },
    { name: 'Maliha Tabassum', phone: '+8801744000004', district: 'Sylhet' },
    { name: 'Sohel Rana', phone: '+8801744000005', district: 'Rajshahi' },
  ],
}

const ORDER_STATUSES = ['new', 'confirmed', 'processing', 'packed', 'shipped', 'delivered', 'cancelled'] as const

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function pick<T>(arr: readonly T[] | T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

export async function POST() {
  try {
    await connectDB()

    const existingBrands = await Brand.find({})
    if (existingBrands.length >= 4) {
      return NextResponse.json({ message: 'Already seeded' })
    }

    const brands = await Brand.create(BRANDS_DATA)

    const brandDocs = await Brand.find({}).lean()
    const brandMap = new Map(brandDocs.map((b) => [b.slug, b._id.toString()]))

    await User.create({
      name: 'Super Admin',
      email: 'admin@mboms.com',
      password: 'Admin@123',
      role: 'super_admin',
      brandAccess: brandDocs.map((b) => b._id),
      permissions: [],
      isActive: true,
    })

    await User.create({
      name: 'Brand Manager',
      email: 'manager@mboms.com',
      password: 'Manager@123',
      role: 'brand_admin',
      brandAccess: [brandDocs[0]._id],
      permissions: [],
      isActive: true,
    })

    const warehouses: { _id: string; brandSlug: string }[] = []
    for (const b of brandDocs) {
      const w1 = await Warehouse.create({
        name: 'Dhaka Warehouse',
        brand: b._id,
        manager: 'Rahim',
        phone: '+8801711111111',
        address: 'Dhaka, Bangladesh',
        isActive: true,
      })
      const w2 = await Warehouse.create({
        name: 'Chittagong Warehouse',
        brand: b._id,
        manager: 'Karim',
        phone: '+8801722222222',
        address: 'Chittagong, Bangladesh',
        isActive: true,
      })
      warehouses.push({ _id: w1._id.toString(), brandSlug: b.slug })
      warehouses.push({ _id: w2._id.toString(), brandSlug: b.slug })
    }

    const catMap = new Map<string, string>()
    for (const b of brandDocs) {
      const cats = CATEGORIES_PER_BRAND[b.slug] || []
      for (const c of cats) {
        const doc = await Category.create({
          name: c.name,
          slug: c.slug,
          brand: b._id,
          description: c.description,
          isActive: true,
        })
        catMap.set(`${b.slug}:${c.slug}`, doc._id.toString())
      }
    }

    const productMap = new Map<string, string>()
    for (const b of brandDocs) {
      const products = PRODUCTS_PER_BRAND[b.slug] || []
      for (const p of products) {
        const sku = generateSku(b.slug, p.name)
        const catId = catMap.get(`${b.slug}:${p.categorySlug}`)
        const doc = await Product.create({
          name: p.name,
          sku,
          barcode: sku,
          brand: b._id,
          category: catId,
          purchasePrice: p.purchasePrice,
          sellingPrice: p.sellingPrice,
          images: [],
          stockAlertLimit: p.stockAlertLimit,
          isActive: true,
        })
        productMap.set(`${b.slug}:${p.name}`, doc._id.toString())
      }
    }

    const custMap = new Map<string, string>()
    for (const b of brandDocs) {
      const customers = CUSTOMERS_PER_BRAND[b.slug] || []
      for (const c of customers) {
        const doc = await Customer.create({
          name: c.name,
          phone: c.phone,
          district: c.district,
          brand: b._id,
          totalPurchases: 0,
          totalOrders: 0,
          isBlacklisted: false,
        })
        custMap.set(`${b.slug}:${c.phone}`, doc._id.toString())
      }
    }

    for (const b of brandDocs) {
      const prefix = b.invoiceSettings.prefix
      let nextNum = b.invoiceSettings.nextNumber
      const customers = CUSTOMERS_PER_BRAND[b.slug] || []
      const products = PRODUCTS_PER_BRAND[b.slug] || []
      const orderCount = Math.min(5, customers.length)

      for (let i = 0; i < orderCount; i++) {
        const cust = customers[i]
        const custId = custMap.get(`${b.slug}:${cust.phone}`)
        if (!custId) continue

        const itemCount = randomInt(1, 3)
        const items: { product: string; name: string; sku: string; quantity: number; price: number; total: number }[] = []
        const usedProductIndices = new Set<number>()

        for (let j = 0; j < itemCount; j++) {
          let idx: number
          do {
            idx = randomInt(0, products.length - 1)
          } while (usedProductIndices.has(idx))
          usedProductIndices.add(idx)

          const prod = products[idx]
          const prodId = productMap.get(`${b.slug}:${prod.name}`)
          if (!prodId) continue

          const qty = randomInt(1, 5)
          items.push({
            product: prodId as any,
            name: prod.name,
            sku: generateSku(b.slug, prod.name),
            quantity: qty,
            price: prod.sellingPrice,
            total: qty * prod.sellingPrice,
          })
        }

        if (items.length === 0) continue

        const subtotal = items.reduce((sum, it) => sum + it.total, 0)
        const orderNumber = generateOrderNumber(prefix, nextNum)
        nextNum++
        const status = pick(ORDER_STATUSES)
        const shipping = randomInt(50, 200)
        const total = subtotal + shipping
        const paidAmount = status === 'delivered' ? total : status === 'shipped' ? Math.floor(total * 0.5) : 0
        const paymentStatus: 'pending' | 'partial' | 'paid' | 'refunded' =
          paidAmount >= total ? 'paid' : paidAmount > 0 ? 'partial' : 'pending'

        await Order.create({
          orderNumber,
          brand: b._id,
          customer: custId,
          items,
          subtotal,
          discount: 0,
          shipping,
          total,
          codAmount: total - paidAmount,
          paidAmount,
          paymentStatus,
          status,
          shippingAddress: {
            name: cust.name,
            phone: cust.phone,
            address: `House ${randomInt(1, 500)}, Road ${randomInt(1, 20)}, ${cust.district}`,
            district: cust.district,
            country: 'Bangladesh',
          },
          notes: '',
          courierName: status === 'shipped' || status === 'delivered' ? 'Sundarban Courier' : undefined,
          trackingNumber: status === 'shipped' || status === 'delivered' ? `SB-${Date.now()}-${i}` : undefined,
          dispatchDate: status === 'shipped' || status === 'delivered' ? new Date() : undefined,
          deliveryDate: status === 'delivered' ? new Date() : undefined,
        })
      }
    }

    for (const b of brandDocs) {
      const wId = warehouses.find((w) => w.brandSlug === b.slug)?._id
      if (!wId) continue
      const products = PRODUCTS_PER_BRAND[b.slug] || []
      for (const p of products) {
        const prodId = productMap.get(`${b.slug}:${p.name}`)
        if (!prodId) continue
        const stock = randomInt(20, 200)
        await Inventory.create({
          product: prodId,
          warehouse: wId,
          brand: b._id,
          openingStock: stock,
          currentStock: stock,
        })
      }
    }

    return NextResponse.json({
      message: 'Database seeded successfully',
      brands: brandDocs.map((b) => ({ id: b._id, name: b.name })),
    })
  } catch (error) {
    console.error('Seed error:', error)
    return NextResponse.json({ error: 'Seed failed' }, { status: 500 })
  }
}
