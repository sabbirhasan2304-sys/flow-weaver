// API Docs - Centralized data definitions

import { API_ENDPOINT } from '@/config/brand';

// Display URL for docs (user-facing)
export const API_BASE_URL = `${API_ENDPOINT}/public-api`;

// Internal URL for actual API calls (playground)
export const INTERNAL_API_BASE_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/public-api`;

export interface EndpointParam {
  name: string;
  type: string;
  required?: boolean;
  default?: string;
  description: string;
}

export interface EndpointField {
  name: string;
  type: string;
  required?: boolean;
  description: string;
}

export interface EndpointError {
  code: number;
  message: string;
  description: string;
}

export interface Endpoint {
  method: string;
  path: string;
  description: string;
  summary?: string;
  auth: boolean;
  permissions: string[];
  rateLimit?: string;
  category?: string;
  params?: EndpointParam[];
  pathParams?: EndpointParam[];
  body?: string;
  bodyFields?: EndpointField[];
  response: string;
  responseFields?: EndpointField[];
  errors?: EndpointError[];
}

// Endpoint categories for grouping
export const endpointCategories = [
  { id: "workflows", label: "Workflows", icon: "Zap" },
  { id: "executions", label: "Executions", icon: "Play" },
  { id: "contacts", label: "Contacts & Lists", icon: "Users" },
  { id: "campaigns", label: "Campaigns", icon: "Mail" },
  { id: "triggers", label: "Triggers & Tracking", icon: "Target" },
  { id: "webhooks", label: "Webhooks", icon: "Globe" },
  { id: "system", label: "System", icon: "Settings" },
];

export const endpoints: Endpoint[] = [
  // System
  {
    method: "GET",
    path: "/health",
    description: "Check API status and connectivity",
    summary: "Returns the current health status of the API. Use this endpoint to verify your API key is working and the service is available.",
    auth: true,
    permissions: ["read"],
    rateLimit: "No limit",
    category: "system",
    response: `{
  "status": "ok",
  "timestamp": "2024-01-15T10:30:00.000Z"
}`,
    responseFields: [
      { name: "status", type: "string", description: "API health status. Will be 'ok' if the service is running normally." },
      { name: "timestamp", type: "string (ISO 8601)", description: "Current server timestamp in UTC." },
    ],
  },
  // Workflows
  {
    method: "GET",
    path: "/workflows",
    description: "List all workflows",
    summary: "Retrieves a paginated list of all workflows in workspaces accessible to your API key. Supports filtering and pagination.",
    auth: true,
    permissions: ["read"],
    rateLimit: "100 req/hr",
    category: "workflows",
    params: [
      { name: "page", type: "integer", required: false, default: "1", description: "Page number for pagination." },
      { name: "limit", type: "integer", required: false, default: "20", description: "Items per page. Max: 100." },
    ],
    response: `{
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "Email Notification Workflow",
      "description": "Sends automated email notifications",
      "is_active": true,
      "tags": ["automation", "email"],
      "version": 3,
      "created_at": "2024-01-10T08:00:00.000Z",
      "updated_at": "2024-01-15T10:30:00.000Z"
    }
  ],
  "pagination": { "page": 1, "limit": 20, "total": 45, "totalPages": 3 }
}`,
    responseFields: [
      { name: "data", type: "array", description: "Array of workflow objects." },
      { name: "data[].id", type: "UUID", description: "Unique workflow identifier." },
      { name: "data[].name", type: "string", description: "Workflow name." },
      { name: "data[].is_active", type: "boolean", description: "Whether workflow can be executed." },
      { name: "data[].version", type: "integer", description: "Version number." },
      { name: "pagination", type: "object", description: "Pagination metadata." },
    ],
  },
  {
    method: "GET",
    path: "/workflows/:id",
    description: "Get workflow details",
    summary: "Retrieves detailed information about a single workflow including its configuration and metadata.",
    auth: true,
    permissions: ["read"],
    rateLimit: "100 req/hr",
    category: "workflows",
    pathParams: [
      { name: "id", type: "UUID", required: true, description: "The unique identifier of the workflow." },
    ],
    response: `{
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "Email Notification Workflow",
    "description": "Sends automated email notifications",
    "is_active": true,
    "tags": ["automation", "email"],
    "version": 3,
    "created_at": "2024-01-10T08:00:00.000Z",
    "updated_at": "2024-01-15T10:30:00.000Z"
  }
}`,
    responseFields: [
      { name: "data", type: "object", description: "The workflow object with full details." },
    ],
    errors: [
      { code: 404, message: "Workflow not found", description: "The specified workflow ID does not exist or you don't have access." },
    ],
  },
  {
    method: "POST",
    path: "/workflows",
    description: "Create a new workflow",
    summary: "Create a new workflow with a name, description, and optional configuration.",
    auth: true,
    permissions: ["write"],
    rateLimit: "50 req/hr",
    category: "workflows",
    body: `{
  "name": "My New Workflow",
  "description": "Automated order processing",
  "tags": ["orders", "automation"],
  "is_active": false
}`,
    bodyFields: [
      { name: "name", type: "string", required: true, description: "Workflow name." },
      { name: "description", type: "string", required: false, description: "Workflow description." },
      { name: "tags", type: "array<string>", required: false, description: "Tags for categorization." },
      { name: "is_active", type: "boolean", required: false, description: "Whether to activate immediately. Default: false." },
    ],
    response: `{
  "data": {
    "id": "new-workflow-uuid",
    "name": "My New Workflow",
    "is_active": false,
    "version": 1,
    "created_at": "2024-01-15T10:30:00.000Z"
  },
  "message": "Workflow created"
}`,
    responseFields: [
      { name: "data", type: "object", description: "The newly created workflow." },
    ],
  },
  {
    method: "PUT",
    path: "/workflows/:id",
    description: "Update a workflow",
    summary: "Update an existing workflow's name, description, tags, or active status.",
    auth: true,
    permissions: ["write"],
    rateLimit: "50 req/hr",
    category: "workflows",
    pathParams: [
      { name: "id", type: "UUID", required: true, description: "Workflow ID to update." },
    ],
    body: `{
  "name": "Updated Workflow Name",
  "is_active": true
}`,
    bodyFields: [
      { name: "name", type: "string", required: false, description: "New workflow name." },
      { name: "description", type: "string", required: false, description: "New description." },
      { name: "is_active", type: "boolean", required: false, description: "Activate or deactivate." },
    ],
    response: `{
  "data": { "id": "...", "name": "Updated Workflow Name", "is_active": true, "version": 4 },
  "message": "Workflow updated"
}`,
    responseFields: [],
    errors: [
      { code: 404, message: "Workflow not found", description: "Workflow doesn't exist or no access." },
    ],
  },
  {
    method: "DELETE",
    path: "/workflows/:id",
    description: "Delete a workflow",
    summary: "Permanently delete a workflow and all associated execution history.",
    auth: true,
    permissions: ["write"],
    rateLimit: "50 req/hr",
    category: "workflows",
    pathParams: [
      { name: "id", type: "UUID", required: true, description: "Workflow ID to delete." },
    ],
    response: `{ "message": "Workflow deleted" }`,
    responseFields: [],
    errors: [
      { code: 404, message: "Workflow not found", description: "Workflow doesn't exist or no access." },
    ],
  },
  {
    method: "POST",
    path: "/workflows/:id/execute",
    description: "Execute a workflow",
    summary: "Triggers execution of a workflow with optional input data. The workflow must be active. Returns execution result including output data and logs.",
    auth: true,
    permissions: ["execute"],
    rateLimit: "50 req/hr",
    category: "workflows",
    pathParams: [
      { name: "id", type: "UUID", required: true, description: "Workflow ID to execute." },
    ],
    body: `{
  "input": {
    "email": "user@example.com",
    "subject": "Welcome!",
    "template": "welcome_email",
    "data": { "firstName": "John", "company": "Acme Inc" }
  }
}`,
    bodyFields: [
      { name: "input", type: "object", required: false, description: "Input data to pass to the workflow." },
    ],
    response: `{
  "success": true,
  "executionId": "770e8400-e29b-41d4-a716-446655440222",
  "status": "completed",
  "duration_ms": 2340,
  "output": { "emailSent": true, "messageId": "msg_abc123" },
  "logs": [
    { "nodeId": "trigger-1", "nodeName": "HTTP Trigger", "timestamp": "2024-01-15T10:30:00.000Z", "message": "Workflow triggered via API", "level": "info" },
    { "nodeId": "email-1", "nodeName": "Send Email", "timestamp": "2024-01-15T10:30:02.000Z", "message": "Email sent successfully", "level": "success" }
  ]
}`,
    responseFields: [
      { name: "success", type: "boolean", description: "Whether execution completed successfully." },
      { name: "executionId", type: "UUID", description: "Unique execution identifier." },
      { name: "status", type: "string", description: "Execution status: completed, failed, or running." },
      { name: "duration_ms", type: "integer", description: "Total execution time in milliseconds." },
      { name: "output", type: "object", description: "Output data produced by the workflow." },
      { name: "logs", type: "array", description: "Array of node-level log entries." },
    ],
    errors: [
      { code: 403, message: "Permission denied", description: "API key lacks execute permission." },
      { code: 400, message: "Workflow is not active", description: "Activate the workflow before executing." },
    ],
  },
  {
    method: "POST",
    path: "/workflows/:id/clone",
    description: "Clone a workflow",
    summary: "Create a copy of an existing workflow with a new name.",
    auth: true,
    permissions: ["write"],
    rateLimit: "50 req/hr",
    category: "workflows",
    pathParams: [
      { name: "id", type: "UUID", required: true, description: "Workflow ID to clone." },
    ],
    body: `{ "name": "My Workflow (Copy)" }`,
    bodyFields: [
      { name: "name", type: "string", required: false, description: "Name for the cloned workflow." },
    ],
    response: `{
  "data": { "id": "new-uuid", "name": "My Workflow (Copy)", "version": 1 },
  "message": "Workflow cloned"
}`,
    responseFields: [],
  },
  {
    method: "GET",
    path: "/workflows/:id/stats",
    description: "Get workflow statistics",
    summary: "Retrieve execution statistics, success rates, and performance metrics for a specific workflow.",
    auth: true,
    permissions: ["read"],
    rateLimit: "100 req/hr",
    category: "workflows",
    pathParams: [
      { name: "id", type: "UUID", required: true, description: "Workflow ID." },
    ],
    response: `{
  "data": {
    "total_executions": 156,
    "success": 142,
    "failed": 14,
    "avg_duration_ms": 2150,
    "last_executed": "2024-01-15T10:30:00.000Z"
  }
}`,
    responseFields: [
      { name: "data.total_executions", type: "integer", description: "Total number of executions." },
      { name: "data.success", type: "integer", description: "Successful executions count." },
      { name: "data.failed", type: "integer", description: "Failed executions count." },
      { name: "data.avg_duration_ms", type: "integer", description: "Average execution duration." },
    ],
  },
  // Executions
  {
    method: "GET",
    path: "/executions",
    description: "List execution history",
    summary: "Retrieves a paginated list of all workflow executions. Supports filtering by workflow ID and status.",
    auth: true,
    permissions: ["read"],
    rateLimit: "100 req/hr",
    category: "executions",
    params: [
      { name: "page", type: "integer", required: false, default: "1", description: "Page number." },
      { name: "limit", type: "integer", required: false, default: "20", description: "Items per page (max 100)." },
      { name: "workflow_id", type: "UUID", required: false, description: "Filter by workflow ID." },
      { name: "status", type: "string", required: false, description: "Filter: running, success, error, pending." },
    ],
    response: `{
  "data": [
    {
      "id": "880e8400-...",
      "workflow_id": "550e8400-...",
      "status": "success",
      "started_at": "2024-01-15T10:30:00.000Z",
      "finished_at": "2024-01-15T10:30:02.340Z",
      "error_message": null
    }
  ],
  "pagination": { "page": 1, "limit": 20, "total": 156, "totalPages": 8 }
}`,
    responseFields: [
      { name: "data[].id", type: "UUID", description: "Execution identifier." },
      { name: "data[].status", type: "string", description: "Execution status." },
      { name: "data[].error_message", type: "string | null", description: "Error message if failed." },
    ],
  },
  {
    method: "GET",
    path: "/executions/:id",
    description: "Get execution details",
    summary: "Retrieves complete details of a specific execution including input/output data and full logs.",
    auth: true,
    permissions: ["read"],
    rateLimit: "100 req/hr",
    category: "executions",
    pathParams: [
      { name: "id", type: "UUID", required: true, description: "Execution ID." },
    ],
    response: `{
  "data": {
    "id": "880e8400-...",
    "workflow_id": "550e8400-...",
    "status": "success",
    "input_data": { "email": "user@example.com" },
    "output_data": { "emailSent": true },
    "logs": [
      { "nodeId": "trigger-1", "nodeName": "HTTP Trigger", "timestamp": "2024-01-15T10:30:00.000Z", "message": "Workflow triggered", "level": "info" }
    ],
    "started_at": "2024-01-15T10:30:00.000Z",
    "finished_at": "2024-01-15T10:30:02.340Z"
  }
}`,
    responseFields: [
      { name: "data.input_data", type: "object", description: "Input data passed to the workflow." },
      { name: "data.output_data", type: "object", description: "Output data produced." },
      { name: "data.logs", type: "array", description: "Complete node-level execution logs." },
    ],
    errors: [
      { code: 404, message: "Execution not found", description: "Execution ID doesn't exist or no access." },
    ],
  },
  {
    method: "GET",
    path: "/executions/:id/logs",
    description: "Get execution logs",
    summary: "Retrieve only the log entries for a specific execution, useful for debugging.",
    auth: true,
    permissions: ["read"],
    rateLimit: "100 req/hr",
    category: "executions",
    pathParams: [
      { name: "id", type: "UUID", required: true, description: "Execution ID." },
    ],
    response: `{
  "data": [
    { "nodeId": "trigger-1", "nodeName": "HTTP Trigger", "timestamp": "...", "message": "Workflow triggered", "level": "info" },
    { "nodeId": "email-1", "nodeName": "Send Email", "timestamp": "...", "message": "Email sent", "level": "success" }
  ]
}`,
    responseFields: [],
  },
  {
    method: "POST",
    path: "/executions/:id/retry",
    description: "Retry failed execution",
    summary: "Retry a failed workflow execution with the same or modified input data.",
    auth: true,
    permissions: ["execute"],
    rateLimit: "50 req/hr",
    category: "executions",
    pathParams: [
      { name: "id", type: "UUID", required: true, description: "Failed execution ID to retry." },
    ],
    body: `{ "modified_input": { "email": "new@example.com" } }`,
    bodyFields: [
      { name: "modified_input", type: "object", required: false, description: "Optional modified input data. Uses original input if not provided." },
    ],
    response: `{
  "success": true,
  "executionId": "new-execution-uuid",
  "status": "completed"
}`,
    responseFields: [],
  },
  // Contacts & Lists
  {
    method: "POST",
    path: "/contacts",
    description: "Create a contact",
    summary: "Add a new contact to your email marketing list. Contacts are automatically de-duplicated by email.",
    auth: true,
    permissions: ["write"],
    rateLimit: "100 req/hr",
    category: "contacts",
    body: `{
  "email": "john@example.com",
  "first_name": "John",
  "last_name": "Doe",
  "phone": "+1234567890",
  "company": "Acme Inc",
  "source": "website",
  "custom_fields": { "plan": "pro" }
}`,
    bodyFields: [
      { name: "email", type: "string", required: true, description: "Contact email address." },
      { name: "first_name", type: "string", required: false, description: "First name." },
      { name: "last_name", type: "string", required: false, description: "Last name." },
      { name: "phone", type: "string", required: false, description: "Phone number." },
      { name: "company", type: "string", required: false, description: "Company name." },
      { name: "source", type: "string", required: false, description: "Acquisition source." },
      { name: "custom_fields", type: "object", required: false, description: "Custom key-value data." },
    ],
    response: `{
  "data": { "id": "...", "email": "john@example.com", "status": "subscribed", "created_at": "..." },
  "message": "Contact created"
}`,
    responseFields: [
      { name: "data.id", type: "UUID", description: "Contact identifier." },
      { name: "data.status", type: "string", description: "Subscription status." },
    ],
  },
  {
    method: "GET",
    path: "/contacts",
    description: "List contacts",
    summary: "Retrieve a paginated list of contacts with filtering by status or search.",
    auth: true,
    permissions: ["read"],
    rateLimit: "100 req/hr",
    category: "contacts",
    params: [
      { name: "page", type: "integer", required: false, default: "1", description: "Page number." },
      { name: "limit", type: "integer", required: false, default: "20", description: "Items per page." },
      { name: "status", type: "string", required: false, description: "Filter: subscribed, unsubscribed, bounced." },
      { name: "search", type: "string", required: false, description: "Search by email or name." },
    ],
    response: `{
  "data": [{ "id": "...", "email": "john@example.com", "first_name": "John", "status": "subscribed" }],
  "pagination": { "page": 1, "limit": 20, "total": 150, "totalPages": 8 }
}`,
    responseFields: [],
  },
  {
    method: "POST",
    path: "/lists",
    description: "Create a mailing list",
    summary: "Create a new mailing list to organize contacts into segments.",
    auth: true,
    permissions: ["write"],
    rateLimit: "100 req/hr",
    category: "contacts",
    body: `{ "name": "Newsletter Subscribers", "description": "Weekly newsletter recipients" }`,
    bodyFields: [
      { name: "name", type: "string", required: true, description: "List name." },
      { name: "description", type: "string", required: false, description: "List description." },
    ],
    response: `{
  "data": { "id": "...", "name": "Newsletter Subscribers", "subscriber_count": 0 },
  "message": "List created"
}`,
    responseFields: [],
  },
  {
    method: "POST",
    path: "/lists/:id/subscribe",
    description: "Subscribe to list",
    summary: "Add a contact to a mailing list. Contact is auto-created if email doesn't exist.",
    auth: true,
    permissions: ["write"],
    rateLimit: "100 req/hr",
    category: "contacts",
    pathParams: [
      { name: "id", type: "UUID", required: true, description: "List ID." },
    ],
    body: `{ "email": "john@example.com" }`,
    bodyFields: [
      { name: "email", type: "string", required: false, description: "Email address." },
      { name: "contact_id", type: "UUID", required: false, description: "Existing contact ID." },
    ],
    response: `{ "message": "Subscribed successfully", "contact_id": "..." }`,
    responseFields: [],
  },
  // Campaigns
  {
    method: "POST",
    path: "/campaigns",
    description: "Create a campaign",
    summary: "Create a draft email campaign with HTML content, subject, and target list.",
    auth: true,
    permissions: ["write"],
    rateLimit: "50 req/hr",
    category: "campaigns",
    body: `{
  "name": "January Newsletter",
  "subject": "Your January Update",
  "from_email": "hello@yourstore.com",
  "from_name": "Your Store",
  "html_content": "<h1>Hello {{first_name}}!</h1><p>Here's your update...</p>",
  "list_id": "list-uuid-here"
}`,
    bodyFields: [
      { name: "name", type: "string", required: true, description: "Campaign name." },
      { name: "subject", type: "string", required: false, description: "Email subject line." },
      { name: "from_email", type: "string", required: false, description: "Sender email." },
      { name: "html_content", type: "string", required: false, description: "HTML email body. Supports merge tags." },
      { name: "list_id", type: "UUID", required: false, description: "Target mailing list." },
    ],
    response: `{
  "data": { "id": "...", "name": "January Newsletter", "status": "draft" },
  "message": "Campaign created"
}`,
    responseFields: [],
  },
  {
    method: "POST",
    path: "/campaigns/:id/send",
    description: "Send a campaign",
    summary: "Initiate sending a draft campaign to all contacts in the target list.",
    auth: true,
    permissions: ["execute"],
    rateLimit: "10 req/hr",
    category: "campaigns",
    pathParams: [
      { name: "id", type: "UUID", required: true, description: "Campaign ID." },
    ],
    response: `{ "message": "Campaign sending initiated" }`,
    responseFields: [],
    errors: [
      { code: 400, message: "Campaign must be in draft status", description: "Only draft campaigns can be sent." },
    ],
  },
  // Triggers & Tracking
  {
    method: "POST",
    path: "/triggers/checkout-abandon",
    description: "Checkout abandonment event",
    summary: "Track when a user fills out checkout details but leaves without completing. Triggers automated recovery workflows.",
    auth: true,
    permissions: ["execute"],
    rateLimit: "200 req/hr",
    category: "triggers",
    body: `{
  "email": "customer@example.com",
  "first_name": "Jane",
  "cart_value": 129.99,
  "checkout_step": "payment",
  "items": [
    { "name": "Premium Widget", "price": 49.99, "quantity": 2 },
    { "name": "Accessory Pack", "price": 30.01, "quantity": 1 }
  ]
}`,
    bodyFields: [
      { name: "email", type: "string", required: true, description: "Customer email." },
      { name: "cart_value", type: "number", required: false, description: "Total cart value." },
      { name: "checkout_step", type: "string", required: false, description: "Where they stopped: shipping, payment, review." },
      { name: "items", type: "array", required: false, description: "Cart items." },
    ],
    response: `{
  "message": "Checkout abandonment event recorded",
  "contact_id": "...",
  "trigger_type": "checkout_abandon"
}`,
    responseFields: [],
  },
  {
    method: "POST",
    path: "/triggers/payment-failure",
    description: "Payment failure event",
    summary: "Track when a payment attempt fails. Sends recovery email with retry link.",
    auth: true,
    permissions: ["execute"],
    rateLimit: "200 req/hr",
    category: "triggers",
    body: `{
  "email": "customer@example.com",
  "order_id": "ORD-12345",
  "amount": 89.99,
  "error_code": "card_declined",
  "retry_url": "https://yourstore.com/checkout/retry?order=ORD-12345"
}`,
    bodyFields: [
      { name: "email", type: "string", required: true, description: "Customer email." },
      { name: "order_id", type: "string", required: false, description: "Order reference." },
      { name: "amount", type: "number", required: false, description: "Failed payment amount." },
      { name: "error_code", type: "string", required: false, description: "Gateway error code." },
      { name: "retry_url", type: "string", required: false, description: "Payment retry URL." },
    ],
    response: `{
  "message": "Payment failure event recorded",
  "contact_id": "...",
  "trigger_type": "payment_failure"
}`,
    responseFields: [],
  },
  {
    method: "POST",
    path: "/triggers/cart-abandon",
    description: "Cart abandonment event",
    summary: "Track when a user adds items to cart but leaves without proceeding to checkout.",
    auth: true,
    permissions: ["execute"],
    rateLimit: "200 req/hr",
    category: "triggers",
    body: `{
  "email": "shopper@example.com",
  "cart_total": 75.50,
  "items": [{ "name": "Running Shoes", "price": 75.50, "quantity": 1 }]
}`,
    bodyFields: [
      { name: "email", type: "string", required: true, description: "Customer email." },
      { name: "cart_total", type: "number", required: false, description: "Total cart value." },
      { name: "items", type: "array", required: false, description: "Cart items." },
    ],
    response: `{ "message": "Cart abandonment event recorded", "contact_id": "...", "trigger_type": "cart_abandon" }`,
    responseFields: [],
  },
  {
    method: "POST",
    path: "/track/pageview",
    description: "Track page view",
    summary: "Record page views for behavior-based segmentation and browse abandonment triggers.",
    auth: true,
    permissions: ["execute"],
    rateLimit: "500 req/hr",
    category: "triggers",
    body: `{
  "page_url": "https://yourstore.com/products/widget",
  "referrer": "https://google.com",
  "contact_email": "visitor@example.com"
}`,
    bodyFields: [
      { name: "page_url", type: "string", required: false, description: "Page URL." },
      { name: "referrer", type: "string", required: false, description: "Referrer URL." },
      { name: "contact_email", type: "string", required: false, description: "Email if known." },
    ],
    response: `{ "message": "Pageview tracked" }`,
    responseFields: [],
  },
  // Webhooks
  {
    method: "POST",
    path: "/webhooks/incoming",
    description: "Universal webhook receiver",
    summary: "Receive webhook events from any external platform (Shopify, WooCommerce, custom). Normalizes and routes events to internal triggers.",
    auth: true,
    permissions: ["execute"],
    rateLimit: "500 req/hr",
    category: "webhooks",
    params: [
      { name: "platform", type: "string", required: false, description: "Platform identifier: shopify, woocommerce, custom." },
      { name: "api_key", type: "string", required: false, description: "Alternative auth via query param for platforms without custom headers." },
    ],
    body: `{
  "platform": "custom",
  "event": "checkout.abandoned",
  "customer": { "email": "customer@example.com", "first_name": "Jane" },
  "data": {
    "cart_value": 129.99,
    "items": [{ "name": "Product A", "price": 99.99, "quantity": 1 }]
  }
}`,
    bodyFields: [
      { name: "platform", type: "string", required: false, description: "Platform identifier." },
      { name: "event", type: "string", required: true, description: "Event type: checkout.abandoned, payment.failed, order.completed, customer.created." },
      { name: "customer", type: "object", required: false, description: "Customer data with email, name, phone." },
      { name: "data", type: "object", required: false, description: "Event-specific data." },
    ],
    response: `{ "message": "Webhook processed", "event_type": "checkout_abandon", "contact_id": "..." }`,
    responseFields: [],
  },
  // Batch & Usage
  {
    method: "POST",
    path: "/batch/execute",
    description: "Batch execute workflows",
    summary: "Execute multiple workflows in a single API call for efficient bulk operations.",
    auth: true,
    permissions: ["execute"],
    rateLimit: "20 req/hr",
    category: "workflows",
    body: `{
  "operations": [
    { "action": "execute", "workflow_id": "uuid-1", "input": { "email": "a@test.com" } },
    { "action": "execute", "workflow_id": "uuid-2", "input": { "email": "b@test.com" } }
  ],
  "continue_on_error": true
}`,
    bodyFields: [
      { name: "operations", type: "array", required: true, description: "Array of workflow operations." },
      { name: "continue_on_error", type: "boolean", required: false, description: "Continue if one fails. Default: true." },
    ],
    response: `{
  "results": [
    { "workflow_id": "uuid-1", "status": "completed", "execution_id": "..." },
    { "workflow_id": "uuid-2", "status": "completed", "execution_id": "..." }
  ],
  "summary": { "total": 2, "success": 2, "failed": 0 }
}`,
    responseFields: [],
  },
  {
    method: "GET",
    path: "/usage/summary",
    description: "API usage summary",
    summary: "Get your API usage statistics including credit balance, API calls, and rate limit info.",
    auth: true,
    permissions: ["read"],
    rateLimit: "100 req/hr",
    category: "system",
    response: `{
  "data": {
    "credits_remaining": 850,
    "credits_used_today": 150,
    "api_calls_today": 342,
    "api_calls_this_month": 5420,
    "rate_limit": 1000,
    "rate_limit_remaining": 658
  }
}`,
    responseFields: [
      { name: "data.credits_remaining", type: "integer", description: "Available credits." },
      { name: "data.api_calls_today", type: "integer", description: "API calls made today." },
    ],
  },
  {
    method: "GET",
    path: "/credentials",
    description: "List credentials",
    summary: "List all stored credentials (names and types only, not secrets) for use in workflow integrations.",
    auth: true,
    permissions: ["read"],
    rateLimit: "100 req/hr",
    category: "system",
    response: `{
  "data": [
    { "id": "...", "name": "My OpenAI Key", "type": "openai", "created_at": "..." },
    { "id": "...", "name": "Slack Bot Token", "type": "slack", "created_at": "..." }
  ]
}`,
    responseFields: [],
  },
  {
    method: "GET",
    path: "/templates",
    description: "List workflow templates",
    summary: "Browse available workflow templates that can be used to create new workflows quickly.",
    auth: true,
    permissions: ["read"],
    rateLimit: "100 req/hr",
    category: "system",
    response: `{
  "data": [
    { "id": "...", "name": "Email Drip Campaign", "category": "marketing", "description": "...", "use_count": 234 }
  ]
}`,
    responseFields: [],
  },
];

export const errorCodes = [
  { code: 400, name: "Bad Request", description: "Malformed or missing required parameters.", fix: "Check request body and params match expected format." },
  { code: 401, name: "Unauthorized", description: "No API key provided or key is invalid.", fix: "Include a valid API key in x-api-key header or Authorization: Bearer header." },
  { code: 403, name: "Forbidden", description: "API key lacks required permissions.", fix: "Update API key permissions or use a key with appropriate access." },
  { code: 404, name: "Not Found", description: "Resource doesn't exist or no access.", fix: "Verify the resource ID and your API key's workspace access." },
  { code: 429, name: "Too Many Requests", description: "Rate limit exceeded.", fix: "Wait for reset or upgrade your API key's rate limit." },
  { code: 500, name: "Internal Server Error", description: "Unexpected server error.", fix: "Retry the request. Contact support if persistent." },
];

export const sdkExamples = {
  javascript: `import { BiztoriBD } from '@biztoribbd/sdk';

const client = new BiztoriBD({
  apiKey: process.env.BIZTORIBBD_API_KEY
});

// List workflows
const workflows = await client.workflows.list({ limit: 10 });
console.log(workflows.data);

// Execute a workflow
const result = await client.workflows.execute('workflow-id', {
  input: { email: 'user@example.com', data: { name: 'John' } }
});
console.log(result.output);

// Get execution details
const execution = await client.executions.get('execution-id');
console.log(execution.logs);`,

  typescript: `import { BiztoriBD, Workflow, Execution } from '@biztoribbd/sdk';

const client = new BiztoriBD({
  apiKey: process.env.BIZTORIBBD_API_KEY!
});

// Execute with typed input/output
interface EmailInput { email: string; subject: string; template: string; }
interface EmailOutput { emailSent: boolean; messageId: string; }

const result = await client.workflows.execute<EmailInput, EmailOutput>(
  'workflow-id',
  { input: { email: 'user@example.com', subject: 'Hello', template: 'welcome' } }
);
console.log(result.output.messageId);`,

  python: `from biztoribbd import BiztoriBD
import os

client = BiztoriBD(api_key=os.environ['BIZTORIBBD_API_KEY'])

# List workflows
workflows = client.workflows.list(limit=10)
for workflow in workflows.data:
    print(f"{workflow.name} - Active: {workflow.is_active}")

# Execute a workflow
result = client.workflows.execute(
    workflow_id='workflow-id',
    input={'email': 'user@example.com', 'data': {'name': 'John'}}
)
print(f"Success: {result.success}, Output: {result.output}")`,

  php: `<?php
use BiztoriBD\\Client;

$client = new Client(['api_key' => getenv('BIZTORIBBD_API_KEY')]);

// List workflows
$workflows = $client->workflows->list(['limit' => 10]);
foreach ($workflows->data as $workflow) {
    echo "{$workflow->name} - Active: " . ($workflow->is_active ? 'Yes' : 'No') . "\\n";
}

// Execute a workflow
$result = $client->workflows->execute('workflow-id', [
    'input' => ['email' => 'user@example.com', 'data' => ['name' => 'John']]
]);
echo "Success: " . ($result->success ? 'Yes' : 'No') . "\\n";`,

  go: `package main

import (
    "fmt"
    "os"
    "github.com/biztoribbd/go-sdk"
)

func main() {
    client := biztoribbd.NewClient(os.Getenv("BIZTORIBBD_API_KEY"))

    workflows, err := client.Workflows.List(&biztoribbd.ListOptions{Limit: 10})
    if err != nil { panic(err) }

    for _, workflow := range workflows.Data {
        fmt.Printf("%s - Active: %v\\n", workflow.Name, workflow.IsActive)
    }

    result, err := client.Workflows.Execute("workflow-id", &biztoribbd.ExecuteInput{
        Input: map[string]interface{}{"email": "user@example.com"},
    })
    if err != nil { panic(err) }
    fmt.Printf("Success: %v\\n", result.Success)
}`,
};

// Code examples generator
export const generateCodeExample = (endpoint: Endpoint, language: string): string => {
  const url = `${API_BASE_URL}${endpoint.path.replace(':id', '{id}')}`;
  
  switch (language) {
    case "curl": {
      let code = `curl -X ${endpoint.method} \\\n  "${url}" \\\n  -H "x-api-key: bz_your_api_key_here" \\\n  -H "Content-Type: application/json"`;
      if (endpoint.body) code += ` \\\n  -d '${endpoint.body.replace(/\n/g, '').replace(/\s+/g, ' ')}'`;
      return code;
    }
    case "javascript": {
      let code = `const response = await fetch("${url}", {\n  method: "${endpoint.method}",\n  headers: {\n    "x-api-key": "bz_your_api_key_here",\n    "Content-Type": "application/json"\n  }`;
      if (endpoint.body) code += `,\n  body: JSON.stringify(${endpoint.body})`;
      code += `\n});\n\nconst data = await response.json();\nconsole.log(data);`;
      return code;
    }
    case "python": {
      let code = `import requests\n\nresponse = requests.${endpoint.method.toLowerCase()}(\n    "${url}",\n    headers={"x-api-key": "bz_your_api_key_here"}`;
      if (endpoint.body) code += `,\n    json=${endpoint.body.replace(/\n/g, '').replace(/\s+/g, ' ')}`;
      code += `\n)\n\nprint(response.json())`;
      return code;
    }
    case "php": {
      let code = `<?php\n$ch = curl_init("${url}");\ncurl_setopt_array($ch, [\n    CURLOPT_RETURNTRANSFER => true,\n    CURLOPT_HTTPHEADER => ["x-api-key: bz_your_api_key_here", "Content-Type: application/json"],\n    CURLOPT_CUSTOMREQUEST => "${endpoint.method}"`;
      if (endpoint.body) code += `,\n    CURLOPT_POSTFIELDS => json_encode(${endpoint.body.replace(/\n/g, '').replace(/\s+/g, ' ')})`;
      code += `\n]);\n$response = curl_exec($ch);\ncurl_close($ch);\necho $response;`;
      return code;
    }
    default:
      return "";
  }
};
