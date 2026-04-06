import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Play, Loader2, Copy, CheckCircle, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { endpoints, INTERNAL_API_BASE_URL, type Endpoint } from "./apiDocsData";

export function ApiPlayground() {
  const { toast } = useToast();
  const [apiKey, setApiKey] = useState("");
  const [selectedEndpoint, setSelectedEndpoint] = useState<Endpoint>(endpoints[0]);
  const [pathParamValues, setPathParamValues] = useState<Record<string, string>>({});
  const [queryParamValues, setQueryParamValues] = useState<Record<string, string>>({});
  const [requestBody, setRequestBody] = useState("");
  const [response, setResponse] = useState<{ status: number; body: string; time: number } | null>(null);
  const [loading, setLoading] = useState(false);

  const handleEndpointChange = (path: string) => {
    const ep = endpoints.find(e => `${e.method} ${e.path}` === path);
    if (ep) {
      setSelectedEndpoint(ep);
      setRequestBody(ep.body || "");
      setResponse(null);
      setPathParamValues({});
      setQueryParamValues({});
    }
  };

  const buildUrl = () => {
    let url = `${API_BASE_URL}${selectedEndpoint.path}`;
    // Replace path params
    selectedEndpoint.pathParams?.forEach(p => {
      url = url.replace(`:${p.name}`, pathParamValues[p.name] || `{${p.name}}`);
    });
    // Add query params
    const queryParts = Object.entries(queryParamValues).filter(([, v]) => v);
    if (queryParts.length > 0) {
      url += "?" + queryParts.map(([k, v]) => `${k}=${encodeURIComponent(v)}`).join("&");
    }
    return url;
  };

  const handleSend = async () => {
    if (!apiKey) {
      toast({ title: "API Key Required", description: "Enter your API key to make requests.", variant: "destructive" });
      return;
    }
    setLoading(true);
    const start = Date.now();
    try {
      const url = buildUrl();
      const options: RequestInit = {
        method: selectedEndpoint.method,
        headers: {
          "x-api-key": apiKey,
          "Content-Type": "application/json",
        },
      };
      if (requestBody && ["POST", "PUT", "PATCH"].includes(selectedEndpoint.method)) {
        options.body = requestBody;
      }
      const res = await fetch(url, options);
      const body = await res.text();
      setResponse({
        status: res.status,
        body: tryFormatJson(body),
        time: Date.now() - start,
      });
    } catch (err: any) {
      setResponse({
        status: 0,
        body: `Network Error: ${err.message}`,
        time: Date.now() - start,
      });
    } finally {
      setLoading(false);
    }
  };

  const tryFormatJson = (text: string) => {
    try {
      return JSON.stringify(JSON.parse(text), null, 2);
    } catch {
      return text;
    }
  };

  const getStatusColor = (status: number) => {
    if (status >= 200 && status < 300) return "bg-green-600";
    if (status >= 400 && status < 500) return "bg-amber-600";
    if (status >= 500) return "bg-destructive";
    return "bg-muted-foreground";
  };

  const getMethodColor = (method: string) => {
    switch (method) {
      case "GET": return "bg-primary text-primary-foreground";
      case "POST": return "bg-green-600 text-white";
      case "PUT": return "bg-amber-600 text-white";
      case "DELETE": return "bg-destructive text-destructive-foreground";
      default: return "bg-muted-foreground text-white";
    }
  };

  return (
    <div className="space-y-6">
      <Card className="border-2 border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Play className="h-5 w-5 text-primary" />
            API Playground
          </CardTitle>
          <CardDescription>
            Test API endpoints directly from your browser. Enter your API key and make live requests.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* API Key */}
          <div>
            <label className="text-sm font-medium mb-1.5 block">API Key</label>
            <Input
              type="password"
              placeholder="bz_your_api_key_here"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="font-mono"
            />
          </div>

          {/* Endpoint Selector */}
          <div>
            <label className="text-sm font-medium mb-1.5 block">Endpoint</label>
            <Select
              value={`${selectedEndpoint.method} ${selectedEndpoint.path}`}
              onValueChange={handleEndpointChange}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {endpoints.map((ep, i) => (
                  <SelectItem key={i} value={`${ep.method} ${ep.path}`}>
                    <span className="flex items-center gap-2">
                      <Badge className={`${getMethodColor(ep.method)} text-xs px-1.5 py-0`}>{ep.method}</Badge>
                      <span className="font-mono text-sm">{ep.path}</span>
                      <span className="text-muted-foreground text-xs">— {ep.description}</span>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Path Parameters */}
          {selectedEndpoint.pathParams && selectedEndpoint.pathParams.length > 0 && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Path Parameters</label>
              {selectedEndpoint.pathParams.map(p => (
                <div key={p.name} className="flex items-center gap-2">
                  <code className="text-xs bg-muted px-2 py-1 rounded w-24 shrink-0">{p.name}</code>
                  <Input
                    placeholder={p.description}
                    value={pathParamValues[p.name] || ""}
                    onChange={e => setPathParamValues(prev => ({ ...prev, [p.name]: e.target.value }))}
                    className="font-mono text-sm"
                  />
                </div>
              ))}
            </div>
          )}

          {/* Query Parameters */}
          {selectedEndpoint.params && selectedEndpoint.params.length > 0 && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Query Parameters</label>
              {selectedEndpoint.params.map(p => (
                <div key={p.name} className="flex items-center gap-2">
                  <code className="text-xs bg-muted px-2 py-1 rounded w-24 shrink-0">{p.name}</code>
                  <Input
                    placeholder={`${p.description}${p.default ? ` (default: ${p.default})` : ""}`}
                    value={queryParamValues[p.name] || ""}
                    onChange={e => setQueryParamValues(prev => ({ ...prev, [p.name]: e.target.value }))}
                    className="font-mono text-sm"
                  />
                </div>
              ))}
            </div>
          )}

          {/* Request Body */}
          {selectedEndpoint.body && (
            <div>
              <label className="text-sm font-medium mb-1.5 block">Request Body</label>
              <Textarea
                value={requestBody}
                onChange={(e) => setRequestBody(e.target.value)}
                className="font-mono text-sm min-h-[120px]"
                placeholder="JSON request body"
              />
            </div>
          )}

          {/* URL Preview */}
          <div className="bg-muted rounded-lg p-3">
            <p className="text-xs text-muted-foreground mb-1">Request URL</p>
            <code className="text-sm break-all">{`${selectedEndpoint.method} ${buildUrl()}`}</code>
          </div>

          {/* Send Button */}
          <Button onClick={handleSend} disabled={loading} className="w-full">
            {loading ? (
              <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Sending...</>
            ) : (
              <><Play className="h-4 w-4 mr-2" /> Send Request</>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Response */}
      {response && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm flex items-center gap-2">
                {response.status >= 200 && response.status < 300 ? (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                ) : (
                  <AlertTriangle className="h-4 w-4 text-destructive" />
                )}
                Response
                <Badge className={`${getStatusColor(response.status)} text-white`}>
                  {response.status || "Error"}
                </Badge>
                <span className="text-xs text-muted-foreground font-normal">{response.time}ms</span>
              </CardTitle>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  navigator.clipboard.writeText(response.body);
                  toast({ title: "Copied!", description: "Response copied to clipboard." });
                }}
              >
                <Copy className="h-3 w-3" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <pre className="bg-muted p-4 rounded-lg text-sm overflow-x-auto max-h-[400px] overflow-y-auto">
              {response.body}
            </pre>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
