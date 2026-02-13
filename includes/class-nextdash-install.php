<?php
/**
 * Installation and activation
 */

if (!defined('ABSPATH')) {
    exit;
}

class NextDash_Install {
    
    /**
     * Activate plugin
     */
    public static function activate() {
        $default_options = array(
            'enabled' => true,
            'template' => 'modern',
            'sections' => array(
                'overview' => true,
                'orders' => true,
                'downloads' => true,
                'addresses' => true,
                'account' => true,
            ),
            'theme_mode' => 'light',
        );
        
        if (!get_option('nextdash_settings')) {
            update_option('nextdash_settings', $default_options);
        }
        
        self::create_tables();
        add_rewrite_endpoint('wishlist', EP_PAGES);
        flush_rewrite_rules();
    }
    
    /**
     * Deactivate plugin
     */
    public static function deactivate() {
        flush_rewrite_rules();
    }
    
    /**
     * Create custom tables
     */
    private static function create_tables() {
        global $wpdb;
        
        $charset_collate = $wpdb->get_charset_collate();
        
        // Future: Add custom tables for analytics, custom tabs, etc.
        
        require_once(ABSPATH . 'wp-admin/includes/upgrade.php');
    }
}

