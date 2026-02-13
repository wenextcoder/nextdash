import { useParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, Package, MapPin, CreditCard } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { api } from '@/lib/api'
import { formatDateTime } from '@/lib/utils'
import type { OrderDetails } from '@/types'

export default function OrderDetailsPage() {
  const { id } = useParams<{ id: string }>()
  
  const { data: order, isLoading } = useQuery<OrderDetails>({
    queryKey: ['order', id],
    queryFn: () => api.getOrder(Number(id)),
    enabled: !!id,
  })
  
  // @ts-ignore - WordPress global
  const wcCapabilities = window.nextdashData?.wcCapabilities || {}

  const getStatusVariant = (status: string) => {
    const variants: Record<string, 'success' | 'warning' | 'secondary' | 'destructive'> = {
      completed: 'success',
      processing: 'warning',
      'on-hold': 'secondary',
      pending: 'secondary',
      cancelled: 'destructive',
      refunded: 'destructive',
      failed: 'destructive',
    }
    return variants[status] || 'secondary'
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-4 md:grid-cols-2">
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Order not found</p>
        <Link to="/orders">
          <Button variant="outline" className="mt-4">
            Back to Orders
          </Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link to="/orders">
          <Button variant="ghost" size="icon" className="bg-black/10 hover:bg-black/20">
            <ArrowLeft className="h-5 w-5 " />
          </Button>
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-3xl font-bold tracking-tight">
              Order #{order.number}
            </h1>
            <Badge variant={getStatusVariant(order.status)}>
              {order.status_label}
            </Badge>
          </div>
          <p className="text-muted-foreground">
            Placed on {formatDateTime(order.date)}
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Order Items */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Order Items
            </CardTitle>
            <CardDescription>
              {order.items.length} items in this order
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {order.items.map((item) => (
                <div key={item.id} className="pb-4 border-b last:border-0">
                  <div className="flex items-start gap-4">
                    {item.image && (
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-16 h-16 object-cover rounded-md border flex-shrink-0"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      {item.product_url ? (
                        <a 
                          href={item.product_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="font-medium hover:text-primary transition-colors"
                        >
                          {item.name}
                        </a>
                      ) : (
                        <div className="font-medium">{item.name}</div>
                      )}
                      {item.sku && (
                        <div className="text-xs text-muted-foreground mt-0.5">
                          SKU: {item.sku}
                        </div>
                      )}
                      <div className="text-sm text-muted-foreground mt-1">
                        Quantity: {item.quantity}
                      </div>
                      
                      {/* Item Meta Data (Variations, Custom Options) */}
                      {item.meta_data && item.meta_data.length > 0 && (
                        <div className="mt-2 space-y-1">
                          {item.meta_data.map((meta, index) => (
                            <div key={index} className="text-sm">
                              <span className="text-muted-foreground">{meta.display_key}: </span>
                              <span className="font-medium">{meta.display_value}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="font-semibold" dangerouslySetInnerHTML={{ __html: item.formatted_total || '$0.00' }} />
                      {item.subtotal > item.total && (
                        <div className="text-xs text-muted-foreground line-through mt-0.5" dangerouslySetInnerHTML={{ __html: item.formatted_subtotal }} />
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {/* Totals */}
              <div className="space-y-2 pt-4">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span dangerouslySetInnerHTML={{ __html: order.formatted_subtotal || '$0.00' }} />
                </div>
                
                {/* Discounts/Coupons */}
                {order.coupon_lines && order.coupon_lines.length > 0 && (
                  <>
                    {order.coupon_lines.map((coupon, index) => (
                      <div key={index} className="flex justify-between text-sm text-green-600 dark:text-green-400">
                        <span>Coupon: {coupon.code}</span>
                        <span dangerouslySetInnerHTML={{ __html: `-${coupon.formatted_discount}` }} />
                      </div>
                    ))}
                  </>
                )}
                
                {/* Shipping */}
                {order.shipping_lines && order.shipping_lines.length > 0 && (
                  <>
                    {order.shipping_lines.map((shipping) => (
                      <div key={shipping.id} className="flex justify-between text-sm">
                        <span className="text-muted-foreground">
                          Shipping ({shipping.method_title})
                        </span>
                        <span dangerouslySetInnerHTML={{ __html: shipping.formatted_total || '$0.00' }} />
                      </div>
                    ))}
                  </>
                )}
                
                {/* Fees */}
                {order.fee_lines && order.fee_lines.length > 0 && (
                  <>
                    {order.fee_lines.map((fee) => (
                      <div key={fee.id} className="flex justify-between text-sm">
                        <span className="text-muted-foreground">{fee.name}</span>
                        <span dangerouslySetInnerHTML={{ __html: fee.formatted_total || '$0.00' }} />
                      </div>
                    ))}
                  </>
                )}
                
                {/* Tax */}
                {order.tax_lines && order.tax_lines.length > 0 ? (
                  <>
                    {order.tax_lines.map((tax, index) => (
                      <div key={index} className="flex justify-between text-sm">
                        <span className="text-muted-foreground">{tax.label}</span>
                        <span dangerouslySetInnerHTML={{ __html: tax.formatted_amount || '$0.00' }} />
                      </div>
                    ))}
                  </>
                ) : order.tax_total > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Tax</span>
                    <span dangerouslySetInnerHTML={{ __html: order.formatted_tax_total || '$0.00' }} />
                  </div>
                )}
                
                <div className="flex justify-between font-bold text-lg pt-2 border-t">
                  <span>Total</span>
                  <span dangerouslySetInnerHTML={{ __html: order.formatted_total || '$0.00' }} />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Billing Address */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Billing Address
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1 text-sm">
              <div className="font-medium">
                {order.billing.first_name} {order.billing.last_name}
              </div>
              {order.billing.company && <div>{order.billing.company}</div>}
              <div>{order.billing.address_1}</div>
              {order.billing.address_2 && <div>{order.billing.address_2}</div>}
              <div>
                {order.billing.city}, {order.billing.state} {order.billing.postcode}
              </div>
              <div>{order.billing.country}</div>
              <div className="pt-2 border-t mt-2">
                <div>{order.billing.email}</div>
                {order.billing.phone && <div>{order.billing.phone}</div>}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Shipping Address - Only show if shipping is enabled */}
        {wcCapabilities.shipping_enabled && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Shipping Address
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1 text-sm">
                <div className="font-medium">
                  {order.shipping.first_name} {order.shipping.last_name}
                </div>
                {order.shipping.company && <div>{order.shipping.company}</div>}
                <div>{order.shipping.address_1}</div>
                {order.shipping.address_2 && <div>{order.shipping.address_2}</div>}
                <div>
                  {order.shipping.city}, {order.shipping.state} {order.shipping.postcode}
                </div>
                <div>{order.shipping.country}</div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Payment Method */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Payment Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm">
              <span className="text-muted-foreground">Payment Method: </span>
              <span className="font-medium">{order.payment_method}</span>
            </div>
            {order.customer_note && (
              <div className="mt-4 p-3 bg-muted rounded-md">
                <div className="text-sm font-medium mb-1">Customer Note:</div>
                <div className="text-sm text-muted-foreground">
                  {order.customer_note}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-between">
        <Link to="/orders">
          <Button variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Orders
          </Button>
        </Link>
      </div>
    </div>
  )
}

