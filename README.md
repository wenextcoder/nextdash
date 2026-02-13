# NextDash – Advanced WooCommerce Customer Dashboard

A modern, React-powered customer dashboard for WooCommerce that replaces the default My Account page with a beautiful, fast, and user-friendly interface.

## Features

### Free Version

- **Modern Dashboard Interface** - Clean, SaaS-style UI built with React and shadcn/ui
- **Overview Page** - Display order statistics, recent orders, and account summary
- **Orders Management** - View order history with detailed order information
- **Order Details** - Complete order information including items, addresses, and payment details
- **Downloads Section** - Access downloadable products
- **Address Management** - Edit billing and shipping addresses
- **Account Settings** - Update personal information and password
- **Dark Mode** - Built-in light/dark theme support
- **Responsive Design** - Mobile-first design that works on all devices
- **Live Data Sync** - Real-time data from WooCommerce via REST API
- **Developer Friendly** - Action and filter hooks for customization

## Requirements

- WordPress 5.8 or higher (Tested up to 6.4)
- WooCommerce 5.0 or higher (Tested up to 8.5)
- PHP 7.4 or higher (Recommended: PHP 8.0+)
- Node.js 18+ (for development only)

### WooCommerce Compatibility

✅ **WooCommerce Blocks** - Compatible with Cart & Checkout blocks
✅ **YITH WooCommerce Wishlist** - Fully compatible with YITH WooCommerce Wishlist plugin. Wishlist items are seamlessly integrated into the dashboard.

This plugin declares compatibility with all WooCommerce features and follows WooCommerce coding standards.

## Installation

### From WordPress Admin

1. Download the plugin zip file
2. Go to WordPress Admin → Plugins → Add New
3. Click "Upload Plugin" and select the zip file
4. Click "Install Now" and then "Activate"

### Manual Installation

1. Upload the `nextdash` folder to `/wp-content/plugins/`
2. Activate the plugin through the 'Plugins' menu in WordPress
3. Go to WooCommerce → NextDash to configure settings

## Development Setup

### Initial Setup

1. Clone or download the plugin to your WordPress plugins directory
2. Navigate to the plugin directory:
   ```bash
   cd wp-content/plugins/NextDash
   ```

3. Install dependencies:
   ```bash
   npm install
   ```

### Development Mode

Run Vite development server:
```bash
npm run dev
```

This will start the Vite dev server at `http://localhost:5173`. The plugin will automatically use the dev server when it's running.

### Production Build

Build for production:
```bash
npm run build
```

This creates optimized files in the `dist` folder that the plugin will use in production.

## Configuration

1. Go to **WooCommerce → NextDash** in your WordPress admin
2. Configure the following settings:
   - **Enable NextDash** - Toggle the dashboard on/off
   - **Dashboard Template** - Select template style (currently: Modern)
   - **Theme Mode** - Choose light, dark, or auto (system)
   - **Dashboard Sections** - Enable/disable specific sections

## Usage

Once activated and enabled, NextDash automatically replaces the default WooCommerce My Account page. Customers will see the new React-based dashboard when they visit their account page.

## File Structure

```
NextDash/
├── assets/                 # Admin CSS/JS assets
│   ├── css/
│   └── js/
├── includes/              # PHP classes
│   ├── class-nextdash-account.php
│   ├── class-nextdash-api.php
│   ├── class-nextdash-assets.php
│   ├── class-nextdash-hooks.php
│   ├── class-nextdash-install.php
│   └── class-nextdash-settings.php
├── src/                   # React source files
│   ├── components/        # React components
│   │   ├── ui/           # shadcn/ui components
│   │   ├── Dashboard.tsx
│   │   └── theme-provider.tsx
│   ├── pages/            # Page components
│   │   ├── Overview.tsx
│   │   ├── Orders.tsx
│   │   ├── OrderDetails.tsx
│   │   ├── Downloads.tsx
│   │   ├── Addresses.tsx
│   │   └── AccountDetails.tsx
│   ├── lib/              # Utilities
│   │   ├── api.ts
│   │   └── utils.ts
│   ├── types/            # TypeScript types
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── dist/                 # Built files (generated)
├── nextdash.php          # Main plugin file
├── package.json
├── vite.config.ts
├── tsconfig.json
└── tailwind.config.js
```

## REST API Endpoints

NextDash creates the following REST API endpoints:

- `GET /wp-json/nextdash/v1/overview` - Dashboard overview data
- `GET /wp-json/nextdash/v1/orders` - List user orders
- `GET /wp-json/nextdash/v1/orders/{id}` - Single order details
- `GET /wp-json/nextdash/v1/downloads` - User downloads
- `GET /wp-json/nextdash/v1/addresses` - User addresses
- `POST /wp-json/nextdash/v1/addresses` - Update address
- `GET /wp-json/nextdash/v1/account` - Account details
- `POST /wp-json/nextdash/v1/account` - Update account

## Customization

### Hooks & Filters

#### Actions

```php
// Fires when NextDash is loaded
do_action('nextdash_loaded');

// Before rendering dashboard
do_action('nextdash_before_dashboard');

// After rendering dashboard
do_action('nextdash_after_dashboard');
```

#### Filters

```php
// Modify menu items
add_filter('nextdash_menu_items', function($items) {
    // Add custom menu item
    $items[] = array(
        'id' => 'custom',
        'label' => 'Custom Page',
        'icon' => 'star',
        'path' => '/custom',
    );
    return $items;
});

// Modify dashboard data
add_filter('nextdash_dashboard_data', function($data) {
    // Customize data
    return $data;
});
```

## Technology Stack

- **Frontend Framework**: React 18
- **Build Tool**: Vite 5
- **UI Components**: shadcn/ui (Radix UI)
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **State Management**: TanStack Query (React Query)
- **Routing**: React Router v6
- **Backend**: WordPress + WooCommerce
- **Data Sync**: WooCommerce REST API

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

## Troubleshooting

### Dashboard not loading?

1. Make sure NextDash is enabled in settings
2. Check if WooCommerce is installed and active
3. Clear browser cache and hard refresh (Ctrl+Shift+R)
4. Check browser console for JavaScript errors

### Development server not working?

1. Make sure you've run `npm install`
2. Check if port 5173 is available
3. Try running `npm run dev` again

### Build errors?

1. Delete `node_modules` and `package-lock.json`
2. Run `npm install` again
3. Run `npm run build`

## Support

For issues, questions, or feature requests:
- GitHub Issues: [https://github.com/wenextcoder/nextdash/issues]


## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

GPL v2 or later

## Credits

Built with:
- [React](https://react.dev/)
- [Vite](https://vitejs.dev/)
- [shadcn/ui](https://ui.shadcn.com/)
- [Tailwind CSS](https://tailwindcss.com/)
- [TanStack Query](https://tanstack.com/query)
- [Lucide Icons](https://lucide.dev/)

## Changelog

### Version 1.0.0
- Initial release
- Modern React dashboard
- Order management
- Address management
- Account settings
- Dark mode support
- Mobile responsive design

