import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Heart, Trash2, ShoppingBag } from 'lucide-react'
import { Card, CardContent } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Skeleton } from '../components/ui/skeleton'
import { api } from '@/lib/api'

interface WishlistItem {
  id: number
  product_id: number
  product_name?: string
  name?: string
  product_image?: string
  image?: string
  product_price?: string
  price?: string
  product_url?: string
  permalink?: string
  quantity?: number
}

interface YITHWishlist {
  id: number
  name: string
  token?: string
  user_id?: number
  items?: WishlistItem[]
  products?: any[]
  [key: string]: any
}

export default function Wishlist() {
  const queryClient = useQueryClient()

  const { data: wishlists, isLoading, error } = useQuery<YITHWishlist[]>({
    queryKey: ['wishlists'],
    queryFn: async () => {
      try {
        const response = await api.getWishlists()
        
        // YITH REST API returns array of wishlists (or object with IDs as keys)
        let wishlistArray: YITHWishlist[] = []
        
        if (Array.isArray(response)) {
          wishlistArray = response
        } else if (response && typeof response === 'object') {
          // Convert object with IDs as keys to array
          wishlistArray = Object.values(response)
        }
        
        if (wishlistArray.length > 0) {
          // Get items for each wishlist - YITH wishlist data includes items via get_data()
          // But we may need to get the items separately
          return wishlistArray.map((wishlist: any) => {
            // YITH wishlist data structure includes items if available
            // The items are typically in the wishlist object itself
            return wishlist
          })
        }
        
        return []
      } catch (err) {
        console.error('Error fetching wishlists:', err)
        throw err
      }
    },
    retry: 1,
  })

  const removeMutation = useMutation({
    mutationFn: ({ wishlistId, productId }: { wishlistId: number; productId: number }) =>
      api.removeFromWishlist(wishlistId, productId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wishlists'] })
    },
  })

  const handleRemove = (wishlistId: number, productId: number) => {
    if (confirm('Are you sure you want to remove this item from your wishlist?')) {
      removeMutation.mutate({ wishlistId, productId })
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    )
  }

  // Handle API errors
  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Wishlist</h1>
          <p className="text-muted-foreground">
            Unable to load wishlist
          </p>
        </div>
        <Card>
          <CardContent className="p-6">
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">
                {error instanceof Error ? error.message : 'Failed to load wishlist. Please make sure YITH WooCommerce Wishlist REST API plugin is installed and activated.'}
              </p>
              <Button onClick={() => window.location.reload()}>
                Retry
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Get the first wishlist (YITH typically has one default wishlist per user)
  const wishlist = wishlists && wishlists.length > 0 ? wishlists[0] : null
  
  // Extract items from wishlist - YITH wishlist data structure
  let items: WishlistItem[] = []
  if (wishlist) {
    // YITH wishlist may have items directly or we need to get them from the wishlist object
    // The get_data() method includes items if the wishlist was loaded with items
    if (wishlist.items && Array.isArray(wishlist.items)) {
      // Items are already in array format
      items = wishlist.items.map((item: any) => {
        const product = item.product || item
        return {
          id: item.id || item.product_id || 0,
          product_id: item.product_id || product?.id || 0,
          product_name: product?.name || item.product_name || '',
          name: product?.name || item.product_name || '',
          product_image: product?.image?.src || product?.images?.[0]?.src || item.product_image || '',
          image: product?.image?.src || product?.images?.[0]?.src || item.product_image || '',
          product_price: product?.price_html || product?.price || item.product_price || '',
          price: product?.price_html || product?.price || item.product_price || '',
          product_url: product?.permalink || product?.product_url || item.product_url || '',
          permalink: product?.permalink || product?.product_url || item.product_url || '',
          quantity: item.quantity || 1,
        }
      })
    } else if (wishlist.products && Array.isArray(wishlist.products)) {
      // Products array format
      items = wishlist.products.map((product: any, index: number) => ({
        id: product.id || index,
        product_id: product.product_id || product.id || 0,
        product_name: product.name || product.product_name || '',
        name: product.name || product.product_name || '',
        product_image: product.image?.src || product.images?.[0]?.src || product.product_image || product.image || '',
        image: product.image?.src || product.images?.[0]?.src || product.product_image || product.image || '',
        product_price: product.price_html || product.price || product.product_price || '',
        price: product.price_html || product.price || product.product_price || '',
        product_url: product.permalink || product.product_url || '',
        permalink: product.permalink || product.product_url || '',
        quantity: product.quantity || 1,
      }))
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Wishlist</h1>
        <p className="text-muted-foreground">
          {items.length > 0 
            ? `${items.length} ${items.length === 1 ? 'item' : 'items'} in your wishlist`
            : 'Your saved products will appear here'}
        </p>
      </div>

      {items.length === 0 ? (
        <Card>
          <CardContent>
            <div className="text-center py-12">
              <Heart className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
              <p className="text-muted-foreground text-lg mb-2">
                Your wishlist is empty
              </p>
              <p className="text-muted-foreground text-sm mb-4">
                Start adding products to your wishlist!
              </p>
              <Button asChild>
                <a 
                  href={(() => {
                    // @ts-ignore - WordPress global
                    const shopUrl = window.nextdashData?.shopUrl || '/shop/'
                    // Remove site URL if it's included to make it relative
                    const siteUrl = window.nextdashData?.siteUrl || ''
                    if (shopUrl.startsWith('http')) {
                      // If it's a full URL, make it relative by removing site URL
                      return shopUrl.replace(siteUrl, '') || '/shop/'
                    }
                    return shopUrl
                  })()}
                >
                  Browse Products
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-4 font-medium text-muted-foreground">Product</th>
                    <th className="text-left p-4 font-medium text-muted-foreground">Price</th>
                    <th className="text-right p-4 font-medium text-muted-foreground">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => {
                    const imageUrl = item.product_image || item.image || ''
                    const productName = item.product_name || item.name || 'Product'
                    const productUrl = item.product_url || item.permalink || ''
                    const productPrice = item.product_price || item.price || ''
                    
                    return (
                      <tr 
                        key={item.id} 
                        className="border-b hover:bg-accent/50 transition-colors"
                      >
                        {/* Product Name with Image */}
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="flex-shrink-0">
                              {imageUrl ? (
                                <img
                                  src={imageUrl}
                                  alt={productName}
                                  className="w-16 h-16 object-cover rounded-md border"
                                />
                              ) : (
                                <div className="w-16 h-16 bg-muted rounded-md border flex items-center justify-center">
                                  <ShoppingBag className="h-8 w-8 text-muted-foreground" />
                                </div>
                              )}
                            </div>
                            <div className="min-w-0">
                              {productUrl ? (
                                <a 
                                  href={(() => {
                                    // If it's a full URL, use it directly
                                    if (productUrl.startsWith('http')) {
                                      return productUrl
                                    }
                                    // If it's a relative URL, make sure it's absolute
                                    const siteUrl = window.nextdashData?.siteUrl || window.location.origin
                                    return productUrl.startsWith('/') ? siteUrl + productUrl : siteUrl + '/' + productUrl
                                  })()}
                                  className="font-medium hover:text-primary transition-colors block"
                                >
                                  {productName}
                                </a>
                              ) : (
                                <span className="font-medium">{productName}</span>
                              )}
                            </div>
                          </div>
                        </td>
                        
                        {/* Price */}
                        <td className="p-4">
                          {productPrice ? (
                            <span 
                              className="text-primary font-medium"
                              dangerouslySetInnerHTML={{ __html: productPrice }}
                            />
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </td>
                        
                        {/* Actions */}
                        <td className="p-4">
                          <div className="flex items-center justify-end gap-2">
                            {productUrl && (
                              <Button asChild size="default" className="bg-primary text-primary-foreground hover:bg-primary/90">
                                <a 
                                  href={(() => {
                                    // If it's a full URL, use it directly
                                    if (productUrl.startsWith('http')) {
                                      return productUrl
                                    }
                                    // If it's a relative URL, make sure it's absolute
                                    const siteUrl = window.nextdashData?.siteUrl || window.location.origin
                                    return productUrl.startsWith('/') ? siteUrl + productUrl : siteUrl + '/' + productUrl
                                  })()}
                                >
                                  View
                                </a>
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleRemove(wishlist!.id, item.product_id)}
                              disabled={removeMutation.isPending}
                              className="text-destructive hover:text-destructive bg-destructive/10 hover:bg-destructive/20"
                              title="Remove from wishlist"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
