import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { 
  Copy, Key, Zap, List, CheckCircle, AlertTriangle, 
  Shield, Clock, Code, BookOpen, Terminal, Globe,
  FileJson, Lock, Activity, ArrowRight, ExternalLink,
  Download, ShoppingBag, ShoppingCart, Plug
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const API_BASE_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/public-api`;

// Comprehensive endpoint definitions with detailed documentation
const endpoints = [
  {
    method: "GET",
    path: "/health",
    description: "Check API status and connectivity",
    summary: "Returns the current health status of the API. Use this endpoint to verify your API key is working and the service is available.",
    auth: true,
    permissions: ["read"],
    rateLimit: "No limit",
    response: `{
  "status": "ok",
  "timestamp": "2024-01-15T10:30:00.000Z"
}`,
    responseFields: [
      { name: "status", type: "string", description: "API health status. Will be 'ok' if the service is running normally." },
      { name: "timestamp", type: "string (ISO 8601)", description: "Current server timestamp in UTC." },
    ],
  },
  {
    method: "GET",
    path: "/workflows",
    description: "List all workflows accessible to your API key",
    summary: "Retrieves a paginated list of all workflows in workspaces accessible to your API key. Supports filtering and pagination.",
    auth: true,
    permissions: ["read"],
    rateLimit: "100 requests/hour",
    params: [
      { name: "page", type: "integer", required: false, default: "1", description: "Page number for pagination. Must be >= 1." },
      { name: "limit", type: "integer", required: false, default: "20", description: "Number of items per page. Min: 1, Max: 100." },
    ],
    response: `{
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "Email Notification Workflow",
      "description": "Sends automated email notifications",
      "is_active": true,
      "tags": ["automation", "email", "notifications"],
      "version": 3,
      "created_at": "2024-01-10T08:00:00.000Z",
      "updated_at": "2024-01-15T10:30:00.000Z"
    },
    {
      "id": "660f9511-f30c-52e5-b827-557766551111",
      "name": "Data Sync Pipeline",
      "description": "Syncs data between systems",
      "is_active": false,
      "tags": ["data", "sync"],
      "version": 1,
      "created_at": "2024-01-12T14:00:00.000Z",
      "updated_at": "2024-01-12T14:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "totalPages": 3
  }
}`,
    responseFields: [
      { name: "data", type: "array", description: "Array of workflow objects." },
      { name: "data[].id", type: "string (UUID)", description: "Unique identifier for the workflow." },
      { name: "data[].name", type: "string", description: "Human-readable name of the workflow." },
      { name: "data[].description", type: "string | null", description: "Optional description of what the workflow does." },
      { name: "data[].is_active", type: "boolean", description: "Whether the workflow is currently active and can be executed." },
      { name: "data[].tags", type: "array<string>", description: "Array of tags for categorization." },
      { name: "data[].version", type: "integer", description: "Version number, incremented on each update." },
      { name: "data[].created_at", type: "string (ISO 8601)", description: "Timestamp when the workflow was created." },
      { name: "data[].updated_at", type: "string (ISO 8601)", description: "Timestamp when the workflow was last modified." },
      { name: "pagination", type: "object", description: "Pagination metadata." },
      { name: "pagination.page", type: "integer", description: "Current page number." },
      { name: "pagination.limit", type: "integer", description: "Number of items per page." },
      { name: "pagination.total", type: "integer", description: "Total number of workflows." },
      { name: "pagination.totalPages", type: "integer", description: "Total number of pages." },
    ],
  },
  {
    method: "GET",
    path: "/workflows/:id",
    description: "Get a specific workflow by ID",
    summary: "Retrieves detailed information about a single workflow. Use this to get the current state of a workflow before executing it.",
    auth: true,
    permissions: ["read"],
    rateLimit: "100 requests/hour",
    pathParams: [
      { name: "id", type: "string (UUID)", required: true, description: "The unique identifier of the workflow." },
    ],
    response: `{
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "Email Notification Workflow",
    "description": "Sends automated email notifications based on triggers",
    "is_active": true,
    "tags": ["automation", "email", "notifications"],
    "version": 3,
    "created_at": "2024-01-10T08:00:00.000Z",
    "updated_at": "2024-01-15T10:30:00.000Z"
  }
}`,
    responseFields: [
      { name: "data", type: "object", description: "The workflow object." },
      { name: "data.id", type: "string (UUID)", description: "Unique identifier for the workflow." },
      { name: "data.name", type: "string", description: "Human-readable name of the workflow." },
      { name: "data.description", type: "string | null", description: "Optional description." },
      { name: "data.is_active", type: "boolean", description: "Whether the workflow can be executed." },
      { name: "data.tags", type: "array<string>", description: "Categorization tags." },
      { name: "data.version", type: "integer", description: "Current version number." },
      { name: "data.created_at", type: "string (ISO 8601)", description: "Creation timestamp." },
      { name: "data.updated_at", type: "string (ISO 8601)", description: "Last update timestamp." },
    ],
    errors: [
      { code: 404, message: "Workflow not found", description: "The specified workflow ID does not exist or you don't have access to it." },
    ],
  },
  {
    method: "POST",
    path: "/workflows/:id/execute",
    description: "Execute a workflow with input data",
    summary: "Triggers the execution of a workflow with optional input data. The workflow must be active to be executed. Returns the execution result including output data and logs.",
    auth: true,
    permissions: ["execute"],
    rateLimit: "50 requests/hour",
    pathParams: [
      { name: "id", type: "string (UUID)", required: true, description: "The unique identifier of the workflow to execute." },
    ],
    body: `{
  "input": {
    "email": "user@example.com",
    "subject": "Welcome!",
    "template": "welcome_email",
    "data": {
      "firstName": "John",
      "lastName": "Doe",
      "company": "Acme Inc"
    }
  }
}`,
    bodyFields: [
      { name: "input", type: "object", required: false, description: "Input data to pass to the workflow. Structure depends on the workflow's expected input schema." },
    ],
    response: `{
  "success": true,
  "executionId": "770e8400-e29b-41d4-a716-446655440222",
  "status": "completed",
  "duration_ms": 2340,
  "output": {
    "emailSent": true,
    "messageId": "msg_abc123def456",
    "recipient": "user@example.com"
  },
  "logs": [
    {
      "nodeId": "trigger-1",
      "nodeName": "HTTP Trigger",
      "timestamp": "2024-01-15T10:30:00.000Z",
      "message": "Workflow triggered via API",
      "level": "info"
    },
    {
      "nodeId": "email-1",
      "nodeName": "Send Email",
      "timestamp": "2024-01-15T10:30:02.000Z",
      "message": "Email sent successfully",
      "level": "success"
    }
  ]
}`,
    responseFields: [
      { name: "success", type: "boolean", description: "Whether the execution completed successfully." },
      { name: "executionId", type: "string (UUID)", description: "Unique identifier for this execution. Use to retrieve logs later." },
      { name: "status", type: "string", description: "Execution status: 'completed', 'failed', or 'running'." },
      { name: "duration_ms", type: "integer", description: "Total execution time in milliseconds." },
      { name: "output", type: "object", description: "Output data produced by the workflow." },
      { name: "logs", type: "array", description: "Array of log entries from each node." },
      { name: "logs[].nodeId", type: "string", description: "Identifier of the node that produced this log." },
      { name: "logs[].nodeName", type: "string", description: "Human-readable name of the node." },
      { name: "logs[].timestamp", type: "string (ISO 8601)", description: "When the log was created." },
      { name: "logs[].message", type: "string", description: "Log message content." },
      { name: "logs[].level", type: "string", description: "Log level: 'info', 'success', 'warning', or 'error'." },
    ],
    errors: [
      { code: 403, message: "Permission denied: execute access required", description: "Your API key doesn't have execute permission." },
      { code: 404, message: "Workflow not found or access denied", description: "The workflow doesn't exist or you don't have access." },
      { code: 400, message: "Workflow is not active", description: "The workflow must be activated before execution." },
    ],
  },
  {
    method: "GET",
    path: "/executions",
    description: "List workflow execution history",
    summary: "Retrieves a paginated list of all workflow executions. Supports filtering by workflow ID and status. Useful for monitoring and debugging.",
    auth: true,
    permissions: ["read"],
    rateLimit: "100 requests/hour",
    params: [
      { name: "page", type: "integer", required: false, default: "1", description: "Page number for pagination." },
      { name: "limit", type: "integer", required: false, default: "20", description: "Number of items per page (max: 100)." },
      { name: "workflow_id", type: "string (UUID)", required: false, description: "Filter executions by workflow ID." },
      { name: "status", type: "string", required: false, description: "Filter by status: 'running', 'success', 'error', or 'pending'." },
    ],
    response: `{
  "data": [
    {
      "id": "880e8400-e29b-41d4-a716-446655440333",
      "workflow_id": "550e8400-e29b-41d4-a716-446655440000",
      "status": "success",
      "started_at": "2024-01-15T10:30:00.000Z",
      "finished_at": "2024-01-15T10:30:02.340Z",
      "error_message": null
    },
    {
      "id": "990f9511-f30c-52e5-b827-557766551444",
      "workflow_id": "550e8400-e29b-41d4-a716-446655440000",
      "status": "error",
      "started_at": "2024-01-15T09:00:00.000Z",
      "finished_at": "2024-01-15T09:00:05.120Z",
      "error_message": "Connection timeout to external API"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 156,
    "totalPages": 8
  }
}`,
    responseFields: [
      { name: "data", type: "array", description: "Array of execution objects." },
      { name: "data[].id", type: "string (UUID)", description: "Unique execution identifier." },
      { name: "data[].workflow_id", type: "string (UUID)", description: "ID of the executed workflow." },
      { name: "data[].status", type: "string", description: "Execution status." },
      { name: "data[].started_at", type: "string (ISO 8601)", description: "When execution started." },
      { name: "data[].finished_at", type: "string (ISO 8601) | null", description: "When execution completed (null if still running)." },
      { name: "data[].error_message", type: "string | null", description: "Error message if execution failed." },
      { name: "pagination", type: "object", description: "Pagination metadata." },
    ],
  },
  {
    method: "GET",
    path: "/executions/:id",
    description: "Get detailed execution information",
    summary: "Retrieves complete details of a specific execution including input data, output data, and full execution logs. Essential for debugging failed executions.",
    auth: true,
    permissions: ["read"],
    rateLimit: "100 requests/hour",
    pathParams: [
      { name: "id", type: "string (UUID)", required: true, description: "The unique identifier of the execution." },
    ],
    response: `{
  "data": {
    "id": "880e8400-e29b-41d4-a716-446655440333",
    "workflow_id": "550e8400-e29b-41d4-a716-446655440000",
    "status": "success",
    "input_data": {
      "email": "user@example.com",
      "template": "welcome_email"
    },
    "output_data": {
      "emailSent": true,
      "messageId": "msg_abc123def456"
    },
    "logs": [
      {
        "nodeId": "trigger-1",
        "nodeName": "HTTP Trigger",
        "timestamp": "2024-01-15T10:30:00.000Z",
        "message": "Workflow triggered via API",
        "level": "info",
        "data": { "source": "api", "apiKeyId": "key_xxx" }
      }
    ],
    "started_at": "2024-01-15T10:30:00.000Z",
    "finished_at": "2024-01-15T10:30:02.340Z",
    "error_message": null
  }
}`,
    responseFields: [
      { name: "data.input_data", type: "object", description: "The input data that was passed to the workflow." },
      { name: "data.output_data", type: "object", description: "The output data produced by the workflow." },
      { name: "data.logs", type: "array", description: "Complete execution logs from all nodes." },
      { name: "data.logs[].data", type: "object", description: "Additional structured data from the node execution." },
    ],
    errors: [
      { code: 404, message: "Execution not found", description: "The specified execution ID does not exist or you don't have access." },
    ],
  },
  // ==================== EMAIL MARKETING ENDPOINTS ====================
  {
    method: "POST",
    path: "/contacts",
    description: "Create a new contact",
    summary: "Add a new contact to your email marketing list. Contacts are automatically de-duplicated by email.",
    auth: true,
    permissions: ["write"],
    rateLimit: "100 requests/hour",
    body: `{
  "email": "john@example.com",
  "first_name": "John",
  "last_name": "Doe",
  "phone": "+1234567890",
  "company": "Acme Inc",
  "source": "website",
  "custom_fields": { "plan": "pro", "signup_page": "/pricing" }
}`,
    bodyFields: [
      { name: "email", type: "string", required: true, description: "Contact's email address." },
      { name: "first_name", type: "string", required: false, description: "Contact's first name." },
      { name: "last_name", type: "string", required: false, description: "Contact's last name." },
      { name: "phone", type: "string", required: false, description: "Phone number." },
      { name: "company", type: "string", required: false, description: "Company name." },
      { name: "source", type: "string", required: false, description: "How the contact was acquired (e.g. 'website', 'api', 'import')." },
      { name: "custom_fields", type: "object", required: false, description: "Arbitrary key-value pairs for custom data." },
    ],
    response: `{
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "john@example.com",
    "first_name": "John",
    "last_name": "Doe",
    "status": "subscribed",
    "created_at": "2024-01-15T10:30:00.000Z"
  },
  "message": "Contact created"
}`,
    responseFields: [
      { name: "data.id", type: "string (UUID)", description: "Unique contact identifier." },
      { name: "data.email", type: "string", description: "Contact email." },
      { name: "data.status", type: "string", description: "Subscription status: subscribed, unsubscribed, bounced." },
    ],
  },
  {
    method: "GET",
    path: "/contacts",
    description: "List all contacts with filtering",
    summary: "Retrieve a paginated list of contacts. Filter by status or search by name/email.",
    auth: true,
    permissions: ["read"],
    rateLimit: "100 requests/hour",
    params: [
      { name: "page", type: "integer", required: false, default: "1", description: "Page number." },
      { name: "limit", type: "integer", required: false, default: "20", description: "Items per page (max 100)." },
      { name: "status", type: "string", required: false, description: "Filter by status: subscribed, unsubscribed, bounced." },
      { name: "search", type: "string", required: false, description: "Search by email, first name, or last name." },
    ],
    response: `{
  "data": [
    { "id": "...", "email": "john@example.com", "first_name": "John", "status": "subscribed", "source": "api" }
  ],
  "pagination": { "page": 1, "limit": 20, "total": 150, "totalPages": 8 }
}`,
    responseFields: [
      { name: "data", type: "array", description: "Array of contact objects." },
      { name: "pagination", type: "object", description: "Pagination metadata." },
    ],
  },
  {
    method: "POST",
    path: "/lists",
    description: "Create a new email list",
    summary: "Create a new mailing list to organize your contacts into segments.",
    auth: true,
    permissions: ["write"],
    rateLimit: "100 requests/hour",
    body: `{
  "name": "Newsletter Subscribers",
  "description": "Weekly newsletter recipients"
}`,
    bodyFields: [
      { name: "name", type: "string", required: true, description: "List name." },
      { name: "description", type: "string", required: false, description: "List description." },
    ],
    response: `{
  "data": { "id": "...", "name": "Newsletter Subscribers", "subscriber_count": 0, "created_at": "..." },
  "message": "List created"
}`,
    responseFields: [
      { name: "data.id", type: "string (UUID)", description: "Unique list identifier." },
      { name: "data.subscriber_count", type: "integer", description: "Number of active subscribers." },
    ],
  },
  {
    method: "POST",
    path: "/lists/:id/subscribe",
    description: "Subscribe a contact to a list",
    summary: "Add a contact to a mailing list. If the email doesn't exist as a contact, it will be created automatically.",
    auth: true,
    permissions: ["write"],
    rateLimit: "100 requests/hour",
    pathParams: [
      { name: "id", type: "string (UUID)", required: true, description: "The list ID to subscribe to." },
    ],
    body: `{
  "email": "john@example.com"
}`,
    bodyFields: [
      { name: "email", type: "string", required: false, description: "Email address. Contact will be auto-created if it doesn't exist." },
      { name: "contact_id", type: "string (UUID)", required: false, description: "Existing contact ID. Use either email or contact_id." },
    ],
    response: `{
  "message": "Subscribed successfully",
  "contact_id": "550e8400-e29b-41d4-a716-446655440000"
}`,
    responseFields: [
      { name: "contact_id", type: "string (UUID)", description: "ID of the subscribed contact." },
    ],
  },
  {
    method: "POST",
    path: "/campaigns",
    description: "Create a new email campaign",
    summary: "Create a draft email campaign. Add HTML content, subject, sender info, and target list.",
    auth: true,
    permissions: ["write"],
    rateLimit: "50 requests/hour",
    body: `{
  "name": "January Newsletter",
  "subject": "Your January Update",
  "from_email": "hello@yourstore.com",
  "from_name": "Your Store",
  "html_content": "<h1>Hello {{first_name}}!</h1><p>Here's your update...</p>",
  "list_id": "list-uuid-here"
}`,
    bodyFields: [
      { name: "name", type: "string", required: true, description: "Campaign name (internal)." },
      { name: "subject", type: "string", required: false, description: "Email subject line." },
      { name: "from_email", type: "string", required: false, description: "Sender email address." },
      { name: "html_content", type: "string", required: false, description: "HTML email body. Supports merge tags like {{first_name}}." },
      { name: "list_id", type: "string (UUID)", required: false, description: "Target mailing list ID." },
    ],
    response: `{
  "data": { "id": "...", "name": "January Newsletter", "subject": "Your January Update", "status": "draft", "created_at": "..." },
  "message": "Campaign created"
}`,
    responseFields: [
      { name: "data.status", type: "string", description: "Campaign status: draft, sending, sent, scheduled." },
    ],
  },
  {
    method: "POST",
    path: "/campaigns/:id/send",
    description: "Send an email campaign",
    summary: "Initiate sending a draft campaign to all contacts in the target list. Campaign must be in 'draft' status.",
    auth: true,
    permissions: ["execute"],
    rateLimit: "10 requests/hour",
    pathParams: [
      { name: "id", type: "string (UUID)", required: true, description: "Campaign ID to send." },
    ],
    response: `{
  "message": "Campaign sending initiated"
}`,
    responseFields: [],
    errors: [
      { code: 400, message: "Campaign must be in draft status to send", description: "Only draft campaigns can be sent." },
      { code: 404, message: "Campaign not found", description: "Campaign doesn't exist or you don't have access." },
    ],
  },
  {
    method: "POST",
    path: "/triggers/checkout-abandon",
    description: "Fire checkout abandonment event",
    summary: "Track when a user fills out checkout details (shipping/payment) but leaves without completing the purchase. Triggers automated recovery emails.",
    auth: true,
    permissions: ["execute"],
    rateLimit: "200 requests/hour",
    body: `{
  "email": "customer@example.com",
  "first_name": "Jane",
  "cart_value": 129.99,
  "checkout_step": "payment",
  "items": [
    { "name": "Premium Widget", "price": 49.99, "quantity": 2, "image_url": "https://..." },
    { "name": "Accessory Pack", "price": 30.01, "quantity": 1 }
  ]
}`,
    bodyFields: [
      { name: "email", type: "string", required: true, description: "Customer email. Contact is auto-created if needed." },
      { name: "first_name", type: "string", required: false, description: "Customer first name for personalization." },
      { name: "cart_value", type: "number", required: false, description: "Total cart value for dynamic email content." },
      { name: "checkout_step", type: "string", required: false, description: "Where they stopped: 'shipping', 'payment', 'review'." },
      { name: "items", type: "array", required: false, description: "Cart items with name, price, quantity, image_url." },
    ],
    response: `{
  "message": "Checkout abandonment event recorded",
  "contact_id": "...",
  "trigger_type": "checkout_abandon",
  "data": { "cart_value": 129.99, "items": [...], "checkout_step": "payment" }
}`,
    responseFields: [
      { name: "contact_id", type: "string (UUID)", description: "The contact that was matched or created." },
      { name: "trigger_type", type: "string", description: "Type of trigger fired." },
    ],
  },
  {
    method: "POST",
    path: "/triggers/payment-failure",
    description: "Fire payment failure recovery event",
    summary: "Track when a payment attempt fails (card declined, insufficient funds, etc.). Sends recovery email with a retry payment link.",
    auth: true,
    permissions: ["execute"],
    rateLimit: "200 requests/hour",
    body: `{
  "email": "customer@example.com",
  "order_id": "ORD-12345",
  "amount": 89.99,
  "error_code": "card_declined",
  "retry_url": "https://yourstore.com/checkout/retry?order=ORD-12345"
}`,
    bodyFields: [
      { name: "email", type: "string", required: true, description: "Customer email." },
      { name: "order_id", type: "string", required: false, description: "Your order reference ID." },
      { name: "amount", type: "number", required: false, description: "Payment amount that failed." },
      { name: "error_code", type: "string", required: false, description: "Payment gateway error code." },
      { name: "retry_url", type: "string", required: false, description: "URL for the customer to retry payment." },
    ],
    response: `{
  "message": "Payment failure event recorded",
  "contact_id": "...",
  "trigger_type": "payment_failure",
  "data": { "order_id": "ORD-12345", "amount": 89.99, "error_code": "card_declined", "retry_url": "..." }
}`,
    responseFields: [
      { name: "contact_id", type: "string (UUID)", description: "The contact that was matched or created." },
    ],
  },
  {
    method: "POST",
    path: "/triggers/cart-abandon",
    description: "Fire cart abandonment event",
    summary: "Track when a user adds items to cart but leaves the site without proceeding to checkout.",
    auth: true,
    permissions: ["execute"],
    rateLimit: "200 requests/hour",
    body: `{
  "email": "shopper@example.com",
  "cart_total": 75.50,
  "items": [
    { "name": "Running Shoes", "price": 75.50, "quantity": 1 }
  ]
}`,
    bodyFields: [
      { name: "email", type: "string", required: true, description: "Customer email." },
      { name: "cart_total", type: "number", required: false, description: "Total cart value." },
      { name: "items", type: "array", required: false, description: "Items in the cart." },
    ],
    response: `{
  "message": "Cart abandonment event recorded",
  "contact_id": "...",
  "trigger_type": "cart_abandon"
}`,
    responseFields: [],
  },
  {
    method: "POST",
    path: "/track/pageview",
    description: "Track a page view event",
    summary: "Record page views for behavior-based segmentation and browse abandonment triggers.",
    auth: true,
    permissions: ["execute"],
    rateLimit: "500 requests/hour",
    body: `{
  "page_url": "https://yourstore.com/products/widget",
  "referrer": "https://google.com",
  "contact_email": "visitor@example.com"
}`,
    bodyFields: [
      { name: "page_url", type: "string", required: false, description: "URL of the page viewed." },
      { name: "referrer", type: "string", required: false, description: "Referrer URL." },
      { name: "contact_email", type: "string", required: false, description: "Email if known (for attribution)." },
    ],
    response: `{ "message": "Pageview tracked" }`,
    responseFields: [],
  },
];

// Error codes reference
const errorCodes = [
  { code: 400, name: "Bad Request", description: "The request was malformed or missing required parameters.", fix: "Check your request body and query parameters match the expected format." },
  { code: 401, name: "Unauthorized", description: "No API key provided or the API key is invalid.", fix: "Include a valid API key in the x-api-key header or Authorization: Bearer header." },
  { code: 403, name: "Forbidden", description: "Your API key doesn't have the required permissions.", fix: "Update your API key permissions or use a different key with appropriate access." },
  { code: 404, name: "Not Found", description: "The requested resource doesn't exist or you don't have access.", fix: "Verify the resource ID exists and your API key has access to the workspace." },
  { code: 429, name: "Too Many Requests", description: "You've exceeded the rate limit for your API key.", fix: "Wait for the rate limit to reset or upgrade your API key's rate limit." },
  { code: 500, name: "Internal Server Error", description: "An unexpected error occurred on our servers.", fix: "Retry the request. If the problem persists, contact support." },
];

// SDK examples
const sdkExamples = {
  javascript: `// Install: npm install @biztoribbd/sdk

import { BiztoriBD } from '@biztoribbd/sdk';

const client = new BiztoriBD({
  apiKey: process.env.BIZTORIBBD_API_KEY
});

// List workflows
const workflows = await client.workflows.list({ limit: 10 });
console.log(workflows.data);

// Execute a workflow
const result = await client.workflows.execute('workflow-id', {
  input: {
    email: 'user@example.com',
    data: { name: 'John' }
  }
});
console.log(result.output);

// Get execution details
const execution = await client.executions.get('execution-id');
console.log(execution.logs);`,

  typescript: `// Install: npm install @biztoribbd/sdk

import { BiztoriBD, Workflow, Execution } from '@biztoribbd/sdk';

const client = new BiztoriBD({
  apiKey: process.env.BIZTORIBBD_API_KEY!
});

// List workflows with TypeScript types
const workflows = await client.workflows.list<Workflow>({ 
  limit: 10,
  page: 1 
});

workflows.data.forEach((workflow: Workflow) => {
  console.log(\`\${workflow.name} - Active: \${workflow.is_active}\`);
});

// Execute with typed input/output
interface EmailInput {
  email: string;
  subject: string;
  template: string;
}

interface EmailOutput {
  emailSent: boolean;
  messageId: string;
}

const result = await client.workflows.execute<EmailInput, EmailOutput>(
  'workflow-id',
  {
    input: {
      email: 'user@example.com',
      subject: 'Hello',
      template: 'welcome'
    }
  }
);

console.log(result.output.messageId);`,

  python: `# Install: pip install biztoribbd

from biztoribbd import BiztoriBD
import os

client = BiztoriBD(api_key=os.environ['BIZTORIBBD_API_KEY'])

# List workflows
workflows = client.workflows.list(limit=10)
for workflow in workflows.data:
    print(f"{workflow.name} - Active: {workflow.is_active}")

# Execute a workflow
result = client.workflows.execute(
    workflow_id='workflow-id',
    input={
        'email': 'user@example.com',
        'data': {'name': 'John'}
    }
)
print(f"Success: {result.success}")
print(f"Output: {result.output}")

# Get execution with error handling
try:
    execution = client.executions.get('execution-id')
    print(f"Status: {execution.status}")
    for log in execution.logs:
        print(f"[{log.level}] {log.message}")
except biztoribbd.NotFoundError:
    print("Execution not found")
except biztoribbd.RateLimitError as e:
    print(f"Rate limited. Retry after {e.retry_after} seconds")`,

  php: `<?php
// Install: composer require biztoribbd/sdk

require_once 'vendor/autoload.php';

use BiztoriBD\\Client;

$client = new Client(['api_key' => getenv('BIZTORIBBD_API_KEY')]);

// List workflows
$workflows = $client->workflows->list(['limit' => 10]);
foreach ($workflows->data as $workflow) {
    echo "{$workflow->name} - Active: " . ($workflow->is_active ? 'Yes' : 'No') . "\\n";
}

// Execute a workflow
$result = $client->workflows->execute('workflow-id', [
    'input' => [
        'email' => 'user@example.com',
        'data' => ['name' => 'John']
    ]
]);
echo "Success: " . ($result->success ? 'Yes' : 'No') . "\\n";
echo "Output: " . json_encode($result->output) . "\\n";

// Handle errors
try {
    $execution = $client->executions->get('execution-id');
    echo "Status: {$execution->status}\\n";
} catch (BiztoriBD\\Exceptions\\NotFoundError $e) {
    echo "Execution not found\\n";
} catch (BiztoriBD\\Exceptions\\RateLimitError $e) {
    echo "Rate limited. Retry after {$e->retryAfter} seconds\\n";
}`,

  go: `// Install: go get github.com/biztoribbd/go-sdk

package main

import (
    "fmt"
    "os"
    
    "github.com/biztoribbd/go-sdk"
)

func main() {
    client := biztoribbd.NewClient(os.Getenv("BIZTORIBBD_API_KEY"))
    
    // List workflows
    workflows, err := client.Workflows.List(&biztoribbd.ListOptions{
        Limit: 10,
    })
    if err != nil {
        panic(err)
    }
    
    for _, workflow := range workflows.Data {
        fmt.Printf("%s - Active: %v\\n", workflow.Name, workflow.IsActive)
    }
    
    // Execute a workflow
    result, err := client.Workflows.Execute("workflow-id", &biztoribbd.ExecuteInput{
        Input: map[string]interface{}{
            "email": "user@example.com",
            "data": map[string]interface{}{
                "name": "John",
            },
        },
    })
    if err != nil {
        panic(err)
    }
    
    fmt.Printf("Success: %v\\n", result.Success)
    fmt.Printf("Output: %v\\n", result.Output)
}`,
};

// Code examples generator
const codeExamples = {
  curl: (endpoint: typeof endpoints[0]) => {
    let code = `curl -X ${endpoint.method} \\
  "${API_BASE_URL}${endpoint.path.replace(':id', '{workflow_id}')}" \\
  -H "x-api-key: bz_your_api_key_here" \\
  -H "Content-Type: application/json"`;
    if (endpoint.body) {
      code += ` \\
  -d '${endpoint.body.replace(/\n/g, '').replace(/\s+/g, ' ')}'`;
    }
    return code;
  },
  
  javascript: (endpoint: typeof endpoints[0]) => {
    let code = `const response = await fetch(
  "${API_BASE_URL}${endpoint.path.replace(':id', '${workflowId}')}",
  {
    method: "${endpoint.method}",
    headers: {
      "x-api-key": "bz_your_api_key_here",
      "Content-Type": "application/json"
    }`;
    if (endpoint.body) {
      code += `,
    body: JSON.stringify(${endpoint.body})`;
    }
    code += `
  }
);

if (!response.ok) {
  const error = await response.json();
  throw new Error(\`API Error: \${error.message}\`);
}

const data = await response.json();
console.log(data);`;
    return code;
  },
  
  python: (endpoint: typeof endpoints[0]) => {
    let code = `import requests
import os

API_KEY = os.environ.get('BIZTORIBBD_API_KEY')
BASE_URL = "${API_BASE_URL}"

headers = {
    "x-api-key": API_KEY,
    "Content-Type": "application/json"
}

response = requests.${endpoint.method.toLowerCase()}(
    f"{BASE_URL}${endpoint.path.replace(':id', '{workflow_id}')}",
    headers=headers`;
    if (endpoint.body) {
      code += `,
    json={
        "input": {
            "email": "user@example.com",
            "template": "welcome_email"
        }
    }`;
    }
    code += `
)

if response.status_code != 200:
    print(f"Error: {response.json()}")
else:
    data = response.json()
    print(data)`;
    return code;
  },

  nodejs: (endpoint: typeof endpoints[0]) => {
    let code = `const https = require('https');

const options = {
  hostname: '${API_BASE_URL.replace('https://', '').split('/')[0]}',
  path: '/functions/v1/public-api${endpoint.path.replace(':id', '{workflow_id}')}',
  method: '${endpoint.method}',
  headers: {
    'x-api-key': process.env.BIZTORIBBD_API_KEY,
    'Content-Type': 'application/json'
  }
};

const req = https.request(options, (res) => {
  let data = '';
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    const result = JSON.parse(data);
    console.log(result);
  });
});

req.on('error', (e) => {
  console.error(\`Error: \${e.message}\`);
});`;
    if (endpoint.body) {
      code += `

const postData = JSON.stringify({
  input: {
    email: "user@example.com",
    template: "welcome_email"
  }
});

req.write(postData);`;
    }
    code += `
req.end();`;
    return code;
  },
};

// WordPress/WooCommerce plugin code
const wordpressPluginCode = `<?php
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

        // Admin menu & settings
        add_action('admin_menu', [$this, 'add_admin_menu']);
        add_action('admin_init', [$this, 'register_settings']);
        add_action('admin_enqueue_scripts', [$this, 'enqueue_admin_assets']);

        // AJAX handlers for WP admin
        add_action('wp_ajax_bz_list_workflows', [$this, 'ajax_list_workflows']);
        add_action('wp_ajax_bz_execute_workflow', [$this, 'ajax_execute_workflow']);
        add_action('wp_ajax_bz_list_executions', [$this, 'ajax_list_executions']);
        add_action('wp_ajax_bz_get_execution', [$this, 'ajax_get_execution']);
        add_action('wp_ajax_bz_workflow_stats', [$this, 'ajax_workflow_stats']);
        add_action('wp_ajax_bz_save_mappings', [$this, 'ajax_save_mappings']);

        if (empty($this->api_key)) return;

        // WooCommerce event hooks → workflow triggers
        add_action('woocommerce_new_order', [$this, 'on_new_order'], 10, 2);
        add_action('woocommerce_order_status_completed', [$this, 'on_order_complete']);
        add_action('woocommerce_order_status_failed', [$this, 'on_payment_failed']);
        add_action('woocommerce_order_status_cancelled', [$this, 'on_order_cancelled']);
        add_action('woocommerce_order_status_refunded', [$this, 'on_order_refunded']);
        add_action('woocommerce_created_customer', [$this, 'on_customer_created'], 10, 3);
        add_action('woocommerce_update_product', [$this, 'on_product_updated'], 10, 2);
        add_action('woocommerce_add_to_cart', [$this, 'on_add_to_cart'], 10, 6);

        // Front-end JS tracker for abandonment
        add_action('wp_footer', [$this, 'inject_tracker_script']);

        // Cron for abandoned carts
        add_action('biztoribbd_check_abandoned', [$this, 'check_abandoned_carts']);
        if (!wp_next_scheduled('biztoribbd_check_abandoned')) {
            wp_schedule_event(time(), 'hourly', 'biztoribbd_check_abandoned');
        }
    }

    // ==================== ADMIN MENU ====================

    public function add_admin_menu() {
        add_menu_page(
            'BiztoriBD Automation',
            'BiztoriBD',
            'manage_options',
            'biztoribbd',
            [$this, 'page_dashboard'],
            'dashicons-networking',
            56
        );
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

    public function enqueue_admin_assets($hook) {
        if (strpos($hook, 'biztoribbd') === false) return;
        wp_enqueue_style('biztoribbd-admin', false);
        wp_add_inline_style('biztoribbd-admin', '
            .bz-wrap { max-width: 1200px; }
            .bz-card { background: #fff; border: 1px solid #c3c4c7; border-radius: 4px; padding: 20px; margin-bottom: 20px; }
            .bz-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 16px; margin-bottom: 20px; }
            .bz-stat { background: #fff; border: 1px solid #c3c4c7; border-radius: 4px; padding: 16px; text-align: center; }
            .bz-stat .number { font-size: 28px; font-weight: 700; color: #2271b1; }
            .bz-stat .label { font-size: 13px; color: #646970; margin-top: 4px; }
            .bz-badge { display: inline-block; padding: 2px 8px; border-radius: 10px; font-size: 11px; font-weight: 600; }
            .bz-badge-success { background: #d4edda; color: #155724; }
            .bz-badge-error { background: #f8d7da; color: #721c24; }
            .bz-badge-running { background: #cce5ff; color: #004085; }
            .bz-badge-active { background: #d4edda; color: #155724; }
            .bz-badge-inactive { background: #e2e3e5; color: #383d41; }
            .bz-table { width: 100%; border-collapse: collapse; }
            .bz-table th, .bz-table td { padding: 10px 12px; border-bottom: 1px solid #e2e4e7; text-align: left; }
            .bz-table th { background: #f0f0f1; font-weight: 600; font-size: 13px; }
            .bz-table tr:hover { background: #f6f7f7; }
            .bz-logs { background: #1d2327; color: #d4d4d8; padding: 16px; border-radius: 4px; font-family: monospace; font-size: 12px; max-height: 400px; overflow-y: auto; }
            .bz-log-info { color: #93c5fd; }
            .bz-log-success { color: #86efac; }
            .bz-log-error { color: #fca5a5; }
            #bz-loading { display: none; text-align: center; padding: 40px; }
        ');
        wp_enqueue_script('biztoribbd-admin', false);
        wp_add_inline_script('biztoribbd-admin', '
            var bzAjax = { url: "' . admin_url('admin-ajax.php') . '", nonce: "' . wp_create_nonce('bz_nonce') . '" };
            function bzApi(action, data, callback) {
                data = data || {};
                data.action = action;
                data._ajax_nonce = bzAjax.nonce;
                jQuery.post(bzAjax.url, data, function(res) {
                    callback(res.success ? res.data : null, res.success ? null : res.data);
                });
            }
        ');
    }

    // ==================== ADMIN PAGES ====================

    public function page_dashboard() {
        ?>
        <div class="wrap bz-wrap">
            <h1>BiztoriBD Automation Dashboard</h1>
            <?php if (empty($this->api_key)): ?>
                <div class="notice notice-warning"><p>Please <a href="<?php echo admin_url("admin.php?page=biztoribbd-settings"); ?>">configure your API key</a> to get started.</p></div>
            <?php else: ?>
                <div class="bz-grid" id="bz-dashboard-stats">
                    <div class="bz-stat"><div class="number" id="bz-total-workflows">--</div><div class="label">Total Workflows</div></div>
                    <div class="bz-stat"><div class="number" id="bz-active-workflows">--</div><div class="label">Active Workflows</div></div>
                    <div class="bz-stat"><div class="number" id="bz-total-executions">--</div><div class="label">Total Executions</div></div>
                    <div class="bz-stat"><div class="number" id="bz-success-rate">--</div><div class="label">Success Rate</div></div>
                </div>
                <div class="bz-card">
                    <h2>Recent Executions</h2>
                    <div id="bz-recent-execs"><p>Loading...</p></div>
                </div>
                <script>
                jQuery(function($) {
                    bzApi("bz_list_workflows", {}, function(d) {
                        if (!d) return;
                        $("#bz-total-workflows").text(d.pagination ? d.pagination.total : d.data.length);
                        var active = d.data ? d.data.filter(function(w) { return w.is_active; }).length : 0;
                        $("#bz-active-workflows").text(active);
                    });
                    bzApi("bz_list_executions", { limit: 5 }, function(d) {
                        if (!d || !d.data) { $("#bz-recent-execs").html("<p>No executions yet.</p>"); return; }
                        $("#bz-total-executions").text(d.pagination ? d.pagination.total : d.data.length);
                        var success = d.data.filter(function(e) { return e.status === "success"; }).length;
                        var rate = d.data.length > 0 ? Math.round(success / d.data.length * 100) : 0;
                        $("#bz-success-rate").text(rate + "%");
                        var html = "<table class=\\"bz-table\\"><tr><th>Workflow</th><th>Status</th><th>Started</th><th>Duration</th></tr>";
                        d.data.forEach(function(e) {
                            var dur = e.finished_at ? ((new Date(e.finished_at) - new Date(e.started_at)) / 1000).toFixed(1) + "s" : "—";
                            var badge = e.status === "success" ? "bz-badge-success" : e.status === "error" ? "bz-badge-error" : "bz-badge-running";
                            html += "<tr><td>" + (e.workflow_id || "—").substring(0,8) + "…</td><td><span class=\\"bz-badge " + badge + "\\">" + e.status + "</span></td><td>" + new Date(e.started_at).toLocaleString() + "</td><td>" + dur + "</td></tr>";
                        });
                        html += "</table>";
                        $("#bz-recent-execs").html(html);
                    });
                });
                </script>
            <?php endif; ?>
        </div>
        <?php
    }

    public function page_workflows() {
        ?>
        <div class="wrap bz-wrap">
            <h1>Workflows</h1>
            <div id="bz-loading"><span class="spinner is-active" style="float:none;"></span> Loading workflows...</div>
            <div class="bz-card" id="bz-workflows-list"></div>
            <script>
            jQuery(function($) {
                $("#bz-loading").show();
                bzApi("bz_list_workflows", {}, function(d) {
                    $("#bz-loading").hide();
                    if (!d || !d.data || d.data.length === 0) {
                        $("#bz-workflows-list").html("<p>No workflows found. Create workflows in the BiztoriBD dashboard.</p>");
                        return;
                    }
                    var html = "<table class=\\"bz-table\\"><tr><th>Name</th><th>Status</th><th>Version</th><th>Updated</th><th>Actions</th></tr>";
                    d.data.forEach(function(w) {
                        var badge = w.is_active ? "bz-badge-active\\">Active" : "bz-badge-inactive\\">Inactive";
                        html += "<tr>";
                        html += "<td><strong>" + w.name + "</strong><br><small style=\\"color:#646970;\\">" + (w.description || "No description") + "</small></td>";
                        html += "<td><span class=\\"bz-badge " + badge + "</span></td>";
                        html += "<td>v" + w.version + "</td>";
                        html += "<td>" + new Date(w.updated_at).toLocaleDateString() + "</td>";
                        html += "<td>";
                        if (w.is_active) {
                            html += "<button class=\\"button button-primary bz-execute\\" data-id=\\"" + w.id + "\\" data-name=\\"" + w.name + "\\">▶ Execute</button> ";
                        }
                        html += "<button class=\\"button bz-stats\\" data-id=\\"" + w.id + "\\">📊 Stats</button>";
                        html += "</td>";
                        html += "</tr>";
                    });
                    html += "</table>";
                    $("#bz-workflows-list").html(html);

                    // Execute handler
                    $(".bz-execute").on("click", function() {
                        var btn = $(this), id = btn.data("id"), name = btn.data("name");
                        if (!confirm("Execute workflow: " + name + "?")) return;
                        btn.prop("disabled", true).text("Running...");
                        bzApi("bz_execute_workflow", { workflow_id: id, input: "{}" }, function(res, err) {
                            btn.prop("disabled", false).text("▶ Execute");
                            if (err) { alert("Error: " + (err.message || "Execution failed")); return; }
                            alert("✅ Execution " + (res.status || "completed") + "\\nDuration: " + (res.duration_ms || 0) + "ms");
                        });
                    });

                    // Stats handler
                    $(".bz-stats").on("click", function() {
                        var id = $(this).data("id");
                        bzApi("bz_workflow_stats", { workflow_id: id }, function(res) {
                            if (!res) { alert("Could not load stats"); return; }
                            var s = res.data || res;
                            alert("📊 Workflow Stats\\n\\nTotal Executions: " + (s.total_executions || 0) + "\\nSuccess: " + (s.success || 0) + "\\nFailed: " + (s.failed || 0) + "\\nAvg Duration: " + (s.avg_duration_ms || 0) + "ms\\nLast Run: " + (s.last_executed || "Never"));
                        });
                    });
                });
            });
            </script>
        </div>
        <?php
    }

    public function page_executions() {
        ?>
        <div class="wrap bz-wrap">
            <h1>Execution History</h1>
            <div class="bz-card" id="bz-exec-list"><p>Loading...</p></div>
            <div class="bz-card" id="bz-exec-detail" style="display:none;">
                <h2>Execution Details</h2>
                <div id="bz-exec-meta"></div>
                <h3>Input Data</h3>
                <pre id="bz-exec-input" class="bz-logs"></pre>
                <h3>Output Data</h3>
                <pre id="bz-exec-output" class="bz-logs"></pre>
                <h3>Execution Logs</h3>
                <div id="bz-exec-logs" class="bz-logs"></div>
                <p><button class="button" onclick="jQuery(\\'#bz-exec-detail\\').hide();jQuery(\\'#bz-exec-list\\').show();">← Back to list</button></p>
            </div>
            <script>
            jQuery(function($) {
                function loadExecs() {
                    bzApi("bz_list_executions", { limit: 20 }, function(d) {
                        if (!d || !d.data || d.data.length === 0) { $("#bz-exec-list").html("<p>No executions yet.</p>"); return; }
                        var html = "<table class=\\"bz-table\\"><tr><th>ID</th><th>Workflow</th><th>Status</th><th>Started</th><th>Duration</th><th></th></tr>";
                        d.data.forEach(function(e) {
                            var dur = e.finished_at ? ((new Date(e.finished_at) - new Date(e.started_at)) / 1000).toFixed(1) + "s" : "Running...";
                            var badge = e.status === "success" ? "bz-badge-success" : e.status === "error" ? "bz-badge-error" : "bz-badge-running";
                            html += "<tr>";
                            html += "<td><code>" + e.id.substring(0,8) + "…</code></td>";
                            html += "<td>" + (e.workflow_id || "—").substring(0,8) + "…</td>";
                            html += "<td><span class=\\"bz-badge " + badge + "\\">" + e.status + "</span></td>";
                            html += "<td>" + new Date(e.started_at).toLocaleString() + "</td>";
                            html += "<td>" + dur + "</td>";
                            html += "<td><button class=\\"button bz-view-exec\\" data-id=\\"" + e.id + "\\">View</button></td>";
                            html += "</tr>";
                        });
                        html += "</table>";
                        $("#bz-exec-list").html(html);

                        $(".bz-view-exec").on("click", function() {
                            var eid = $(this).data("id");
                            bzApi("bz_get_execution", { execution_id: eid }, function(res) {
                                if (!res || !res.data) { alert("Could not load execution"); return; }
                                var ex = res.data;
                                var badge = ex.status === "success" ? "bz-badge-success" : ex.status === "error" ? "bz-badge-error" : "bz-badge-running";
                                $("#bz-exec-meta").html("<p><strong>Status:</strong> <span class=\\"bz-badge " + badge + "\\">" + ex.status + "</span> | <strong>Started:</strong> " + new Date(ex.started_at).toLocaleString() + (ex.error_message ? " | <strong style=\\"color:red\\">Error:</strong> " + ex.error_message : "") + "</p>");
                                $("#bz-exec-input").text(JSON.stringify(ex.input_data || {}, null, 2));
                                $("#bz-exec-output").text(JSON.stringify(ex.output_data || {}, null, 2));
                                var logs = ex.logs || [];
                                var logHtml = "";
                                if (Array.isArray(logs)) {
                                    logs.forEach(function(l) {
                                        var cls = l.level === "error" ? "bz-log-error" : l.level === "success" ? "bz-log-success" : "bz-log-info";
                                        logHtml += "<div class=\\"" + cls + "\\">[" + (l.timestamp || "") + "] " + (l.nodeName || l.nodeId || "") + ": " + l.message + "</div>";
                                    });
                                }
                                $("#bz-exec-logs").html(logHtml || "<div>No logs</div>");
                                $("#bz-exec-list").hide();
                                $("#bz-exec-detail").show();
                            });
                        });
                    });
                }
                loadExecs();
            });
            </script>
        </div>
        <?php
    }

    public function page_mappings() {
        $mappings = get_option('biztoribbd_event_mappings', []);
        if (!is_array($mappings)) $mappings = [];
        $events = [
            'new_order'        => 'New Order Created',
            'order_completed'  => 'Order Completed',
            'payment_failed'   => 'Payment Failed',
            'order_cancelled'  => 'Order Cancelled',
            'order_refunded'   => 'Order Refunded',
            'customer_created' => 'New Customer Registered',
            'product_updated'  => 'Product Updated',
            'cart_abandon'     => 'Cart Abandoned (hourly check)',
            'checkout_abandon' => 'Checkout Abandoned',
        ];
        ?>
        <div class="wrap bz-wrap">
            <h1>WooCommerce → Workflow Mappings</h1>
            <p class="description">Map WooCommerce events to specific workflows. When the event fires, the mapped workflow will be automatically executed with the event data as input.</p>
            <div class="bz-card">
                <div id="bz-mappings-loading"><span class="spinner is-active" style="float:none;"></span> Loading workflows...</div>
                <form id="bz-mappings-form" style="display:none;">
                    <table class="bz-table">
                        <tr><th style="width:35%;">WooCommerce Event</th><th>Workflow to Execute</th></tr>
                        <?php foreach ($events as $key => $label): ?>
                        <tr>
                            <td><strong><?php echo esc_html($label); ?></strong><br><small style="color:#646970;"><?php echo esc_html($key); ?></small></td>
                            <td><select name="bz_map_<?php echo esc_attr($key); ?>" id="bz_map_<?php echo esc_attr($key); ?>" class="bz-wf-select" style="width:100%;max-width:400px;">
                                <option value="">— No workflow (disabled) —</option>
                            </select></td>
                        </tr>
                        <?php endforeach; ?>
                    </table>
                    <p><button type="submit" class="button button-primary">Save Mappings</button></p>
                </form>
            </div>
            <script>
            jQuery(function($) {
                var saved = <?php echo json_encode($mappings); ?>;
                bzApi("bz_list_workflows", {}, function(d) {
                    $("#bz-mappings-loading").hide();
                    $("#bz-mappings-form").show();
                    if (!d || !d.data) return;
                    d.data.forEach(function(w) {
                        $(".bz-wf-select").append("<option value=\\"" + w.id + "\\">" + w.name + (w.is_active ? "" : " (inactive)") + "</option>");
                    });
                    // Restore saved mappings
                    Object.keys(saved).forEach(function(k) {
                        $("#bz_map_" + k).val(saved[k]);
                    });
                });

                $("#bz-mappings-form").on("submit", function(e) {
                    e.preventDefault();
                    var mappings = {};
                    $(".bz-wf-select").each(function() {
                        var key = $(this).attr("name").replace("bz_map_", "");
                        var val = $(this).val();
                        if (val) mappings[key] = val;
                    });
                    bzApi("bz_save_mappings", { mappings: JSON.stringify(mappings) }, function(res, err) {
                        if (err) { alert("Failed to save"); return; }
                        alert("✅ Mappings saved! WooCommerce events will now trigger workflows automatically.");
                    });
                });
            });
            </script>
        </div>
        <?php
    }

    public function page_settings() {
        ?>
        <div class="wrap bz-wrap">
            <h1>BiztoriBD Settings</h1>
            <div class="bz-card">
                <form method="post" action="options.php">
                    <?php settings_fields('biztoribbd_settings'); ?>
                    <table class="form-table">
                        <tr>
                            <th>API Key</th>
                            <td>
                                <input type="password" name="biztoribbd_api_key" value="<?php echo esc_attr(get_option('biztoribbd_api_key')); ?>" class="regular-text" placeholder="bz_xxxxxxxxxxxx" />
                                <p class="description">Get your API key from <a href="https://www.biztoribd.com" target="_blank">BiztoriBD Dashboard → API Keys</a></p>
                            </td>
                        </tr>
                        <tr>
                            <th>API URL</th>
                            <td>
                                <input type="url" name="biztoribbd_api_url" value="<?php echo esc_attr(get_option('biztoribbd_api_url', '${API_BASE_URL}')); ?>" class="regular-text" />
                                <p class="description">Only change this if you have a custom deployment.</p>
                            </td>
                        </tr>
                    </table>
                    <?php submit_button(); ?>
                </form>
            </div>
            <?php if (!empty($this->api_key)): ?>
            <div class="bz-card">
                <h2>Connection Status</h2>
                <div id="bz-conn-status"><span class="spinner is-active" style="float:none;"></span> Testing connection...</div>
                <script>
                jQuery(function($) {
                    $.ajax({
                        url: "<?php echo esc_js($this->api_url); ?>/health",
                        headers: { "x-api-key": "<?php echo esc_js($this->api_key); ?>" },
                        success: function(d) {
                            $("#bz-conn-status").html("<span style=\\"color:green;font-size:18px;\\">✅ Connected</span><br><small>Server time: " + d.timestamp + "</small>");
                        },
                        error: function() {
                            $("#bz-conn-status").html("<span style=\\"color:red;font-size:18px;\\">❌ Connection failed</span><br><small>Check your API key and URL.</small>");
                        }
                    });
                });
                </script>
            </div>
            <?php endif; ?>
        </div>
        <?php
    }

    // ==================== AJAX HANDLERS ====================

    public function ajax_list_workflows() {
        check_ajax_referer('bz_nonce');
        $res = $this->get('/workflows?limit=50');
        wp_send_json_success($res);
    }

    public function ajax_execute_workflow() {
        check_ajax_referer('bz_nonce');
        $wf_id = sanitize_text_field($_POST['workflow_id'] ?? '');
        $input = json_decode(stripslashes($_POST['input'] ?? '{}'), true) ?: [];
        $res = $this->api_post('/workflows/' . $wf_id . '/execute', ['input' => $input]);
        wp_send_json_success($res);
    }

    public function ajax_list_executions() {
        check_ajax_referer('bz_nonce');
        $limit = intval($_POST['limit'] ?? 20);
        $res = $this->get('/executions?limit=' . $limit);
        wp_send_json_success($res);
    }

    public function ajax_get_execution() {
        check_ajax_referer('bz_nonce');
        $eid = sanitize_text_field($_POST['execution_id'] ?? '');
        $res = $this->get('/executions/' . $eid);
        wp_send_json_success($res);
    }

    public function ajax_workflow_stats() {
        check_ajax_referer('bz_nonce');
        $wf_id = sanitize_text_field($_POST['workflow_id'] ?? '');
        $res = $this->get('/workflows/' . $wf_id . '/stats');
        wp_send_json_success($res);
    }

    public function ajax_save_mappings() {
        check_ajax_referer('bz_nonce');
        $mappings = json_decode(stripslashes($_POST['mappings'] ?? '{}'), true) ?: [];
        update_option('biztoribbd_event_mappings', $mappings);
        wp_send_json_success(['saved' => true]);
    }

    // ==================== API HELPERS ====================

    private function get($endpoint) {
        $response = wp_remote_get($this->api_url . $endpoint, [
            'headers' => ['x-api-key' => $this->api_key],
            'timeout' => 15,
        ]);
        if (is_wp_error($response)) return ['error' => $response->get_error_message()];
        return json_decode(wp_remote_retrieve_body($response), true);
    }

    private function api_post($endpoint, $data) {
        $response = wp_remote_post($this->api_url . $endpoint, [
            'headers' => ['x-api-key' => $this->api_key, 'Content-Type' => 'application/json'],
            'body'    => json_encode($data),
            'timeout' => 30,
        ]);
        if (is_wp_error($response)) return ['error' => $response->get_error_message()];
        return json_decode(wp_remote_retrieve_body($response), true);
    }

    private function post($endpoint, $data) {
        wp_remote_post($this->api_url . $endpoint, [
            'headers' => ['x-api-key' => $this->api_key, 'Content-Type' => 'application/json'],
            'body'    => json_encode($data),
            'timeout' => 5,
            'blocking' => false,
        ]);
    }

    // ==================== EVENT → WORKFLOW TRIGGER ====================

    private function trigger_mapped_workflow($event_key, $input_data) {
        $mappings = get_option('biztoribbd_event_mappings', []);
        if (!is_array($mappings) || empty($mappings[$event_key])) return;
        $workflow_id = $mappings[$event_key];
        $this->api_post('/workflows/' . $workflow_id . '/execute', [
            'input' => array_merge($input_data, [
                '_source'    => 'wordpress',
                '_event'     => $event_key,
                '_timestamp' => current_time('c'),
                '_site_url'  => home_url(),
            ]),
        ]);
    }

    private function get_order_data($order) {
        $items = [];
        foreach ($order->get_items() as $item) {
            $product = $item->get_product();
            $items[] = [
                'name'     => $item->get_name(),
                'quantity' => $item->get_quantity(),
                'price'    => (float)$item->get_total(),
                'sku'      => $product ? $product->get_sku() : '',
            ];
        }
        return [
            'order_id'   => $order->get_id(),
            'status'     => $order->get_status(),
            'total'      => (float)$order->get_total(),
            'currency'   => $order->get_currency(),
            'email'      => $order->get_billing_email(),
            'first_name' => $order->get_billing_first_name(),
            'last_name'  => $order->get_billing_last_name(),
            'phone'      => $order->get_billing_phone(),
            'items'      => $items,
            'payment_method' => $order->get_payment_method_title(),
        ];
    }

    // ==================== WOOCOMMERCE HOOKS ====================

    public function on_new_order($order_id, $order = null) {
        if (!$order) $order = wc_get_order($order_id);
        if (!$order) return;
        $data = $this->get_order_data($order);
        $this->post('/contacts', [
            'email' => $data['email'], 'first_name' => $data['first_name'], 'last_name' => $data['last_name'],
            'phone' => $data['phone'], 'source' => 'woocommerce',
            'custom_fields' => ['last_order_id' => (string)$order_id, 'last_order_total' => $data['total']],
        ]);
        $this->trigger_mapped_workflow('new_order', $data);
    }

    public function on_order_complete($order_id) {
        $order = wc_get_order($order_id);
        if (!$order) return;
        $data = $this->get_order_data($order);
        $this->post('/contacts', [
            'email' => $data['email'], 'first_name' => $data['first_name'], 'last_name' => $data['last_name'],
            'phone' => $data['phone'], 'source' => 'woocommerce',
            'custom_fields' => ['last_order_id' => (string)$order_id, 'last_order_total' => $data['total'], 'order_count' => 1],
        ]);
        $this->trigger_mapped_workflow('order_completed', $data);
    }

    public function on_payment_failed($order_id) {
        $order = wc_get_order($order_id);
        if (!$order) return;
        $data = $this->get_order_data($order);
        $this->post('/triggers/payment-failure', [
            'email' => $data['email'], 'order_id' => (string)$order_id,
            'amount' => $data['total'], 'error_code' => 'payment_failed',
            'retry_url' => $order->get_checkout_payment_url(),
        ]);
        $this->trigger_mapped_workflow('payment_failed', $data);
    }

    public function on_order_cancelled($order_id) {
        $order = wc_get_order($order_id);
        if (!$order) return;
        $this->trigger_mapped_workflow('order_cancelled', $this->get_order_data($order));
    }

    public function on_order_refunded($order_id) {
        $order = wc_get_order($order_id);
        if (!$order) return;
        $this->trigger_mapped_workflow('order_refunded', $this->get_order_data($order));
    }

    public function on_customer_created($customer_id, $new_customer_data, $password_generated) {
        $user = get_userdata($customer_id);
        if (!$user) return;
        $data = ['email' => $user->user_email, 'first_name' => $user->first_name, 'last_name' => $user->last_name, 'source' => 'woocommerce'];
        $this->post('/contacts', $data);
        $this->trigger_mapped_workflow('customer_created', $data);
    }

    public function on_product_updated($product_id, $product = null) {
        if (!$product) $product = wc_get_product($product_id);
        if (!$product) return;
        $this->trigger_mapped_workflow('product_updated', [
            'product_id' => $product_id, 'name' => $product->get_name(),
            'price' => (float)$product->get_price(), 'sku' => $product->get_sku(),
            'status' => $product->get_status(), 'stock_status' => $product->get_stock_status(),
        ]);
    }

    // Cart/checkout abandonment tracking (unchanged from v1)
    public function inject_tracker_script() {
        if (!is_cart() && !is_checkout()) return;
        $cart = WC()->cart;
        if (!$cart || $cart->is_empty()) return;
        $email = is_user_logged_in() ? wp_get_current_user()->user_email : 'null';
        $items = [];
        foreach ($cart->get_cart() as $item) {
            $product = $item['data'];
            $items[] = ['name' => $product->get_name(), 'price' => (float)$product->get_price(), 'quantity' => $item['quantity']];
        }
        $total = (float)$cart->get_cart_contents_total();
        ?>
        <script>
        (function(){
            var bzEmail = <?php echo $email !== 'null' ? '"'.esc_js($email).'"' : 'null'; ?>;
            var bzItems = <?php echo json_encode($items); ?>;
            var bzTotal = <?php echo $total; ?>;
            var bzCompleted = false;
            if (document.querySelector('.woocommerce-order-received')) bzCompleted = true;
            window.addEventListener('beforeunload', function() {
                if (bzCompleted || !bzEmail) return;
                var isCheckout = <?php echo is_checkout() ? 'true' : 'false'; ?>;
                var endpoint = isCheckout ? '/triggers/checkout-abandon' : '/triggers/cart-abandon';
                var payload = isCheckout
                    ? { email: bzEmail, cart_value: bzTotal, checkout_step: 'in_progress', items: bzItems }
                    : { email: bzEmail, cart_total: bzTotal, items: bzItems };
                navigator.sendBeacon && navigator.sendBeacon(
                    '<?php echo esc_js($this->api_url); ?>' + endpoint,
                    new Blob([JSON.stringify(Object.assign(payload, {_key: '<?php echo esc_js($this->api_key); ?>'}))], {type:'application/json'})
                );
            });
        })();
        </script>
        <?php
    }
}

new BiztoriBD_Automation();`;

// Shopify Liquid snippet code
const shopifySnippetCode = `{% comment %}
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
      // Auto-track pageview
      this._post("/track/pageview", {
        page_url: window.location.href,
        referrer: document.referrer,
        contact_email: this._getEmail()
      });

      // Detect checkout abandonment
      this._trackCheckoutAbandon();

      // Identify customer if logged in
      {% if customer %}
      this.identify("{{ customer.email }}", {
        firstName: "{{ customer.first_name }}",
        lastName: "{{ customer.last_name }}",
        phone: "{{ customer.phone }}",
        ordersCount: {{ customer.orders_count | default: 0 }}
      });
      {% endif %}

      // Track cart on page with items
      {% if cart.item_count > 0 %}
      this._currentCart = {
        total: {{ cart.total_price | money_without_currency | remove: ',' }},
        items: [
          {% for item in cart.items %}
          { name: "{{ item.product.title | escape }}", price: {{ item.final_price | money_without_currency | remove: ',' }}, quantity: {{ item.quantity }}, image_url: "{{ item.image | image_url: '200x' }}" }{% unless forloop.last %},{% endunless %}
          {% endfor %}
        ]
      };
      {% endif %}
    },

    identify: function(email, data) {
      this._post("/contacts", {
        email: email,
        first_name: data.firstName || null,
        last_name: data.lastName || null,
        phone: data.phone || null,
        source: "shopify",
        custom_fields: { orders_count: data.ordersCount || 0 }
      });
    },

    _getEmail: function() {
      {% if customer %}
      return "{{ customer.email }}";
      {% else %}
      return null;
      {% endif %}
    },

    _trackCheckoutAbandon: function() {
      // Only on checkout pages
      if (window.location.pathname.indexOf('/checkouts/') === -1) return;
      var self = this;
      var completed = false;

      // Shopify fires this on thank-you page
      if (window.Shopify && window.Shopify.checkout && window.Shopify.checkout.order_id) {
        completed = true;
      }

      window.addEventListener("beforeunload", function() {
        if (completed) return;
        var email = self._getEmail();
        if (!email) {
          // Try to get email from checkout form
          var emailField = document.querySelector('input[type="email"], #checkout_email');
          if (emailField) email = emailField.value;
        }
        if (!email) return;

        var cart = self._currentCart || {};
        navigator.sendBeacon && navigator.sendBeacon(
          BZ_API_URL + "/triggers/checkout-abandon",
          new Blob([JSON.stringify({
            email: email,
            cart_value: cart.total || 0,
            checkout_step: "in_progress",
            items: cart.items || [],
            _key: BZ_API_KEY
          })], { type: "application/json" })
        );
      });
    }
  };

  // Initialize
  if (document.readyState === "complete") {
    BZShopify.init();
  } else {
    window.addEventListener("load", function() { BZShopify.init(); });
  }

  window.BZShopify = BZShopify;
})();
</script>

{% comment %}
  === ADDITIONAL: Thank You Page Tracking ===
  Add this to your "Additional Scripts" in Settings → Checkout → Order status page:
{% endcomment %}
{% if first_time_accessed %}
<script>
  // Order completion tracking
  fetch("${API_BASE_URL}/contacts", {
    method: "POST",
    headers: { "x-api-key": "bz_your_api_key_here", "Content-Type": "application/json" },
    body: JSON.stringify({
      email: "{{ order.email }}",
      first_name: "{{ order.billing_address.first_name }}",
      last_name: "{{ order.billing_address.last_name }}",
      phone: "{{ order.billing_address.phone }}",
      source: "shopify",
      custom_fields: {
        last_order_id: "{{ order.order_number }}",
        last_order_total: {{ order.total_price | money_without_currency | remove: ',' }},
        currency: "{{ order.currency }}"
      }
    })
  });
</script>
{% endif %}`;

export default function ApiDocs() {
  const { toast } = useToast();
  const [selectedEndpoint, setSelectedEndpoint] = useState(endpoints[0]);
  const [codeLanguage, setCodeLanguage] = useState<"curl" | "javascript" | "python" | "nodejs">("curl");
  const [sdkLanguage, setSdkLanguage] = useState<"javascript" | "typescript" | "python" | "php" | "go">("javascript");
  const [activeSection, setActiveSection] = useState("quickstart");

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast({
      title: "Copied!",
      description: "Code copied to clipboard",
    });
  };

  const getMethodColor = (method: string) => {
    switch (method) {
      case "GET": return "bg-primary";
      case "POST": return "bg-green-600 dark:bg-green-500";
      case "PUT": return "bg-amber-600 dark:bg-amber-500";
      case "DELETE": return "bg-destructive";
      default: return "bg-muted-foreground";
    }
  };

  const sections = [
    { id: "quickstart", label: "Quick Start", icon: Zap },
    { id: "authentication", label: "Authentication", icon: Key },
    { id: "endpoints", label: "API Endpoints", icon: List },
    { id: "tracking", label: "JS Tracking SDK", icon: Code },
    { id: "sdks", label: "SDKs & Libraries", icon: Code },
    { id: "errors", label: "Error Handling", icon: AlertTriangle },
    { id: "ratelimits", label: "Rate Limits", icon: Clock },
    { id: "security", label: "Security", icon: Shield },
    { id: "webhooks", label: "Webhooks", icon: Globe },
    { id: "plugins", label: "Plugins & Integrations", icon: Plug },
  ];

  return (
    <DashboardLayout>
      <div className="flex gap-6">
        {/* Left Sidebar - Navigation */}
        <div className="hidden lg:block w-64 flex-shrink-0">
          <div className="sticky top-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <BookOpen className="h-4 w-4" />
                  Documentation
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <nav className="space-y-1">
                  {sections.map((section) => (
                    <button
                      key={section.id}
                      onClick={() => setActiveSection(section.id)}
                      className={`w-full flex items-center gap-2 px-4 py-2 text-sm text-left transition-colors ${
                        activeSection === section.id
                          ? "bg-primary text-primary-foreground"
                          : "hover:bg-muted"
                      }`}
                    >
                      <section.icon className="h-4 w-4" />
                      {section.label}
                    </button>
                  ))}
                </nav>
              </CardContent>
            </Card>

            <Card className="mt-4">
              <CardContent className="p-4">
                <h4 className="font-semibold text-sm mb-2">Need Help?</h4>
                <p className="text-xs text-muted-foreground mb-3">
                  Having trouble with the API? Contact our developer support.
                </p>
                <Button size="sm" variant="outline" className="w-full">
                  <ExternalLink className="h-3 w-3 mr-2" />
                  Contact Support
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 space-y-6 min-w-0">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">API Documentation</h1>
              <p className="text-muted-foreground mt-1">
                Complete reference for the BiztoriBD REST API
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" asChild>
                <a href="/api-keys">
                  <Key className="h-4 w-4 mr-2" />
                  Get API Key
                </a>
              </Button>
            </div>
          </div>

          {/* Quick Start Section */}
          {activeSection === "quickstart" && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="h-5 w-5 text-yellow-500" />
                    Quick Start Guide
                  </CardTitle>
                  <CardDescription>
                    Get up and running with the BiztoriBD API in under 5 minutes
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Step 1 */}
                  <div className="flex gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold flex-shrink-0">
                      1
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-lg">Create an API Key</h4>
                      <p className="text-muted-foreground mt-1">
                        Navigate to the <a href="/api-keys" className="text-primary underline">API Keys page</a> and generate a new API key. 
                        Choose the appropriate permissions based on your use case:
                      </p>
                      <ul className="mt-2 space-y-1 text-sm">
                        <li className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          <strong>Read</strong> - List and view workflows/executions
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          <strong>Execute</strong> - Trigger workflow executions
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          <strong>Write</strong> - Create and modify workflows
                        </li>
                      </ul>
                    </div>
                  </div>

                  {/* Step 2 */}
                  <div className="flex gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold flex-shrink-0">
                      2
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-lg">Store Your API Key Securely</h4>
                      <p className="text-muted-foreground mt-1">
                        Store your API key as an environment variable. Never commit API keys to version control.
                      </p>
                      <div className="mt-3 bg-muted p-4 rounded-lg font-mono text-sm">
                        <div className="text-muted-foreground"># .env file</div>
                        <div>BIZTORIBBD_API_KEY=bz_xxxxxxxxxxxxxxxxxxxx</div>
                      </div>
                    </div>
                  </div>

                  {/* Step 3 */}
                  <div className="flex gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold flex-shrink-0">
                      3
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-lg">Make Your First Request</h4>
                      <p className="text-muted-foreground mt-1">
                        Test your API key by calling the health endpoint:
                      </p>
                      <div className="mt-3 relative">
                        <pre className="bg-muted p-4 rounded-lg text-sm overflow-x-auto">
{`curl -X GET \\
  "${API_BASE_URL}/health" \\
  -H "x-api-key: bz_your_api_key_here"`}
                        </pre>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="absolute top-2 right-2"
                          onClick={() => copyCode(`curl -X GET "${API_BASE_URL}/health" -H "x-api-key: bz_your_api_key_here"`)}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="mt-3">
                        <p className="text-sm text-muted-foreground mb-2">Expected response:</p>
                        <pre className="bg-muted p-4 rounded-lg text-sm">
{`{
  "status": "ok",
  "timestamp": "2024-01-15T10:30:00.000Z"
}`}
                        </pre>
                      </div>
                    </div>
                  </div>

                  {/* Step 4 */}
                  <div className="flex gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold flex-shrink-0">
                      4
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-lg">Execute Your First Workflow</h4>
                      <p className="text-muted-foreground mt-1">
                        Once connected, you can list workflows and execute them programmatically:
                      </p>
                      <div className="mt-3 relative">
                        <pre className="bg-muted p-4 rounded-lg text-sm overflow-x-auto">
{`# List all workflows
curl -X GET \\
  "${API_BASE_URL}/workflows" \\
  -H "x-api-key: bz_your_api_key_here"

# Execute a workflow
curl -X POST \\
  "${API_BASE_URL}/workflows/{workflow_id}/execute" \\
  -H "x-api-key: bz_your_api_key_here" \\
  -H "Content-Type: application/json" \\
  -d '{"input": {"key": "value"}}'`}
                        </pre>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Base URL Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Globe className="h-5 w-5" />
                    Base URL
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between bg-muted p-4 rounded-lg">
                    <code className="text-sm">{API_BASE_URL}</code>
                    <Button variant="ghost" size="sm" onClick={() => copyCode(API_BASE_URL)}>
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">
                    All API endpoints are relative to this base URL. Always use HTTPS for secure communication.
                  </p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Authentication Section */}
          {activeSection === "authentication" && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Key className="h-5 w-5" />
                    Authentication
                  </CardTitle>
                  <CardDescription>
                    Secure your API requests with API key authentication
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <h4 className="font-semibold mb-2">API Key Format</h4>
                    <p className="text-muted-foreground">
                      All API keys start with the prefix <code className="bg-muted px-2 py-1 rounded text-sm">bz_</code> followed by a unique identifier.
                    </p>
                    <div className="mt-3 bg-muted p-4 rounded-lg font-mono text-sm">
                      bz_k8f9h2j5m3n7p1q4r6s0t8u2v5w9x3y7z
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2">Authentication Methods</h4>
                    <p className="text-muted-foreground mb-3">
                      You can authenticate using either of these header formats:
                    </p>
                    
                    <div className="space-y-4">
                      <div className="border rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="outline">Recommended</Badge>
                          <h5 className="font-medium">x-api-key Header</h5>
                        </div>
                        <pre className="bg-muted p-3 rounded text-sm">x-api-key: bz_your_api_key_here</pre>
                      </div>

                      <div className="border rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <h5 className="font-medium">Authorization Header</h5>
                        </div>
                        <pre className="bg-muted p-3 rounded text-sm">Authorization: Bearer bz_your_api_key_here</pre>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2">API Key Permissions</h4>
                    <div className="grid gap-3">
                      <div className="flex items-start gap-3 p-3 border rounded-lg">
                        <Badge className="bg-blue-600">read</Badge>
                        <div>
                          <p className="font-medium">Read Access</p>
                          <p className="text-sm text-muted-foreground">View workflows, executions, and their details</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3 p-3 border rounded-lg">
                        <Badge className="bg-green-600">execute</Badge>
                        <div>
                          <p className="font-medium">Execute Access</p>
                          <p className="text-sm text-muted-foreground">Trigger workflow executions via API</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3 p-3 border rounded-lg">
                        <Badge className="bg-orange-600">write</Badge>
                        <div>
                          <p className="font-medium">Write Access</p>
                          <p className="text-sm text-muted-foreground">Create, update, and delete workflows</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <h5 className="font-semibold text-amber-800 dark:text-amber-200">Security Best Practices</h5>
                        <ul className="mt-2 space-y-1 text-sm text-amber-700 dark:text-amber-300">
                          <li>• Never expose API keys in client-side code or public repositories</li>
                          <li>• Rotate your API keys periodically</li>
                          <li>• Use the minimum permissions required for your use case</li>
                          <li>• Set expiration dates for API keys when possible</li>
                          <li>• Monitor API usage for unusual activity</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Endpoints Section */}
          {activeSection === "endpoints" && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <List className="h-5 w-5" />
                    API Endpoints Reference
                  </CardTitle>
                  <CardDescription>
                    Complete reference for all available API endpoints
                  </CardDescription>
                </CardHeader>
              </Card>

              <div className="grid gap-6 lg:grid-cols-3">
                {/* Endpoint List */}
                <Card className="lg:col-span-1">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Endpoints</CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <ScrollArea className="h-[600px]">
                      <div className="space-y-1 p-2">
                        {endpoints.map((endpoint, i) => (
                          <button
                            key={i}
                            onClick={() => setSelectedEndpoint(endpoint)}
                            className={`w-full flex items-center gap-2 px-3 py-2.5 text-left rounded-lg transition-colors ${
                              selectedEndpoint === endpoint ? "bg-primary text-primary-foreground" : "hover:bg-muted"
                            }`}
                          >
                            <Badge className={`${getMethodColor(endpoint.method)} text-white text-xs shrink-0`}>
                              {endpoint.method}
                            </Badge>
                            <span className="text-sm font-mono truncate">{endpoint.path}</span>
                          </button>
                        ))}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>

                {/* Endpoint Details */}
                <Card className="lg:col-span-2">
                  <CardHeader>
                    <div className="flex items-center gap-3 flex-wrap">
                      <Badge className={`${getMethodColor(selectedEndpoint.method)} text-white`}>
                        {selectedEndpoint.method}
                      </Badge>
                      <code className="text-lg font-mono">{selectedEndpoint.path}</code>
                    </div>
                    <CardDescription className="mt-2">{selectedEndpoint.summary || selectedEndpoint.description}</CardDescription>
                    
                    <div className="flex items-center gap-4 mt-3 text-sm">
                      <div className="flex items-center gap-1">
                        <Lock className="h-4 w-4" />
                        <span>Auth required</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Activity className="h-4 w-4" />
                        <span>{selectedEndpoint.rateLimit || "Standard rate limit"}</span>
                      </div>
                      {selectedEndpoint.permissions && (
                        <div className="flex items-center gap-1">
                          <Shield className="h-4 w-4" />
                          <span>Requires: {selectedEndpoint.permissions.join(", ")}</span>
                        </div>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Path Parameters */}
                    {selectedEndpoint.pathParams && (
                      <div>
                        <h4 className="font-semibold mb-3 flex items-center gap-2">
                          <ArrowRight className="h-4 w-4" />
                          Path Parameters
                        </h4>
                        <div className="space-y-2">
                          {selectedEndpoint.pathParams.map((param, i) => (
                            <div key={i} className="flex items-start gap-4 p-3 bg-muted rounded-lg">
                              <div className="flex items-center gap-2">
                                <code className="text-sm font-semibold">{param.name}</code>
                                <Badge variant="outline" className="text-xs">{param.type}</Badge>
                                {param.required && <Badge className="bg-destructive text-xs">required</Badge>}
                              </div>
                              <span className="text-sm text-muted-foreground flex-1">{param.description}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Query Parameters */}
                    {selectedEndpoint.params && (
                      <div>
                        <h4 className="font-semibold mb-3 flex items-center gap-2">
                          <FileJson className="h-4 w-4" />
                          Query Parameters
                        </h4>
                        <div className="space-y-2">
                          {selectedEndpoint.params.map((param, i) => (
                            <div key={i} className="flex flex-col gap-1 p-3 bg-muted rounded-lg">
                              <div className="flex items-center gap-2 flex-wrap">
                                <code className="text-sm font-semibold">{param.name}</code>
                                <Badge variant="outline" className="text-xs">{param.type}</Badge>
                                {param.required ? (
                                  <Badge className="bg-destructive text-xs">required</Badge>
                                ) : (
                                  <Badge variant="secondary" className="text-xs">optional</Badge>
                                )}
                                {param.default && (
                                  <span className="text-xs text-muted-foreground">Default: {param.default}</span>
                                )}
                              </div>
                              <span className="text-sm text-muted-foreground">{param.description}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Request Body */}
                    {selectedEndpoint.body && (
                      <div>
                        <h4 className="font-semibold mb-3 flex items-center gap-2">
                          <Terminal className="h-4 w-4" />
                          Request Body
                        </h4>
                        <div className="relative">
                          <pre className="bg-muted p-4 rounded-lg text-sm overflow-x-auto">
                            {selectedEndpoint.body}
                          </pre>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="absolute top-2 right-2"
                            onClick={() => copyCode(selectedEndpoint.body!)}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                        {selectedEndpoint.bodyFields && (
                          <div className="mt-3 space-y-2">
                            {selectedEndpoint.bodyFields.map((field, i) => (
                              <div key={i} className="flex items-start gap-2 text-sm">
                                <code className="bg-muted px-2 py-0.5 rounded">{field.name}</code>
                                <Badge variant="outline" className="text-xs">{field.type}</Badge>
                                {field.required && <Badge className="bg-destructive text-xs">required</Badge>}
                                <span className="text-muted-foreground">{field.description}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Code Examples */}
                    <div>
                      <h4 className="font-semibold mb-3 flex items-center gap-2">
                        <Code className="h-4 w-4" />
                        Code Examples
                      </h4>
                      <Tabs value={codeLanguage} onValueChange={(v) => setCodeLanguage(v as any)}>
                        <TabsList>
                          <TabsTrigger value="curl">cURL</TabsTrigger>
                          <TabsTrigger value="javascript">JavaScript</TabsTrigger>
                          <TabsTrigger value="python">Python</TabsTrigger>
                          <TabsTrigger value="nodejs">Node.js</TabsTrigger>
                        </TabsList>
                        {(["curl", "javascript", "python", "nodejs"] as const).map((lang) => (
                          <TabsContent key={lang} value={lang} className="relative">
                            <pre className="bg-muted p-4 rounded-lg text-sm overflow-x-auto mt-2">
                              {codeExamples[lang](selectedEndpoint)}
                            </pre>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="absolute top-4 right-2"
                              onClick={() => copyCode(codeExamples[lang](selectedEndpoint))}
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                          </TabsContent>
                        ))}
                      </Tabs>
                    </div>

                    {/* Response */}
                    <div>
                      <h4 className="font-semibold mb-3 flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        Response <Badge className="bg-green-600 text-xs">200 OK</Badge>
                      </h4>
                      <div className="relative">
                        <pre className="bg-muted p-4 rounded-lg text-sm overflow-x-auto max-h-96">
                          {selectedEndpoint.response}
                        </pre>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="absolute top-2 right-2"
                          onClick={() => copyCode(selectedEndpoint.response)}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>

                      {/* Response Fields */}
                      {selectedEndpoint.responseFields && (
                        <Accordion type="single" collapsible className="mt-4">
                          <AccordionItem value="fields">
                            <AccordionTrigger className="text-sm">Response Fields</AccordionTrigger>
                            <AccordionContent>
                              <div className="space-y-2">
                                {selectedEndpoint.responseFields.map((field, i) => (
                                  <div key={i} className="flex items-start gap-2 text-sm p-2 bg-muted/50 rounded">
                                    <code className="bg-muted px-2 py-0.5 rounded text-xs shrink-0">{field.name}</code>
                                    <Badge variant="outline" className="text-xs shrink-0">{field.type}</Badge>
                                    <span className="text-muted-foreground">{field.description}</span>
                                  </div>
                                ))}
                              </div>
                            </AccordionContent>
                          </AccordionItem>
                        </Accordion>
                      )}
                    </div>

                    {/* Errors */}
                    {selectedEndpoint.errors && (
                      <div>
                        <h4 className="font-semibold mb-3 flex items-center gap-2">
                          <AlertTriangle className="h-4 w-4 text-destructive" />
                          Error Responses
                        </h4>
                        <div className="space-y-2">
                          {selectedEndpoint.errors.map((error, i) => (
                            <div key={i} className="p-3 border border-destructive/20 bg-destructive/5 rounded-lg">
                              <div className="flex items-center gap-2 mb-1">
                                <Badge variant="destructive">{error.code}</Badge>
                                <span className="font-medium">{error.message}</span>
                              </div>
                              <p className="text-sm text-muted-foreground">{error.description}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {/* JS Tracking SDK Section */}
          {activeSection === "tracking" && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Code className="h-5 w-5" />
                    JavaScript Tracking SDK
                  </CardTitle>
                  <CardDescription>
                    Embed this script on your website to automatically track e-commerce events, trigger abandoned cart/checkout recovery, and capture payment failures.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <h4 className="font-semibold mb-2">1. Add the tracking script to your website</h4>
                    <p className="text-sm text-muted-foreground mb-3">
                      Copy and paste this script before the closing <code className="bg-muted px-1 rounded">&lt;/body&gt;</code> tag on every page of your site.
                    </p>
                    <div className="relative">
                      <pre className="bg-muted p-4 rounded-lg text-sm overflow-x-auto">
{`<script>
(function() {
  var BZ_API_KEY = "bz_your_api_key_here";
  var BZ_API_URL = "${API_BASE_URL}";

  var BZTracker = {
    _post: function(endpoint, data) {
      fetch(BZ_API_URL + endpoint, {
        method: "POST",
        headers: {
          "x-api-key": BZ_API_KEY,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(data)
      }).catch(function(e) { console.warn("BZ tracking error:", e); });
    },

    // Track page views
    trackPageview: function(email) {
      this._post("/track/pageview", {
        page_url: window.location.href,
        referrer: document.referrer,
        contact_email: email || null
      });
    },

    // Track cart abandonment
    trackCartAbandon: function(email, items, cartTotal) {
      this._post("/triggers/cart-abandon", {
        email: email,
        items: items,
        cart_total: cartTotal
      });
    },

    // Track checkout abandonment
    trackCheckoutAbandon: function(email, opts) {
      this._post("/triggers/checkout-abandon", {
        email: email,
        first_name: opts.firstName || null,
        cart_value: opts.cartValue || null,
        checkout_step: opts.checkoutStep || "unknown",
        items: opts.items || []
      });
    },

    // Track payment failure
    trackPaymentFailure: function(email, opts) {
      this._post("/triggers/payment-failure", {
        email: email,
        order_id: opts.orderId || null,
        amount: opts.amount || null,
        error_code: opts.errorCode || null,
        retry_url: opts.retryUrl || null
      });
    },

    // Subscribe contact to a list
    subscribe: function(email, listId) {
      this._post("/lists/" + listId + "/subscribe", { email: email });
    },

    // Create or update a contact
    identify: function(email, data) {
      this._post("/contacts", {
        email: email,
        first_name: data.firstName || null,
        last_name: data.lastName || null,
        phone: data.phone || null,
        company: data.company || null,
        source: "website",
        custom_fields: data.customFields || {}
      });
    }
  };

  // Auto-track pageview on load
  BZTracker.trackPageview();

  // Expose globally
  window.BZTracker = BZTracker;
})();
</script>`}
                      </pre>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="absolute top-2 right-2"
                        onClick={() => copyCode(`<script>
(function() {
  var BZ_API_KEY = "bz_your_api_key_here";
  var BZ_API_URL = "${API_BASE_URL}";
  var BZTracker = {
    _post: function(endpoint, data) { fetch(BZ_API_URL + endpoint, { method: "POST", headers: { "x-api-key": BZ_API_KEY, "Content-Type": "application/json" }, body: JSON.stringify(data) }).catch(function(e) { console.warn("BZ tracking error:", e); }); },
    trackPageview: function(email) { this._post("/track/pageview", { page_url: window.location.href, referrer: document.referrer, contact_email: email || null }); },
    trackCartAbandon: function(email, items, cartTotal) { this._post("/triggers/cart-abandon", { email: email, items: items, cart_total: cartTotal }); },
    trackCheckoutAbandon: function(email, opts) { this._post("/triggers/checkout-abandon", { email: email, first_name: opts.firstName || null, cart_value: opts.cartValue || null, checkout_step: opts.checkoutStep || "unknown", items: opts.items || [] }); },
    trackPaymentFailure: function(email, opts) { this._post("/triggers/payment-failure", { email: email, order_id: opts.orderId || null, amount: opts.amount || null, error_code: opts.errorCode || null, retry_url: opts.retryUrl || null }); },
    subscribe: function(email, listId) { this._post("/lists/" + listId + "/subscribe", { email: email }); },
    identify: function(email, data) { this._post("/contacts", { email: email, first_name: data.firstName || null, last_name: data.lastName || null, phone: data.phone || null, company: data.company || null, source: "website", custom_fields: data.customFields || {} }); }
  };
  BZTracker.trackPageview();
  window.BZTracker = BZTracker;
})();
</script>`)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2">2. Usage examples</h4>
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm font-medium mb-1">Identify a user (e.g. after login or form fill)</p>
                        <pre className="bg-muted p-3 rounded-lg text-sm overflow-x-auto">
{`BZTracker.identify("john@example.com", {
  firstName: "John",
  lastName: "Doe",
  company: "Acme Inc"
});`}
                        </pre>
                      </div>

                      <div>
                        <p className="text-sm font-medium mb-1">Track checkout abandonment (on checkout page unload)</p>
                        <pre className="bg-muted p-3 rounded-lg text-sm overflow-x-auto">
{`window.addEventListener("beforeunload", function() {
  if (!orderCompleted) {
    BZTracker.trackCheckoutAbandon("john@example.com", {
      cartValue: 129.99,
      checkoutStep: "payment",
      items: [
        { name: "Widget Pro", price: 99.99, quantity: 1 },
        { name: "Cable", price: 30.00, quantity: 1 }
      ]
    });
  }
});`}
                        </pre>
                      </div>

                      <div>
                        <p className="text-sm font-medium mb-1">Track payment failure (in your payment error handler)</p>
                        <pre className="bg-muted p-3 rounded-lg text-sm overflow-x-auto">
{`function onPaymentError(error) {
  BZTracker.trackPaymentFailure("john@example.com", {
    orderId: "ORD-12345",
    amount: 89.99,
    errorCode: error.code, // e.g. "card_declined"
    retryUrl: window.location.href + "?retry=1"
  });
  
  showErrorMessage("Payment failed. We'll send you a recovery link.");
}`}
                        </pre>
                      </div>

                      <div>
                        <p className="text-sm font-medium mb-1">Track cart abandonment (when user has items but navigates away)</p>
                        <pre className="bg-muted p-3 rounded-lg text-sm overflow-x-auto">
{`// Call this when cart has items and user is leaving
BZTracker.trackCartAbandon("john@example.com", [
  { name: "Running Shoes", price: 75.50, quantity: 1 }
], 75.50);`}
                        </pre>
                      </div>

                      <div>
                        <p className="text-sm font-medium mb-1">Subscribe to a list (e.g. newsletter signup form)</p>
                        <pre className="bg-muted p-3 rounded-lg text-sm overflow-x-auto">
{`document.getElementById("signup-form").addEventListener("submit", function(e) {
  e.preventDefault();
  var email = document.getElementById("email-input").value;
  BZTracker.subscribe(email, "your-list-id-here");
  showSuccess("You're subscribed!");
});`}
                        </pre>
                      </div>
                    </div>
                  </div>

                  <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 rounded-lg p-4">
                    <h5 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">How It Works</h5>
                    <ul className="space-y-1 text-sm text-blue-700 dark:text-blue-300">
                      <li>• The script auto-tracks page views on every page load</li>
                      <li>• Call <code className="bg-blue-100 dark:bg-blue-900 px-1 rounded">BZTracker.identify()</code> after login/signup to associate activity with a contact</li>
                      <li>• Use <code className="bg-blue-100 dark:bg-blue-900 px-1 rounded">beforeunload</code> event to detect checkout abandonment</li>
                      <li>• Hook into your payment gateway's error callback for payment failure tracking</li>
                      <li>• All events create/update contacts automatically — no manual syncing needed</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* SDKs Section */}
          {activeSection === "sdks" && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Code className="h-5 w-5" />
                    Official SDKs & Libraries
                  </CardTitle>
                  <CardDescription>
                    Use our official SDKs for a better development experience with type safety and built-in error handling
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Tabs value={sdkLanguage} onValueChange={(v) => setSdkLanguage(v as any)}>
                    <TabsList className="flex-wrap h-auto">
                      <TabsTrigger value="javascript">JavaScript</TabsTrigger>
                      <TabsTrigger value="typescript">TypeScript</TabsTrigger>
                      <TabsTrigger value="python">Python</TabsTrigger>
                      <TabsTrigger value="php">PHP</TabsTrigger>
                      <TabsTrigger value="go">Go</TabsTrigger>
                    </TabsList>
                    {(Object.keys(sdkExamples) as Array<keyof typeof sdkExamples>).map((lang) => (
                      <TabsContent key={lang} value={lang} className="relative">
                        <pre className="bg-muted p-4 rounded-lg text-sm overflow-x-auto mt-2 max-h-[500px]">
                          {sdkExamples[lang]}
                        </pre>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="absolute top-4 right-2"
                          onClick={() => copyCode(sdkExamples[lang])}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </TabsContent>
                    ))}
                  </Tabs>
                </CardContent>
              </Card>

              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Installation</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Badge>npm</Badge>
                      <code className="text-sm bg-muted px-2 py-1 rounded">npm install @biztoribbd/sdk</code>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge>pip</Badge>
                      <code className="text-sm bg-muted px-2 py-1 rounded">pip install biztoribbd</code>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge>composer</Badge>
                      <code className="text-sm bg-muted px-2 py-1 rounded">composer require biztoribbd/sdk</code>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge>go</Badge>
                      <code className="text-sm bg-muted px-2 py-1 rounded">go get github.com/biztoribbd/go-sdk</code>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">SDK Features</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        Type-safe API calls with full TypeScript support
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        Automatic retry with exponential backoff
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        Built-in rate limit handling
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        Comprehensive error types
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        Request/response logging
                      </li>
                    </ul>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {/* Error Handling Section */}
          {activeSection === "errors" && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5" />
                    Error Handling
                  </CardTitle>
                  <CardDescription>
                    Understanding and handling API errors effectively
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <h4 className="font-semibold mb-3">Error Response Format</h4>
                    <p className="text-muted-foreground mb-3">
                      All error responses follow a consistent JSON format:
                    </p>
                    <pre className="bg-muted p-4 rounded-lg text-sm">
{`{
  "error": "Unauthorized",
  "message": "Invalid or expired API key",
  "code": 401,
  "details": {
    "hint": "Check that your API key is correct and not expired"
  }
}`}
                    </pre>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-3">HTTP Status Codes</h4>
                    <div className="space-y-3">
                      {errorCodes.map((error, i) => (
                        <div key={i} className="p-4 border rounded-lg">
                          <div className="flex items-center gap-3 mb-2">
                            <Badge variant={error.code >= 500 ? "destructive" : error.code >= 400 ? "secondary" : "default"}>
                              {error.code}
                            </Badge>
                            <span className="font-semibold">{error.name}</span>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">{error.description}</p>
                          <div className="flex items-start gap-2 text-sm bg-muted p-2 rounded">
                            <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                            <span><strong>Fix:</strong> {error.fix}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-3">Error Handling Example</h4>
                    <pre className="bg-muted p-4 rounded-lg text-sm overflow-x-auto">
{`try {
  const response = await fetch(API_URL, {
    headers: { "x-api-key": apiKey }
  });
  
  if (!response.ok) {
    const error = await response.json();
    
    switch (response.status) {
      case 401:
        console.error("Authentication failed:", error.message);
        // Refresh or request new API key
        break;
      case 429:
        const retryAfter = response.headers.get("Retry-After");
        console.log(\`Rate limited. Retry after \${retryAfter} seconds\`);
        break;
      case 500:
        console.error("Server error. Retrying...");
        // Implement retry logic
        break;
      default:
        console.error(\`Error \${response.status}: \${error.message}\`);
    }
    return;
  }
  
  const data = await response.json();
  console.log("Success:", data);
} catch (networkError) {
  console.error("Network error:", networkError);
}`}
                    </pre>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Rate Limits Section */}
          {activeSection === "ratelimits" && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Rate Limiting
                  </CardTitle>
                  <CardDescription>
                    Understanding and working with API rate limits
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <h4 className="font-semibold mb-3">Default Rate Limits</h4>
                    <div className="grid gap-4 md:grid-cols-3">
                      <div className="p-4 border rounded-lg text-center">
                        <div className="text-3xl font-bold text-primary">1,000</div>
                        <div className="text-sm text-muted-foreground">Requests per hour</div>
                      </div>
                      <div className="p-4 border rounded-lg text-center">
                        <div className="text-3xl font-bold text-primary">100</div>
                        <div className="text-sm text-muted-foreground">Requests per minute</div>
                      </div>
                      <div className="p-4 border rounded-lg text-center">
                        <div className="text-3xl font-bold text-primary">50</div>
                        <div className="text-sm text-muted-foreground">Executions per hour</div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-3">Rate Limit Headers</h4>
                    <p className="text-muted-foreground mb-3">
                      Every API response includes headers to help you track your rate limit status:
                    </p>
                    <div className="bg-muted p-4 rounded-lg font-mono text-sm space-y-1">
                      <div className="flex items-center gap-4">
                        <span className="text-muted-foreground w-48">X-RateLimit-Limit:</span>
                        <span>1000</span>
                        <span className="text-xs text-muted-foreground ml-4">Maximum requests per hour</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-muted-foreground w-48">X-RateLimit-Remaining:</span>
                        <span>950</span>
                        <span className="text-xs text-muted-foreground ml-4">Requests remaining this hour</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-muted-foreground w-48">X-RateLimit-Reset:</span>
                        <span>1704110400</span>
                        <span className="text-xs text-muted-foreground ml-4">Unix timestamp when limit resets</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-3">Handling Rate Limit Errors</h4>
                    <p className="text-muted-foreground mb-3">
                      When you exceed the rate limit, you'll receive a 429 status code:
                    </p>
                    <pre className="bg-muted p-4 rounded-lg text-sm">
{`{
  "error": "Too Many Requests",
  "message": "Rate limit exceeded. Please retry after 60 seconds.",
  "retry_after": 60
}`}
                    </pre>
                  </div>

                  <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 rounded-lg p-4">
                    <h5 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">Best Practices</h5>
                    <ul className="space-y-1 text-sm text-blue-700 dark:text-blue-300">
                      <li>• Implement exponential backoff when retrying failed requests</li>
                      <li>• Cache responses when possible to reduce API calls</li>
                      <li>• Use webhooks instead of polling for real-time updates</li>
                      <li>• Batch requests when the API supports it</li>
                      <li>• Monitor your X-RateLimit-Remaining header proactively</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Security Section */}
          {activeSection === "security" && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Security Best Practices
                  </CardTitle>
                  <CardDescription>
                    Keep your integration secure
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="p-4 border rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Lock className="h-5 w-5 text-green-500" />
                        <h5 className="font-semibold">HTTPS Only</h5>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        All API requests must use HTTPS. HTTP requests will be rejected.
                      </p>
                    </div>

                    <div className="p-4 border rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Key className="h-5 w-5 text-green-500" />
                        <h5 className="font-semibold">API Key Hashing</h5>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        API keys are stored as SHA-256 hashes. We never store plain text keys.
                      </p>
                    </div>

                    <div className="p-4 border rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Clock className="h-5 w-5 text-green-500" />
                        <h5 className="font-semibold">Key Expiration</h5>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Set expiration dates on API keys for enhanced security.
                      </p>
                    </div>

                    <div className="p-4 border rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Activity className="h-5 w-5 text-green-500" />
                        <h5 className="font-semibold">Activity Logging</h5>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        All API requests are logged with IP address and user agent.
                      </p>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-3">Environment Variable Storage</h4>
                    <pre className="bg-muted p-4 rounded-lg text-sm">
{`# Store API keys in environment variables, never in code

# .env file (add to .gitignore!)
BIZTORIBBD_API_KEY=bz_xxxxxxxxxxxxxxxxxxxx

# Access in your code
const apiKey = process.env.BIZTORIBBD_API_KEY;`}
                    </pre>
                  </div>

                  <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
                    <h5 className="font-semibold text-destructive mb-2">⚠️ Never Do This</h5>
                    <pre className="bg-destructive/5 p-3 rounded text-sm text-destructive">
{`// DON'T hardcode API keys in your source code
const apiKey = "bz_live_xxxxxxxxxxxxxxxx"; // ❌ Bad!

// DON'T commit API keys to version control
// DON'T expose keys in client-side JavaScript
// DON'T share keys via insecure channels`}
                    </pre>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Webhooks Section */}
          {activeSection === "webhooks" && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Globe className="h-5 w-5" />
                    Webhooks
                  </CardTitle>
                  <CardDescription>
                    Receive real-time notifications when events occur
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Clock className="h-5 w-5 text-amber-600" />
                      <h5 className="font-semibold text-amber-800 dark:text-amber-200">Coming Soon</h5>
                    </div>
                    <p className="text-sm text-amber-700 dark:text-amber-300">
                      Webhook support is currently in development. Subscribe to our changelog to be notified when it's available.
                    </p>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-3">Planned Webhook Events</h4>
                    <div className="space-y-2">
                      <div className="flex items-center gap-3 p-3 border rounded-lg">
                        <Badge variant="outline">workflow.executed</Badge>
                        <span className="text-sm text-muted-foreground">When a workflow execution completes</span>
                      </div>
                      <div className="flex items-center gap-3 p-3 border rounded-lg">
                        <Badge variant="outline">workflow.failed</Badge>
                        <span className="text-sm text-muted-foreground">When a workflow execution fails</span>
                      </div>
                      <div className="flex items-center gap-3 p-3 border rounded-lg">
                        <Badge variant="outline">workflow.updated</Badge>
                        <span className="text-sm text-muted-foreground">When a workflow is modified</span>
                      </div>
                      <div className="flex items-center gap-3 p-3 border rounded-lg">
                        <Badge variant="outline">api_key.created</Badge>
                        <span className="text-sm text-muted-foreground">When a new API key is generated</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-3">Webhook Payload Preview</h4>
                    <pre className="bg-muted p-4 rounded-lg text-sm">
{`{
  "event": "workflow.executed",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "data": {
    "workflow_id": "550e8400-e29b-41d4-a716-446655440000",
    "execution_id": "660f9511-f30c-52e5-b827-557766551111",
    "status": "success",
    "duration_ms": 2340,
    "output": {
      "result": "Workflow completed successfully"
    }
  },
  "signature": "sha256=xxxxxxxxxxxxxxxxxxxxx"
}`}
                    </pre>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Plugins & Integrations Section */}
          {activeSection === "plugins" && (
            <div className="space-y-6">
              {/* Overview */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Plug className="h-5 w-5" />
                    Plugins & Platform Integrations
                  </CardTitle>
                  <CardDescription>
                    Ready-to-install plugins for WordPress/WooCommerce & Shopify, plus webhook-based integration for any platform
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="p-4 border rounded-lg text-center">
                      <ShoppingCart className="h-8 w-8 mx-auto text-purple-600 mb-2" />
                      <h5 className="font-semibold">WordPress / WooCommerce</h5>
                      <p className="text-xs text-muted-foreground mt-1">Full automation plugin with workflow management & event triggers</p>
                    </div>
                    <div className="p-4 border rounded-lg text-center">
                      <ShoppingBag className="h-8 w-8 mx-auto text-green-600 mb-2" />
                      <h5 className="font-semibold">Shopify</h5>
                      <p className="text-xs text-muted-foreground mt-1">Theme snippet & webhook integration</p>
                    </div>
                    <div className="p-4 border rounded-lg text-center">
                      <Globe className="h-8 w-8 mx-auto text-blue-600 mb-2" />
                      <h5 className="font-semibold">Webhook API</h5>
                      <p className="text-xs text-muted-foreground mt-1">Universal webhook receiver for any platform</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* WordPress / WooCommerce Plugin */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ShoppingCart className="h-5 w-5 text-purple-600" />
                    WordPress / WooCommerce Automation Plugin
                  </CardTitle>
                  <CardDescription>
                    Full workflow automation engine for WordPress — manage workflows, map WooCommerce events to workflows, monitor executions, and track abandonment &amp; payment failures, all from your WP admin.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <h4 className="font-semibold mb-2">Installation Steps</h4>
                    <ol className="space-y-3 text-sm">
                      <li className="flex gap-3">
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold shrink-0">1</span>
                        <span>Copy the PHP code below and save it as <code className="bg-muted px-1 rounded">biztoribbd-tracker.php</code></span>
                      </li>
                      <li className="flex gap-3">
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold shrink-0">2</span>
                        <span>Upload it to your WordPress <code className="bg-muted px-1 rounded">wp-content/plugins/</code> directory</span>
                      </li>
                      <li className="flex gap-3">
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold shrink-0">3</span>
                        <span>Activate the plugin from <strong>Plugins → Installed Plugins</strong> in WordPress admin</span>
                      </li>
                      <li className="flex gap-3">
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold shrink-0">4</span>
                        <span>Go to <strong>BiztoriBD → Settings</strong> and enter your API Key</span>
                      </li>
                      <li className="flex gap-3">
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold shrink-0">5</span>
                        <span>Go to <strong>BiztoriBD → Event Mappings</strong> to map WooCommerce events to your workflows</span>
                      </li>
                    </ol>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold">Plugin Code — <code className="text-xs bg-muted px-1 rounded">biztoribbd-tracker.php</code></h4>
                      <Button size="sm" variant="outline" onClick={() => copyCode(wordpressPluginCode)}>
                        <Copy className="h-3 w-3 mr-1" /> Copy
                      </Button>
                    </div>
                    <pre className="bg-muted p-4 rounded-lg text-xs overflow-x-auto max-h-[500px]">
                      {wordpressPluginCode}
                    </pre>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2">Plugin Capabilities</h4>
                    <div className="grid gap-2 md:grid-cols-2">
                      <div className="flex items-center gap-2 p-2 border rounded text-sm">
                        <CheckCircle className="h-4 w-4 text-green-500 shrink-0" />
                        <span><strong>Workflow Management</strong> — List, execute & monitor workflows from WP admin</span>
                      </div>
                      <div className="flex items-center gap-2 p-2 border rounded text-sm">
                        <CheckCircle className="h-4 w-4 text-green-500 shrink-0" />
                        <span><strong>Event → Workflow Mapping</strong> — Auto-trigger workflows on WooCommerce events</span>
                      </div>
                      <div className="flex items-center gap-2 p-2 border rounded text-sm">
                        <CheckCircle className="h-4 w-4 text-green-500 shrink-0" />
                        <span><strong>Execution Logs</strong> — View detailed execution history, input/output & logs</span>
                      </div>
                      <div className="flex items-center gap-2 p-2 border rounded text-sm">
                        <CheckCircle className="h-4 w-4 text-green-500 shrink-0" />
                        <span><strong>Cart & Checkout Abandonment</strong> — Automatic JS tracking via sendBeacon</span>
                      </div>
                      <div className="flex items-center gap-2 p-2 border rounded text-sm">
                        <CheckCircle className="h-4 w-4 text-green-500 shrink-0" />
                        <span><strong>Payment Failure Recovery</strong> — Declined cards trigger recovery workflows</span>
                      </div>
                      <div className="flex items-center gap-2 p-2 border rounded text-sm">
                        <CheckCircle className="h-4 w-4 text-green-500 shrink-0" />
                        <span><strong>Contact Sync</strong> — Customers auto-synced on order & registration</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 rounded-lg p-4">
                    <h5 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">WordPress Admin Pages</h5>
                    <ul className="space-y-1 text-sm text-blue-700 dark:text-blue-300">
                      <li>• <strong>Dashboard</strong> — Overview stats, recent executions, connection status</li>
                      <li>• <strong>Workflows</strong> — Browse, execute, and view stats for all your workflows</li>
                      <li>• <strong>Executions</strong> — Full execution history with input/output data & node-level logs</li>
                      <li>• <strong>Event Mappings</strong> — Map 9 WooCommerce events to specific workflows</li>
                      <li>• <strong>Settings</strong> — API key configuration & connection testing</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>

              {/* Shopify Integration */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ShoppingBag className="h-5 w-5 text-green-600" />
                    Shopify Integration
                  </CardTitle>
                  <CardDescription>
                    Two methods: Liquid theme snippet for front-end tracking, or webhook-based server-side integration.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <Tabs defaultValue="snippet">
                    <TabsList>
                      <TabsTrigger value="snippet">Theme Snippet</TabsTrigger>
                      <TabsTrigger value="webhooks">Shopify Webhooks</TabsTrigger>
                    </TabsList>

                    <TabsContent value="snippet" className="space-y-4 mt-4">
                      <div>
                        <h4 className="font-semibold mb-2">Installation Steps</h4>
                        <ol className="space-y-2 text-sm">
                          <li className="flex gap-3">
                            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold shrink-0">1</span>
                            <span>In Shopify Admin, go to <strong>Online Store → Themes → Edit Code</strong></span>
                          </li>
                          <li className="flex gap-3">
                            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold shrink-0">2</span>
                            <span>Open <code className="bg-muted px-1 rounded">theme.liquid</code> and paste the snippet before <code className="bg-muted px-1 rounded">&lt;/body&gt;</code></span>
                          </li>
                          <li className="flex gap-3">
                            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold shrink-0">3</span>
                            <span>Replace <code className="bg-muted px-1 rounded">bz_your_api_key_here</code> with your actual API key</span>
                          </li>
                        </ol>
                      </div>
                      <div className="relative">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-semibold">Shopify Liquid Snippet</h4>
                          <Button size="sm" variant="outline" onClick={() => copyCode(shopifySnippetCode)}>
                            <Copy className="h-3 w-3 mr-1" /> Copy
                          </Button>
                        </div>
                        <pre className="bg-muted p-4 rounded-lg text-xs overflow-x-auto max-h-[500px]">
                          {shopifySnippetCode}
                        </pre>
                      </div>
                    </TabsContent>

                    <TabsContent value="webhooks" className="space-y-4 mt-4">
                      <div>
                        <h4 className="font-semibold mb-2">Shopify Webhook Setup</h4>
                        <p className="text-sm text-muted-foreground mb-3">
                          For server-side tracking (no theme code needed), configure Shopify webhooks to send events directly to our API.
                        </p>
                        <ol className="space-y-2 text-sm">
                          <li className="flex gap-3">
                            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold shrink-0">1</span>
                            <span>In Shopify Admin, go to <strong>Settings → Notifications → Webhooks</strong></span>
                          </li>
                          <li className="flex gap-3">
                            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold shrink-0">2</span>
                            <span>Create webhooks for these events with the URL below:</span>
                          </li>
                        </ol>
                        <div className="mt-3 bg-muted p-3 rounded-lg">
                          <p className="text-xs text-muted-foreground mb-1">Webhook URL:</p>
                          <div className="flex items-center gap-2">
                            <code className="text-sm flex-1 break-all">{API_BASE_URL}/webhooks/incoming?platform=shopify</code>
                            <Button size="sm" variant="ghost" onClick={() => copyCode(`${API_BASE_URL}/webhooks/incoming?platform=shopify`)}>
                              <Copy className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                        <div className="mt-3 space-y-2">
                          <h5 className="text-sm font-medium">Recommended webhook events:</h5>
                          {[
                            { event: "checkouts/create", desc: "Tracks checkout abandonment" },
                            { event: "orders/create", desc: "Tracks completed purchases" },
                            { event: "orders/paid", desc: "Confirms successful payment" },
                            { event: "orders/cancelled", desc: "Tracks order cancellations" },
                            { event: "customers/create", desc: "Auto-syncs new customers as contacts" },
                          ].map(w => (
                            <div key={w.event} className="flex items-center gap-3 p-2 border rounded text-sm">
                              <Badge variant="outline" className="font-mono text-xs shrink-0">{w.event}</Badge>
                              <span className="text-muted-foreground">{w.desc}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>

              {/* Webhook API (Universal) */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Globe className="h-5 w-5 text-blue-600" />
                    Universal Webhook Receiver
                  </CardTitle>
                  <CardDescription>
                    For any platform not listed above — send webhook events to our universal endpoint.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="bg-muted p-3 rounded-lg">
                    <p className="text-xs text-muted-foreground mb-1">Endpoint:</p>
                    <div className="flex items-center gap-2">
                      <code className="text-sm flex-1 break-all">POST {API_BASE_URL}/webhooks/incoming</code>
                      <Button size="sm" variant="ghost" onClick={() => copyCode(`POST ${API_BASE_URL}/webhooks/incoming`)}>
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2">Payload Format</h4>
                    <pre className="bg-muted p-4 rounded-lg text-sm overflow-x-auto">
{`{
  "platform": "custom",
  "event": "checkout.abandoned",
  "customer": {
    "email": "customer@example.com",
    "first_name": "Jane",
    "last_name": "Doe"
  },
  "data": {
    "cart_value": 129.99,
    "currency": "USD",
    "items": [
      { "name": "Product A", "price": 99.99, "quantity": 1 },
      { "name": "Product B", "price": 30.00, "quantity": 1 }
    ],
    "checkout_url": "https://yourstore.com/checkout/recover/abc123"
  }
}`}
                    </pre>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2">Supported Events</h4>
                    <div className="grid gap-2 md:grid-cols-2">
                      {[
                        { event: "checkout.abandoned", desc: "Customer left during checkout" },
                        { event: "cart.abandoned", desc: "Items left in cart" },
                        { event: "payment.failed", desc: "Payment attempt failed" },
                        { event: "order.completed", desc: "Order placed successfully" },
                        { event: "customer.created", desc: "New customer registered" },
                        { event: "product.viewed", desc: "Product page viewed" },
                      ].map(e => (
                        <div key={e.event} className="flex items-center gap-2 p-2 border rounded text-sm">
                          <Badge variant="secondary" className="font-mono text-xs shrink-0">{e.event}</Badge>
                          <span className="text-muted-foreground text-xs">{e.desc}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 rounded-lg p-4">
                    <h5 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">Authentication</h5>
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                      Include your API key as <code className="bg-blue-100 dark:bg-blue-900 px-1 rounded">x-api-key</code> header or <code className="bg-blue-100 dark:bg-blue-900 px-1 rounded">?api_key=bz_xxx</code> query parameter (for platforms that don't support custom headers).
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
