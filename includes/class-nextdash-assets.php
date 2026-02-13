<?php
/**
 * Assets management
 */

if (!defined('ABSPATH')) {
    exit;
}

class NextDash_Assets {
    
    private static $instance = null;
    
    public static function instance() {
        if (null === self::$instance) {
            self::$instance = new self();
        }
        return self::$instance;
    }
    
    private $assets_enqueued = false;
    
    private function __construct() {
        add_action('wp_enqueue_scripts', array($this, 'maybe_enqueue_frontend_scripts'));
        add_action('admin_enqueue_scripts', array($this, 'enqueue_admin_scripts'));
    }
    
    /**
     * Maybe enqueue on My Account page
     */
    public function maybe_enqueue_frontend_scripts() {
        if (is_account_page() && is_user_logged_in()) {
            $this->enqueue_frontend_scripts();
        }
    }
    
    /**
     * Enqueue frontend scripts and styles
     */
    public function enqueue_frontend_scripts() {
        if ($this->assets_enqueued) {
            return;
        }
        $this->assets_enqueued = true;
        
        $settings = get_option('nextdash_settings', array());
        
        $default_settings = array(
            'enabled' => true,
            'display_mode' => 'fullscreen',
            'primary_color' => '#f9743b',
            'theme_mode' => 'light',
            'sections' => array(
                'overview' => true,
                'orders' => true,
                'downloads' => true,
                'addresses' => true,
                'account' => true,
                'wishlist' => true,
            ),
        );
        
        if (!isset($settings['sections']) || !is_array($settings['sections'])) {
            $settings['sections'] = $default_settings['sections'];
        } else {
            $settings['sections'] = wp_parse_args($settings['sections'], $default_settings['sections']);
        }
        
        $settings = wp_parse_args($settings, $default_settings);
        $manifest_path = NEXTDASH_PLUGIN_DIR . 'dist/manifest.json';
        $is_development = defined('WP_DEBUG') && WP_DEBUG && defined('SCRIPT_DEBUG') && SCRIPT_DEBUG;
        
        if (file_exists($manifest_path)) {
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
                
                wp_add_inline_style('nextdash-app', wp_strip_all_tags($this->get_display_mode_css()));
                wp_add_inline_style('nextdash-app', wp_strip_all_tags($this->get_primary_color_css($settings)));
                
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
        } elseif ($is_development) {
            wp_enqueue_style(
                'nextdash-app-dev',
                NEXTDASH_PLUGIN_URL . 'src/index.css',
                array(),
                NEXTDASH_VERSION
            );
            
            wp_add_inline_style('nextdash-app-dev', wp_strip_all_tags($this->get_display_mode_css()));
            wp_add_inline_style('nextdash-app-dev', wp_strip_all_tags($this->get_primary_color_css($settings)));
            
            wp_enqueue_script(
                'nextdash-vite-client',
                'http://localhost:5173/@vite/client',
                array(),
                NEXTDASH_VERSION,
                true
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
            if (current_user_can('manage_options')) {
                add_action('admin_notices', function() {
                    echo '<div class="notice notice-error"><p>';
                    esc_html_e('NextDash: Production build files are missing. Please rebuild the plugin or contact support.', 'nextdash');
                    echo '</p></div>';
                });
            }
        }
        
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
            // translators: %s: User's display name
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
        
        wp_localize_script('nextdash-app', 'nextdashData', array(
            'restUrl' => esc_url_raw(rest_url()),
            'nonce' => wp_create_nonce('wp_rest'),
            'currentUser' => absint(get_current_user_id()),
            'ajaxUrl' => esc_url_raw(admin_url('admin-ajax.php')),
            'siteUrl' => esc_url_raw(get_site_url()),
            'siteName' => esc_html(get_bloginfo('name')),
            'myAccountUrl' => esc_url_raw(wc_get_page_permalink('myaccount')),
            'shopUrl' => esc_url_raw(wc_get_page_permalink('shop') ?: get_home_url()),
            'basePath' => esc_attr($base_path),
            'logoUrl' => isset($settings['logo_url']) ? esc_url_raw($settings['logo_url']) : '',
            'settings' => $escaped_settings,
            'wcCapabilities' => $wc_capabilities,
            'translations' => $translations,
        ));
    }
    
    /**
     * Enqueue admin scripts and styles
     */
    public function enqueue_admin_scripts($hook) {
        if (strpos($hook, 'nextdash-settings') === false) {
            return;
        }
        
        wp_enqueue_media();
        
        wp_enqueue_style('wp-color-picker');
        wp_enqueue_script('wp-color-picker');
        wp_enqueue_script('media-upload');
        
        wp_enqueue_style(
            'nextdash-admin',
            NEXTDASH_PLUGIN_URL . 'assets/css/admin.css',
            array(),
            NEXTDASH_VERSION
        );
        
        wp_enqueue_script(
            'nextdash-admin',
            NEXTDASH_PLUGIN_URL . 'assets/js/admin.js',
            array('jquery', 'wp-color-picker', 'media-upload'),
            NEXTDASH_VERSION,
            true
        );
    }
    
    /**
     * Get display mode CSS
     */
    private function get_display_mode_css() {
        $settings = get_option('nextdash_settings', array('display_mode' => 'fullscreen'));
        $display_mode = isset($settings['display_mode']) ? $settings['display_mode'] : 'fullscreen';
        
        if ($display_mode === 'fullscreen') {
            return '
                /* FULL SCREEN MODE - COMPLETE OVERRIDE */
                body.nextdash-fullscreen,
                body.nextdash-fullscreen * {
                    box-sizing: border-box !important;
                }
                
                body.nextdash-fullscreen {
                    margin: 0 !important;
                    padding: 0 !important;
                    height: 100vh !important;
                    width: 100% !important;
                    overflow-x: hidden !important;
                    max-width: 100vw !important;
                }
                
                html.nextdash-fullscreen {
                    overflow-x: hidden !important;
                    max-width: 100vw !important;
                }
                
                /* Hide ALL WordPress/Theme Elements */
                body.nextdash-fullscreen #wpadminbar,
                body.nextdash-fullscreen .site-header,
                body.nextdash-fullscreen header,
                body.nextdash-fullscreen .site-footer,
                body.nextdash-fullscreen footer,
                body.nextdash-fullscreen .site-navigation,
                body.nextdash-fullscreen nav,
                body.nextdash-fullscreen .breadcrumb,
                body.nextdash-fullscreen .page-header,
                body.nextdash-fullscreen .site-branding,
                body.nextdash-fullscreen .menu,
                body.nextdash-fullscreen aside:not(.nextdash-dashboard aside) {
                    display: none !important;
                    visibility: hidden !important;
                }
                
                /* AGGRESSIVE OVERRIDE - All container elements */
                body.nextdash-fullscreen #page,
                body.nextdash-fullscreen #content,
                body.nextdash-fullscreen #main,
                body.nextdash-fullscreen #primary,
                body.nextdash-fullscreen .site,
                body.nextdash-fullscreen .site-content,
                body.nextdash-fullscreen .content-area,
                body.nextdash-fullscreen .container,
                body.nextdash-fullscreen .container-fluid,
                body.nextdash-fullscreen .wrap,
                body.nextdash-fullscreen .wrapper,
                body.nextdash-fullscreen main,
                body.nextdash-fullscreen .main,
                body.nextdash-fullscreen article,
                body.nextdash-fullscreen .entry-content,
                body.nextdash-fullscreen .page-content,
                body.nextdash-fullscreen .woocommerce,
                body.nextdash-fullscreen .woocommerce-page,
                body.nextdash-fullscreen .woocommerce-account {
                    display: block !important;
                    padding: 0 !important;
                    margin: 0 !important;
                    max-width: none !important;
                    width: 100vw !important;
                    height: auto !important;
                    position: static !important;
                    left: auto !important;
                    right: auto !important;
                    transform: none !important;
                }
                
                /* Hide WooCommerce default elements */
                body.nextdash-fullscreen .woocommerce-MyAccount-navigation,
                body.nextdash-fullscreen .woocommerce-MyAccount-content > *:not(#nextdash-app),
                body.nextdash-fullscreen .woocommerce-breadcrumb {
                    display: none !important;
                }
                
                /* Make dashboard parent containers full width */
                body.nextdash-fullscreen .woocommerce-MyAccount-content {
                    width: 100vw !important;
                    max-width: none !important;
                    padding: 0 !important;
                    margin: 0 !important;
                    float: none !important;
                }
                
                /* DASHBOARD - ABSOLUTE FULL VIEWPORT */
                body.nextdash-fullscreen #nextdash-app {
                    position: fixed !important;
                    top: 0 !important;
                    left: 0 !important;
                    right: 0 !important;
                    bottom: 0 !important;
                    width: 100vw !important;
                    height: 100vh !important;
                    max-width: 100vw !important;
                    max-height: 100vh !important;
                    min-width: 100vw !important;
                    min-height: 100vh !important;
                    margin: 0 !important;
                    padding: 0 !important;
                    z-index: 999999 !important;
                    overflow: visible !important;
                    transform: none !important;
                }
                
                /* Ensure React root takes full space and allows scrolling */
                body.nextdash-fullscreen #nextdash-app > div {
                    width: 100% !important;
                    height: 100% !important;
                    min-height: 100vh !important;
                    overflow: visible !important;
                }
            ';
        }
        
        return '
            /* Integrated Mode */
            body.nextdash-integrated #nextdash-app {
                min-height: 600px;
            }
        ';
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
        
        $hex = str_replace('#', '', $primary_color);
        $r = absint(hexdec(substr($hex, 0, 2)));
        $g = absint(hexdec(substr($hex, 2, 2)));
        $b = absint(hexdec(substr($hex, 4, 2)));
        
        $hsl = $this->rgb_to_hsl($r, $g, $b);
        
        // Escape numeric values
        $h = absint($hsl['h']);
        $s = absint($hsl['s']);
        $l = absint($hsl['l']);
        
        $dark_s = absint(min($hsl['s'] + 5, 100));
        $dark_l = absint($hsl['l']);
        
        if ($hsl['l'] < 45) {
            $dark_l = absint(min($hsl['l'] + 15, 65));
        } else {
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

