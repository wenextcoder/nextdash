export interface Order {
  id: number
  number: string
  status: string
  status_label: string
  date: string
  total: number
  currency: string
  formatted_total: string
  item_count: number
  payment_method: string
  view_url: string
  product_image: string | null
  product_name: string | null
}

export interface OrderDetails extends Order {
  subtotal: number
  discount_total: number
  shipping_total: number
  tax_total: number
  formatted_subtotal: string
  formatted_discount_total: string
  formatted_shipping_total: string
  formatted_tax_total: string
  billing: Address
  shipping: Address
  items: OrderItem[]
  shipping_lines: ShippingLine[]
  coupon_lines: CouponLine[]
  fee_lines: FeeLine[]
  tax_lines: TaxLine[]
  customer_note: string
}

export interface OrderItem {
  id: number
  name: string
  quantity: number
  total: number
  subtotal: number
  formatted_total: string
  formatted_subtotal: string
  image: string | null
  product_url: string | null
  meta_data: OrderItemMeta[]
  sku: string
}

export interface OrderItemMeta {
  key: string
  value: string
  display_key: string
  display_value: string
}

export interface ShippingLine {
  id: number
  method_title: string
  method_id: string
  total: number
  formatted_total: string
}

export interface CouponLine {
  code: string
  discount: number
  formatted_discount: string
}

export interface FeeLine {
  id: number
  name: string
  total: number
  formatted_total: string
}

export interface TaxLine {
  label: string
  amount: number
  formatted_amount: string
}

export interface Address {
  first_name: string
  last_name: string
  company?: string
  address_1: string
  address_2?: string
  city: string
  state: string
  postcode: string
  country: string
  email?: string
  phone?: string
}

export interface Download {
  id: string
  name: string
  url: string
  product_name: string
  product_id: number
  order_id: number
  product_image: string | null
  downloads_remaining: string
  access_expires: string | null
}

export interface User {
  id: number
  username: string
  email: string
  first_name: string
  last_name: string
  display_name: string
}

export interface OverviewData {
  user: {
    name: string
    email: string
  }
  stats: {
    total_orders: number
    total_spent: number
    formatted_total_spent: string
  }
  recent_orders: Order[]
}

