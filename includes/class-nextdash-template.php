<?php
/**
 * Custom template for fullscreen mode
 */

if (!defined('ABSPATH')) {
    exit;
}

class NextDash_Template {
    
    private static $instance = null;
    
    public static function instance() {
        if (null === self::$instance) {
            self::$instance = new self();
        }
        return self::$instance;
    }
    
    private function __construct() {
        add_action('template_redirect', array($this, 'maybe_load_custom_template'));
    }
    
    /**
     * Load custom template for fullscreen mode
     */
    public function maybe_load_custom_template() {
        // Only load custom template for logged-in users
        // Let WooCommerce handle login/register for non-logged-in users
        if (!is_user_logged_in()) {
            return;
        }
        
        // Check if this page has the shortcode or is the My Account page
        global $post;
        $has_shortcode = false;
        
        if (is_a($post, 'WP_Post') && has_shortcode($post->post_content, 'nextdash_dashboard')) {
            $has_shortcode = true;
        }
        
        // Return if not My Account page and no shortcode
        if (!is_account_page() && !$has_shortcode) {
            return;
        }
        
        $settings = get_option('nextdash_settings', array('display_mode' => 'fullscreen'));
        $display_mode = isset($settings['display_mode']) ? $settings['display_mode'] : 'fullscreen';
        
        // Only use custom template in fullscreen mode
        if ($display_mode !== 'fullscreen') {
            return;
        }
        
        // Check if NextDash is enabled (only for My Account page)
        if (is_account_page() && (!isset($settings['enabled']) || !$settings['enabled'])) {
            return;
        }
        
        // Enqueue resources before rendering template
        $this->enqueue_template_resources();
        
        // Process enqueue queue
        do_action('wp_enqueue_scripts');
        
        // Load custom template
        $this->render_template();
        exit;
    }
    
    /**
     * Enqueue resources for fullscreen template
     */
    private function enqueue_template_resources() {
        $settings = get_option('nextdash_settings', array());
        
        // Get manifest for production build
        $manifest_path = NEXTDASH_PLUGIN_DIR . 'dist/.vite/manifest.json';
        $is_dev = !file_exists($manifest_path);
        
        if ($is_dev) {
            // Development mode - CSS is handled by Vite in dev mode
            wp_enqueue_style(
                'nextdash-app',
                NEXTDASH_PLUGIN_URL . 'src/index.css',
                array(),
                NEXTDASH_VERSION
            );
            
            wp_enqueue_script(
                'nextdash-vite-client',
                'http://localhost:5173/@vite/client',
                array(),
                NEXTDASH_VERSION,
                false
            );
            
            wp_enqueue_script(
                'nextdash-app',
                'http://localhost:5173/src/main.tsx',
                array('nextdash-vite-client'),
                NEXTDASH_VERSION,
                true
            );
            
            add_filter('script_loader_tag', function($tag, $handle) {
                if (in_array($handle, array('nextdash-vite-client', 'nextdash-app'))) {
                    return str_replace(' src', ' type="module" src', $tag);
                }
                return $tag;
            }, 10, 2);
        } else {
            // Production mode
            $manifest = json_decode(file_get_contents($manifest_path), true);
            
            if (isset($manifest['src/main.tsx'])) {
                $main_file = $manifest['src/main.tsx']['file'];
                $main_css = isset($manifest['src/main.tsx']['css']) ? $manifest['src/main.tsx']['css'][0] : null;
                
                if ($main_css) {
                    wp_enqueue_style(
                        'nextdash-app',
                        NEXTDASH_PLUGIN_URL . 'dist/' . $main_css,
                        array(),
                        NEXTDASH_VERSION
                    );
                }
                
                wp_enqueue_script(
                    'nextdash-app',
                    NEXTDASH_PLUGIN_URL . 'dist/' . $main_file,
                    array(),
                    NEXTDASH_VERSION,
                    true
                );
                
                add_filter('script_loader_tag', function($tag, $handle) {
                    if ('nextdash-app' === $handle) {
                        return str_replace(' src', ' defer src', $tag);
                    }
                    return $tag;
                }, 10, 2);
            }
        }
        
        // Add inline styles
        $inline_css = $this->get_template_inline_css($settings);
        if ($is_dev || wp_style_is('nextdash-app', 'enqueued')) {
            wp_add_inline_style('nextdash-app', wp_strip_all_tags($inline_css));
        }
        
        // Prepare data for React
        $nextdash_data = $this->get_nextdash_data($settings);
        
        // Add inline script with data (before the main script loads)
        wp_add_inline_script('nextdash-app', 'window.nextdashData = ' . wp_json_encode($nextdash_data) . ';', 'before');
    }
    
    /**
     * Get inline CSS for template
     */
    private function get_template_inline_css($settings) {
        $css = '
            html, body {
                margin: 0;
                padding: 0;
                height: 100vh;
                width: 100%;
                overflow-x: hidden;
                max-width: 100vw;
            }
            #nextdash-app {
                width: 100vw;
                height: 100vh;
                overflow: visible;
                max-width: 100vw;
            }
        ';
        
        $css .= $this->get_primary_color_css($settings);
        
        return $css;
    }
    
    /**
     * Get NextDash data for React
     */
    private function get_nextdash_data($settings) {
        global $post;
        $base_path = '/';
        
        if ($post) {
            $permalink = get_permalink($post->ID);
            $base_path = wp_parse_url($permalink, PHP_URL_PATH);
            if (substr($base_path, -1) !== '/') {
                $base_path .= '/';
            }
        }
        
        $wc_capabilities = array(
            'shipping_enabled' => wc_shipping_enabled(),
            'downloads_enabled' => 'yes' === get_option('woocommerce_enable_guest_checkout') || is_user_logged_in(),
        );
        
        $translations = array(
            'overview' => __('Overview', 'nextdash'),
            'orders' => __('Orders', 'nextdash'),
            'downloads' => __('Downloads', 'nextdash'),
            'addresses' => __('Addresses', 'nextdash'),
            'account' => __('Account Details', 'nextdash'),
            'wishlist' => __('Wishlist', 'nextdash'),
            'logout' => __('Logout', 'nextdash'),
            'welcome_back' => __('Welcome back, %s!', 'nextdash'),
            'account_overview' => __('From your account dashboard you can view your recent orders, manage your shipping and billing addresses, and edit your password and account details.', 'nextdash'),
            'total_orders' => __('Total Orders', 'nextdash'),
            'total_spent' => __('Total Spent', 'nextdash'),
            'recent_orders' => __('Recent Orders', 'nextdash'),
            'all_time' => __('All time', 'nextdash'),
            'last_5_orders' => __('Last 5 orders', 'nextdash'),
            'view_all_orders' => __('View All Orders', 'nextdash'),
            'no_orders' => __('No orders yet', 'nextdash'),
            'order_history' => __('Order History', 'nextdash'),
            'order_details' => __('Order Details', 'nextdash'),
            'download' => __('Download', 'nextdash'),
            'access_downloads' => __('Access your downloadable products', 'nextdash'),
            'no_downloads' => __('No downloads available', 'nextdash'),
            'billing_address' => __('Billing Address', 'nextdash'),
            'shipping_address' => __('Shipping Address', 'nextdash'),
            'save_changes' => __('Save Changes', 'nextdash'),
            'update_account' => __('Update Account', 'nextdash'),
            'search_products' => __('Search products...', 'nextdash'),
            'go_to_home' => __('Go to Home', 'nextdash'),
        );
        
        // Escape settings values
        $escaped_settings = array();
        if (isset($settings['logo_url'])) {
            $escaped_settings['logo_url'] = esc_url_raw($settings['logo_url']);
        }
        if (isset($settings['primary_color'])) {
            $escaped_settings['primary_color'] = sanitize_hex_color($settings['primary_color']);
        }
        if (isset($settings['display_mode'])) {
            $escaped_settings['display_mode'] = sanitize_text_field($settings['display_mode']);
        }
        if (isset($settings['theme_mode'])) {
            $escaped_settings['theme_mode'] = sanitize_text_field($settings['theme_mode']);
        }
        if (isset($settings['enabled'])) {
            $escaped_settings['enabled'] = (bool) $settings['enabled'];
        }
        if (isset($settings['sections']) && is_array($settings['sections'])) {
            $escaped_settings['sections'] = array_map('boolval', $settings['sections']);
        }
        
        return array(
            'restUrl' => esc_url_raw(rest_url()),
            'nonce' => wp_create_nonce('wp_rest'),
            'currentUser' => absint(get_current_user_id()),
            'ajaxUrl' => esc_url_raw(admin_url('admin-ajax.php')),
            'siteUrl' => esc_url_raw(get_site_url()),
            'siteName' => esc_html(get_bloginfo('name')),
            'myAccountUrl' => esc_url_raw(wc_get_page_permalink('myaccount')),
            'basePath' => esc_attr($base_path),
            'logoUrl' => isset($settings['logo_url']) ? esc_url_raw($settings['logo_url']) : '',
            'settings' => $escaped_settings,
            'wcCapabilities' => $wc_capabilities,
            'translations' => $translations,
        );
    }
    
    /**
     * Render clean template
     */
    private function render_template() {
        $settings = get_option('nextdash_settings', array());
        
        // Get site icon (favicon)
        $site_icon_url = get_site_icon_url();
        
        // Output clean HTML
        ?><!DOCTYPE html>
<html <?php language_attributes(); ?>>
<head>
    <meta charset="<?php bloginfo('charset'); ?>">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?php echo esc_html(get_bloginfo('name')); ?> - Dashboard</title>
    <?php if ($site_icon_url): ?>
    <link rel="icon" href="<?php echo esc_url($site_icon_url); ?>" sizes="any">
    <link rel="icon" href="<?php echo esc_url($site_icon_url); ?>" type="image/png">
    <?php endif; ?>
    <?php
    // Output enqueued styles
    wp_print_styles('nextdash-app');
    ?>
</head>
<body class="nextdash-fullscreen-clean">
    <div id="nextdash-app"></div>
    <noscript>
        <div style="padding: 20px; text-align: center;">
            <p>Please enable JavaScript to use the customer dashboard.</p>
        </div>
    </noscript>
    <?php
    // Output enqueued scripts
    wp_print_scripts('nextdash-vite-client');
    wp_print_scripts('nextdash-app');
    ?>
</body>
</html><?php
    }
    
    /**
     * Get primary color CSS
     */
    private function get_primary_color_css($settings) {
        $primary_color = isset($settings['primary_color']) ? $settings['primary_color'] : '#3b82f6';
        
        // Sanitize hex color
        $primary_color = sanitize_hex_color($primary_color);
        if (empty($primary_color)) {
            $primary_color = '#3b82f6';
        }
        
        // Convert hex to RGB
        $hex = str_replace('#', '', $primary_color);
        $r = absint(hexdec(substr($hex, 0, 2)));
        $g = absint(hexdec(substr($hex, 2, 2)));
        $b = absint(hexdec(substr($hex, 4, 2)));
        
        // Convert RGB to HSL
        $hsl = $this->rgb_to_hsl($r, $g, $b);
        
        // Escape numeric values
        $h = absint($hsl['h']);
        $s = absint($hsl['s']);
        $l = absint($hsl['l']);
        
        // For dark mode: increase saturation and slightly adjust lightness
        $dark_s = absint(min($hsl['s'] + 5, 100)); // Boost saturation
        $dark_l = absint($hsl['l']);
        
        // If color is too dark, lighten it for dark mode
        if ($hsl['l'] < 45) {
            $dark_l = absint(min($hsl['l'] + 15, 65));
        } else {
            // Keep similar lightness for already bright colors
            $dark_l = absint($hsl['l']);
        }
        
        return "
        :root {
            --primary: {$h} {$s}% {$l}%;
            --primary-foreground: 0 0% 100%;
        }
        .dark {
            --primary: {$h} {$dark_s}% {$dark_l}%;
            --primary-foreground: 0 0% 100%;
        }
        ";
    }
    
    /**
     * Convert RGB to HSL
     */
    private function rgb_to_hsl($r, $g, $b) {
        $r /= 255;
        $g /= 255;
        $b /= 255;
        
        $max = max($r, $g, $b);
        $min = min($r, $g, $b);
        $l = ($max + $min) / 2;
        
        if ($max == $min) {
            $h = $s = 0;
        } else {
            $d = $max - $min;
            $s = $l > 0.5 ? $d / (2 - $max - $min) : $d / ($max + $min);
            
            switch ($max) {
                case $r:
                    $h = ($g - $b) / $d + ($g < $b ? 6 : 0);
                    break;
                case $g:
                    $h = ($b - $r) / $d + 2;
                    break;
                case $b:
                    $h = ($r - $g) / $d + 4;
                    break;
            }
            
            $h /= 6;
        }
        
        return array(
            'h' => round($h * 360),
            's' => round($s * 100),
            'l' => round($l * 100)
        );
    }
}

