// Global type declarations for WordPress and WooCommerce data

interface NextDashSettings {
  logo_url: string
  display_mode: 'fullscreen' | 'integrated'
  primary_color: string
  enabled: boolean
  template: string
  theme_mode: string
  sections: {
    overview: boolean
    orders: boolean
    downloads: boolean
    addresses: boolean
    account: boolean
  }
}

interface WCCapabilities {
  shipping_enabled: boolean
  downloads_enabled: boolean
}

export interface NextDashTranslations {
  overview: string
  orders: string
  downloads: string
  addresses: string
  account: string
  wishlist: string
  logout: string
  welcome_back: string
  account_overview: string
  total_orders: string
  total_spent: string
  recent_orders: string
  all_time: string
  last_5_orders: string
  view_all_orders: string
  no_orders: string
  order_history: string
  order_details: string
  download: string
  access_downloads: string
  no_downloads: string
  billing_address: string
  shipping_address: string
  save_changes: string
  update_account: string
  search_products: string
  go_to_home: string
}

interface NextDashData {
  restUrl: string
  nonce: string
  currentUser: string
  ajaxUrl: string
  siteUrl: string
  siteName: string
  myAccountUrl: string
  basePath: string
  logoUrl: string
  settings: NextDashSettings
  wcCapabilities: WCCapabilities
  translations: NextDashTranslations
}

declare global {
  interface Window {
    nextdashData: NextDashData
  }
}

export {}

