<?php
/**
 * NextDash – React My Account Dashboard
 */

if (!defined('ABSPATH')) {
    exit;
}

class NextDash_Account {

    private static $instance = null;

    public static function instance() {
        if (self::$instance === null) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    private function __construct() {

        add_shortcode('nextdash_dashboard', [$this, 'render_dashboard_shortcode']);
        add_action('init', [$this, 'register_wishlist_endpoint']);
        add_filter('woocommerce_account_menu_items', [$this, 'add_wishlist_menu']);
        add_action('woocommerce_account_dashboard_endpoint', [$this, 'render_app']);
        add_action('woocommerce_account_orders_endpoint', [$this, 'render_app']);
        add_action('woocommerce_account_view-order_endpoint', [$this, 'render_app']);
        add_action('woocommerce_account_downloads_endpoint', [$this, 'render_app']);
        add_action('woocommerce_account_edit-address_endpoint', [$this, 'render_app']);
        add_action('woocommerce_account_edit-account_endpoint', [$this, 'render_app']);
        add_action('woocommerce_account_wishlist_endpoint', [$this, 'render_app']);
        add_filter('woocommerce_account_content', [$this, 'replace_account_content']);
        add_filter('body_class', [$this, 'add_body_class']);
    }

    /**
     * Register wishlist endpoint (IMPORTANT FIX)
     */
    public function register_wishlist_endpoint() {
        add_rewrite_endpoint('wishlist', EP_ROOT | EP_PAGES);
    }

    /**
     * Add wishlist menu item
     */
    public function add_wishlist_menu($items) {

        if (!is_user_logged_in()) {
            return $items;
        }

        $new_items = [];

        foreach ($items as $key => $label) {
            $new_items[$key] = $label;

            if ($key === 'downloads') {
                $new_items['wishlist'] = __('Wishlist', 'nextdash');
            }
        }

        return $new_items;
    }

    /**
     * Render React app container
     */
    public function render_app() {
        echo '<div id="nextdash-app" class="nextdash-dashboard"></div>';
    }

    /**
     * Replace Woo content with React app
     */
    public function replace_account_content($content) {

        if (!is_user_logged_in()) {
            return $content;
        }

        return '<div id="nextdash-app" class="nextdash-dashboard"></div>';
    }

    /**
     * Shortcode support
     */
    public function render_dashboard_shortcode() {

        if (!is_user_logged_in()) {
            return '<p>Please log in to view your dashboard.</p>';
        }

        return '<div id="nextdash-app" class="nextdash-dashboard"></div>';
    }

    /**
     * Body class
     */
    public function add_body_class($classes) {

        if (is_account_page() && is_user_logged_in()) {
            $classes[] = 'nextdash-active';
        }

        return $classes;
    }
}

// Boot
NextDash_Account::instance();
