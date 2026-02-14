<?php
/**
 * Admin settings page
 */

if (!defined('ABSPATH')) {
    exit;
}

class NextDash_Settings {
    
    private static $instance = null;
    
    public static function instance() {
        if (null === self::$instance) {
            self::$instance = new self();
        }
        return self::$instance;
    }
    
    private function __construct() {
        add_action('admin_menu', array($this, 'add_menu_page'));
        add_action('admin_init', array($this, 'register_settings'));
        add_action('admin_post_nextdash_save_settings', array($this, 'save_settings'));
    }
    
    /**
     * Add menu page
     */
    public function add_menu_page() {
        add_menu_page(
            __('NextDash Settings', 'nextdash'),
            __('NextDash', 'nextdash'),
            'manage_woocommerce',
            'nextdash-settings',
            array($this, 'render_settings_page'),
            'dashicons-welcome-widgets-menus',
            55
        );
    }
    
    /**
     * Register settings
     */
    public function register_settings() {
        register_setting('nextdash_settings', 'nextdash_settings', array(
            'sanitize_callback' => array($this, 'sanitize_settings'),
        ));
    }
    
    /**
     * Sanitize settings
     */
    public function sanitize_settings($input) {
        $existing = get_option('nextdash_settings', array());
        $sanitized = array();
        
        if (isset($input['logo_url'])) {
            $sanitized['logo_url'] = esc_url_raw($input['logo_url']);
        } elseif (isset($existing['logo_url'])) {
            $sanitized['logo_url'] = $existing['logo_url'];
        }
        
        if (isset($input['display_mode'])) {
            $sanitized['display_mode'] = in_array($input['display_mode'], array('fullscreen', 'integrated')) ? $input['display_mode'] : 'fullscreen';
        } elseif (isset($existing['display_mode'])) {
            $sanitized['display_mode'] = $existing['display_mode'];
        }
        
        if (isset($input['enabled'])) {
            $sanitized['enabled'] = (bool) $input['enabled'];
        } else {
            $sanitized['enabled'] = false;
        }
        
        if (isset($input['template'])) {
            $sanitized['template'] = sanitize_text_field($input['template']);
        } elseif (isset($existing['template'])) {
            $sanitized['template'] = $existing['template'];
        }
        
        if (isset($input['primary_color'])) {
            $sanitized['primary_color'] = sanitize_hex_color($input['primary_color']);
        } elseif (isset($existing['primary_color'])) {
            $sanitized['primary_color'] = $existing['primary_color'];
        }
        
        if (isset($input['theme_mode'])) {
            $sanitized['theme_mode'] = in_array($input['theme_mode'], array('light', 'dark', 'auto')) ? $input['theme_mode'] : 'light';
        } elseif (isset($existing['theme_mode'])) {
            $sanitized['theme_mode'] = $existing['theme_mode'];
        }
        
        $default_sections = array(
            'overview' => true,
            'orders' => true,
            'downloads' => true,
            'addresses' => true,
            'account' => true,
            'wishlist' => true,
        );
        
        $existing_sections = isset($existing['sections']) && is_array($existing['sections']) ? $existing['sections'] : $default_sections;
        $sanitized['sections'] = $existing_sections;
        
        if (isset($input['sections']) && is_array($input['sections'])) {
            foreach ($default_sections as $key => $default_value) {
                if (isset($input['sections'][$key])) {
                    $sanitized['sections'][$key] = (bool) $input['sections'][$key];
                } else {
                    $sanitized['sections'][$key] = false;
                }
            }
        }
        
        return $sanitized;
    }
    
    /**
     * Render settings page
     */
    public function render_settings_page() {
        $settings = get_option('nextdash_settings', array(
            'enabled' => true,
            'template' => 'modern',
            'sections' => array(
                'overview' => true,
                'orders' => true,
                'downloads' => true,
                'addresses' => true,
                'account' => true,
                'wishlist' => true,
            ),
            'theme_mode' => 'light',
        ));
        ?>
        <div class="wrap nextdash-settings">
            <h1><?php echo esc_html(get_admin_page_title()); ?></h1>
            
            <?php
            // phpcs:ignore WordPress.Security.NonceVerification.Recommended
            if (isset($_GET['settings-updated'])): ?>
                <div class="notice notice-success is-dismissible">
                    <p><?php esc_html_e('Settings saved successfully!', 'nextdash'); ?></p>
                </div>
            <?php endif; ?>
            
            <div class="nextdash-settings-container">
                <form method="post" action="<?php echo esc_url(admin_url('admin-post.php')); ?>" id="nextdash-settings-form">
                    <input type="hidden" name="action" value="nextdash_save_settings">
                    <?php wp_nonce_field('nextdash_save_settings', 'nextdash_settings_nonce'); ?>
                    
                    <table class="form-table" role="presentation">
                        <tbody>
                            <!-- Logo Upload -->
                            <tr>
                                <th scope="row">
                                    <label for="nextdash_logo">
                                        <?php esc_html_e('Dashboard Logo', 'nextdash'); ?>
                                    </label>
                                </th>
                                <td>
                                    <?php
                                    $logo_url = isset($settings['logo_url']) ? $settings['logo_url'] : '';
                                    ?>
                                    <div class="nextdash-logo-upload">
                                        <input type="hidden" name="nextdash_settings[logo_url]" id="nextdash_logo_url" value="<?php echo esc_url($logo_url); ?>">
                                        <div class="nextdash-logo-preview" style="margin-bottom: 10px;">
                                            <?php if ($logo_url): ?>
                                                <img src="<?php echo esc_url($logo_url); ?>" style="max-height: 60px; max-width: 200px;">
                                            <?php else: ?>
                                                <p class="description"><?php esc_html_e('No logo selected', 'nextdash'); ?></p>
                                            <?php endif; ?>
                                        </div>
                                        <button type="button" class="button" id="nextdash_upload_logo">
                                            <?php esc_html_e('Upload Logo', 'nextdash'); ?>
                                        </button>
                                        <?php if ($logo_url): ?>
                                            <button type="button" class="button" id="nextdash_remove_logo">
                                                <?php esc_html_e('Remove Logo', 'nextdash'); ?>
                                            </button>
                                        <?php endif; ?>
                                    </div>
                                    <p class="description">
                                        <?php esc_html_e('Upload a logo to display in the dashboard sidebar. Recommended size: 200x60px', 'nextdash'); ?>
                                    </p>
                                </td>
                            </tr>
                            
                            <!-- Display Mode -->
                            <tr>
                                <th scope="row">
                                    <label for="nextdash_display_mode">
                                        <?php esc_html_e('Display Mode', 'nextdash'); ?>
                                    </label>
                                </th>
                                <td>
                                    <fieldset>
                                        <label>
                                            <input type="radio" 
                                                   name="nextdash_settings[display_mode]" 
                                                   value="fullscreen"
                                                   <?php checked(isset($settings['display_mode']) ? $settings['display_mode'] : 'fullscreen', 'fullscreen'); ?>>
                                            <strong><?php esc_html_e('Full Screen', 'nextdash'); ?></strong>
                                        </label>
                                    </fieldset>
                                    <p class="description">
                                        <?php esc_html_e('Dashboard takes entire screen (no WordPress header/footer)', 'nextdash'); ?>
                                    </p>
                                </td>
                            </tr>
                            
                            <!-- Enable/Disable -->
                            <tr>
                                <th scope="row">
                                    <label for="nextdash_enabled">
                                        <?php esc_html_e('Enable NextDash', 'nextdash'); ?>
                                    </label>
                                </th>
                                <td>
                                    <label class="nextdash-switch">
                                        <input type="checkbox" 
                                               name="nextdash_settings[enabled]" 
                                               id="nextdash_enabled" 
                                               value="1"
                                               <?php checked(isset($settings['enabled']) ? $settings['enabled'] : true, true); ?>>
                                        <span class="nextdash-slider"></span>
                                    </label>
                                    <p class="description">
                                        <?php esc_html_e('Replace default WooCommerce My Account page with NextDash dashboard', 'nextdash'); ?>
                                    </p>
                                </td>
                            </tr>
                            
                            <!-- Template Selection -->
                            <tr>
                                <th scope="row">
                                    <label for="nextdash_template">
                                        <?php esc_html_e('Dashboard Template', 'nextdash'); ?>
                                    </label>
                                </th>
                                <td>
                                    <select name="nextdash_settings[template]" id="nextdash_template">
                                        <option value="modern" <?php selected($settings['template'], 'modern'); ?>>
                                            <?php esc_html_e('Modern', 'nextdash'); ?>
                                        </option>
                                    </select>
                                    <p class="description">
                                        <?php esc_html_e('Choose dashboard template style', 'nextdash'); ?>
                                    </p>
                                </td>
                            </tr>
                            
                            <!-- Primary Color -->
                            <tr>
                                <th scope="row">
                                    <label for="nextdash_primary_color">
                                        <?php esc_html_e('Primary Color', 'nextdash'); ?>
                                    </label>
                                </th>
                                <td>
                                    <?php
                                    $primary_color = isset($settings['primary_color']) ? $settings['primary_color'] : '#ff6600';
                                    ?>
                                    <input type="text" 
                                           name="nextdash_settings[primary_color]" 
                                           id="nextdash_primary_color" 
                                           value="<?php echo esc_attr($primary_color); ?>"
                                           class="nextdash-color-picker"
                                           data-default-color="#ff6600">
                                    <p class="description">
                                        <?php esc_html_e('Choose the primary color for buttons, links, and active states in the dashboard', 'nextdash'); ?>
                                    </p>
                                </td>
                            </tr>
                            
                            <!-- Theme Mode -->
                            <tr>
                                <th scope="row">
                                    <label for="nextdash_theme_mode">
                                        <?php esc_html_e('Theme Mode', 'nextdash'); ?>
                                    </label>
                                </th>
                                <td>
                                    <select name="nextdash_settings[theme_mode]" id="nextdash_theme_mode">
                                        <option value="light" <?php selected($settings['theme_mode'], 'light'); ?>>
                                            <?php esc_html_e('Light', 'nextdash'); ?>
                                        </option>
                                        <option value="dark" <?php selected($settings['theme_mode'], 'dark'); ?>>
                                            <?php esc_html_e('Dark', 'nextdash'); ?>
                                        </option>
                                        <option value="auto" <?php selected($settings['theme_mode'], 'auto'); ?>>
                                            <?php esc_html_e('Auto (System)', 'nextdash'); ?>
                                        </option>
                                    </select>
                                    <p class="description">
                                        <?php esc_html_e('Choose color theme for the dashboard', 'nextdash'); ?>
                                    </p>
                                </td>
                            </tr>
                            
                            <!-- Sections Visibility -->
                            <tr>
                                <th scope="row">
                                    <?php esc_html_e('Dashboard Sections', 'nextdash'); ?>
                                </th>
                                <td>
                                    <fieldset>
                                        <label>
                                            <input type="checkbox" 
                                                   name="nextdash_settings[sections][overview]" 
                                                   value="1"
                                                   <?php checked(isset($settings['sections']['overview']) ? $settings['sections']['overview'] : true, true); ?>>
                                            <?php esc_html_e('Overview', 'nextdash'); ?>
                                        </label><br>
                                        
                                        <label>
                                            <input type="checkbox" 
                                                   name="nextdash_settings[sections][orders]" 
                                                   value="1"
                                                   <?php checked(isset($settings['sections']['orders']) ? $settings['sections']['orders'] : true, true); ?>>
                                            <?php esc_html_e('Orders', 'nextdash'); ?>
                                        </label><br>
                                        
                                        <label>
                                            <input type="checkbox" 
                                                   name="nextdash_settings[sections][downloads]" 
                                                   value="1"
                                                   <?php checked(isset($settings['sections']['downloads']) ? $settings['sections']['downloads'] : true, true); ?>>
                                            <?php esc_html_e('Downloads', 'nextdash'); ?>
                                        </label><br>
                                        
                                        <label>
                                            <input type="checkbox" 
                                                   name="nextdash_settings[sections][addresses]" 
                                                   value="1"
                                                   <?php checked(isset($settings['sections']['addresses']) ? $settings['sections']['addresses'] : true, true); ?>>
                                            <?php esc_html_e('Addresses', 'nextdash'); ?>
                                        </label><br>
                                        
                                        <label>
                                            <input type="checkbox" 
                                                   name="nextdash_settings[sections][account]" 
                                                   value="1"
                                                   <?php checked(isset($settings['sections']['account']) ? $settings['sections']['account'] : true, true); ?>>
                                            <?php esc_html_e('Account Details', 'nextdash'); ?>
                                        </label><br>
                                        
                                        <label>
                                            <input type="checkbox" 
                                                   name="nextdash_settings[sections][wishlist]" 
                                                   value="1"
                                                   <?php checked(isset($settings['sections']['wishlist']) ? $settings['sections']['wishlist'] : true, true); ?>>
                                            <?php esc_html_e('Wishlist', 'nextdash'); ?>
                                        </label>
                                    </fieldset>
                                    <p class="description">
                                        <?php esc_html_e('Select which sections to show in the dashboard', 'nextdash'); ?>
                                    </p>
                                    <p class="description" style="margin-top: 10px; padding: 8px; background: #f0f0f1; border-left: 4px solid #2271b1;">
                                        <strong><?php esc_html_e('Note:', 'nextdash'); ?></strong> <?php esc_html_e('Wishlist feature currently supports YITH WooCommerce Wishlist plugin only.', 'nextdash'); ?>
                                    </p>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                    
                    <?php submit_button(__('Save Settings', 'nextdash')); ?>
                </form>
                
                <hr>
                
                <div class="nextdash-info-box">
                    <h3><?php esc_html_e('Shortcode', 'nextdash'); ?></h3>
                    <p><?php esc_html_e('Use this shortcode to display the dashboard anywhere:', 'nextdash'); ?></p>
                    <code style="display: block; padding: 10px; background: #fff; border: 1px solid #ddd; border-radius: 3px; margin: 10px 0;">[nextdash_dashboard]</code>
                    <p class="description">
                        <?php esc_html_e('You can add this shortcode to any page or post. When auto-replace is enabled, it also replaces the WooCommerce My Account page automatically.', 'nextdash'); ?>
                    </p>
                </div>
                
            </div>
        </div>
        <?php
    }
    
    /**
     * Save settings
     */
    public function save_settings() {
        if (!isset($_POST['nextdash_settings_nonce']) || 
            !wp_verify_nonce(sanitize_text_field(wp_unslash($_POST['nextdash_settings_nonce'])), 'nextdash_save_settings')) {
            wp_die(esc_html__('Security check failed', 'nextdash'));
        }
        
        if (!current_user_can('manage_woocommerce')) {
            wp_die(esc_html__('You do not have permission to access this page', 'nextdash'));
        }
        
        $settings = isset($_POST['nextdash_settings']) ? wp_unslash($_POST['nextdash_settings']) : array();
        $sanitized_settings = $this->sanitize_settings($settings);
        
        update_option('nextdash_settings', $sanitized_settings);
        flush_rewrite_rules();
        wp_safe_redirect(add_query_arg('settings-updated', 'true', wp_get_referer()));
        exit;
    }
}

