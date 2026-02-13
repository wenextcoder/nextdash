import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Home, ShoppingBag, Download, MapPin, User, Heart, LogOut, Menu, Moon, Sun, Search, X } from 'lucide-react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { useTheme } from './theme-provider'
import { api } from '@/lib/api'
import { cn } from '@/lib/utils'
import { t } from '@/lib/translations'
import type { NextDashTranslations } from '../global'

interface DashboardProps {
  children: React.ReactNode
}

type WCCapabilityKey = 'shipping_enabled' | 'downloads_enabled'

interface MenuItem {
  id: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  path: string
  requiredCapability: WCCapabilityKey | null
}

// Menu items will be translated dynamically in the component
const allMenuItems: Omit<MenuItem, 'label'>[] = [
  { id: 'overview', icon: Home, path: '/', requiredCapability: null },
  { id: 'orders', icon: ShoppingBag, path: '/orders', requiredCapability: null },
  { id: 'downloads', icon: Download, path: '/downloads', requiredCapability: 'downloads_enabled' },
  { id: 'wishlist', icon: Heart, path: '/wishlist', requiredCapability: null },
  { id: 'addresses', icon: MapPin, path: '/edit-address', requiredCapability: 'shipping_enabled' },
  { id: 'account', icon: User, path: '/edit-account', requiredCapability: null },
]

export default function Dashboard({ children }: DashboardProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const location = useLocation()
  const { theme, setTheme } = useTheme()

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light')
  }

  const handleLogout = async () => {
    if (confirm('Are you sure you want to logout?')) {
      await api.logout()
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      // Redirect to shop page with search query
      const siteUrl = window.nextdashData?.siteUrl || ''
      window.location.href = `${siteUrl}/shop/?s=${encodeURIComponent(searchQuery)}`
    }
  }

  const goToHome = () => {
    const siteUrl = window.nextdashData?.siteUrl || ''
    window.location.href = siteUrl
  }

  const logoUrl = window.nextdashData?.logoUrl || ''
  const siteName = window.nextdashData?.siteName || 'NextDash'
  const siteUrl = window.nextdashData?.siteUrl || ''
  const wcCapabilities = window.nextdashData?.wcCapabilities || {}
  const sections = (window.nextdashData?.settings?.sections || {}) as Record<string, boolean>
  
  // Get translation keys for menu items
  const menuLabelMap: Record<string, keyof NextDashTranslations> = {
    overview: 'overview',
    orders: 'orders',
    downloads: 'downloads',
    wishlist: 'wishlist',
    addresses: 'addresses',
    account: 'account',
  }
  
  // Filter menu items based on WooCommerce capabilities and enabled sections
  // Add translated labels
  const menuItems: MenuItem[] = allMenuItems
    .filter(item => {
      // Check if section is enabled in settings (defaults to true if not set)
      const sectionEnabled = sections[item.id] !== false
      
      if (!sectionEnabled) {
        return false
      }
      
      // Then check WooCommerce capabilities
      if (!item.requiredCapability) return true
      return wcCapabilities[item.requiredCapability] === true
    })
    .map(item => ({
      ...item,
      label: t(menuLabelMap[item.id] || 'overview', item.id),
    }))

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Top Header - Fixed across full width */}
      <header className="h-16 border-b bg-card">
        <div className="flex items-center h-full gap-4">
          {/* Left: Logo Section - matches sidebar width */}
          <div className="flex items-center gap-3 px-4 md:px-6 lg:w-64 lg:border-r h-full flex-shrink-0">
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden flex-shrink-0"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              title={sidebarOpen ? 'Close menu' : 'Open menu'}
            >
              {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
            
            {logoUrl ? (
              <a href={siteUrl} className="flex-shrink-0" title="Go to home">
                <img src={logoUrl} alt={siteName} className="h-9 w-auto object-contain cursor-pointer hover:opacity-80 transition-opacity" />
              </a>
            ) : (
              <a href={siteUrl} className="flex-shrink-0" title="Go to home">
                <h1 className="text-xl font-bold cursor-pointer hover:opacity-80 transition-opacity">{siteName}</h1>
              </a>
            )}
          </div>
          
          {/* Center: Search Bar & Home Button - Hidden on mobile */}
          <div className="hidden md:flex flex-1 items-center gap-2 px-2 md:px-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={goToHome}
              title="Go to home"
              className="flex-shrink-0"
            >
              <Home className="w-5 h-5" />
            </Button>
            
            <form onSubmit={handleSearch} className="flex-1 max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                <Input
                  type="search"
                  placeholder={t('search_products')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 pr-4 h-9"
                />
              </div>
            </form>
          </div>
          
          {/* Right: Theme Toggle */}
          <div className="flex items-center gap-2 px-4 md:px-6 flex-shrink-0">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className="rounded-full"
              title={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
            >
              {theme === 'light' ? (
                <Moon className="w-5 h-5" />
              ) : (
                <Sun className="w-5 h-5" />
              )}
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content Area: Sidebar + Content */}
      <div className="flex flex-1 overflow-hidden" style={{ height: 'calc(100vh - 4rem)', minHeight: 0 }}>
        {/* Sidebar - Desktop - Fixed */}
        <aside 
          className="hidden lg:flex lg:flex-col lg:w-64 border-r bg-card" 
          style={{ 
            height: 'calc(100vh - 4rem)',
            position: 'fixed',
            left: 0,
            top: '4rem',
            overflow: 'hidden'
          }}
        >
          <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto" style={{ minHeight: 0 }}>
            {menuItems.map((item) => {
              const Icon = item.icon
              const isActive = location.pathname === item.path
              
              return (
                <Link
                  key={item.id}
                  to={item.path}
                  className={cn(
                    'flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors',
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                  )}
                >
                  <Icon className="w-5 h-5 mr-3" />
                  {item.label}
                </Link>
              )
            })}
          </nav>

          <div className="flex-shrink-0 p-3 border-t bg-card">
            <Button
              variant="ghost"
              className="w-full justify-start bg-secondary hover:bg-red-500 hover:text-white transition-colors"
              onClick={handleLogout}
            >
              <LogOut className="w-5 h-5 mr-3" />
              {t('logout')}
            </Button>
          </div>
        </aside>

        {/* Mobile Sidebar */}
        {sidebarOpen && (
          <>
            <div
              className="fixed inset-0 z-40 bg-black/50 lg:hidden"
              onClick={() => setSidebarOpen(false)}
            ></div>
            <aside className="fixed inset-y-0 left-0 z-50 w-64 flex flex-col bg-card lg:hidden shadow-2xl">
              <div className="flex items-center justify-between h-16 px-6 border-b">
                {logoUrl ? (
                  <a href={siteUrl} onClick={() => setSidebarOpen(false)}>
                    <img src={logoUrl} alt={siteName} className="h-9 w-auto object-contain cursor-pointer hover:opacity-80 transition-opacity" />
                  </a>
                ) : (
                  <a href={siteUrl} onClick={() => setSidebarOpen(false)}>
                    <h1 className="text-xl font-bold cursor-pointer hover:opacity-80 transition-opacity">{siteName}</h1>
                  </a>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setSidebarOpen(false)}
                  title="Close menu"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>
              
              {/* Mobile Search */}
              <div className="px-4 py-3 border-b">
                <form onSubmit={(e) => { handleSearch(e); setSidebarOpen(false); }}>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                    <Input
                      type="search"
                      placeholder={t('search_products')}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9 pr-4 h-9"
                    />
                  </div>
                </form>
                
                <Button
                  variant="ghost"
                  onClick={() => { goToHome(); setSidebarOpen(false); }}
                  className="w-full justify-start mt-2 text-sm font-medium"
                >
                  <Home className="w-5 h-5 mr-3" />
                  {t('go_to_home')}
                </Button>
              </div>
              
              <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1" style={{ minHeight: 0 }}>
                {menuItems.map((item) => {
                  const Icon = item.icon
                  const isActive = location.pathname === item.path
                  
                  return (
                    <Link
                      key={item.id}
                      to={item.path}
                      onClick={() => setSidebarOpen(false)}
                      className={cn(
                        'flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors',
                        isActive
                          ? 'bg-primary text-primary-foreground'
                          : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                      )}
                    >
                      <Icon className="w-5 h-5 mr-3" />
                      {item.label}
                    </Link>
                  )
                })}
              </nav>

              <div className="flex-shrink-0 p-3 border-t bg-card">
                <Button
                  variant="ghost"
                  className="w-full justify-start bg-secondary hover:bg-red-500 hover:text-white transition-colors"
                  onClick={handleLogout}
                >
                  <LogOut className="w-5 h-5 mr-3" />
                  Logout
                </Button>
              </div>
            </aside>
          </>
        )}

        {/* Content Column - Scrollable */}
        <main 
          className="flex-1 overflow-y-auto overflow-x-hidden lg:ml-64" 
          style={{ 
            WebkitOverflowScrolling: 'touch',
            minHeight: 0,
            overflowX: 'hidden',
            height: 'calc(100vh - 4rem)'
          }}
        >
          <div className="p-4 md:p-6 lg:p-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}