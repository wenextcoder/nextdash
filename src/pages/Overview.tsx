import { useQuery } from '@tanstack/react-query'
import { ShoppingBag, Wallet, Package } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { api } from '@/lib/api'
import { formatDate } from '@/lib/utils'
import { Link } from 'react-router-dom'
import { t, tf } from '@/lib/translations'
import type { OverviewData } from '@/types'

export default function Overview() {
  const { data, isLoading } = useQuery<OverviewData>({
    queryKey: ['overview'],
    queryFn: api.getOverview,
  })

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    )
  }

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          {data?.user.name ? tf('welcome_back', data.user.name) : t('welcome_back')}
        </h1>
        <p className="text-muted-foreground mt-1">
          {t('account_overview')}
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('total_orders')}</CardTitle>
            <ShoppingBag className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data?.stats.total_orders || 0}</div>
            <p className="text-xs text-muted-foreground">{t('all_time')}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('total_spent')}</CardTitle>
            <Wallet className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div 
              className="text-2xl font-bold"
              dangerouslySetInnerHTML={{ __html: data?.stats.formatted_total_spent || '$0.00' }}
            />
            <p className="text-xs text-muted-foreground">{t('all_time')}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('recent_orders')}</CardTitle>
            <Package className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data?.recent_orders?.length || 0}
            </div>
            <p className="text-xs text-muted-foreground">{t('last_5_orders')}</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Orders */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <CardTitle>{t('recent_orders')}</CardTitle>
              <CardDescription>{t('recent_orders')}</CardDescription>
            </div>
            <Link to="/orders">
              <Button variant="outline" size="sm">
                {t('view_all_orders')}
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {data?.recent_orders && data.recent_orders.length > 0 ? (
            <div className="space-y-4">
              {data.recent_orders.map((order) => (
                <div
                  key={order.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border rounded-lg hover:bg-accent transition-colors gap-4"
                >
                  <div className="flex items-center gap-4 flex-1 min-w-0">
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
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className="font-medium">Order #{order.number}</span>
                        <Badge variant={getStatusVariant(order.status)}>
                          {order.status_label}
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {formatDate(order.date)} • {order.item_count} items
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 flex-shrink-0">
                    <div className="text-right">
                      <div 
                        className="font-semibold"
                        dangerouslySetInnerHTML={{ __html: order.formatted_total }}
                      />
                      <div className="text-xs text-muted-foreground">
                        {order.payment_method}
                      </div>
                    </div>
                    <Link to={`/orders/${order.id}`}>
                      <Button variant="outline" size="sm">
                        {t('order_details')}
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <ShoppingBag className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>{t('no_orders')}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

