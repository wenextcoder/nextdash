import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { ShoppingBag, Eye } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { api } from '@/lib/api'
import { formatDate } from '@/lib/utils'
import type { Order } from '@/types'

export default function Orders() {
  const [page, setPage] = useState(1)
  const perPage = 10

  const { data, isLoading } = useQuery({
    queryKey: ['orders', page],
    queryFn: () => api.getOrders(page, perPage),
  })

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
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      </div>
    )
  }

  const orders: Order[] = data?.orders || []
  const totalPages = data?.pages || 1

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Orders</h1>
        <p className="text-muted-foreground mt-1">
          View and manage your order history
        </p>
      </div>

      {/* Orders List */}
      <Card>
        <CardHeader>
          <CardTitle>Order History</CardTitle>
          <CardDescription>
            {data?.total || 0} orders in total
          </CardDescription>
        </CardHeader>
        <CardContent>
          {orders.length > 0 ? (
            <>
              <div className="space-y-4">
                {orders.map((order) => (
                  <div
                    key={order.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border rounded-lg hover:bg-accent transition-colors gap-4"
                  >
                    <div className="flex items-center gap-4 flex-1">
                      {/* Product Image */}
                      <div className="flex-shrink-0">
                        {order.product_image ? (
                          <img
                            src={order.product_image}
                            alt={`Order #${order.number}`}
                            className="w-16 h-16 object-cover rounded-md border"
                          />
                        ) : (
                          <div className="w-16 h-16 bg-muted rounded-md border flex items-center justify-center">
                            <ShoppingBag className="h-8 w-8 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                      {/* Order Details */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium">Order #{order.number}</span>
                          <Badge variant={getStatusVariant(order.status)}>
                            {order.status_label}
                          </Badge>
                        </div>
                        {order.product_name && (
                          <div className="text-sm font-medium mb-1 line-clamp-1">
                            {order.product_name}
                            {order.item_count > 1 && (
                              <span className="text-muted-foreground font-normal"> + {order.item_count - 1} more</span>
                            )}
                          </div>
                        )}
                        <div className="text-sm text-muted-foreground">
                          {order.item_count} {order.item_count === 1 ? 'item' : 'items'} • {formatDate(order.date)} • {order.payment_method}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="font-semibold text-lg" dangerouslySetInnerHTML={{ __html: order.formatted_total || '$0.00' }} />
                      </div>
                      <Link to={`/orders/${order.id}`}>
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4 mr-2" />
                          View
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 pt-6 border-t">
                <div className="text-sm text-muted-foreground">
                  Showing {((page - 1) * perPage) + 1} to {Math.min(page * perPage, data?.total || 0)} of {data?.total || 0} orders
                </div>
                {totalPages > 1 && (
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={page === 1}
                    >
                      Previous
                    </Button>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                        let pageNum: number
                        if (totalPages <= 5) {
                          pageNum = i + 1
                        } else if (page <= 3) {
                          pageNum = i + 1
                        } else if (page >= totalPages - 2) {
                          pageNum = totalPages - 4 + i
                        } else {
                          pageNum = page - 2 + i
                        }
                        
                        return (
                          <Button
                            key={pageNum}
                            variant={page === pageNum ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setPage(pageNum)}
                            className="min-w-[40px]"
                          >
                            {pageNum}
                          </Button>
                        )
                      })}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                    >
                      Next
                    </Button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <ShoppingBag className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">No orders found</p>
              <p className="text-sm mt-1">Your order history will appear here</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

