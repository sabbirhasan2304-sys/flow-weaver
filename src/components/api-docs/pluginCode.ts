import { API_ENDPOINT } from '@/config/brand';

const API_BASE_URL = API_ENDPOINT;

export const wordpressPluginCode = `<?php
/**
 * Plugin Name: BiztoriBD Automation for WooCommerce
 * Description: Full workflow automation engine — trigger workflows on WooCommerce events, manage & monitor workflows, track abandonment, sync contacts.
 * Version: 2.0.0
 * Author: BiztoriBD
 * Requires Plugins: woocommerce
 */

if (!defined('ABSPATH')) exit;

class BiztoriBD_Automation {
    private $api_key;
    private $api_url;

    public function __construct() {
        $this->api_key = get_option('biztoribbd_api_key', '');
        $this->api_url = get_option('biztoribbd_api_url', '${API_BASE_URL}');

        add_action('admin_menu', [$this, 'add_admin_menu']);
        add_action('admin_init', [$this, 'register_settings']);
        add_action('admin_enqueue_scripts', [$this, 'enqueue_admin_assets']);

        add_action('wp_ajax_bz_list_workflows', [$this, 'ajax_list_workflows']);
        add_action('wp_ajax_bz_execute_workflow', [$this, 'ajax_execute_workflow']);
        add_action('wp_ajax_bz_list_executions', [$this, 'ajax_list_executions']);
        add_action('wp_ajax_bz_get_execution', [$this, 'ajax_get_execution']);
        add_action('wp_ajax_bz_workflow_stats', [$this, 'ajax_workflow_stats']);
        add_action('wp_ajax_bz_save_mappings', [$this, 'ajax_save_mappings']);

        if (empty($this->api_key)) return;

        // WooCommerce event hooks
        add_action('woocommerce_new_order', [$this, 'on_new_order'], 10, 2);
        add_action('woocommerce_order_status_completed', [$this, 'on_order_complete']);
        add_action('woocommerce_order_status_failed', [$this, 'on_payment_failed']);
        add_action('woocommerce_order_status_cancelled', [$this, 'on_order_cancelled']);
        add_action('woocommerce_order_status_refunded', [$this, 'on_order_refunded']);
        add_action('woocommerce_created_customer', [$this, 'on_customer_created'], 10, 3);
        add_action('woocommerce_update_product', [$this, 'on_product_updated'], 10, 2);
        add_action('woocommerce_add_to_cart', [$this, 'on_add_to_cart'], 10, 6);
        add_action('wp_footer', [$this, 'inject_tracker_script']);

        add_action('biztoribbd_check_abandoned', [$this, 'check_abandoned_carts']);
        if (!wp_next_scheduled('biztoribbd_check_abandoned')) {
            wp_schedule_event(time(), 'hourly', 'biztoribbd_check_abandoned');
        }
    }

    public function add_admin_menu() {
        add_menu_page('BiztoriBD', 'BiztoriBD', 'manage_options', 'biztoribbd', [$this, 'page_dashboard'], 'dashicons-networking', 56);
        add_submenu_page('biztoribbd', 'Dashboard', 'Dashboard', 'manage_options', 'biztoribbd', [$this, 'page_dashboard']);
        add_submenu_page('biztoribbd', 'Workflows', 'Workflows', 'manage_options', 'biztoribbd-workflows', [$this, 'page_workflows']);
        add_submenu_page('biztoribbd', 'Executions', 'Executions', 'manage_options', 'biztoribbd-executions', [$this, 'page_executions']);
        add_submenu_page('biztoribbd', 'Event Mappings', 'Event Mappings', 'manage_options', 'biztoribbd-mappings', [$this, 'page_mappings']);
        add_submenu_page('biztoribbd', 'Settings', 'Settings', 'manage_options', 'biztoribbd-settings', [$this, 'page_settings']);
    }

    public function register_settings() {
        register_setting('biztoribbd_settings', 'biztoribbd_api_key');
        register_setting('biztoribbd_settings', 'biztoribbd_api_url');
        register_setting('biztoribbd_settings', 'biztoribbd_event_mappings');
    }

    // ... Full admin pages, AJAX handlers, event hooks, and tracker script
    // See complete plugin code in the downloadable version

    private function trigger_mapped_workflow($event_key, $input_data) {
        $mappings = get_option('biztoribbd_event_mappings', []);
        if (!is_array($mappings) || empty($mappings[$event_key])) return;
        $this->api_post('/workflows/' . $mappings[$event_key] . '/execute', [
            'input' => array_merge($input_data, [
                '_source' => 'wordpress', '_event' => $event_key,
                '_timestamp' => current_time('c'), '_site_url' => home_url(),
            ]),
        ]);
    }

    private function api_post($endpoint, $data) {
        $response = wp_remote_post($this->api_url . $endpoint, [
            'headers' => ['x-api-key' => $this->api_key, 'Content-Type' => 'application/json'],
            'body' => json_encode($data), 'timeout' => 30,
        ]);
        if (is_wp_error($response)) return ['error' => $response->get_error_message()];
        return json_decode(wp_remote_retrieve_body($response), true);
    }
}

new BiztoriBD_Automation();`;

export const shopifySnippetCode = `{% comment %}
  BiztoriBD Tracker for Shopify
  Add this snippet to theme.liquid before </body>
{% endcomment %}

<script>
(function() {
  var BZ_API_KEY = "bz_your_api_key_here";
  var BZ_API_URL = "${API_BASE_URL}";

  var BZShopify = {
    _post: function(endpoint, data) {
      fetch(BZ_API_URL + endpoint, {
        method: "POST",
        headers: { "x-api-key": BZ_API_KEY, "Content-Type": "application/json" },
        body: JSON.stringify(data)
      }).catch(function(e) { console.warn("BZ:", e); });
    },
    init: function() {
      this._post("/track/pageview", {
        page_url: window.location.href,
        referrer: document.referrer,
        contact_email: this._getEmail()
      });
      this._trackCheckoutAbandon();
      {% if customer %}
      this.identify("{{ customer.email }}", {
        firstName: "{{ customer.first_name }}",
        lastName: "{{ customer.last_name }}",
        ordersCount: {{ customer.orders_count | default: 0 }}
      });
      {% endif %}
    },
    identify: function(email, data) {
      this._post("/contacts", {
        email: email, first_name: data.firstName || null,
        last_name: data.lastName || null, source: "shopify",
        custom_fields: { orders_count: data.ordersCount || 0 }
      });
    },
    _getEmail: function() {
      {% if customer %} return "{{ customer.email }}";
      {% else %} return null; {% endif %}
    },
    _trackCheckoutAbandon: function() {
      if (window.location.pathname.indexOf('/checkouts/') === -1) return;
      if (window.Shopify && window.Shopify.checkout && window.Shopify.checkout.order_id) return;
      var self = this;
      window.addEventListener("beforeunload", function() {
        var email = self._getEmail() || (document.querySelector('input[type="email"]') || {}).value;
        if (!email) return;
        navigator.sendBeacon && navigator.sendBeacon(
          BZ_API_URL + "/triggers/checkout-abandon",
          new Blob([JSON.stringify({ email: email, checkout_step: "in_progress", _key: BZ_API_KEY })], { type: "application/json" })
        );
      });
    }
  };

  window.addEventListener("load", function() { BZShopify.init(); });
  window.BZShopify = BZShopify;
})();
</script>`;
