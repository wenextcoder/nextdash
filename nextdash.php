<?php
/**
 * Plugin Name: NextDash - Modern Customer Dashboard
 * Plugin URI: https://nextdash.io
 * Description: A modern, React-powered customer dashboard for WooCommerce that replaces the default My Account page
 * Version: 1.0.0
 * Author: wenextcoder
 * Author URI: https://wenextcoder.com
 * License: GPL v2 or later
 * License URI: https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain: nextdash
 * Domain Path: /languages
 * Requires at least: 5.8
 * Tested up to: 6.9
 * Requires PHP: 7.4
 * WC requires at least: 5.0
 * WC tested up to: 8.5
 * 
 * @package nextdash
 */

// Exit if accessed directly
if (!defined('ABSPATH')) {
    exit;
}

// Define plugin constants
define('NEXTDASH_VERSION', '1.0.0');
define('NEXTDASH_PLUGIN_FILE', __FILE__);
define('NEXTDASH_PLUGIN_DIR', plugin_dir_path(__FILE__));
define('NEXTDASH_PLUGIN_URL', plugin_dir_url(__FILE__));
define('NEXTDASH_PLUGIN_BASENAME', plugin_basename(__FILE__));

/**
 * Main NextDash Class
 */
final class NextDash {
    
    /**
     * Instance of this class
     */
    private static $instance = null;
    
    /**
     * Get instance
     */
    public static function instance() {
        if (null === self::$instance) {
            self::$instance = new self();
        }
        return self::$instance;
    }
    
    /**
     * Constructor
     */
    private function __construct() {
        $this->includes();
        $this->init_hooks();
    }
    
    /**
     * Include required files
     */
    private function includes() {
        require_once NEXTDASH_PLUGIN_DIR . 'includes/class-nextdash-install.php';
        require_once NEXTDASH_PLUGIN_DIR . 'includes/class-nextdash-assets.php';
        require_once NEXTDASH_PLUGIN_DIR . 'includes/class-nextdash-api.php';
        require_once NEXTDASH_PLUGIN_DIR . 'includes/class-nextdash-account.php';
        require_once NEXTDASH_PLUGIN_DIR . 'includes/class-nextdash-settings.php';
        require_once NEXTDASH_PLUGIN_DIR . 'includes/class-nextdash-hooks.php';
        require_once NEXTDASH_PLUGIN_DIR . 'includes/class-nextdash-template.php';
    }
    
    /**
     * Initialize hooks
     */
    private function init_hooks() {
        add_action('before_woocommerce_init', array($this, 'declare_wc_compatibility'));
        add_action('plugins_loaded', array($this, 'check_dependencies'));
        add_action('init', array($this, 'init'));
        register_activation_hook(__FILE__, array('NextDash_Install', 'activate'));
        register_deactivation_hook(__FILE__, array('NextDash_Install', 'deactivate'));
    }
    
    /**
     * Declare compatibility with WooCommerce features
     */
    public function declare_wc_compatibility() {
        if (class_exists('\Automattic\WooCommerce\Utilities\FeaturesUtil')) {
            \Automattic\WooCommerce\Utilities\FeaturesUtil::declare_compatibility(
                'custom_order_tables',
                NEXTDASH_PLUGIN_FILE,
                true
            );
            
            \Automattic\WooCommerce\Utilities\FeaturesUtil::declare_compatibility(
                'cart_checkout_blocks',
                NEXTDASH_PLUGIN_FILE,
                true
            );
        }
    }
    
    /**
     * Check plugin dependencies
     */
    public function check_dependencies() {
        if (!class_exists('WooCommerce')) {
            add_action('admin_notices', array($this, 'woocommerce_missing_notice'));
            return false;
        }
        return true;
    }
    
    /**
     * WooCommerce missing notice
     */
    public function woocommerce_missing_notice() {
        ?>
        <div class="notice notice-error">
            <p><?php esc_html_e('NextDash requires WooCommerce to be installed and active.', 'nextdash'); ?></p>
        </div>
        <?php
    }
    
    /**
     * Initialize plugin
     */
    public function init() {
        if (!$this->check_dependencies()) {
            return;
        }
        
        // Translations are automatically loaded by WordPress.org for plugins hosted on WordPress.org
        
        NextDash_Template::instance();
        NextDash_Assets::instance();
        NextDash_API::instance();
        NextDash_Account::instance();
        NextDash_Settings::instance();
        NextDash_Hooks::instance();
        
        do_action('nextdash_init');
    }
}

/**
 * Initialize NextDash
 */
function NextDash() {
    return NextDash::instance();
}

NextDash();

