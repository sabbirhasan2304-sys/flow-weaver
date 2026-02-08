// ============================================================
// BANGLADESHI PAYMENT GATEWAY NODES
// bKash, Nagad, SSLCommerz, Rocket, AamarPay integrations
// ============================================================

import { NodeDefinition, NODE_CATEGORIES } from '@/types/nodes';

export const paymentNodes: NodeDefinition[] = [
  // ============================================================
  // BKASH NODES
  // ============================================================
  {
    type: 'bkash-payment',
    displayName: 'bKash Payment',
    category: 'Payments',
    description: 'Initiate bKash payment request',
    icon: 'Wallet',
    color: '#E2136E',
    inputs: [{ name: 'trigger', type: 'any' }],
    outputs: [{ name: 'success', type: 'object' }, { name: 'error', type: 'object' }],
    configSchema: [
      { name: 'mode', label: 'Mode', type: 'select', options: [{ label: 'Sandbox', value: 'sandbox' }, { label: 'Live', value: 'live' }], defaultValue: 'sandbox' },
      { name: 'amount', label: 'Amount (BDT)', type: 'text', placeholder: '{{ $json.amount }}', required: true },
      { name: 'payerReference', label: 'Payer Reference', type: 'text', placeholder: 'Order ID or reference' },
      { name: 'callbackUrl', label: 'Callback URL', type: 'text', placeholder: 'https://your-domain.com/callback' },
      { name: 'credential', label: 'bKash Credentials', type: 'credential', required: true },
    ],
  },
  {
    type: 'bkash-verify',
    displayName: 'bKash Verify Payment',
    category: 'Payments',
    description: 'Verify bKash payment status',
    icon: 'CheckCircle',
    color: '#E2136E',
    inputs: [{ name: 'trigger', type: 'any' }],
    outputs: [{ name: 'verified', type: 'object' }, { name: 'failed', type: 'object' }],
    configSchema: [
      { name: 'paymentId', label: 'Payment ID', type: 'text', placeholder: '{{ $json.paymentId }}', required: true },
      { name: 'credential', label: 'bKash Credentials', type: 'credential', required: true },
    ],
  },
  {
    type: 'bkash-refund',
    displayName: 'bKash Refund',
    category: 'Payments',
    description: 'Process bKash refund',
    icon: 'RotateCcw',
    color: '#E2136E',
    inputs: [{ name: 'trigger', type: 'any' }],
    outputs: [{ name: 'success', type: 'object' }, { name: 'error', type: 'object' }],
    configSchema: [
      { name: 'paymentId', label: 'Payment ID', type: 'text', required: true },
      { name: 'amount', label: 'Refund Amount', type: 'text', required: true },
      { name: 'reason', label: 'Refund Reason', type: 'text' },
      { name: 'credential', label: 'bKash Credentials', type: 'credential', required: true },
    ],
  },
  {
    type: 'bkash-query',
    displayName: 'bKash Query Transaction',
    category: 'Payments',
    description: 'Query bKash transaction details',
    icon: 'Search',
    color: '#E2136E',
    inputs: [{ name: 'trigger', type: 'any' }],
    outputs: [{ name: 'result', type: 'object' }],
    configSchema: [
      { name: 'transactionId', label: 'Transaction ID', type: 'text', required: true },
      { name: 'credential', label: 'bKash Credentials', type: 'credential', required: true },
    ],
  },

  // ============================================================
  // NAGAD NODES
  // ============================================================
  {
    type: 'nagad-payment',
    displayName: 'Nagad Payment',
    category: 'Payments',
    description: 'Initiate Nagad mobile wallet payment',
    icon: 'Wallet',
    color: '#F6921E',
    inputs: [{ name: 'trigger', type: 'any' }],
    outputs: [{ name: 'success', type: 'object' }, { name: 'error', type: 'object' }],
    configSchema: [
      { name: 'mode', label: 'Mode', type: 'select', options: [{ label: 'Sandbox', value: 'sandbox' }, { label: 'Live', value: 'live' }], defaultValue: 'sandbox' },
      { name: 'amount', label: 'Amount (BDT)', type: 'text', placeholder: '{{ $json.amount }}', required: true },
      { name: 'orderId', label: 'Order ID', type: 'text', required: true },
      { name: 'productDetails', label: 'Product Details', type: 'text' },
      { name: 'callbackUrl', label: 'Callback URL', type: 'text' },
      { name: 'credential', label: 'Nagad Credentials', type: 'credential', required: true },
    ],
  },
  {
    type: 'nagad-verify',
    displayName: 'Nagad Verify Payment',
    category: 'Payments',
    description: 'Verify Nagad payment status',
    icon: 'CheckCircle',
    color: '#F6921E',
    inputs: [{ name: 'trigger', type: 'any' }],
    outputs: [{ name: 'verified', type: 'object' }, { name: 'failed', type: 'object' }],
    configSchema: [
      { name: 'paymentRefId', label: 'Payment Reference ID', type: 'text', required: true },
      { name: 'credential', label: 'Nagad Credentials', type: 'credential', required: true },
    ],
  },

  // ============================================================
  // SSLCOMMERZ NODES (Primary aggregator)
  // ============================================================
  {
    type: 'sslcommerz-payment',
    displayName: 'SSLCommerz Payment',
    category: 'Payments',
    description: 'Initiate SSLCommerz payment (cards, mobile banking)',
    icon: 'CreditCard',
    color: '#2E7D32',
    inputs: [{ name: 'trigger', type: 'any' }],
    outputs: [{ name: 'redirectUrl', type: 'string' }, { name: 'error', type: 'object' }],
    configSchema: [
      { name: 'mode', label: 'Mode', type: 'select', options: [{ label: 'Sandbox', value: 'sandbox' }, { label: 'Live', value: 'live' }], defaultValue: 'sandbox' },
      { name: 'amount', label: 'Amount (BDT)', type: 'text', required: true },
      { name: 'currency', label: 'Currency', type: 'select', options: [{ label: 'BDT', value: 'BDT' }, { label: 'USD', value: 'USD' }], defaultValue: 'BDT' },
      { name: 'transactionId', label: 'Transaction ID', type: 'text', required: true },
      { name: 'productCategory', label: 'Product Category', type: 'text', defaultValue: 'Digital Services' },
      { name: 'customerName', label: 'Customer Name', type: 'text' },
      { name: 'customerEmail', label: 'Customer Email', type: 'text' },
      { name: 'customerPhone', label: 'Customer Phone', type: 'text' },
      { name: 'customerAddress', label: 'Customer Address', type: 'text' },
      { name: 'successUrl', label: 'Success URL', type: 'text', required: true },
      { name: 'failUrl', label: 'Fail URL', type: 'text', required: true },
      { name: 'cancelUrl', label: 'Cancel URL', type: 'text', required: true },
      { name: 'ipnUrl', label: 'IPN URL (Webhook)', type: 'text' },
      { name: 'credential', label: 'SSLCommerz Credentials', type: 'credential', required: true },
    ],
  },
  {
    type: 'sslcommerz-validate',
    displayName: 'SSLCommerz Validate',
    category: 'Payments',
    description: 'Validate SSLCommerz transaction',
    icon: 'Shield',
    color: '#2E7D32',
    inputs: [{ name: 'trigger', type: 'any' }],
    outputs: [{ name: 'valid', type: 'object' }, { name: 'invalid', type: 'object' }],
    configSchema: [
      { name: 'validationId', label: 'Validation ID', type: 'text', required: true },
      { name: 'credential', label: 'SSLCommerz Credentials', type: 'credential', required: true },
    ],
  },
  {
    type: 'sslcommerz-refund',
    displayName: 'SSLCommerz Refund',
    category: 'Payments',
    description: 'Process SSLCommerz refund',
    icon: 'RotateCcw',
    color: '#2E7D32',
    inputs: [{ name: 'trigger', type: 'any' }],
    outputs: [{ name: 'success', type: 'object' }, { name: 'error', type: 'object' }],
    configSchema: [
      { name: 'bankTransactionId', label: 'Bank Transaction ID', type: 'text', required: true },
      { name: 'refundAmount', label: 'Refund Amount', type: 'text', required: true },
      { name: 'refundRemarks', label: 'Refund Remarks', type: 'text' },
      { name: 'credential', label: 'SSLCommerz Credentials', type: 'credential', required: true },
    ],
  },
  {
    type: 'sslcommerz-transaction-query',
    displayName: 'SSLCommerz Query',
    category: 'Payments',
    description: 'Query SSLCommerz transaction by ID or session',
    icon: 'Search',
    color: '#2E7D32',
    inputs: [{ name: 'trigger', type: 'any' }],
    outputs: [{ name: 'result', type: 'object' }],
    configSchema: [
      { name: 'queryType', label: 'Query By', type: 'select', options: [{ label: 'Transaction ID', value: 'transactionId' }, { label: 'Session Key', value: 'sessionKey' }] },
      { name: 'queryValue', label: 'Query Value', type: 'text', required: true },
      { name: 'credential', label: 'SSLCommerz Credentials', type: 'credential', required: true },
    ],
  },

  // ============================================================
  // ROCKET (DBBL) NODES
  // ============================================================
  {
    type: 'rocket-payment',
    displayName: 'Rocket Payment',
    category: 'Payments',
    description: 'Initiate DBBL Rocket mobile banking payment',
    icon: 'Rocket',
    color: '#8E24AA',
    inputs: [{ name: 'trigger', type: 'any' }],
    outputs: [{ name: 'success', type: 'object' }, { name: 'error', type: 'object' }],
    configSchema: [
      { name: 'amount', label: 'Amount (BDT)', type: 'text', required: true },
      { name: 'referenceId', label: 'Reference ID', type: 'text', required: true },
      { name: 'customerMobile', label: 'Customer Mobile', type: 'text' },
      { name: 'callbackUrl', label: 'Callback URL', type: 'text' },
      { name: 'credential', label: 'Rocket Credentials', type: 'credential', required: true },
    ],
  },

  // ============================================================
  // AAMARPAY NODES
  // ============================================================
  {
    type: 'aamarpay-payment',
    displayName: 'AamarPay Payment',
    category: 'Payments',
    description: 'Initiate AamarPay payment gateway transaction',
    icon: 'CreditCard',
    color: '#1976D2',
    inputs: [{ name: 'trigger', type: 'any' }],
    outputs: [{ name: 'redirectUrl', type: 'string' }, { name: 'error', type: 'object' }],
    configSchema: [
      { name: 'mode', label: 'Mode', type: 'select', options: [{ label: 'Sandbox', value: 'sandbox' }, { label: 'Live', value: 'live' }], defaultValue: 'sandbox' },
      { name: 'amount', label: 'Amount', type: 'text', required: true },
      { name: 'currency', label: 'Currency', type: 'select', options: [{ label: 'BDT', value: 'BDT' }, { label: 'USD', value: 'USD' }], defaultValue: 'BDT' },
      { name: 'transactionId', label: 'Transaction ID', type: 'text', required: true },
      { name: 'description', label: 'Description', type: 'text' },
      { name: 'customerName', label: 'Customer Name', type: 'text' },
      { name: 'customerEmail', label: 'Customer Email', type: 'text' },
      { name: 'customerPhone', label: 'Customer Phone', type: 'text' },
      { name: 'successUrl', label: 'Success URL', type: 'text', required: true },
      { name: 'failUrl', label: 'Fail URL', type: 'text', required: true },
      { name: 'cancelUrl', label: 'Cancel URL', type: 'text' },
      { name: 'credential', label: 'AamarPay Credentials', type: 'credential', required: true },
    ],
  },
  {
    type: 'aamarpay-verify',
    displayName: 'AamarPay Verify',
    category: 'Payments',
    description: 'Verify AamarPay transaction status',
    icon: 'CheckCircle',
    color: '#1976D2',
    inputs: [{ name: 'trigger', type: 'any' }],
    outputs: [{ name: 'verified', type: 'object' }, { name: 'failed', type: 'object' }],
    configSchema: [
      { name: 'transactionId', label: 'Transaction ID', type: 'text', required: true },
      { name: 'credential', label: 'AamarPay Credentials', type: 'credential', required: true },
    ],
  },

  // ============================================================
  // PAYMENT TRIGGERS
  // ============================================================
  {
    type: 'payment-webhook-trigger',
    displayName: 'Payment Webhook',
    category: 'Payments',
    description: 'Trigger workflow on payment gateway webhook',
    icon: 'Webhook',
    color: '#00897B',
    inputs: [],
    outputs: [{ name: 'payment', type: 'object' }],
    configSchema: [
      { name: 'gateway', label: 'Payment Gateway', type: 'select', options: [
        { label: 'bKash', value: 'bkash' },
        { label: 'Nagad', value: 'nagad' },
        { label: 'SSLCommerz', value: 'sslcommerz' },
        { label: 'Rocket', value: 'rocket' },
        { label: 'AamarPay', value: 'aamarpay' },
        { label: 'Stripe', value: 'stripe' },
      ]},
      { name: 'events', label: 'Events', type: 'select', options: [
        { label: 'Payment Successful', value: 'payment.success' },
        { label: 'Payment Failed', value: 'payment.failed' },
        { label: 'Refund Processed', value: 'refund.processed' },
        { label: 'All Events', value: 'all' },
      ]},
      { name: 'webhookSecret', label: 'Webhook Secret', type: 'credential' },
    ],
  },

  // ============================================================
  // STRIPE (INTERNATIONAL FALLBACK)
  // ============================================================
  {
    type: 'stripe-payment',
    displayName: 'Stripe Payment',
    category: 'Payments',
    description: 'Create Stripe payment intent or checkout session',
    icon: 'Stripe',
    color: '#635BFF',
    inputs: [{ name: 'trigger', type: 'any' }],
    outputs: [{ name: 'paymentIntent', type: 'object' }, { name: 'error', type: 'object' }],
    configSchema: [
      { name: 'mode', label: 'Mode', type: 'select', options: [{ label: 'Payment Intent', value: 'intent' }, { label: 'Checkout Session', value: 'checkout' }] },
      { name: 'amount', label: 'Amount (cents)', type: 'text', required: true },
      { name: 'currency', label: 'Currency', type: 'text', defaultValue: 'usd' },
      { name: 'description', label: 'Description', type: 'text' },
      { name: 'customerEmail', label: 'Customer Email', type: 'text' },
      { name: 'successUrl', label: 'Success URL', type: 'text', description: 'Required for checkout session' },
      { name: 'cancelUrl', label: 'Cancel URL', type: 'text' },
      { name: 'credential', label: 'Stripe API Key', type: 'credential', required: true },
    ],
  },
  {
    type: 'stripe-subscription',
    displayName: 'Stripe Subscription',
    category: 'Payments',
    description: 'Create or manage Stripe subscriptions',
    icon: 'Stripe',
    color: '#635BFF',
    inputs: [{ name: 'trigger', type: 'any' }],
    outputs: [{ name: 'subscription', type: 'object' }, { name: 'error', type: 'object' }],
    configSchema: [
      { name: 'operation', label: 'Operation', type: 'select', options: [
        { label: 'Create Subscription', value: 'create' },
        { label: 'Update Subscription', value: 'update' },
        { label: 'Cancel Subscription', value: 'cancel' },
        { label: 'Get Subscription', value: 'get' },
      ]},
      { name: 'customerId', label: 'Customer ID', type: 'text', required: true },
      { name: 'priceId', label: 'Price ID', type: 'text', description: 'Required for create' },
      { name: 'subscriptionId', label: 'Subscription ID', type: 'text', description: 'Required for update/cancel/get' },
      { name: 'credential', label: 'Stripe API Key', type: 'credential', required: true },
    ],
  },
  {
    type: 'stripe-customer',
    displayName: 'Stripe Customer',
    category: 'Payments',
    description: 'Create or manage Stripe customers',
    icon: 'Stripe',
    color: '#635BFF',
    inputs: [{ name: 'trigger', type: 'any' }],
    outputs: [{ name: 'customer', type: 'object' }, { name: 'error', type: 'object' }],
    configSchema: [
      { name: 'operation', label: 'Operation', type: 'select', options: [
        { label: 'Create Customer', value: 'create' },
        { label: 'Update Customer', value: 'update' },
        { label: 'Get Customer', value: 'get' },
        { label: 'Delete Customer', value: 'delete' },
      ]},
      { name: 'email', label: 'Email', type: 'text' },
      { name: 'name', label: 'Name', type: 'text' },
      { name: 'customerId', label: 'Customer ID', type: 'text', description: 'Required for update/get/delete' },
      { name: 'metadata', label: 'Metadata', type: 'json' },
      { name: 'credential', label: 'Stripe API Key', type: 'credential', required: true },
    ],
  },
];

// Add Payments to category colors
export const PAYMENT_CATEGORY_COLOR = '#00897B';
