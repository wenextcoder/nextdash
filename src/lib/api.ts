// @ts-ignore - WordPress global
const { restUrl, nonce } = window.nextdashData || {
  restUrl: '/wp-json/',
  nonce: '',
}

const API_BASE = `${restUrl}nextdash/v1`

interface FetchOptions extends RequestInit {
  params?: Record<string, string | number>
}

async function apiFetch<T>(endpoint: string, options: FetchOptions = {}): Promise<T> {
  const { params, ...fetchOptions } = options

  let url = `${API_BASE}${endpoint}`
  
  if (params) {
    const queryString = new URLSearchParams(
      Object.entries(params).map(([key, value]) => [key, String(value)])
    ).toString()
    url += `?${queryString}`
  }

  const response = await fetch(url, {
    ...fetchOptions,
    headers: {
      'Content-Type': 'application/json',
      'X-WP-Nonce': nonce,
      ...fetchOptions.headers,
    },
    credentials: 'same-origin',
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Request failed' }))
    throw new Error(error.message || 'API request failed')
  }

  return response.json()
}

// API functions
export const api = {
  // Overview
  getOverview: () => apiFetch<any>('/overview'),

  // Orders
  getOrders: (page = 1, perPage = 10) =>
    apiFetch<any>('/orders', {
      params: { page, per_page: perPage },
    }),

  getOrder: (id: number) => apiFetch<any>(`/orders/${id}`),

  // Downloads
  getDownloads: (page = 1, perPage = 10) =>
    apiFetch<any>('/downloads', {
      params: { page, per_page: perPage },
    }),

  // Addresses
  getAddresses: () => apiFetch<any>('/addresses'),

  updateAddress: (type: 'billing' | 'shipping', address: any) =>
    apiFetch<any>('/addresses', {
      method: 'POST',
      body: JSON.stringify({ type, address }),
    }),

  // Account
  getAccount: () => apiFetch<any>('/account'),

  updateAccount: (data: any) =>
    apiFetch<any>('/account', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Logout
  logout: async () => {
    try {
      const response = await apiFetch<any>('/logout', {
        method: 'POST',
      })
      
      // Redirect to my-account page (will show login form)
      if (response.redirect_url) {
        window.location.href = response.redirect_url
      } else {
        // Fallback to my-account page
        // @ts-ignore
        window.location.href = window.nextdashData?.myAccountUrl || window.nextdashData?.siteUrl + '/my-account/'
      }
    } catch (error) {
      console.error('Logout error:', error)
      // Fallback to my-account page even on error
      // @ts-ignore
      window.location.href = window.nextdashData?.myAccountUrl || window.nextdashData?.siteUrl + '/my-account/'
    }
  },

  // Wishlist (YITH) - Using NextDash custom endpoint that includes items
  getWishlists: async () => {
    // @ts-ignore - WordPress global
    const { restUrl, nonce } = window.nextdashData || { restUrl: '/wp-json/', nonce: '' }
    
    // Try NextDash custom endpoint first (includes items)
    try {
      const response = await fetch(`${restUrl}nextdash/v1/wishlists`, {
        headers: {
          'X-WP-Nonce': nonce,
          'Content-Type': 'application/json',
        },
        credentials: 'same-origin',
      })
      
      if (response.ok) {
        const data = await response.json()
        if (Array.isArray(data)) {
          return data
        }
      }
    } catch (e) {
      // Fallback to YITH endpoint if NextDash endpoint fails
    }
    
    // Fallback to YITH's built-in REST API
    const response = await fetch(`${restUrl}yith/wishlist/v1/lists`, {
      headers: {
        'X-WP-Nonce': nonce,
        'Content-Type': 'application/json',
      },
      credentials: 'same-origin',
    })
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Failed to fetch wishlists' }))
      throw new Error(error.message || error.error || 'Failed to fetch wishlists')
    }
    
    const data = await response.json()
    // YITH returns { lists: { "1": {...}, "2": {...} } } format (object with IDs as keys)
    if (data && data.lists) {
      if (Array.isArray(data.lists)) {
        return data.lists
      }
      // Convert object to array
      if (typeof data.lists === 'object') {
        return Object.values(data.lists)
      }
    }
    // Fallback: if it's already an array
    if (data && Array.isArray(data)) {
      return data
    }
    return []
  },

  getWishlist: async (id: number) => {
    // Get all wishlists and find the one with matching ID
    const wishlists = await api.getWishlists()
    const wishlist = wishlists.find((w: any) => w.id === id || w.ID === id)
    if (!wishlist) {
      throw new Error('Wishlist not found')
    }
    return wishlist
  },

  addToWishlist: async (wishlistId: number, productId: number, quantity: number = 1) => {
    // @ts-ignore - WordPress global
    const { restUrl, nonce } = window.nextdashData || { restUrl: '/wp-json/', nonce: '' }
    const response = await fetch(`${restUrl}yith/wishlist/v1/items`, {
      method: 'POST',
      headers: {
        'X-WP-Nonce': nonce,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        product_id: productId,
        wishlist_id: wishlistId,
        quantity: quantity 
      }),
      credentials: 'same-origin',
    })
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Failed to add product' }))
      throw new Error(error.message || error.error || 'Failed to add product to wishlist')
    }
    
    return response.json()
  },

  removeFromWishlist: async (wishlistId: number, productId: number) => {
    // @ts-ignore - WordPress global
    const { restUrl, nonce } = window.nextdashData || { restUrl: '/wp-json/', nonce: '' }
    const response = await fetch(`${restUrl}yith/wishlist/v1/items`, {
      method: 'DELETE',
      headers: {
        'X-WP-Nonce': nonce,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        product_id: productId,
        wishlist_id: wishlistId 
      }),
      credentials: 'same-origin',
    })
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Failed to remove product' }))
      throw new Error(error.message || error.error || 'Failed to remove product from wishlist')
    }
    
    return response.json()
  },
}

