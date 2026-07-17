export const runtime = 'nodejs'

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
      .populate('brand', 'name logo')
      .lean()

    if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 })

    const brand = order.brand as unknown as { name: string; logo?: string }
    const customer = order.customer as unknown as { name: string; phone: string; address?: string; district?: string }

    const itemsHtml = (order.items as Array<{
      name: string
      sku: string
      quantity: number
    }>).map(
      (item) => `
        <tr>
          <td>${item.name}</td>
          <td>${item.sku}</td>
          <td>${item.quantity}</td>
        </tr>`
    ).join('')

    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Packing Slip - ${order.orderNumber}</title>
  <style>
    @media print { body { -webkit-print-color-adjust: exact; } }
    body { font-family: 'Segoe UI', Arial, sans-serif; margin: 0; padding: 20px; color: #333; }
    .slip-box { max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; }
    .header { text-align: center; margin-bottom: 20px; padding-bottom: 15px; border-bottom: 2px solid #333; }
    .header h1 { margin: 0; font-size: 22px; }
    .header h2 { margin: 5px 0 0; font-size: 16px; color: #555; }
    .info-section { margin-bottom: 20px; }
    .info-section h3 { margin: 0 0 5px; font-size: 14px; color: #666; text-transform: uppercase; }
    .info-section p { margin: 2px 0; font-size: 13px; }
    table { width: 100%; border-collapse: collapse; margin: 10px 0; }
    th, td { padding: 8px 6px; border-bottom: 1px solid #ddd; font-size: 13px; }
    th { background: #f5f5f5; text-align: left; }
    .text-center { text-align: center; }
    .footer { margin-top: 30px; text-align: center; font-size: 11px; color: #aaa; }
    .print-btn { margin: 20px auto; display: block; padding: 10px 30px; font-size: 16px; cursor: pointer; }
    @media print { .print-btn { display: none; } }
  </style>
</head>
<body>
  <button class="print-btn" onclick="window.print()">Print Packing Slip</button>
  <div class="slip-box">
    <div class="header">
      ${brand.logo ? `<img src="${brand.logo}" alt="${brand.name}" style="max-height:50px;margin-bottom:5px" />` : ''}
      <h1>${brand.name}</h1>
      <h2>Packing Slip</h2>
    </div>

    <div style="display:flex;justify-content:space-between;margin-bottom:20px">
      <div class="info-section">
        <h3>Ship To</h3>
        <p><strong>${customer.name}</strong></p>
        <p>${customer.phone}</p>
        ${customer.address ? `<p>${customer.address}${customer.district ? ', ' + customer.district : ''}</p>` : ''}
      </div>
      <div class="info-section" style="text-align:right">
        <p><strong>Order #:</strong> ${order.orderNumber}</p>
        <p><strong>Date:</strong> ${new Date(order.createdAt).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' })}</p>
      </div>
    </div>

    <table>
      <thead>
        <tr>
          <th>Item</th>
          <th>SKU</th>
          <th>Qty</th>
        </tr>
      </thead>
      <tbody>
        ${itemsHtml}
      </tbody>
    </table>

    <div class="info-section" style="margin-top:30px">
      <h3>Notes</h3>
      <p style="font-size:12px">Please inspect all items before accepting delivery.</p>
    </div>

    <div class="footer">Thank you for your business!</div>
  </div>
</body>
</html>`

    return new NextResponse(html, {
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    })
  } catch (error) {
    console.error('Packing slip error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

