// ============================================================
// BANGLADESH-SPECIFIC SERVICE NODES
// Pathao, eCourier, Steadfast, BulkSMS BD, Banglalink SMS,
// Bangladesh Bank, Upay, Tap, local e-commerce platforms
// ============================================================

import { NodeDefinition } from '@/types/nodes';

export const bangladeshNodes: NodeDefinition[] = [
  // ============================================================
  // PATHAO (Ride-sharing & Delivery)
  // ============================================================
  {
    type: 'pathao-delivery',
    displayName: 'Pathao Delivery',
    category: 'E-Commerce',
    description: 'Create Pathao courier delivery order',
    icon: 'Truck',
    color: '#00B140',
    inputs: [{ name: 'trigger', type: 'any' }],
    outputs: [{ name: 'order', type: 'object' }, { name: 'error', type: 'object' }],
    configSchema: [
      { name: 'recipientName', label: 'Recipient Name', type: 'text', required: true, placeholder: '{{ $json.customerName }}' },
      { name: 'recipientPhone', label: 'Recipient Phone', type: 'text', required: true, placeholder: '{{ $json.phone }}' },
      { name: 'recipientAddress', label: 'Delivery Address', type: 'textarea', required: true },
      { name: 'recipientCity', label: 'City', type: 'select', options: [
        { label: 'Dhaka', value: '1' }, { label: 'Chittagong', value: '2' }, { label: 'Rajshahi', value: '3' },
        { label: 'Khulna', value: '4' }, { label: 'Sylhet', value: '5' }, { label: 'Rangpur', value: '6' },
        { label: 'Barisal', value: '7' }, { label: 'Mymensingh', value: '8' },
      ]},
      { name: 'recipientZone', label: 'Zone ID', type: 'text' },
      { name: 'recipientArea', label: 'Area ID', type: 'text' },
      { name: 'deliveryType', label: 'Delivery Type', type: 'select', options: [
        { label: 'Normal', value: '48' }, { label: 'Same Day', value: '12' },
      ], defaultValue: '48' },
      { name: 'itemType', label: 'Item Type', type: 'select', options: [
        { label: 'Parcel', value: '2' }, { label: 'Document', value: '1' },
      ], defaultValue: '2' },
      { name: 'itemQuantity', label: 'Quantity', type: 'number', defaultValue: 1 },
      { name: 'itemWeight', label: 'Weight (kg)', type: 'number', defaultValue: 0.5 },
      { name: 'amountToCollect', label: 'COD Amount (BDT)', type: 'text', placeholder: '{{ $json.total }}' },
      { name: 'specialInstruction', label: 'Special Instructions', type: 'textarea' },
      { name: 'credential', label: 'Pathao API Credentials', type: 'credential', required: true },
    ],
  },
  {
    type: 'pathao-track',
    displayName: 'Pathao Track Order',
    category: 'E-Commerce',
    description: 'Track Pathao delivery order status',
    icon: 'MapPin',
    color: '#00B140',
    inputs: [{ name: 'trigger', type: 'any' }],
    outputs: [{ name: 'status', type: 'object' }],
    configSchema: [
      { name: 'consignmentId', label: 'Consignment ID', type: 'text', required: true, placeholder: '{{ $json.pathaoOrderId }}' },
      { name: 'credential', label: 'Pathao API Credentials', type: 'credential', required: true },
    ],
  },
  {
    type: 'pathao-price',
    displayName: 'Pathao Price Calculate',
    category: 'E-Commerce',
    description: 'Calculate Pathao delivery price',
    icon: 'Calculator',
    color: '#00B140',
    inputs: [{ name: 'trigger', type: 'any' }],
    outputs: [{ name: 'price', type: 'object' }],
    configSchema: [
      { name: 'storeId', label: 'Store ID', type: 'text', required: true },
      { name: 'itemType', label: 'Item Type', type: 'select', options: [
        { label: 'Parcel', value: '2' }, { label: 'Document', value: '1' },
      ] },
      { name: 'deliveryType', label: 'Delivery Type', type: 'select', options: [
        { label: 'Normal', value: '48' }, { label: 'Same Day', value: '12' },
      ] },
      { name: 'itemWeight', label: 'Weight (kg)', type: 'number', defaultValue: 0.5 },
      { name: 'recipientCityId', label: 'Recipient City ID', type: 'text', required: true },
      { name: 'recipientZoneId', label: 'Recipient Zone ID', type: 'text', required: true },
      { name: 'credential', label: 'Pathao API Credentials', type: 'credential', required: true },
    ],
  },

  // ============================================================
  // eCOURIER
  // ============================================================
  {
    type: 'ecourier-order',
    displayName: 'eCourier Order',
    category: 'E-Commerce',
    description: 'Create eCourier delivery order',
    icon: 'Package',
    color: '#FF5722',
    inputs: [{ name: 'trigger', type: 'any' }],
    outputs: [{ name: 'order', type: 'object' }, { name: 'error', type: 'object' }],
    configSchema: [
      { name: 'recipientName', label: 'Recipient Name', type: 'text', required: true },
      { name: 'recipientMobile', label: 'Recipient Mobile', type: 'text', required: true },
      { name: 'recipientAddress', label: 'Delivery Address', type: 'textarea', required: true },
      { name: 'recipientCity', label: 'City', type: 'text', required: true },
      { name: 'recipientThana', label: 'Thana', type: 'text' },
      { name: 'recipientPostcode', label: 'Postcode', type: 'text' },
      { name: 'packageCode', label: 'Package Code', type: 'text' },
      { name: 'productPrice', label: 'Product Price', type: 'text' },
      { name: 'paymentMethod', label: 'Payment Method', type: 'select', options: [
        { label: 'COD', value: 'COD' }, { label: 'Prepaid', value: 'PREPAID' },
      ], defaultValue: 'COD' },
      { name: 'comments', label: 'Comments', type: 'textarea' },
      { name: 'credential', label: 'eCourier API Credentials', type: 'credential', required: true },
    ],
  },
  {
    type: 'ecourier-track',
    displayName: 'eCourier Track',
    category: 'E-Commerce',
    description: 'Track eCourier package status',
    icon: 'MapPin',
    color: '#FF5722',
    inputs: [{ name: 'trigger', type: 'any' }],
    outputs: [{ name: 'tracking', type: 'object' }],
    configSchema: [
      { name: 'trackingId', label: 'Tracking ID', type: 'text', required: true },
      { name: 'credential', label: 'eCourier API Credentials', type: 'credential', required: true },
    ],
  },

  // ============================================================
  // STEADFAST COURIER
  // ============================================================
  {
    type: 'steadfast-order',
    displayName: 'Steadfast Order',
    category: 'E-Commerce',
    description: 'Create Steadfast courier delivery',
    icon: 'Truck',
    color: '#0D47A1',
    inputs: [{ name: 'trigger', type: 'any' }],
    outputs: [{ name: 'order', type: 'object' }, { name: 'error', type: 'object' }],
    configSchema: [
      { name: 'invoiceId', label: 'Invoice ID', type: 'text', required: true },
      { name: 'recipientName', label: 'Recipient Name', type: 'text', required: true },
      { name: 'recipientPhone', label: 'Recipient Phone', type: 'text', required: true },
      { name: 'recipientAddress', label: 'Recipient Address', type: 'textarea', required: true },
      { name: 'codAmount', label: 'COD Amount (BDT)', type: 'text', required: true },
      { name: 'note', label: 'Note', type: 'textarea' },
      { name: 'credential', label: 'Steadfast Credentials', type: 'credential', required: true },
    ],
  },
  {
    type: 'steadfast-track',
    displayName: 'Steadfast Track',
    category: 'E-Commerce',
    description: 'Track Steadfast delivery status',
    icon: 'MapPin',
    color: '#0D47A1',
    inputs: [{ name: 'trigger', type: 'any' }],
    outputs: [{ name: 'status', type: 'object' }],
    configSchema: [
      { name: 'consignmentId', label: 'Consignment ID', type: 'text', required: true },
      { name: 'credential', label: 'Steadfast Credentials', type: 'credential', required: true },
    ],
  },
  {
    type: 'steadfast-bulk',
    displayName: 'Steadfast Bulk Order',
    category: 'E-Commerce',
    description: 'Create multiple Steadfast delivery orders',
    icon: 'Layers',
    color: '#0D47A1',
    inputs: [{ name: 'trigger', type: 'any' }],
    outputs: [{ name: 'results', type: 'array' }, { name: 'errors', type: 'array' }],
    configSchema: [
      { name: 'orders', label: 'Orders Array', type: 'json', required: true, description: 'Array of order objects with recipientName, recipientPhone, recipientAddress, codAmount' },
      { name: 'credential', label: 'Steadfast Credentials', type: 'credential', required: true },
    ],
  },

  // ============================================================
  // REDX COURIER
  // ============================================================
  {
    type: 'redx-order',
    displayName: 'RedX Order',
    category: 'E-Commerce',
    description: 'Create RedX delivery order',
    icon: 'Package',
    color: '#D32F2F',
    inputs: [{ name: 'trigger', type: 'any' }],
    outputs: [{ name: 'order', type: 'object' }, { name: 'error', type: 'object' }],
    configSchema: [
      { name: 'customerName', label: 'Customer Name', type: 'text', required: true },
      { name: 'customerPhone', label: 'Customer Phone', type: 'text', required: true },
      { name: 'deliveryArea', label: 'Delivery Area', type: 'text', required: true },
      { name: 'deliveryAddress', label: 'Delivery Address', type: 'textarea', required: true },
      { name: 'merchantInvoiceId', label: 'Invoice ID', type: 'text' },
      { name: 'cashCollectionAmount', label: 'Cash Collection (BDT)', type: 'text' },
      { name: 'parcelWeight', label: 'Weight (gm)', type: 'number', defaultValue: 500 },
      { name: 'instruction', label: 'Instruction', type: 'textarea' },
      { name: 'credential', label: 'RedX API Token', type: 'credential', required: true },
    ],
  },

  // ============================================================
  // BANGLADESH SMS GATEWAYS
  // ============================================================
  {
    type: 'bulksms-bd',
    displayName: 'BulkSMS BD',
    category: 'Communication',
    description: 'Send SMS via BulkSMS Bangladesh',
    icon: 'MessageSquare',
    color: '#4CAF50',
    inputs: [{ name: 'trigger', type: 'any' }],
    outputs: [{ name: 'sent', type: 'object' }, { name: 'error', type: 'object' }],
    configSchema: [
      { name: 'to', label: 'Phone Number', type: 'text', required: true, placeholder: '01XXXXXXXXX' },
      { name: 'message', label: 'Message', type: 'textarea', required: true },
      { name: 'senderId', label: 'Sender ID', type: 'text', description: 'Masking name (if approved)' },
      { name: 'credential', label: 'BulkSMS BD Credentials', type: 'credential', required: true },
    ],
  },
  {
    type: 'sms-bd-bulk',
    displayName: 'Bulk SMS Send',
    category: 'Communication',
    description: 'Send bulk SMS to multiple numbers in Bangladesh',
    icon: 'Send',
    color: '#4CAF50',
    inputs: [{ name: 'trigger', type: 'any' }],
    outputs: [{ name: 'results', type: 'array' }, { name: 'errors', type: 'array' }],
    configSchema: [
      { name: 'numbers', label: 'Phone Numbers', type: 'textarea', required: true, description: 'Comma-separated or one per line', placeholder: '01711XXXXXX, 01812XXXXXX' },
      { name: 'message', label: 'Message', type: 'textarea', required: true },
      { name: 'senderId', label: 'Sender ID', type: 'text' },
      { name: 'scheduleTime', label: 'Schedule (optional)', type: 'text', placeholder: 'YYYY-MM-DD HH:mm:ss' },
      { name: 'credential', label: 'SMS Gateway Credentials', type: 'credential', required: true },
    ],
  },
  {
    type: 'sslsms',
    displayName: 'SSL Wireless SMS',
    category: 'Communication',
    description: 'Send SMS via SSL Wireless (Bangladesh)',
    icon: 'MessageSquare',
    color: '#1B5E20',
    inputs: [{ name: 'trigger', type: 'any' }],
    outputs: [{ name: 'sent', type: 'object' }, { name: 'error', type: 'object' }],
    configSchema: [
      { name: 'msisdn', label: 'Phone Number', type: 'text', required: true, placeholder: '88017XXXXXXXX' },
      { name: 'sms', label: 'SMS Body', type: 'textarea', required: true },
      { name: 'csmsId', label: 'Reference ID', type: 'text' },
      { name: 'credential', label: 'SSL Wireless API Key', type: 'credential', required: true },
    ],
  },

  // ============================================================
  // DARAZ (E-COMMERCE MARKETPLACE)
  // ============================================================
  {
    type: 'daraz-get-orders',
    displayName: 'Daraz Get Orders',
    category: 'E-Commerce',
    description: 'Fetch orders from Daraz seller center',
    icon: 'ShoppingCart',
    color: '#F85606',
    inputs: [{ name: 'trigger', type: 'any' }],
    outputs: [{ name: 'orders', type: 'array' }],
    configSchema: [
      { name: 'status', label: 'Order Status', type: 'select', options: [
        { label: 'All', value: 'all' }, { label: 'Pending', value: 'pending' },
        { label: 'Ready to Ship', value: 'ready_to_ship' }, { label: 'Shipped', value: 'shipped' },
        { label: 'Delivered', value: 'delivered' }, { label: 'Cancelled', value: 'cancelled' },
      ] },
      { name: 'createdAfter', label: 'Created After', type: 'text', placeholder: '2024-01-01T00:00:00+06:00' },
      { name: 'limit', label: 'Limit', type: 'number', defaultValue: 50 },
      { name: 'offset', label: 'Offset', type: 'number', defaultValue: 0 },
      { name: 'credential', label: 'Daraz API Credentials', type: 'credential', required: true },
    ],
  },
  {
    type: 'daraz-get-products',
    displayName: 'Daraz Get Products',
    category: 'E-Commerce',
    description: 'Fetch products from Daraz seller center',
    icon: 'Package',
    color: '#F85606',
    inputs: [{ name: 'trigger', type: 'any' }],
    outputs: [{ name: 'products', type: 'array' }],
    configSchema: [
      { name: 'filter', label: 'Filter', type: 'select', options: [
        { label: 'All', value: 'all' }, { label: 'Live', value: 'live' },
        { label: 'Inactive', value: 'inactive' }, { label: 'Deleted', value: 'deleted' },
      ] },
      { name: 'search', label: 'Search', type: 'text' },
      { name: 'limit', label: 'Limit', type: 'number', defaultValue: 50 },
      { name: 'credential', label: 'Daraz API Credentials', type: 'credential', required: true },
    ],
  },
  {
    type: 'daraz-update-stock',
    displayName: 'Daraz Update Stock',
    category: 'E-Commerce',
    description: 'Update product stock on Daraz',
    icon: 'RefreshCw',
    color: '#F85606',
    inputs: [{ name: 'trigger', type: 'any' }],
    outputs: [{ name: 'result', type: 'object' }, { name: 'error', type: 'object' }],
    configSchema: [
      { name: 'sellerSku', label: 'Seller SKU', type: 'text', required: true },
      { name: 'quantity', label: 'New Quantity', type: 'number', required: true },
      { name: 'price', label: 'New Price (optional)', type: 'number' },
      { name: 'credential', label: 'Daraz API Credentials', type: 'credential', required: true },
    ],
  },

  // ============================================================
  // UPAY
  // ============================================================
  {
    type: 'upay-payment',
    displayName: 'Upay Payment',
    category: 'Payments',
    description: 'Initiate Upay mobile wallet payment',
    icon: 'Wallet',
    color: '#673AB7',
    inputs: [{ name: 'trigger', type: 'any' }],
    outputs: [{ name: 'success', type: 'object' }, { name: 'error', type: 'object' }],
    configSchema: [
      { name: 'amount', label: 'Amount (BDT)', type: 'text', required: true },
      { name: 'invoiceId', label: 'Invoice ID', type: 'text', required: true },
      { name: 'callbackUrl', label: 'Callback URL', type: 'text' },
      { name: 'credential', label: 'Upay Credentials', type: 'credential', required: true },
    ],
  },

  // ============================================================
  // TAP (LOCAL PAYMENTS)
  // ============================================================
  {
    type: 'tap-payment',
    displayName: 'Tap Payment',
    category: 'Payments',
    description: 'Initiate Tap digital payment',
    icon: 'CreditCard',
    color: '#2979FF',
    inputs: [{ name: 'trigger', type: 'any' }],
    outputs: [{ name: 'success', type: 'object' }, { name: 'error', type: 'object' }],
    configSchema: [
      { name: 'amount', label: 'Amount', type: 'text', required: true },
      { name: 'currency', label: 'Currency', type: 'select', options: [{ label: 'BDT', value: 'BDT' }, { label: 'USD', value: 'USD' }], defaultValue: 'BDT' },
      { name: 'description', label: 'Description', type: 'text' },
      { name: 'customerEmail', label: 'Customer Email', type: 'text' },
      { name: 'customerPhone', label: 'Customer Phone', type: 'text' },
      { name: 'redirectUrl', label: 'Redirect URL', type: 'text' },
      { name: 'credential', label: 'Tap API Key', type: 'credential', required: true },
    ],
  },

  // ============================================================
  // BANGLADESH BANK / GOVT SERVICES
  // ============================================================
  {
    type: 'bd-nid-verify',
    displayName: 'BD NID Verify',
    category: 'Security',
    description: 'Verify Bangladesh National ID (NID)',
    icon: 'Shield',
    color: '#006A4E',
    inputs: [{ name: 'trigger', type: 'any' }],
    outputs: [{ name: 'verified', type: 'object' }, { name: 'failed', type: 'object' }],
    configSchema: [
      { name: 'nidNumber', label: 'NID Number', type: 'text', required: true },
      { name: 'dateOfBirth', label: 'Date of Birth', type: 'text', required: true, placeholder: 'YYYY-MM-DD' },
      { name: 'credential', label: 'NID Verification API', type: 'credential', required: true },
    ],
  },
  {
    type: 'bd-tin-verify',
    displayName: 'BD TIN Verify',
    category: 'Security',
    description: 'Verify Bangladesh Tax Identification Number',
    icon: 'FileCheck',
    color: '#006A4E',
    inputs: [{ name: 'trigger', type: 'any' }],
    outputs: [{ name: 'result', type: 'object' }],
    configSchema: [
      { name: 'tinNumber', label: 'TIN Number', type: 'text', required: true },
      { name: 'credential', label: 'NBR API Credentials', type: 'credential', required: true },
    ],
  },

  // ============================================================
  // BENGALI LANGUAGE / LOCAL TOOLS
  // ============================================================
  {
    type: 'bangla-sms-template',
    displayName: 'Bangla SMS Template',
    category: 'Communication',
    description: 'Format SMS with Bengali Unicode support',
    icon: 'FileText',
    color: '#006A4E',
    inputs: [{ name: 'trigger', type: 'any' }],
    outputs: [{ name: 'formatted', type: 'object' }],
    configSchema: [
      { name: 'template', label: 'Template', type: 'textarea', required: true, placeholder: 'প্রিয় {{name}}, আপনার অর্ডার #{{orderId}} সফলভাবে গ্রহণ করা হয়েছে।' },
      { name: 'variables', label: 'Variables (JSON)', type: 'json', placeholder: '{"name": "রহিম", "orderId": "12345"}' },
      { name: 'encoding', label: 'Encoding', type: 'select', options: [
        { label: 'Unicode (Bangla)', value: 'unicode' }, { label: 'ASCII (English)', value: 'ascii' },
      ], defaultValue: 'unicode' },
    ],
  },
  {
    type: 'bd-district-lookup',
    displayName: 'BD District Lookup',
    category: 'Data Manipulation',
    description: 'Lookup Bangladesh district, upazila, and union data',
    icon: 'MapPin',
    color: '#006A4E',
    inputs: [{ name: 'trigger', type: 'any' }],
    outputs: [{ name: 'result', type: 'object' }],
    configSchema: [
      { name: 'lookupType', label: 'Lookup Type', type: 'select', options: [
        { label: 'All Districts', value: 'districts' },
        { label: 'Upazilas by District', value: 'upazilas' },
        { label: 'Unions by Upazila', value: 'unions' },
        { label: 'Postcode Lookup', value: 'postcode' },
      ] },
      { name: 'districtId', label: 'District ID', type: 'text' },
      { name: 'upazilaId', label: 'Upazila ID', type: 'text' },
      { name: 'postcode', label: 'Postcode', type: 'text' },
    ],
  },
];
