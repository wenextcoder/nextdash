<?php
/**
 * Hooks and filters for extensibility
 */

if (!defined('ABSPATH')) {
    exit;
}

class NextDash_Hooks {
    
    private static $instance = null;
    
    public static function instance() {
        if (null === self::$instance) {
            self::$instance = new self();
        }
        return self::$instance;
    }
    
    private function __construct() {
        $this->register_action_hooks();
        $this->register_filter_hooks();
    }
    
    /**
     * Register action hooks
     */
    private function register_action_hooks() {
        do_action('nextdash_loaded');
        
        add_action('nextdash_before_dashboard', function() {
            do_action('nextdash_before_render');
        });
        
        add_action('nextdash_after_dashboard', function() {
            do_action('nextdash_after_render');
        });
    }
    
    /**
     * Register filter hooks
     */
    private function register_filter_hooks() {
        add_filter('nextdash_menu_items', array($this, 'get_menu_items'), 10, 1);
        add_filter('nextdash_dashboard_data', array($this, 'filter_dashboard_data'), 10, 1);
    }
    
    /**
     * Get menu items
     */
    public function get_menu_items($items) {
        $default_items = array(
            array(
                'id' => 'overview',
                'label' => __('Overview', 'nextdash'),
                'icon' => 'home',
                'path' => '/',
            ),
            array(
                'id' => 'orders',
                'label' => __('Orders', 'nextdash'),
                'icon' => 'shopping-bag',
                'path' => '/orders',
            ),
            array(
                'id' => 'downloads',
                'label' => __('Downloads', 'nextdash'),
                'icon' => 'download',
                'path' => '/downloads',
            ),
            array(
                'id' => 'wishlist',
                'label' => __('Wishlist', 'nextdash'),
                'icon' => 'heart',
                'path' => '/wishlist',
            ),
            array(
                'id' => 'addresses',
                'label' => __('Addresses', 'nextdash'),
                'icon' => 'map-pin',
                'path' => '/addresses',
            ),
            array(
                'id' => 'account',
                'label' => __('Account Details', 'nextdash'),
                'icon' => 'user',
                'path' => '/account',
            ),
        );
        
        return apply_filters('nextdash_default_menu_items', $default_items);
    }
    
    /**
     * Filter dashboard data
     */
    public function filter_dashboard_data($data) {
        return $data;
    }
}

