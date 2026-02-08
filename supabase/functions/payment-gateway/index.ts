import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PaymentRequest {
  gateway: 'sslcommerz' | 'bkash' | 'nagad';
  action: 'initiate' | 'validate' | 'refund' | 'query';
  amount?: number;
  currency?: string;
  transactionId?: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  successUrl?: string;
  failUrl?: string;
  cancelUrl?: string;
  // For validation/refund/query
  validationId?: string;
  paymentId?: string;
  refundAmount?: number;
  refundReason?: string;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const payload: PaymentRequest = await req.json();
    const { gateway, action } = payload;

    // Get credentials from environment (set via Supabase secrets)
    const sslStoreId = Deno.env.get('SSLCOMMERZ_STORE_ID');
    const sslStorePassword = Deno.env.get('SSLCOMMERZ_STORE_PASSWORD');
    const sslSandbox = Deno.env.get('SSLCOMMERZ_SANDBOX') === 'true';
    
    const bkashAppKey = Deno.env.get('BKASH_APP_KEY');
    const bkashAppSecret = Deno.env.get('BKASH_APP_SECRET');
    const bkashUsername = Deno.env.get('BKASH_USERNAME');
    const bkashPassword = Deno.env.get('BKASH_PASSWORD');
    const bkashSandbox = Deno.env.get('BKASH_SANDBOX') === 'true';

    const nagadMerchantId = Deno.env.get('NAGAD_MERCHANT_ID');
    const nagadMerchantNumber = Deno.env.get('NAGAD_MERCHANT_NUMBER');
    const nagadPrivateKey = Deno.env.get('NAGAD_PRIVATE_KEY');
    const nagadSandbox = Deno.env.get('NAGAD_SANDBOX') === 'true';

    let result: unknown;

    switch (gateway) {
      case 'sslcommerz':
        result = await handleSSLCommerz(payload, {
          storeId: sslStoreId || '',
          storePassword: sslStorePassword || '',
          sandbox: sslSandbox,
        });
        break;

      case 'bkash':
        result = await handleBKash(payload, {
          appKey: bkashAppKey || '',
          appSecret: bkashAppSecret || '',
          username: bkashUsername || '',
          password: bkashPassword || '',
          sandbox: bkashSandbox,
        });
        break;

      case 'nagad':
        result = await handleNagad(payload, {
          merchantId: nagadMerchantId || '',
          merchantNumber: nagadMerchantNumber || '',
          privateKey: nagadPrivateKey || '',
          sandbox: nagadSandbox,
        });
        break;

      default:
        throw new Error(`Unsupported gateway: ${gateway}`);
    }

    return new Response(JSON.stringify({ success: true, data: result }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Payment gateway error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

// SSLCommerz Handler
async function handleSSLCommerz(
  payload: PaymentRequest,
  credentials: { storeId: string; storePassword: string; sandbox: boolean }
) {
  const baseUrl = credentials.sandbox
    ? 'https://sandbox.sslcommerz.com'
    : 'https://securepay.sslcommerz.com';

  switch (payload.action) {
    case 'initiate': {
      const formData = new URLSearchParams();
      formData.append('store_id', credentials.storeId);
      formData.append('store_passwd', credentials.storePassword);
      formData.append('total_amount', String(payload.amount || 0));
      formData.append('currency', payload.currency || 'BDT');
      formData.append('tran_id', payload.transactionId || `TXN_${Date.now()}`);
      formData.append('success_url', payload.successUrl || '');
      formData.append('fail_url', payload.failUrl || '');
      formData.append('cancel_url', payload.cancelUrl || '');
      formData.append('cus_name', payload.customerName || 'Customer');
      formData.append('cus_email', payload.customerEmail || 'customer@example.com');
      formData.append('cus_phone', payload.customerPhone || '01700000000');
      formData.append('cus_add1', 'Dhaka');
      formData.append('cus_city', 'Dhaka');
      formData.append('cus_country', 'Bangladesh');
      formData.append('shipping_method', 'NO');
      formData.append('product_name', 'BiztoriBD Subscription');
      formData.append('product_category', 'Digital Services');
      formData.append('product_profile', 'non-physical-goods');

      const response = await fetch(`${baseUrl}/gwprocess/v4/api.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: formData.toString(),
      });

      return await response.json();
    }

    case 'validate': {
      const response = await fetch(
        `${baseUrl}/validator/api/validationserverAPI.php?val_id=${payload.validationId}&store_id=${credentials.storeId}&store_passwd=${credentials.storePassword}&format=json`
      );
      return await response.json();
    }

    case 'refund': {
      const formData = new URLSearchParams();
      formData.append('store_id', credentials.storeId);
      formData.append('store_passwd', credentials.storePassword);
      formData.append('bank_tran_id', payload.transactionId || '');
      formData.append('refund_amount', String(payload.refundAmount || 0));
      formData.append('refund_remarks', payload.refundReason || 'Customer requested refund');

      const response = await fetch(`${baseUrl}/validator/api/merchantTransIDvalidationAPI.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: formData.toString(),
      });
      return await response.json();
    }

    case 'query': {
      const response = await fetch(
        `${baseUrl}/validator/api/merchantTransIDvalidationAPI.php?tran_id=${payload.transactionId}&store_id=${credentials.storeId}&store_passwd=${credentials.storePassword}&format=json`
      );
      return await response.json();
    }

    default:
      throw new Error(`Unsupported SSLCommerz action: ${payload.action}`);
  }
}

// bKash Handler
async function handleBKash(
  payload: PaymentRequest,
  credentials: { appKey: string; appSecret: string; username: string; password: string; sandbox: boolean }
) {
  const baseUrl = credentials.sandbox
    ? 'https://tokenized.sandbox.bka.sh/v1.2.0-beta/tokenized/checkout'
    : 'https://tokenized.pay.bka.sh/v1.2.0-beta/tokenized/checkout';

  // First, get grant token
  const grantResponse = await fetch(`${baseUrl}/token/grant`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'username': credentials.username,
      'password': credentials.password,
    },
    body: JSON.stringify({
      app_key: credentials.appKey,
      app_secret: credentials.appSecret,
    }),
  });

  const grantData = await grantResponse.json();
  const idToken = grantData.id_token;

  if (!idToken) {
    throw new Error('Failed to get bKash token');
  }

  switch (payload.action) {
    case 'initiate': {
      const response = await fetch(`${baseUrl}/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': idToken,
          'X-APP-Key': credentials.appKey,
        },
        body: JSON.stringify({
          mode: '0011',
          payerReference: payload.transactionId,
          callbackURL: payload.successUrl,
          amount: String(payload.amount),
          currency: 'BDT',
          intent: 'sale',
          merchantInvoiceNumber: payload.transactionId,
        }),
      });
      return await response.json();
    }

    case 'validate': {
      const response = await fetch(`${baseUrl}/execute`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': idToken,
          'X-APP-Key': credentials.appKey,
        },
        body: JSON.stringify({
          paymentID: payload.paymentId,
        }),
      });
      return await response.json();
    }

    case 'query': {
      const response = await fetch(`${baseUrl}/payment/status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': idToken,
          'X-APP-Key': credentials.appKey,
        },
        body: JSON.stringify({
          paymentID: payload.paymentId,
        }),
      });
      return await response.json();
    }

    case 'refund': {
      const response = await fetch(`${baseUrl}/payment/refund`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': idToken,
          'X-APP-Key': credentials.appKey,
        },
        body: JSON.stringify({
          paymentID: payload.paymentId,
          amount: String(payload.refundAmount),
          trxID: payload.transactionId,
          sku: 'refund',
          reason: payload.refundReason || 'Customer requested',
        }),
      });
      return await response.json();
    }

    default:
      throw new Error(`Unsupported bKash action: ${payload.action}`);
  }
}

// Nagad Handler
async function handleNagad(
  payload: PaymentRequest,
  credentials: { merchantId: string; merchantNumber: string; privateKey: string; sandbox: boolean }
) {
  const baseUrl = credentials.sandbox
    ? 'http://sandbox.mynagad.com:10080/remote-payment-gateway-1.0/api/dfs'
    : 'https://api.mynagad.com/api/dfs';

  // Nagad requires RSA encryption for sensitive data
  // This is a simplified version - production would need proper crypto
  
  switch (payload.action) {
    case 'initiate': {
      const orderId = payload.transactionId || `ORD_${Date.now()}`;
      const dateTime = new Date().toISOString().replace('T', ' ').substring(0, 19);
      
      // Initialize checkout
      const initResponse = await fetch(
        `${baseUrl}/check-out/initialize/${credentials.merchantId}/${orderId}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-KM-IP-V4': '127.0.0.1',
            'X-KM-Client-Type': 'PC_WEB',
            'X-KM-Api-Version': 'v-0.2.0',
          },
          body: JSON.stringify({
            merchantId: credentials.merchantId,
            datetime: dateTime,
            orderId: orderId,
            challenge: generateRandomString(40),
          }),
        }
      );

      const initData = await initResponse.json();
      
      if (initData.sensitiveData) {
        // Complete the checkout
        const completeResponse = await fetch(
          `${baseUrl}/check-out/complete/${initData.paymentReferenceId}`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-KM-IP-V4': '127.0.0.1',
              'X-KM-Client-Type': 'PC_WEB',
              'X-KM-Api-Version': 'v-0.2.0',
            },
            body: JSON.stringify({
              merchantId: credentials.merchantId,
              orderId: orderId,
              currencyCode: '050',
              amount: String(payload.amount),
              challenge: initData.challenge,
            }),
          }
        );
        
        return await completeResponse.json();
      }
      
      return initData;
    }

    case 'validate': {
      const response = await fetch(
        `${baseUrl}/verify/payment/${payload.paymentId}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'X-KM-IP-V4': '127.0.0.1',
            'X-KM-Client-Type': 'PC_WEB',
            'X-KM-Api-Version': 'v-0.2.0',
          },
        }
      );
      return await response.json();
    }

    default:
      throw new Error(`Unsupported Nagad action: ${payload.action}`);
  }
}

function generateRandomString(length: number): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}
