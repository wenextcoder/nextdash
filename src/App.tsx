import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { ThemeProvider } from './components/theme-provider'
import { Toaster } from './components/ui/toaster'

import Dashboard from './components/Dashboard'
import Overview from './pages/Overview'
import Orders from './pages/Orders'
import OrderDetails from './pages/OrderDetails'
import Downloads from './pages/Downloads'
import Addresses from './pages/Addresses'
import AccountDetails from './pages/AccountDetails'
import Wishlist from './pages/Wishlist'

function App() {
  // Provided by wp_localize_script
  // Example: /pluginfy/my-account
  // @ts-ignore
  const basePath = window.nextdashData?.basePath || '/my-account'

  return (
    <ThemeProvider defaultTheme="light" storageKey="nextdash-theme">
      <BrowserRouter basename={basePath}>
        <Dashboard>
          <Routes>
            <Route path="/" element={<Overview />} />
            <Route path="/orders" element={<Orders />} />
            <Route path="/orders/:id" element={<OrderDetails />} />
            <Route path="/downloads" element={<Downloads />} />
            <Route path="/edit-address" element={<Addresses />} />
            <Route path="/edit-account" element={<AccountDetails />} />
            <Route path="/wishlist" element={<Wishlist />} />
          </Routes>
        </Dashboard>
      </BrowserRouter>
      <Toaster />
    </ThemeProvider>
  )
}

export default App
