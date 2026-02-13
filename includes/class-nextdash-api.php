<?php
/**
 * REST API endpoints
 */

if (!defined('ABSPATH')) {
    exit;
}

class NextDash_API {
    
    private static $instance = null;
    
    public static function instance() {
        if (null === self::$instance) {
            self::$instance = new self();
        }
        return self::$instance;
    }
    
    private function __construct() {
        add_action('rest_api_init', array($this, 'register_routes'));
    }
    
    /**
     * Register REST API routes
     */
    public function register_routes() {
        $namespace = 'nextdash/v1';
        
        register_rest_route($namespace, '/orders', array(
            'methods' => 'GET',
            'callback' => array($this, 'get_orders'),
            'permission_callback' => array($this, 'check_permission'),
        ));
        
        register_rest_route($namespace, '/orders/(?P<id>\d+)', array(
            'methods' => 'GET',
            'callback' => array($this, 'get_order'),
            'permission_callback' => array($this, 'check_permission'),
        ));
        
        register_rest_route($namespace, '/downloads', array(
            'methods' => 'GET',
            'callback' => array($this, 'get_downloads'),
            'permission_callback' => array($this, 'check_permission'),
        ));
        
        register_rest_route($namespace, '/addresses', array(
            'methods' => 'GET',
            'callback' => array($this, 'get_addresses'),
            'permission_callback' => array($this, 'check_permission'),
        ));
        
        register_rest_route($namespace, '/addresses', array(
            'methods' => 'POST',
            'callback' => array($this, 'update_address'),
            'permission_callback' => array($this, 'check_permission'),
        ));
        
        register_rest_route($namespace, '/account', array(
            'methods' => 'GET',
            'callback' => array($this, 'get_account'),
            'permission_callback' => array($this, 'check_permission'),
        ));
        
        register_rest_route($namespace, '/account', array(
            'methods' => 'POST',
            'callback' => array($this, 'update_account'),
            'permission_callback' => array($this, 'check_permission'),
        ));
        
        register_rest_route($namespace, '/overview', array(
            'methods' => 'GET',
            'callback' => array($this, 'get_overview'),
            'permission_callback' => array($this, 'check_permission'),
        ));
        
        register_rest_route($namespace, '/logout', array(
            'methods' => 'POST',
            'callback' => array($this, 'handle_logout'),
            'permission_callback' => array($this, 'check_permission'),
        ));
        
        register_rest_route($namespace, '/wishlists', array(
            'methods' => 'GET',
            'callback' => array($this, 'get_wishlists_with_items'),
            'permission_callback' => array($this, 'check_permission'),
        ));
    }
    
    /**
     * Check permission
     */
    public function check_permission() {
        return is_user_logged_in();
    }
    
    /**
     * Get user orders
     */
    public function get_orders($request) {
        $user_id = get_current_user_id();
        $page = $request->get_param('page') ?: 1;
        $per_page = $request->get_param('per_page') ?: 10;
        
        $args = array(
            'customer_id' => $user_id,
            'limit' => $per_page,
            'offset' => ($page - 1) * $per_page,
            'orderby' => 'date',
            'order' => 'DESC',
        );
        
        $orders = wc_get_orders($args);
        $formatted_orders = array();
        
        foreach ($orders as $order) {
            $formatted_orders[] = $this->format_order($order);
        }
        
        // Get total count - get all orders without limit
        $total_args = array(
            'customer_id' => $user_id,
            'return' => 'ids',
            'limit' => -1, // Get all orders for accurate count
        );
        $total_orders = wc_get_orders($total_args);
        $total_count = count($total_orders);
        
        return new WP_REST_Response(array(
            'orders' => $formatted_orders,
            'total' => $total_count,
            'pages' => ceil($total_count / $per_page),
        ), 200);
    }
    
    /**
     * Get single order
     */
    public function get_order($request) {
        $order_id = $request->get_param('id');
        $order = wc_get_order($order_id);
        
        if (!$order) {
            return new WP_Error('order_not_found', 'Order not found', array('status' => 404));
        }
        
        // Check if user owns this order
        if ($order->get_customer_id() !== get_current_user_id()) {
            return new WP_Error('unauthorized', 'Unauthorized access', array('status' => 403));
        }
        
        return new WP_REST_Response($this->format_order_details($order), 200);
    }
    
    /**
     * Format order for API
     */
    private function format_order($order) {
        // Get first product image and name from order
        $product_image = null;
        $product_name = null;
        $items = $order->get_items();
        if (!empty($items)) {
            $first_item = reset($items);
            $product = $first_item->get_product();
            if ($product) {
                $product_image = wp_get_attachment_image_url($product->get_image_id(), 'thumbnail');
                $product_name = $first_item->get_name();
            }
        }
        
        return array(
            'id' => $order->get_id(),
            'number' => $order->get_order_number(),
            'status' => $order->get_status(),
            'status_label' => wc_get_order_status_name($order->get_status()),
            'date' => $order->get_date_created()->date('Y-m-d H:i:s'),
            'total' => $order->get_total(),
            'currency' => $order->get_currency(),
            'formatted_total' => $order->get_formatted_order_total(),
            'item_count' => $order->get_item_count(),
            'payment_method' => $order->get_payment_method_title(),
            'view_url' => $order->get_view_order_url(),
            'product_image' => $product_image,
            'product_name' => $product_name,
        );
    }
    
    /**
     * Format order details
     */
    private function format_order_details($order) {
        // Format order items with meta data
        $items = array();
        foreach ($order->get_items() as $item) {
            $product = $item->get_product();
            
            // Get item meta data
            $item_meta = array();
            $meta_data = $item->get_meta_data();
            foreach ($meta_data as $meta) {
                $data = $meta->get_data();
                // Skip hidden meta (starts with _)
                if (substr($data['key'], 0, 1) !== '_') {
                    $item_meta[] = array(
                        'key' => $data['key'],
                        'value' => $data['value'],
                        'display_key' => wc_attribute_label($data['key']),
                        'display_value' => wp_kses_post($data['value']),
                    );
                }
            }
            
            // Get product URL
            $product_url = null;
            if ($product) {
                $product_url = $product->get_permalink();
            }
            
            $items[] = array(
                'id' => $item->get_id(),
                'name' => $item->get_name(),
                'quantity' => $item->get_quantity(),
                'total' => $item->get_total(),
                'subtotal' => $item->get_subtotal(),
                'formatted_total' => wc_price($item->get_total()),
                'formatted_subtotal' => wc_price($item->get_subtotal()),
                'image' => $product ? wp_get_attachment_image_url($product->get_image_id(), 'thumbnail') : null,
                'product_url' => $product_url,
                'meta_data' => $item_meta,
                'sku' => $product ? $product->get_sku() : '',
            );
        }
        
        // Format shipping lines
        $shipping_lines = array();
        foreach ($order->get_shipping_methods() as $shipping) {
            $shipping_lines[] = array(
                'id' => $shipping->get_id(),
                'method_title' => $shipping->get_method_title(),
                'method_id' => $shipping->get_method_id(),
                'total' => $shipping->get_total(),
                'formatted_total' => wc_price($shipping->get_total()),
            );
        }
        
        // Format coupon lines
        $coupon_lines = array();
        foreach ($order->get_coupon_codes() as $code) {
            $coupon_items = $order->get_items('coupon');
            foreach ($coupon_items as $coupon_item) {
                if ($coupon_item->get_code() === $code) {
                    $coupon_lines[] = array(
                        'code' => $code,
                        'discount' => $coupon_item->get_discount(),
                        'formatted_discount' => wc_price($coupon_item->get_discount()),
                    );
                }
            }
        }
        
        // Format fee lines
        $fee_lines = array();
        foreach ($order->get_fees() as $fee) {
            $fee_lines[] = array(
                'id' => $fee->get_id(),
                'name' => $fee->get_name(),
                'total' => $fee->get_total(),
                'formatted_total' => wc_price($fee->get_total()),
            );
        }
        
        // Format tax lines
        $tax_lines = array();
        foreach ($order->get_tax_totals() as $tax) {
            $tax_lines[] = array(
                'label' => $tax->label,
                'amount' => $tax->amount,
                'formatted_amount' => $tax->formatted_amount,
            );
        }
        
        return array(
            'id' => $order->get_id(),
            'number' => $order->get_order_number(),
            'status' => $order->get_status(),
            'status_label' => wc_get_order_status_name($order->get_status()),
            'date' => $order->get_date_created()->date('Y-m-d H:i:s'),
            'total' => $order->get_total(),
            'subtotal' => $order->get_subtotal(),
            'discount_total' => $order->get_discount_total(),
            'shipping_total' => $order->get_shipping_total(),
            'tax_total' => $order->get_total_tax(),
            'currency' => $order->get_currency(),
            'formatted_total' => $order->get_formatted_order_total(),
            'formatted_subtotal' => wc_price($order->get_subtotal()),
            'formatted_discount_total' => wc_price($order->get_discount_total()),
            'formatted_shipping_total' => wc_price($order->get_shipping_total()),
            'formatted_tax_total' => wc_price($order->get_total_tax()),
            'payment_method' => $order->get_payment_method_title(),
            'billing' => array(
                'first_name' => $order->get_billing_first_name(),
                'last_name' => $order->get_billing_last_name(),
                'company' => $order->get_billing_company(),
                'address_1' => $order->get_billing_address_1(),
                'address_2' => $order->get_billing_address_2(),
                'city' => $order->get_billing_city(),
                'state' => $order->get_billing_state(),
                'postcode' => $order->get_billing_postcode(),
                'country' => $order->get_billing_country(),
                'email' => $order->get_billing_email(),
                'phone' => $order->get_billing_phone(),
            ),
            'shipping' => array(
                'first_name' => $order->get_shipping_first_name(),
                'last_name' => $order->get_shipping_last_name(),
                'company' => $order->get_shipping_company(),
                'address_1' => $order->get_shipping_address_1(),
                'address_2' => $order->get_shipping_address_2(),
                'city' => $order->get_shipping_city(),
                'state' => $order->get_shipping_state(),
                'postcode' => $order->get_shipping_postcode(),
                'country' => $order->get_shipping_country(),
            ),
            'items' => $items,
            'shipping_lines' => $shipping_lines,
            'coupon_lines' => $coupon_lines,
            'fee_lines' => $fee_lines,
            'tax_lines' => $tax_lines,
            'customer_note' => $order->get_customer_note(),
        );
    }
    
    /**
     * Get downloads
     */
    public function get_downloads($request) {
        $page = $request->get_param('page') ?: 1;
        $per_page = $request->get_param('per_page') ?: 10;
        
        $downloads = wc_get_customer_available_downloads(get_current_user_id());
        
        $formatted_downloads = array();
        foreach ($downloads as $download) {
            // Get product image from order
            $product_image = null;
            $order = wc_get_order($download['order_id']);
            if ($order) {
                foreach ($order->get_items() as $item) {
                    $product = $item->get_product();
                    if ($product && $product->get_id() == $download['product_id']) {
                        $product_image = wp_get_attachment_image_url($product->get_image_id(), 'thumbnail');
                        break;
                    }
                }
            }
            
            $formatted_downloads[] = array(
                'id' => $download['download_id'],
                'name' => $download['download_name'],
                'url' => $download['download_url'],
                'product_name' => $download['product_name'],
                'product_id' => $download['product_id'],
                'order_id' => $download['order_id'],
                'product_image' => $product_image,
                'downloads_remaining' => $download['downloads_remaining'],
                'access_expires' => $download['access_expires'],
            );
        }
        
        // Group downloads by order_id
        $grouped = array();
        foreach ($formatted_downloads as $download) {
            if (!isset($download['order_id']) || !isset($download['product_name'])) {
                continue; // Skip invalid downloads
            }
            if (!isset($grouped[$download['order_id']])) {
                $grouped[$download['order_id']] = array();
            }
            $grouped[$download['order_id']][] = $download;
        }
        
        // Sort by order_id descending
        krsort($grouped);
        
        // Get total number of orders (groups)
        $total_orders = count($grouped);
        
        // Paginate the groups (orders)
        $grouped_array = array_values($grouped);
        $offset = ($page - 1) * $per_page;
        $paginated_groups = array_slice($grouped_array, $offset, $per_page);
        
        // Flatten paginated groups back to downloads list
        $paginated_downloads = array();
        foreach ($paginated_groups as $group) {
            if (is_array($group)) {
                $paginated_downloads = array_merge($paginated_downloads, $group);
            }
        }
        
        // Ensure pages is at least 1
        $total_pages = max(1, ceil($total_orders / $per_page));
        
        return new WP_REST_Response(array(
            'downloads' => $paginated_downloads,
            'total' => count($formatted_downloads),
            'total_orders' => $total_orders,
            'pages' => $total_pages,
        ), 200);
    }
    
    /**
     * Get addresses
     */
    public function get_addresses($request) {
        $user_id = get_current_user_id();
        $customer = new WC_Customer($user_id);
        
        return new WP_REST_Response(array(
            'billing' => array(
                'first_name' => $customer->get_billing_first_name(),
                'last_name' => $customer->get_billing_last_name(),
                'company' => $customer->get_billing_company(),
                'address_1' => $customer->get_billing_address_1(),
                'address_2' => $customer->get_billing_address_2(),
                'city' => $customer->get_billing_city(),
                'state' => $customer->get_billing_state(),
                'postcode' => $customer->get_billing_postcode(),
                'country' => $customer->get_billing_country(),
                'email' => $customer->get_billing_email(),
                'phone' => $customer->get_billing_phone(),
            ),
            'shipping' => array(
                'first_name' => $customer->get_shipping_first_name(),
                'last_name' => $customer->get_shipping_last_name(),
                'company' => $customer->get_shipping_company(),
                'address_1' => $customer->get_shipping_address_1(),
                'address_2' => $customer->get_shipping_address_2(),
                'city' => $customer->get_shipping_city(),
                'state' => $customer->get_shipping_state(),
                'postcode' => $customer->get_shipping_postcode(),
                'country' => $customer->get_shipping_country(),
            ),
        ), 200);
    }
    
    /**
     * Update address
     */
    public function update_address($request) {
        // Verify nonce for CSRF protection
        $nonce = $request->get_header('X-WP-Nonce');
        if (!wp_verify_nonce($nonce, 'wp_rest')) {
            return new WP_Error('invalid_nonce', 'Invalid security token', array('status' => 403));
        }
        
        // Ensure user is logged in
        $user_id = get_current_user_id();
        if (!$user_id) {
            return new WP_Error('unauthorized', 'You must be logged in', array('status' => 401));
        }
        
        $customer = new WC_Customer($user_id);
        
        // Validate and sanitize type parameter
        $type = sanitize_text_field($request->get_param('type'));
        if (!in_array($type, array('billing', 'shipping'), true)) {
            return new WP_Error('invalid_type', 'Address type must be billing or shipping', array('status' => 400));
        }
        
        // Get and validate address data
        $data = $request->get_param('address');
        if (!is_array($data)) {
            return new WP_Error('invalid_data', 'Address data must be an array', array('status' => 400));
        }
        
        // Sanitize all address fields
        $sanitized_data = array(
            'first_name' => isset($data['first_name']) ? sanitize_text_field($data['first_name']) : '',
            'last_name' => isset($data['last_name']) ? sanitize_text_field($data['last_name']) : '',
            'company' => isset($data['company']) ? sanitize_text_field($data['company']) : '',
            'address_1' => isset($data['address_1']) ? sanitize_text_field($data['address_1']) : '',
            'address_2' => isset($data['address_2']) ? sanitize_text_field($data['address_2']) : '',
            'city' => isset($data['city']) ? sanitize_text_field($data['city']) : '',
            'state' => isset($data['state']) ? sanitize_text_field($data['state']) : '',
            'postcode' => isset($data['postcode']) ? sanitize_text_field($data['postcode']) : '',
            'country' => isset($data['country']) ? sanitize_text_field($data['country']) : '',
            'email' => isset($data['email']) ? sanitize_email($data['email']) : '',
            'phone' => isset($data['phone']) ? sanitize_text_field($data['phone']) : '',
        );
        
        // Validate required fields
        if ($type === 'billing' && empty($sanitized_data['email'])) {
            return new WP_Error('invalid_data', 'Billing email is required', array('status' => 400));
        }
        
        if ($type === 'billing') {
            $customer->set_billing_first_name($sanitized_data['first_name']);
            $customer->set_billing_last_name($sanitized_data['last_name']);
            $customer->set_billing_company($sanitized_data['company']);
            $customer->set_billing_address_1($sanitized_data['address_1']);
            $customer->set_billing_address_2($sanitized_data['address_2']);
            $customer->set_billing_city($sanitized_data['city']);
            $customer->set_billing_state($sanitized_data['state']);
            $customer->set_billing_postcode($sanitized_data['postcode']);
            $customer->set_billing_country($sanitized_data['country']);
            $customer->set_billing_email($sanitized_data['email']);
            $customer->set_billing_phone($sanitized_data['phone']);
        } elseif ($type === 'shipping') {
            $customer->set_shipping_first_name($sanitized_data['first_name']);
            $customer->set_shipping_last_name($sanitized_data['last_name']);
            $customer->set_shipping_company($sanitized_data['company']);
            $customer->set_shipping_address_1($sanitized_data['address_1']);
            $customer->set_shipping_address_2($sanitized_data['address_2']);
            $customer->set_shipping_city($sanitized_data['city']);
            $customer->set_shipping_state($sanitized_data['state']);
            $customer->set_shipping_postcode($sanitized_data['postcode']);
            $customer->set_shipping_country($sanitized_data['country']);
        }
        
        $customer->save();
        
        return new WP_REST_Response(array('success' => true), 200);
    }
    
    /**
     * Get account details
     */
    public function get_account($request) {
        $user_id = get_current_user_id();
        $user = get_userdata($user_id);
        
        return new WP_REST_Response(array(
            'id' => $user->ID,
            'username' => $user->user_login,
            'email' => $user->user_email,
            'first_name' => $user->first_name,
            'last_name' => $user->last_name,
            'display_name' => $user->display_name,
        ), 200);
    }
    
    /**
     * Update account details
     */
    public function update_account($request) {
        // Verify nonce for CSRF protection
        $nonce = $request->get_header('X-WP-Nonce');
        if (!wp_verify_nonce($nonce, 'wp_rest')) {
            return new WP_Error('invalid_nonce', 'Invalid security token', array('status' => 403));
        }
        
        // Ensure user is logged in
        $user_id = get_current_user_id();
        if (!$user_id) {
            return new WP_Error('unauthorized', 'You must be logged in', array('status' => 401));
        }
        
        $data = $request->get_params();
        
        // Ensure user can only update their own account (prevent ID manipulation)
        $target_user_id = isset($data['id']) ? absint($data['id']) : $user_id;
        if ($target_user_id !== $user_id) {
            return new WP_Error('unauthorized', 'You can only update your own account', array('status' => 403));
        }
        $user_data = array(
            'ID' => $user_id,
        );
        
        // Sanitize and validate first name
        if (isset($data['first_name'])) {
            $first_name = sanitize_text_field($data['first_name']);
            if (strlen($first_name) > 50) {
                return new WP_Error('invalid_data', 'First name is too long (max 50 characters)', array('status' => 400));
            }
            $user_data['first_name'] = $first_name;
        }
        
        // Sanitize and validate last name
        if (isset($data['last_name'])) {
            $last_name = sanitize_text_field($data['last_name']);
            if (strlen($last_name) > 50) {
                return new WP_Error('invalid_data', 'Last name is too long (max 50 characters)', array('status' => 400));
            }
            $user_data['last_name'] = $last_name;
        }
        
        // Sanitize and validate display name
        if (isset($data['display_name'])) {
            $display_name = sanitize_text_field($data['display_name']);
            if (strlen($display_name) > 60) {
                return new WP_Error('invalid_data', 'Display name is too long (max 60 characters)', array('status' => 400));
            }
            $user_data['display_name'] = $display_name;
        }
        
        // Validate and sanitize email
        if (isset($data['email'])) {
            $email = sanitize_email($data['email']);
            if (!is_email($email)) {
                return new WP_Error('invalid_data', 'Invalid email address', array('status' => 400));
            }
            
            // Check if email is already in use by another user
            $email_exists = email_exists($email);
            if ($email_exists && $email_exists !== $user_id) {
                return new WP_Error('email_exists', 'This email is already registered to another account', array('status' => 400));
            }
            
            $user_data['user_email'] = $email;
        }
        
        // Handle password change - require current password
        if (isset($data['password']) && !empty($data['password'])) {
            // Require current password for security
            if (!isset($data['current_password']) || empty($data['current_password'])) {
                return new WP_Error('current_password_required', 'Current password is required to change password', array('status' => 400));
            }
            
            // Verify current password
            $user = get_userdata($user_id);
            if (!wp_check_password($data['current_password'], $user->user_pass, $user_id)) {
                return new WP_Error('invalid_password', 'Current password is incorrect', array('status' => 400));
            }
            
            // Validate new password
            $new_password = $data['password'];
            if (strlen($new_password) < 8) {
                return new WP_Error('weak_password', 'Password must be at least 8 characters long', array('status' => 400));
            }
            
            if (strlen($new_password) > 72) {
                return new WP_Error('password_too_long', 'Password is too long (max 72 characters)', array('status' => 400));
            }
            
            // Prevent using current password as new password
            if (wp_check_password($new_password, $user->user_pass, $user_id)) {
                return new WP_Error('same_password', 'New password must be different from current password', array('status' => 400));
            }
            
            $user_data['user_pass'] = $new_password; // wp_update_user() will hash it
        }
        
        // Prevent role/capability changes - users cannot escalate privileges
        // Remove any role or capability fields if present
        unset($data['role']);
        unset($data['user_role']);
        unset($data['capabilities']);
        unset($data['user_level']);
        
        $result = wp_update_user($user_data);
        
        if (is_wp_error($result)) {
            return new WP_Error('update_failed', $result->get_error_message(), array('status' => 400));
        }
        
        return new WP_REST_Response(array('success' => true), 200);
    }
    
    /**
     * Get overview data
     */
    public function get_overview($request) {
        $user_id = get_current_user_id();
        
        // Get recent orders
        $recent_orders = wc_get_orders(array(
            'customer_id' => $user_id,
            'limit' => 5,
            'orderby' => 'date',
            'order' => 'DESC',
        ));
        
        $formatted_recent_orders = array();
        foreach ($recent_orders as $order) {
            $formatted_recent_orders[] = $this->format_order($order);
        }
        
        // Get total orders
        $total_orders = wc_get_orders(array(
            'customer_id' => $user_id,
            'return' => 'ids',
        ));
        
        // Calculate total spent
        $completed_orders = wc_get_orders(array(
            'customer_id' => $user_id,
            'status' => array('completed', 'processing'),
            'return' => 'ids',
        ));
        
        $total_spent = 0;
        foreach ($completed_orders as $order_id) {
            $order = wc_get_order($order_id);
            $total_spent += $order->get_total();
        }
        
        // Get user data
        $user = get_userdata($user_id);
        
        return new WP_REST_Response(array(
            'user' => array(
                'name' => $user->display_name,
                'email' => $user->user_email,
            ),
            'stats' => array(
                'total_orders' => count($total_orders),
                'total_spent' => $total_spent,
                'formatted_total_spent' => wc_price($total_spent),
            ),
            'recent_orders' => $formatted_recent_orders,
        ), 200);
    }
    
    /**
     * Handle logout
     */
    public function handle_logout($request) {
        // Verify nonce
        $nonce = $request->get_header('X-WP-Nonce');
        if (!wp_verify_nonce($nonce, 'wp_rest')) {
            return new WP_Error('invalid_nonce', 'Invalid security token', array('status' => 403));
        }
        
        // Get my account page URL for redirect
        $my_account_url = wc_get_page_permalink('myaccount');
        
        // Logout the user
        wp_logout();
        
        // Clear any WooCommerce session
        if (function_exists('WC') && WC()->session) {
            WC()->session->destroy_session();
        }
        
        // Return redirect URL
        return new WP_REST_Response(array(
            'success' => true,
            'redirect_url' => $my_account_url,
        ), 200);
    }
    
    /**
     * Get wishlists with items (YITH integration)
     */
    public function get_wishlists_with_items($request) {
        // Check if YITH Wishlist is active
        if (!class_exists('YITH_WCWL_Wishlists')) {
            return new WP_Error('yith_not_active', 'YITH WooCommerce Wishlist is not active', array('status' => 404));
        }
        
        $user_id = get_current_user_id();
        if (!$user_id) {
            return new WP_Error('not_authenticated', 'User not authenticated', array('status' => 401));
        }
        
        // Get user wishlists
        $wishlists = YITH_WCWL_Wishlists::get_instance()->get_current_user_wishlists();
        
        $formatted_wishlists = array();
        
        foreach ($wishlists as $wishlist) {
            $items = $wishlist->get_items();
            $formatted_items = array();
            
            foreach ($items as $item) {
                $product = $item->get_product();
                if (!$product) {
                    continue;
                }
                
                // Get prices for display
                $regular_price = $product->get_regular_price();
                $sale_price = $product->get_sale_price();
                $current_price = $product->get_price();
                
                // Format price: if on sale, show regular price crossed out + sale price, otherwise just current price
                if ($sale_price && $regular_price && $sale_price != $regular_price) {
                    $formatted_price = '<span style="text-decoration: line-through; color: #999; margin-right: 8px;">' . wc_price($regular_price) . '</span>' . wc_price($sale_price);
                } else {
                    $formatted_price = $current_price ? wc_price($current_price) : '';
                }
                
                $formatted_items[] = array(
                    'id' => $item->get_id(),
                    'product_id' => $item->get_product_id(),
                    'product_name' => $product->get_name(),
                    'name' => $product->get_name(),
                    'product_image' => wp_get_attachment_image_url($product->get_image_id(), 'woocommerce_thumbnail') ?: wc_placeholder_img_src(),
                    'image' => wp_get_attachment_image_url($product->get_image_id(), 'woocommerce_thumbnail') ?: wc_placeholder_img_src(),
                    'product_price' => $formatted_price,
                    'price' => $formatted_price,
                    'product_url' => $product->get_permalink(),
                    'permalink' => $product->get_permalink(),
                    'quantity' => $item->get_quantity(),
                );
            }
            
            $formatted_wishlists[] = array(
                'id' => $wishlist->get_id(),
                'name' => $wishlist->get_formatted_name(),
                'token' => $wishlist->get_token(),
                'user_id' => $wishlist->get_user_id(),
                'is_default' => $wishlist->is_default(),
                'items' => $formatted_items,
            );
        }
        
        return new WP_REST_Response($formatted_wishlists, 200);
    }
}

