import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { connectDB } from '@/config/db'
import Order from '@/models/Order'
import Brand from '@/models/Brand'

export async function GET(request: Request) {
  try {
    const session = await auth()
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    await connectDB()
    const { searchParams } = new URL(request.url)
    const orderId = searchParams.get('orderId')
    if (!orderId) return NextResponse.json({ error: 'orderId is required' }, { status: 400 })

    const order = await Order.findById(orderId)
      .populate('customer', 'name phone address district')
      .populate('brand', 'name logo email phone address currencySymbol invoiceSettings')
      .lean()

    if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 })

    const brand = order.brand as unknown as {
      name: string
      logo?: string
      email?: string
      phone?: string
      address?: string
      currencySymbol: string
      invoiceSettings?: { footer?: string; logo?: string }
    }
    const customer = order.customer as unknown as {
      name: string
      phone: string
      address?: string
      district?: string
    }
    const currencySymbol = brand.currencySymbol || '৳'

    const itemsHtml = (order.items as Array<{
      name: string
      sku: string
      quantity: number
      price: number
      total: number
    }>).map(
      (item) => `
        <tr>
          <td>${item.name}</td>
          <td>${item.sku}</td>
          <td>${item.quantity}</td>
          <td class="text-right">${currencySymbol}${item.price.toFixed(2)}</td>
          <td class="text-right">${currencySymbol}${item.total.toFixed(2)}</td>
        </tr>`
    ).join('')

    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Invoice - ${order.orderNumber}</title>
  <style>
    @media print { body { -webkit-print-color-adjust: exact; } }
    body { font-family: 'Segoe UI', Arial, sans-serif; margin: 0; padding: 20px; color: #333; }
    .invoice-box { max-width: 800px; margin: auto; padding: 30px; border: 1px solid #eee; }
    h1 { color: #111; margin: 0 0 5px; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 30px; }
    .brand-info p { margin: 2px 0; font-size: 13px; color: #555; }
    .customer-info p { margin: 2px 0; font-size: 13px; }
    table { width: 100%; border-collapse: collapse; margin: 20px 0; }
    th, td { padding: 10px 8px; border-bottom: 1px solid #ddd; font-size: 13px; }
    th { background: #f5f5f5; text-align: left; }
    .text-right { text-align: right; }
    .totals { margin-top: 10px; }
    .totals table { width: 300px; margin-left: auto; }
    .totals td:last-child { text-align: right; font-weight: bold; }
    .grand-total td { font-size: 15px; border-top: 2px solid #333; padding-top: 10px; }
    .footer { margin-top: 40px; text-align: center; font-size: 12px; color: #888; border-top: 1px solid #eee; padding-top: 15px; }
    .print-btn { margin: 20px auto; display: block; padding: 10px 30px; font-size: 16px; cursor: pointer; }
    @media print { .print-btn { display: none; } }
  </style>
</head>
<body>
  <button class="print-btn" onclick="window.print()">Print Invoice</button>
  <div class="invoice-box">
    <div class="header">
      <div class="brand-info">
        ${brand.logo ? `<img src="${brand.logo}" alt="${brand.name}" style="max-height:60px;margin-bottom:8px" />` : ''}
        <h1>${brand.name}</h1>
        ${brand.address ? `<p>${brand.address}</p>` : ''}
        ${brand.phone ? `<p>Phone: ${brand.phone}</p>` : ''}
        ${brand.email ? `<p>Email: ${brand.email}</p>` : ''}
      </div>
      <div style="text-align:right">
        <h2>INVOICE</h2>
        <p><strong>Invoice #:</strong> ${order.orderNumber}</p>
        <p><strong>Date:</strong> ${new Date(order.createdAt).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' })}</p>
        <p><strong>Status:</strong> ${order.status.toUpperCase()}</p>
      </div>
    </div>

    <div class="customer-info" style="margin-bottom:20px">
      <h3 style="margin-bottom:5px">Bill To</h3>
      <p><strong>${customer.name}</strong></p>
      <p>${customer.phone}</p>
      ${customer.address ? `<p>${customer.address}${customer.district ? ', ' + customer.district : ''}</p>` : ''}
    </div>

    <table>
      <thead>
        <tr>
          <th>Item</th>
          <th>SKU</th>
          <th>Qty</th>
          <th class="text-right">Price</th>
          <th class="text-right">Total</th>
        </tr>
      </thead>
      <tbody>
        ${itemsHtml}
      </tbody>
    </table>

    <div class="totals">
      <table>
        <tr><td>Subtotal</td><td>${currencySymbol}${(order.subtotal || 0).toFixed(2)}</td></tr>
        ${order.discount ? `<tr><td>Discount</td><td>-${currencySymbol}${order.discount.toFixed(2)}</td></tr>` : ''}
        ${order.shipping ? `<tr><td>Shipping</td><td>${currencySymbol}${order.shipping.toFixed(2)}</td></tr>` : ''}
        <tr class="grand-total"><td>Total</td><td>${currencySymbol}${order.total.toFixed(2)}</td></tr>
        <tr><td>COD Amount</td><td>${currencySymbol}${(order.codAmount || 0).toFixed(2)}</td></tr>
      </table>
    </div>

    ${brand.invoiceSettings?.footer ? `<div class="footer">${brand.invoiceSettings.footer}</div>` : ''}
  </div>
</body>
</html>`

    return new NextResponse(html, {
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    })
  } catch (error) {
    console.error('Invoice print error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
