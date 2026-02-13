import { useState, useMemo } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Download as DownloadIcon, FileDown, AlertCircle } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { api } from '@/lib/api'
import type { Download } from '@/types'

export default function Downloads() {
  const [page, setPage] = useState(1)
  const perPage = 10
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['downloads', page],
    queryFn: () => api.getDownloads(page, perPage),
  })

  // Handle download click - refresh list after download
  const handleDownload = (download: Download) => {
    // Open download in new tab
    window.open(download.url, '_blank', 'noopener,noreferrer')
    
    // Refresh downloads list after a short delay to allow WooCommerce to update
    // This ensures the list updates when downloads_remaining reaches 0
    setTimeout(() => {
      queryClient.invalidateQueries({ queryKey: ['downloads'] })
    }, 1000)
  }

  // Flatten downloads array if it's grouped by orders
  const downloads: Download[] = useMemo(() => {
    if (!data?.downloads) return []
    
    // Check if downloads are grouped (array of arrays) or flat (array of objects)
    if (Array.isArray(data.downloads) && data.downloads.length > 0) {
      // If first item is an array, it's grouped - flatten it
      if (Array.isArray(data.downloads[0])) {
        return data.downloads.flat()
      }
      // Otherwise it's already flat
      return data.downloads
    }
    return []
  }, [data])
  
  const totalPages = data?.pages || 1
  const totalDownloads = data?.total || downloads.length || 0

  const formatDownloadsRemaining = (remaining: string): string => {
    if (remaining === '' || remaining === null || remaining === undefined) {
      return 'Unlimited'
    }
    const num = parseInt(remaining, 10)
    if (isNaN(num)) {
      return 'Unlimited'
    }
    return num.toString()
  }

  const isLastDownload = (remaining: string): boolean => {
    const num = parseInt(remaining, 10)
    return !isNaN(num) && num === 1
  }

  const formatExpires = (expires: string | null): string => {
    if (!expires || expires === '') {
      return 'Never'
    }
    try {
      const date = new Date(expires)
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    } catch {
      return 'Never'
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        {/* Desktop Skeleton */}
        <Card className="hidden md:block">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr>
                    <th className="p-4 text-left"><Skeleton className="h-4 w-20" /></th>
                    <th className="p-4 text-left"><Skeleton className="h-4 w-24" /></th>
                    <th className="p-4 text-left"><Skeleton className="h-4 w-32" /></th>
                    <th className="p-4 text-left"><Skeleton className="h-4 w-24" /></th>
                    <th className="p-4 text-right"><Skeleton className="h-4 w-20" /></th>
                  </tr>
                </thead>
                <tbody>
                  {[1, 2, 3].map((i) => (
                    <tr key={i}>
                      <td className="p-4"><Skeleton className="h-4 w-full" /></td>
                      <td className="p-4"><Skeleton className="h-4 w-16" /></td>
                      <td className="p-4"><Skeleton className="h-4 w-20" /></td>
                      <td className="p-4"><Skeleton className="h-4 w-24" /></td>
                      <td className="p-4"><Skeleton className="h-8 w-24 ml-auto" /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
        {/* Mobile Skeleton */}
        <div className="md:hidden space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="space-y-3">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-6 w-full" />
                  <div className="grid grid-cols-2 gap-3 pt-2 border-t">
                    <div>
                      <Skeleton className="h-3 w-24 mb-2" />
                      <Skeleton className="h-4 w-16" />
                    </div>
                    <div>
                      <Skeleton className="h-3 w-16 mb-2" />
                      <Skeleton className="h-4 w-20" />
                    </div>
                  </div>
                  <Skeleton className="h-10 w-full mt-2" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Downloads</h1>
        <p className="text-muted-foreground mt-1">
          Access your downloadable products
        </p>
      </div>

      {/* Downloads Table */}
      {downloads.length > 0 ? (
        <>
          {/* Desktop Table View */}
          <Card className="hidden md:block">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full divide-y divide-border">
                  <thead>
                    <tr className="text-left text-sm font-medium text-muted-foreground">
                      <th className="p-4">Order</th>
                      <th className="p-4">Product</th>
                      <th className="p-4">Downloads Remaining</th>
                      <th className="p-4">Expires</th>
                      <th className="p-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {downloads.map((download) => (
                      <tr key={download.id} className="hover:bg-accent/50 transition-colors">
                        {/* Order */}
                        <td className="p-4">
                          <span className="text-sm">#{download.order_id}</span>
                        </td>
                        
                        {/* Product */}
                        <td className="p-4">
                          <div>
                            <div className="font-semibold text-base">
                              {download.product_name || download.name}
                            </div>
                            {download.product_name && download.name !== download.product_name && (
                              <div className="text-sm text-muted-foreground mt-1">
                                {download.name}
                              </div>
                            )}
                          </div>
                        </td>
                        
                        {/* Downloads Remaining */}
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <span className="text-sm">
                              {formatDownloadsRemaining(download.downloads_remaining)}
                            </span>
                            {isLastDownload(download.downloads_remaining) && (
                              <Badge variant="warning" className="text-xs">
                                <AlertCircle className="h-3 w-3 mr-1" />
                                Last
                              </Badge>
                            )}
                          </div>
                        </td>
                        
                        {/* Expires */}
                        <td className="p-4">
                          <span className="text-sm">
                            {formatExpires(download.access_expires)}
                          </span>
                        </td>
                        
                        {/* Action */}
                        <td className="p-4">
                          <div className="flex justify-end">
                            <Button
                              size="default"
                              className="bg-primary text-primary-foreground hover:bg-primary/90"
                              onClick={() => handleDownload(download)}
                            >
                              <DownloadIcon className="h-4 w-4 mr-2" />
                              Download
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Mobile Card View */}
          <div className="md:hidden space-y-4">
            {downloads.map((download) => (
              <Card key={download.id}>
                <CardContent className="p-4">
                  <div className="space-y-3">
                    {/* Header: Order & Product */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="text-xs text-muted-foreground mb-1">
                          Order #{download.order_id}
                        </div>
                        <div className="font-semibold text-base">
                          {download.product_name || download.name}
                        </div>
                        {download.product_name && download.name !== download.product_name && (
                          <div className="text-sm text-muted-foreground mt-1">
                            {download.name}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Info Grid */}
                    <div className="grid grid-cols-2 gap-3 pt-2 border-t">
                      <div>
                        <div className="text-xs text-muted-foreground mb-1">Downloads Remaining</div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">
                            {formatDownloadsRemaining(download.downloads_remaining)}
                          </span>
                          {isLastDownload(download.downloads_remaining) && (
                            <Badge variant="warning" className="text-xs">
                              <AlertCircle className="h-3 w-3 mr-1" />
                              Last
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground mb-1">Expires</div>
                        <div className="text-sm font-medium">
                          {formatExpires(download.access_expires)}
                        </div>
                      </div>
                    </div>

                    {/* Download Button */}
                    <div className="pt-2">
                      <Button
                        size="default"
                        className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                        onClick={() => handleDownload(download)}
                      >
                        <DownloadIcon className="h-4 w-4 mr-2" />
                        Download
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t">
              <div className="text-sm text-muted-foreground">
                Showing {((page - 1) * perPage) + 1} to {Math.min(page * perPage, totalDownloads)} of {totalDownloads} downloads
              </div>
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
            </div>
          )}
        </>
      ) : (
        <Card>
          <CardContent>
            <div className="text-center py-12 text-muted-foreground">
              <FileDown className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">No downloads available</p>
              <p className="text-sm mt-1">
                Purchase downloadable products to access them here
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
