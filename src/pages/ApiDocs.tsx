import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Copy, ExternalLink, Key, Zap, List, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const API_BASE_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/public-api`;

const endpoints = [
  {
    method: "GET",
    path: "/health",
    description: "Check API status",
    auth: true,
    response: `{
  "status": "ok",
  "timestamp": "2024-01-15T10:30:00.000Z"
}`,
  },
  {
    method: "GET",
    path: "/workflows",
    description: "List all workflows",
    auth: true,
    params: [
      { name: "page", type: "number", description: "Page number (default: 1)" },
      { name: "limit", type: "number", description: "Items per page (default: 20, max: 100)" },
    ],
    response: `{
  "data": [
    {
      "id": "uuid",
      "name": "My Workflow",
      "description": "Workflow description",
      "is_active": true,
      "tags": ["automation", "api"],
      "version": 1,
      "created_at": "2024-01-15T10:30:00.000Z",
      "updated_at": "2024-01-15T10:30:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5
  }
}`,
  },
  {
    method: "GET",
    path: "/workflows/:id",
    description: "Get a specific workflow",
    auth: true,
    response: `{
  "data": {
    "id": "uuid",
    "name": "My Workflow",
    "description": "Workflow description",
    "is_active": true,
    "tags": ["automation", "api"],
    "version": 1,
    "created_at": "2024-01-15T10:30:00.000Z",
    "updated_at": "2024-01-15T10:30:00.000Z"
  }
}`,
  },
  {
    method: "POST",
    path: "/workflows/:id/execute",
    description: "Execute a workflow",
    auth: true,
    permissions: ["execute"],
    body: `{
  "input": {
    "key": "value",
    "data": { "nested": "object" }
  }
}`,
    response: `{
  "success": true,
  "executionId": "uuid",
  "output": {
    "result": "Workflow output data"
  },
  "logs": [
    {
      "nodeId": "node-1",
      "timestamp": "2024-01-15T10:30:00.000Z",
      "message": "Node executed",
      "level": "success"
    }
  ]
}`,
  },
  {
    method: "GET",
    path: "/executions",
    description: "List workflow executions",
    auth: true,
    params: [
      { name: "page", type: "number", description: "Page number (default: 1)" },
      { name: "limit", type: "number", description: "Items per page (default: 20, max: 100)" },
      { name: "workflow_id", type: "string", description: "Filter by workflow ID" },
      { name: "status", type: "string", description: "Filter by status (running, success, error)" },
    ],
    response: `{
  "data": [
    {
      "id": "uuid",
      "workflow_id": "uuid",
      "status": "success",
      "started_at": "2024-01-15T10:30:00.000Z",
      "finished_at": "2024-01-15T10:30:05.000Z",
      "error_message": null
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 50,
    "totalPages": 3
  }
}`,
  },
  {
    method: "GET",
    path: "/executions/:id",
    description: "Get execution details",
    auth: true,
    response: `{
  "data": {
    "id": "uuid",
    "workflow_id": "uuid",
    "status": "success",
    "input_data": {},
    "output_data": {},
    "logs": [],
    "started_at": "2024-01-15T10:30:00.000Z",
    "finished_at": "2024-01-15T10:30:05.000Z",
    "error_message": null
  }
}`,
  },
];

const codeExamples = {
  curl: (endpoint: typeof endpoints[0]) => `curl -X ${endpoint.method} \\
  "${API_BASE_URL}${endpoint.path}" \\
  -H "x-api-key: bz_your_api_key_here" \\
  -H "Content-Type: application/json"${endpoint.body ? ` \\
  -d '${endpoint.body.replace(/\n/g, '').replace(/\s+/g, ' ')}'` : ''}`,
  
  javascript: (endpoint: typeof endpoints[0]) => `const response = await fetch("${API_BASE_URL}${endpoint.path}", {
  method: "${endpoint.method}",
  headers: {
    "x-api-key": "bz_your_api_key_here",
    "Content-Type": "application/json"
  }${endpoint.body ? `,
  body: JSON.stringify(${endpoint.body})` : ''}
});

const data = await response.json();
console.log(data);`,
  
  python: (endpoint: typeof endpoints[0]) => `import requests

response = requests.${endpoint.method.toLowerCase()}(
    "${API_BASE_URL}${endpoint.path}",
    headers={
        "x-api-key": "bz_your_api_key_here",
        "Content-Type": "application/json"
    }${endpoint.body ? `,
    json=${endpoint.body.replace(/"/g, '\\"').replace(/\n/g, '')}` : ''}
)

data = response.json()
print(data)`,
};

export default function ApiDocs() {
  const { toast } = useToast();
  const [selectedEndpoint, setSelectedEndpoint] = useState(endpoints[0]);
  const [codeLanguage, setCodeLanguage] = useState<"curl" | "javascript" | "python">("curl");

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

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">API Documentation</h1>
            <p className="text-muted-foreground mt-1">
              Integrate BiztoriBD into your applications
            </p>
          </div>
          <Button variant="outline" asChild>
            <a href="/api-keys">
              <Key className="h-4 w-4 mr-2" />
              Manage API Keys
            </a>
          </Button>
        </div>

        {/* Quick Start */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-yellow-500" />
              Quick Start
            </CardTitle>
            <CardDescription>
              Get started with the BiztoriBD API in minutes
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="flex items-start gap-3 p-4 rounded-lg border">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold">
                  1
                </div>
                <div>
                  <h4 className="font-semibold">Create an API Key</h4>
                  <p className="text-sm text-muted-foreground">
                    Generate an API key from the API Keys page
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-4 rounded-lg border">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold">
                  2
                </div>
                <div>
                  <h4 className="font-semibold">Add to Headers</h4>
                  <p className="text-sm text-muted-foreground">
                    Include <code className="text-xs bg-muted px-1 rounded">x-api-key</code> in your requests
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-4 rounded-lg border">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold">
                  3
                </div>
                <div>
                  <h4 className="font-semibold">Make Requests</h4>
                  <p className="text-sm text-muted-foreground">
                    Start automating your workflows via API
                  </p>
                </div>
              </div>
            </div>

            <div className="p-4 bg-muted rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Base URL</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyCode(API_BASE_URL)}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              <code className="text-sm">{API_BASE_URL}</code>
            </div>
          </CardContent>
        </Card>

        {/* Authentication */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="h-5 w-5" />
              Authentication
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              All API requests require authentication using an API key. Include your key in the request headers:
            </p>
            <div className="bg-muted p-4 rounded-lg font-mono text-sm">
              <div className="text-muted-foreground"># Option 1: x-api-key header</div>
              <div>x-api-key: bz_your_api_key_here</div>
              <div className="mt-3 text-muted-foreground"># Option 2: Authorization header</div>
              <div>Authorization: Bearer bz_your_api_key_here</div>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span>API keys start with <code className="bg-muted px-1 rounded">bz_</code></span>
            </div>
          </CardContent>
        </Card>

        {/* Endpoints */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Endpoint List */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <List className="h-5 w-5" />
                Endpoints
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="space-y-1">
                {endpoints.map((endpoint, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedEndpoint(endpoint)}
                    className={`w-full flex items-center gap-2 px-4 py-3 text-left hover:bg-muted transition-colors ${
                      selectedEndpoint === endpoint ? "bg-muted" : ""
                    }`}
                  >
                    <Badge className={`${getMethodColor(endpoint.method)} text-white text-xs`}>
                      {endpoint.method}
                    </Badge>
                    <span className="text-sm font-mono">{endpoint.path}</span>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Endpoint Details */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <div className="flex items-center gap-3">
                <Badge className={`${getMethodColor(selectedEndpoint.method)} text-white`}>
                  {selectedEndpoint.method}
                </Badge>
                <code className="text-lg font-mono">{selectedEndpoint.path}</code>
              </div>
              <CardDescription>{selectedEndpoint.description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Parameters */}
              {selectedEndpoint.params && (
                <div>
                  <h4 className="font-semibold mb-2">Query Parameters</h4>
                  <div className="space-y-2">
                    {selectedEndpoint.params.map((param, i) => (
                      <div key={i} className="flex items-start gap-4 p-3 bg-muted rounded-lg">
                        <code className="text-sm font-semibold">{param.name}</code>
                        <Badge variant="outline" className="text-xs">{param.type}</Badge>
                        <span className="text-sm text-muted-foreground">{param.description}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Request Body */}
              {selectedEndpoint.body && (
                <div>
                  <h4 className="font-semibold mb-2">Request Body</h4>
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
                </div>
              )}

              {/* Code Examples */}
              <div>
                <h4 className="font-semibold mb-2">Code Examples</h4>
                <Tabs value={codeLanguage} onValueChange={(v) => setCodeLanguage(v as any)}>
                  <TabsList>
                    <TabsTrigger value="curl">cURL</TabsTrigger>
                    <TabsTrigger value="javascript">JavaScript</TabsTrigger>
                    <TabsTrigger value="python">Python</TabsTrigger>
                  </TabsList>
                  <TabsContent value="curl" className="relative">
                    <pre className="bg-muted p-4 rounded-lg text-sm overflow-x-auto mt-2">
                      {codeExamples.curl(selectedEndpoint)}
                    </pre>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="absolute top-4 right-2"
                      onClick={() => copyCode(codeExamples.curl(selectedEndpoint))}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </TabsContent>
                  <TabsContent value="javascript" className="relative">
                    <pre className="bg-muted p-4 rounded-lg text-sm overflow-x-auto mt-2">
                      {codeExamples.javascript(selectedEndpoint)}
                    </pre>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="absolute top-4 right-2"
                      onClick={() => copyCode(codeExamples.javascript(selectedEndpoint))}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </TabsContent>
                  <TabsContent value="python" className="relative">
                    <pre className="bg-muted p-4 rounded-lg text-sm overflow-x-auto mt-2">
                      {codeExamples.python(selectedEndpoint)}
                    </pre>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="absolute top-4 right-2"
                      onClick={() => copyCode(codeExamples.python(selectedEndpoint))}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </TabsContent>
                </Tabs>
              </div>

              {/* Response */}
              <div>
                <h4 className="font-semibold mb-2">Response</h4>
                <div className="relative">
                  <pre className="bg-muted p-4 rounded-lg text-sm overflow-x-auto">
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
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Rate Limiting */}
        <Card>
          <CardHeader>
            <CardTitle>Rate Limiting</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              API requests are rate limited based on your API key settings. Default limits are 1,000 requests per hour.
            </p>
            <div className="bg-muted p-4 rounded-lg">
              <h4 className="font-semibold mb-2">Response Headers</h4>
              <div className="space-y-1 font-mono text-sm">
                <div><span className="text-muted-foreground">X-RateLimit-Limit:</span> 1000</div>
                <div><span className="text-muted-foreground">X-RateLimit-Remaining:</span> 999</div>
                <div><span className="text-muted-foreground">X-RateLimit-Reset:</span> 1704110400</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Error Codes */}
        <Card>
          <CardHeader>
            <CardTitle>Error Codes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {[
                { code: 200, desc: "Success" },
                { code: 400, desc: "Bad Request - Invalid parameters" },
                { code: 401, desc: "Unauthorized - Invalid or missing API key" },
                { code: 403, desc: "Forbidden - Insufficient permissions" },
                { code: 404, desc: "Not Found - Resource doesn't exist" },
                { code: 429, desc: "Too Many Requests - Rate limit exceeded" },
                { code: 500, desc: "Internal Server Error" },
              ].map((errorItem) => (
                <div key={errorItem.code} className="flex items-center gap-4 p-3 rounded-lg border">
                  <Badge variant={errorItem.code < 400 ? "default" : "destructive"}>
                    {errorItem.code}
                  </Badge>
                  <span className="text-sm">{errorItem.desc}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
