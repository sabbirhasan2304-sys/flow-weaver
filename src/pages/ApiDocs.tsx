import { useState } from "react";
import { Link } from "react-router-dom";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { motion } from "framer-motion";
import {
  Copy, Key, Zap, List, CheckCircle, AlertTriangle,
  Shield, Clock, Code, BookOpen, Terminal, Globe,
  FileJson, Lock, Activity, ArrowRight, ExternalLink,
  ShoppingCart, ShoppingBag, Plug, Play, Target,
  Users, Mail, Settings, Search, ChevronRight, Sparkles, Download
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { ApiPlayground } from "@/components/api-docs/ApiPlayground";
import {
  endpoints, endpointCategories, errorCodes, sdkExamples,
  generateCodeExample, API_BASE_URL, type Endpoint,
} from "@/components/api-docs/apiDocsData";
import { wordpressPluginCode, shopifySnippetCode } from "@/components/api-docs/pluginCode";

const categoryIcons: Record<string, any> = {
  workflows: Zap, executions: Play, contacts: Users,
  campaigns: Mail, triggers: Target, webhooks: Globe, system: Settings,
};

export default function ApiDocs() {
  const { toast } = useToast();
  const [selectedEndpoint, setSelectedEndpoint] = useState<Endpoint>(endpoints[0]);
  const [codeLanguage, setCodeLanguage] = useState<string>("curl");
  const [sdkLanguage, setSdkLanguage] = useState<string>("javascript");
  const [activeSection, setActiveSection] = useState("quickstart");
  const [endpointSearch, setEndpointSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast({ title: "Copied!", description: "Code copied to clipboard" });
  };

  const getMethodColor = (method: string) => {
    switch (method) {
      case "GET": return "bg-primary text-primary-foreground";
      case "POST": return "bg-green-600 text-white dark:bg-green-500";
      case "PUT": return "bg-amber-600 text-white dark:bg-amber-500";
      case "DELETE": return "bg-destructive text-destructive-foreground";
      default: return "bg-muted-foreground text-white";
    }
  };

  const getMethodDot = (method: string) => {
    switch (method) {
      case "GET": return "bg-primary";
      case "POST": return "bg-green-500";
      case "PUT": return "bg-amber-500";
      case "DELETE": return "bg-destructive";
      default: return "bg-muted-foreground";
    }
  };

  const filteredEndpoints = endpoints.filter(ep => {
    const matchSearch = !endpointSearch ||
      ep.path.toLowerCase().includes(endpointSearch.toLowerCase()) ||
      ep.description.toLowerCase().includes(endpointSearch.toLowerCase());
    const matchCategory = selectedCategory === "all" || ep.category === selectedCategory;
    return matchSearch && matchCategory;
  });

  const sections = [
    { id: "quickstart", label: "Quick Start", icon: Zap },
    { id: "playground", label: "API Playground", icon: Play },
    { id: "authentication", label: "Authentication", icon: Key },
    { id: "endpoints", label: "API Endpoints", icon: List },
    { id: "tracking", label: "JS Tracking SDK", icon: Code },
    { id: "sdks", label: "SDKs & Libraries", icon: Terminal },
    { id: "errors", label: "Error Handling", icon: AlertTriangle },
    { id: "ratelimits", label: "Rate Limits", icon: Clock },
    { id: "security", label: "Security", icon: Shield },
    { id: "webhooks", label: "Webhooks", icon: Globe },
    { id: "plugins", label: "Plugins & Integrations", icon: Plug },
  ];

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-lg shadow-primary/25">
              <Zap className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold tracking-tight text-foreground">BiztoriBD</span>
          </Link>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button variant="outline" size="sm" asChild>
              <Link to="/auth">Sign In</Link>
            </Button>
          </div>
        </div>
      </header>
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
      <div className="flex gap-6">
        {/* Left Sidebar */}
        <div className="hidden lg:block w-64 flex-shrink-0">
          <div className="sticky top-6 space-y-4">
            <Card className="overflow-hidden">
              <CardHeader className="pb-3 bg-gradient-to-br from-primary/5 to-primary/10">
                <CardTitle className="text-sm flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-primary" />
                  API Reference
                </CardTitle>
                <p className="text-xs text-muted-foreground">v2.0 — Complete documentation</p>
              </CardHeader>
              <CardContent className="p-0">
                <nav className="py-1">
                  {sections.map((section) => (
                    <button
                      key={section.id}
                      onClick={() => setActiveSection(section.id)}
                      className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-left transition-all ${
                        activeSection === section.id
                          ? "bg-primary text-primary-foreground font-medium"
                          : "hover:bg-muted text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <section.icon className="h-4 w-4 shrink-0" />
                      {section.label}
                      {section.id === "playground" && (
                        <Badge variant="secondary" className="ml-auto text-[10px] px-1.5 py-0">NEW</Badge>
                      )}
                    </button>
                  ))}
                </nav>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <h4 className="font-semibold text-sm mb-2 flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-primary" />
                  Need Help?
                </h4>
                <p className="text-xs text-muted-foreground mb-3">
                  Having trouble with the API? Contact developer support.
                </p>
                <Button size="sm" variant="outline" className="w-full" asChild>
                  <a href="/api-keys">
                    <Key className="h-3 w-3 mr-2" />
                    Get API Key
                  </a>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 space-y-6 min-w-0">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-between flex-wrap gap-4"
          >
            <div>
              <h1 className="text-3xl font-bold gradient-text">API Documentation</h1>
              <p className="text-muted-foreground mt-1">
                Complete reference for the BiztoriBD REST API v2
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" asChild>
                <a href="/api-keys">
                  <Key className="h-4 w-4 mr-2" />
                  Get API Key
                </a>
              </Button>
              <Button size="sm" onClick={() => setActiveSection("playground")}>
                <Play className="h-4 w-4 mr-2" />
                Try it Live
              </Button>
            </div>
          </motion.div>

          {/* Mobile Nav */}
          <div className="lg:hidden">
            <ScrollArea className="w-full">
              <div className="flex gap-1 pb-2">
                {sections.map(s => (
                  <Button
                    key={s.id}
                    size="sm"
                    variant={activeSection === s.id ? "default" : "outline"}
                    onClick={() => setActiveSection(s.id)}
                    className="whitespace-nowrap text-xs"
                  >
                    <s.icon className="h-3 w-3 mr-1" />
                    {s.label}
                  </Button>
                ))}
              </div>
            </ScrollArea>
          </div>

          {/* === QUICK START === */}
          {activeSection === "quickstart" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
              <Card className="overflow-hidden">
                <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-6 border-b">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-xl bg-primary/20 flex items-center justify-center">
                      <Zap className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold">Quick Start Guide</h2>
                      <p className="text-muted-foreground">Get up and running in under 5 minutes</p>
                    </div>
                  </div>
                </div>
                <CardContent className="p-6 space-y-8">
                  {[
                    { step: 1, title: "Create an API Key", desc: "Navigate to the API Keys page and generate a new key with read, execute, and/or write permissions.", link: "/api-keys" },
                    { step: 2, title: "Store Your Key Securely", desc: "Store as an environment variable. Never commit to version control.", code: "# .env file\nBIZTORIBBD_API_KEY=bz_xxxxxxxxxxxxxxxxxxxx" },
                    { step: 3, title: "Test the Connection", desc: "Verify your API key works:", code: `curl -X GET \\\n  "${API_BASE_URL}/health" \\\n  -H "x-api-key: bz_your_api_key_here"` },
                    { step: 4, title: "Execute Your First Workflow", desc: "List workflows and trigger one:", code: `curl -X POST \\\n  "${API_BASE_URL}/workflows/{workflow_id}/execute" \\\n  -H "x-api-key: bz_your_api_key_here" \\\n  -H "Content-Type: application/json" \\\n  -d '{"input": {"key": "value"}}'` },
                  ].map(item => (
                    <div key={item.step} className="flex gap-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold flex-shrink-0 text-sm">
                        {item.step}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-lg">{item.title}</h4>
                        <p className="text-muted-foreground mt-1 text-sm">{item.desc}</p>
                        {item.code && (
                          <div className="mt-3 relative">
                            <pre className="bg-muted p-4 rounded-lg text-sm overflow-x-auto">{item.code}</pre>
                            <Button variant="ghost" size="sm" className="absolute top-2 right-2" onClick={() => copyCode(item.code!)}>
                              <Copy className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        )}
                        {item.link && (
                          <Button variant="link" size="sm" className="p-0 mt-2" asChild>
                            <a href={item.link}>Go to API Keys <ChevronRight className="h-3 w-3 ml-1" /></a>
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Globe className="h-5 w-5" />
                    Base URL
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between bg-muted p-4 rounded-lg">
                    <code className="text-sm font-mono">{API_BASE_URL}</code>
                    <Button variant="ghost" size="sm" onClick={() => copyCode(API_BASE_URL)}>
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">All endpoints are relative to this base URL. HTTPS only.</p>
                </CardContent>
              </Card>

              {/* Quick links */}
              <div className="grid gap-3 md:grid-cols-3">
                {[
                  { label: "API Playground", desc: "Test endpoints live", icon: Play, section: "playground" },
                  { label: "WordPress Plugin", desc: "Full WooCommerce automation", icon: ShoppingCart, section: "plugins" },
                  { label: "SDKs & Libraries", desc: "JS, Python, PHP, Go", icon: Terminal, section: "sdks" },
                ].map(item => (
                  <Card key={item.label} className="cursor-pointer hover:border-primary/50 transition-colors" onClick={() => setActiveSection(item.section)}>
                    <CardContent className="p-4 flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                        <item.icon className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">{item.label}</p>
                        <p className="text-xs text-muted-foreground">{item.desc}</p>
                      </div>
                      <ChevronRight className="h-4 w-4 ml-auto text-muted-foreground" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            </motion.div>
          )}

          {/* === PLAYGROUND === */}
          {activeSection === "playground" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <ApiPlayground />
            </motion.div>
          )}

          {/* === AUTHENTICATION === */}
          {activeSection === "authentication" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><Key className="h-5 w-5" /> Authentication</CardTitle>
                  <CardDescription>Secure your API requests with API key authentication</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <h4 className="font-semibold mb-2">API Key Format</h4>
                    <p className="text-muted-foreground text-sm">All API keys start with <code className="bg-muted px-2 py-0.5 rounded text-sm">bz_</code> followed by a unique identifier.</p>
                    <div className="mt-3 bg-muted p-4 rounded-lg font-mono text-sm">bz_k8f9h2j5m3n7p1q4r6s0t8u2v5w9x3y7z</div>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-3">Authentication Methods</h4>
                    <div className="space-y-3">
                      <div className="border rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="outline" className="border-primary text-primary">Recommended</Badge>
                          <h5 className="font-medium">x-api-key Header</h5>
                        </div>
                        <pre className="bg-muted p-3 rounded text-sm">x-api-key: bz_your_api_key_here</pre>
                      </div>
                      <div className="border rounded-lg p-4">
                        <h5 className="font-medium mb-2">Authorization Header</h5>
                        <pre className="bg-muted p-3 rounded text-sm">Authorization: Bearer bz_your_api_key_here</pre>
                      </div>
                      <div className="border rounded-lg p-4">
                        <h5 className="font-medium mb-2">Query Parameter (for webhooks)</h5>
                        <pre className="bg-muted p-3 rounded text-sm">?api_key=bz_your_api_key_here</pre>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-3">Permission Levels</h4>
                    <div className="grid gap-3 sm:grid-cols-3">
                      {[
                        { perm: "read", color: "bg-blue-600", desc: "View workflows, executions, templates" },
                        { perm: "execute", color: "bg-green-600", desc: "Trigger workflow executions, fire events" },
                        { perm: "write", color: "bg-amber-600", desc: "Create, update, delete workflows" },
                      ].map(p => (
                        <div key={p.perm} className="p-3 border rounded-lg">
                          <Badge className={`${p.color} text-white mb-2`}>{p.perm}</Badge>
                          <p className="text-sm text-muted-foreground">{p.desc}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <h5 className="font-semibold text-amber-800 dark:text-amber-200">Security Best Practices</h5>
                        <ul className="mt-2 space-y-1 text-sm text-amber-700 dark:text-amber-300">
                          <li>• Never expose API keys in client-side code</li>
                          <li>• Rotate keys periodically</li>
                          <li>• Use minimum required permissions</li>
                          <li>• Set expiration dates on keys</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* === ENDPOINTS === */}
          {activeSection === "endpoints" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><List className="h-5 w-5" /> API Endpoints</CardTitle>
                  <CardDescription>{endpoints.length} endpoints available across {endpointCategories.length} categories</CardDescription>
                </CardHeader>
              </Card>

              <div className="grid gap-6 lg:grid-cols-3">
                {/* Endpoint sidebar */}
                <Card className="lg:col-span-1">
                  <CardContent className="p-3 space-y-3">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search endpoints..."
                        value={endpointSearch}
                        onChange={e => setEndpointSearch(e.target.value)}
                        className="pl-9 text-sm"
                      />
                    </div>
                    <div className="flex flex-wrap gap-1">
                      <Badge
                        variant={selectedCategory === "all" ? "default" : "outline"}
                        className="cursor-pointer text-xs"
                        onClick={() => setSelectedCategory("all")}
                      >All</Badge>
                      {endpointCategories.map(cat => (
                        <Badge
                          key={cat.id}
                          variant={selectedCategory === cat.id ? "default" : "outline"}
                          className="cursor-pointer text-xs"
                          onClick={() => setSelectedCategory(cat.id)}
                        >{cat.label}</Badge>
                      ))}
                    </div>
                    <ScrollArea className="h-[500px]">
                      <div className="space-y-0.5">
                        {filteredEndpoints.map((ep, i) => (
                          <button
                            key={i}
                            onClick={() => setSelectedEndpoint(ep)}
                            className={`w-full flex items-center gap-2 px-3 py-2 text-left rounded-md transition-colors ${
                              selectedEndpoint === ep ? "bg-primary text-primary-foreground" : "hover:bg-muted"
                            }`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${selectedEndpoint === ep ? "bg-primary-foreground" : getMethodDot(ep.method)}`} />
                            <span className="text-[11px] font-mono font-semibold w-10 shrink-0">{ep.method}</span>
                            <span className="text-xs font-mono truncate">{ep.path}</span>
                          </button>
                        ))}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>

                {/* Endpoint details */}
                <Card className="lg:col-span-2">
                  <CardHeader className="border-b">
                    <div className="flex items-center gap-3 flex-wrap">
                      <Badge className={`${getMethodColor(selectedEndpoint.method)} text-sm px-2.5`}>
                        {selectedEndpoint.method}
                      </Badge>
                      <code className="text-lg font-mono font-semibold">{selectedEndpoint.path}</code>
                    </div>
                    <p className="text-sm text-muted-foreground mt-2">{selectedEndpoint.summary || selectedEndpoint.description}</p>
                    <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><Lock className="h-3 w-3" /> Auth required</span>
                      <span className="flex items-center gap-1"><Activity className="h-3 w-3" /> {selectedEndpoint.rateLimit}</span>
                      <span className="flex items-center gap-1"><Shield className="h-3 w-3" /> {selectedEndpoint.permissions.join(", ")}</span>
                    </div>
                  </CardHeader>
                  <CardContent className="p-6 space-y-6">
                    {/* Path Params */}
                    {selectedEndpoint.pathParams && (
                      <div>
                        <h4 className="font-semibold mb-2 text-sm flex items-center gap-2"><ArrowRight className="h-3.5 w-3.5" /> Path Parameters</h4>
                        <div className="space-y-2">
                          {selectedEndpoint.pathParams.map((p, i) => (
                            <div key={i} className="flex items-start gap-3 p-3 bg-muted rounded-lg text-sm">
                              <code className="font-semibold shrink-0">{p.name}</code>
                              <Badge variant="outline" className="text-xs">{p.type}</Badge>
                              {p.required && <Badge className="bg-destructive text-destructive-foreground text-xs">required</Badge>}
                              <span className="text-muted-foreground">{p.description}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Query Params */}
                    {selectedEndpoint.params && (
                      <div>
                        <h4 className="font-semibold mb-2 text-sm flex items-center gap-2"><FileJson className="h-3.5 w-3.5" /> Query Parameters</h4>
                        <div className="space-y-2">
                          {selectedEndpoint.params.map((p, i) => (
                            <div key={i} className="p-3 bg-muted rounded-lg text-sm">
                              <div className="flex items-center gap-2 flex-wrap mb-1">
                                <code className="font-semibold">{p.name}</code>
                                <Badge variant="outline" className="text-xs">{p.type}</Badge>
                                {p.required ? <Badge className="bg-destructive text-destructive-foreground text-xs">required</Badge> : <Badge variant="secondary" className="text-xs">optional</Badge>}
                                {p.default && <span className="text-xs text-muted-foreground">Default: {p.default}</span>}
                              </div>
                              <span className="text-muted-foreground text-xs">{p.description}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Request Body */}
                    {selectedEndpoint.body && (
                      <div>
                        <h4 className="font-semibold mb-2 text-sm flex items-center gap-2"><Terminal className="h-3.5 w-3.5" /> Request Body</h4>
                        <div className="relative">
                          <pre className="bg-muted p-4 rounded-lg text-sm overflow-x-auto">{selectedEndpoint.body}</pre>
                          <Button variant="ghost" size="sm" className="absolute top-2 right-2" onClick={() => copyCode(selectedEndpoint.body!)}>
                            <Copy className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                        {selectedEndpoint.bodyFields && (
                          <div className="mt-3 space-y-1.5">
                            {selectedEndpoint.bodyFields.map((f, i) => (
                              <div key={i} className="flex items-start gap-2 text-xs">
                                <code className="bg-muted px-1.5 py-0.5 rounded shrink-0">{f.name}</code>
                                <Badge variant="outline" className="text-[10px]">{f.type}</Badge>
                                {f.required && <Badge className="bg-destructive text-[10px]">req</Badge>}
                                <span className="text-muted-foreground">{f.description}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Code Examples */}
                    <div>
                      <h4 className="font-semibold mb-2 text-sm flex items-center gap-2"><Code className="h-3.5 w-3.5" /> Code Examples</h4>
                      <Tabs value={codeLanguage} onValueChange={setCodeLanguage}>
                        <TabsList className="h-8">
                          {["curl", "javascript", "python", "php"].map(lang => (
                            <TabsTrigger key={lang} value={lang} className="text-xs">{lang === "curl" ? "cURL" : lang.charAt(0).toUpperCase() + lang.slice(1)}</TabsTrigger>
                          ))}
                        </TabsList>
                        {["curl", "javascript", "python", "php"].map(lang => (
                          <TabsContent key={lang} value={lang} className="relative">
                            <pre className="bg-muted p-4 rounded-lg text-xs overflow-x-auto mt-2">{generateCodeExample(selectedEndpoint, lang)}</pre>
                            <Button variant="ghost" size="sm" className="absolute top-4 right-2" onClick={() => copyCode(generateCodeExample(selectedEndpoint, lang))}>
                              <Copy className="h-3.5 w-3.5" />
                            </Button>
                          </TabsContent>
                        ))}
                      </Tabs>
                    </div>

                    {/* Response */}
                    <div>
                      <h4 className="font-semibold mb-2 text-sm flex items-center gap-2">
                        <CheckCircle className="h-3.5 w-3.5 text-green-500" /> Response <Badge className="bg-green-600 text-white text-xs ml-1">200</Badge>
                      </h4>
                      <div className="relative">
                        <pre className="bg-muted p-4 rounded-lg text-xs overflow-x-auto max-h-80">{selectedEndpoint.response}</pre>
                        <Button variant="ghost" size="sm" className="absolute top-2 right-2" onClick={() => copyCode(selectedEndpoint.response)}>
                          <Copy className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                      {selectedEndpoint.responseFields && selectedEndpoint.responseFields.length > 0 && (
                        <Accordion type="single" collapsible className="mt-3">
                          <AccordionItem value="fields" className="border-none">
                            <AccordionTrigger className="text-xs py-2">Response Fields</AccordionTrigger>
                            <AccordionContent>
                              <div className="space-y-1.5">
                                {selectedEndpoint.responseFields.map((f, i) => (
                                  <div key={i} className="flex items-start gap-2 text-xs p-2 bg-muted/50 rounded">
                                    <code className="bg-muted px-1.5 py-0.5 rounded shrink-0">{f.name}</code>
                                    <Badge variant="outline" className="text-[10px]">{f.type}</Badge>
                                    <span className="text-muted-foreground">{f.description}</span>
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
                        <h4 className="font-semibold mb-2 text-sm flex items-center gap-2">
                          <AlertTriangle className="h-3.5 w-3.5 text-destructive" /> Error Responses
                        </h4>
                        <div className="space-y-2">
                          {selectedEndpoint.errors.map((err, i) => (
                            <div key={i} className="p-3 border border-destructive/20 bg-destructive/5 rounded-lg text-sm">
                              <Badge variant="destructive" className="text-xs">{err.code}</Badge>
                              <span className="ml-2 font-medium">{err.message}</span>
                              <p className="text-xs text-muted-foreground mt-1">{err.description}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Try it button */}
                    <Button variant="outline" className="w-full" onClick={() => { setActiveSection("playground"); }}>
                      <Play className="h-4 w-4 mr-2" /> Try this endpoint in the Playground
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </motion.div>
          )}

          {/* === JS TRACKING SDK === */}
          {activeSection === "tracking" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><Code className="h-5 w-5" /> JavaScript Tracking SDK</CardTitle>
                  <CardDescription>Embed on your website to auto-track e-commerce events, abandoned carts, and payment failures.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <h4 className="font-semibold mb-2">Add the tracking script</h4>
                    <p className="text-sm text-muted-foreground mb-3">Paste before <code className="bg-muted px-1 rounded">&lt;/body&gt;</code> on every page.</p>
                    <div className="relative">
                      <pre className="bg-muted p-4 rounded-lg text-xs overflow-x-auto max-h-[400px]">
{`<script>
(function() {
  var BZ_API_KEY = "bz_your_api_key_here";
  var BZ_API_URL = "${API_BASE_URL}";

  var BZTracker = {
    _post: function(endpoint, data) {
      fetch(BZ_API_URL + endpoint, {
        method: "POST",
        headers: { "x-api-key": BZ_API_KEY, "Content-Type": "application/json" },
        body: JSON.stringify(data)
      }).catch(function(e) { console.warn("BZ:", e); });
    },
    trackPageview: function(email) {
      this._post("/track/pageview", { page_url: location.href, referrer: document.referrer, contact_email: email || null });
    },
    trackCartAbandon: function(email, items, cartTotal) {
      this._post("/triggers/cart-abandon", { email: email, items: items, cart_total: cartTotal });
    },
    trackCheckoutAbandon: function(email, opts) {
      this._post("/triggers/checkout-abandon", { email: email, cart_value: opts.cartValue, checkout_step: opts.checkoutStep, items: opts.items || [] });
    },
    trackPaymentFailure: function(email, opts) {
      this._post("/triggers/payment-failure", { email: email, order_id: opts.orderId, amount: opts.amount, error_code: opts.errorCode, retry_url: opts.retryUrl });
    },
    identify: function(email, data) {
      this._post("/contacts", { email: email, first_name: data.firstName, last_name: data.lastName, source: "website", custom_fields: data.customFields || {} });
    },
    subscribe: function(email, listId) {
      this._post("/lists/" + listId + "/subscribe", { email: email });
    }
  };

  BZTracker.trackPageview();
  window.BZTracker = BZTracker;
})();
</script>`}
                      </pre>
                      <Button variant="ghost" size="sm" className="absolute top-2 right-2" onClick={() => copyCode("<!-- BiztoriBD Tracker -->")}>
                        <Copy className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-3">Usage Examples</h4>
                    <div className="space-y-4">
                      {[
                        { title: "Identify a user", code: `BZTracker.identify("john@example.com", { firstName: "John", lastName: "Doe" });` },
                        { title: "Track checkout abandonment", code: `BZTracker.trackCheckoutAbandon("john@example.com", { cartValue: 129.99, checkoutStep: "payment", items: [{ name: "Widget", price: 99.99, quantity: 1 }] });` },
                        { title: "Track payment failure", code: `BZTracker.trackPaymentFailure("john@example.com", { orderId: "ORD-123", amount: 89.99, errorCode: "card_declined", retryUrl: location.href });` },
                        { title: "Subscribe to list", code: `BZTracker.subscribe("john@example.com", "your-list-id");` },
                      ].map(ex => (
                        <div key={ex.title}>
                          <p className="text-sm font-medium mb-1">{ex.title}</p>
                          <pre className="bg-muted p-3 rounded-lg text-xs overflow-x-auto">{ex.code}</pre>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 rounded-lg p-4">
                    <h5 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">How It Works</h5>
                    <ul className="space-y-1 text-sm text-blue-700 dark:text-blue-300">
                      <li>• Auto-tracks page views on every page load</li>
                      <li>• Call <code className="bg-blue-100 dark:bg-blue-900 px-1 rounded">identify()</code> after login to associate activity</li>
                      <li>• All events auto-create/update contacts — no manual syncing</li>
                      <li>• Triggers mapped workflows automatically</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* === SDKs === */}
          {activeSection === "sdks" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><Terminal className="h-5 w-5" /> Official SDKs & Libraries</CardTitle>
                  <CardDescription>Type-safe SDKs with built-in error handling and retry logic</CardDescription>
                </CardHeader>
                <CardContent>
                  <Tabs value={sdkLanguage} onValueChange={setSdkLanguage}>
                    <TabsList className="flex-wrap h-auto">
                      {["javascript", "typescript", "python", "php", "go"].map(lang => (
                        <TabsTrigger key={lang} value={lang} className="text-xs capitalize">{lang}</TabsTrigger>
                      ))}
                    </TabsList>
                    {Object.entries(sdkExamples).map(([lang, code]) => (
                      <TabsContent key={lang} value={lang} className="relative">
                        <pre className="bg-muted p-4 rounded-lg text-xs overflow-x-auto mt-2 max-h-[400px]">{code}</pre>
                        <Button variant="ghost" size="sm" className="absolute top-4 right-2" onClick={() => copyCode(code)}>
                          <Copy className="h-3.5 w-3.5" />
                        </Button>
                      </TabsContent>
                    ))}
                  </Tabs>
                </CardContent>
              </Card>
              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader><CardTitle className="text-base">Installation</CardTitle></CardHeader>
                  <CardContent className="space-y-2">
                    {[
                      { pkg: "npm", cmd: "npm install @biztoribbd/sdk" },
                      { pkg: "pip", cmd: "pip install biztoribbd" },
                      { pkg: "composer", cmd: "composer require biztoribbd/sdk" },
                      { pkg: "go", cmd: "go get github.com/biztoribbd/go-sdk" },
                    ].map(p => (
                      <div key={p.pkg} className="flex items-center gap-2">
                        <Badge className="text-xs">{p.pkg}</Badge>
                        <code className="text-xs bg-muted px-2 py-1 rounded flex-1">{p.cmd}</code>
                        <Button variant="ghost" size="sm" onClick={() => copyCode(p.cmd)}><Copy className="h-3 w-3" /></Button>
                      </div>
                    ))}
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader><CardTitle className="text-base">SDK Features</CardTitle></CardHeader>
                  <CardContent>
                    <ul className="space-y-2 text-sm">
                      {["Full TypeScript support", "Automatic retry with backoff", "Built-in rate limit handling", "Comprehensive error types", "Request/response logging"].map(f => (
                        <li key={f} className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-500 shrink-0" />{f}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </div>
            </motion.div>
          )}

          {/* === ERRORS === */}
          {activeSection === "errors" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><AlertTriangle className="h-5 w-5" /> Error Handling</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <h4 className="font-semibold mb-2">Error Response Format</h4>
                    <pre className="bg-muted p-4 rounded-lg text-sm">{`{
  "error": "Unauthorized",
  "message": "Invalid or expired API key",
  "code": 401
}`}</pre>
                  </div>
                  <div className="space-y-3">
                    {errorCodes.map((err, i) => (
                      <div key={i} className="p-4 border rounded-lg">
                        <div className="flex items-center gap-3 mb-2">
                          <Badge variant={err.code >= 500 ? "destructive" : "secondary"}>{err.code}</Badge>
                          <span className="font-semibold">{err.name}</span>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">{err.description}</p>
                        <div className="flex items-start gap-2 text-sm bg-muted p-2 rounded">
                          <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                          <span><strong>Fix:</strong> {err.fix}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* === RATE LIMITS === */}
          {activeSection === "ratelimits" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><Clock className="h-5 w-5" /> Rate Limiting</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid gap-4 md:grid-cols-3">
                    {[
                      { val: "1,000", label: "Requests per hour" },
                      { val: "100", label: "Requests per minute" },
                      { val: "50", label: "Executions per hour" },
                    ].map(s => (
                      <div key={s.label} className="p-4 border rounded-lg text-center">
                        <div className="text-3xl font-bold text-primary">{s.val}</div>
                        <div className="text-sm text-muted-foreground">{s.label}</div>
                      </div>
                    ))}
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Rate Limit Headers</h4>
                    <div className="bg-muted p-4 rounded-lg font-mono text-sm space-y-1">
                      <div>X-RateLimit-Limit: 1000</div>
                      <div>X-RateLimit-Remaining: 950</div>
                      <div>X-RateLimit-Reset: 1704110400</div>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Handling 429 Responses</h4>
                    <pre className="bg-muted p-4 rounded-lg text-xs overflow-x-auto">{`if (response.status === 429) {
  const retryAfter = response.headers.get("Retry-After") || 60;
  console.log(\`Rate limited. Retrying in \${retryAfter}s\`);
  await new Promise(r => setTimeout(r, retryAfter * 1000));
  // Retry the request
}`}</pre>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* === SECURITY === */}
          {activeSection === "security" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><Shield className="h-5 w-5" /> Security</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid gap-4 md:grid-cols-2">
                    {[
                      { icon: Lock, title: "HTTPS Only", desc: "All requests must use HTTPS." },
                      { icon: Key, title: "Key Hashing", desc: "Keys stored as SHA-256 hashes." },
                      { icon: Clock, title: "Key Expiration", desc: "Set expiration dates for enhanced security." },
                      { icon: Activity, title: "Activity Logging", desc: "All requests logged with IP and user agent." },
                    ].map(s => (
                      <div key={s.title} className="p-4 border rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <s.icon className="h-5 w-5 text-green-500" />
                          <h5 className="font-semibold">{s.title}</h5>
                        </div>
                        <p className="text-sm text-muted-foreground">{s.desc}</p>
                      </div>
                    ))}
                  </div>
                  <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
                    <h5 className="font-semibold text-destructive mb-2">⚠️ Never Do This</h5>
                    <pre className="bg-destructive/5 p-3 rounded text-sm text-destructive">{`// DON'T hardcode API keys in source code
const apiKey = "bz_live_xxxx"; // ❌ Bad!
// DON'T expose keys in client-side JavaScript
// DON'T commit keys to version control`}</pre>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* === WEBHOOKS === */}
          {activeSection === "webhooks" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><Globe className="h-5 w-5" /> Webhooks</CardTitle>
                  <CardDescription>Receive real-time notifications when events occur</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <h4 className="font-semibold mb-3">Supported Webhook Events</h4>
                    <div className="space-y-2">
                      {[
                        { event: "workflow.executed", desc: "Workflow execution completes" },
                        { event: "workflow.failed", desc: "Workflow execution fails" },
                        { event: "workflow.updated", desc: "Workflow is modified" },
                        { event: "contact.created", desc: "New contact created" },
                        { event: "campaign.sent", desc: "Campaign finished sending" },
                      ].map(w => (
                        <div key={w.event} className="flex items-center gap-3 p-3 border rounded-lg">
                          <Badge variant="outline" className="font-mono text-xs">{w.event}</Badge>
                          <span className="text-sm text-muted-foreground">{w.desc}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Webhook Payload</h4>
                    <pre className="bg-muted p-4 rounded-lg text-sm">{`{
  "event": "workflow.executed",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "data": {
    "workflow_id": "...",
    "execution_id": "...",
    "status": "success",
    "duration_ms": 2340
  },
  "signature": "sha256=xxxxx"
}`}</pre>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* === PLUGINS === */}
          {activeSection === "plugins" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
              <Card className="overflow-hidden">
                <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-6 border-b">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-xl bg-primary/20 flex items-center justify-center">
                      <Plug className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold">Plugins & Integrations</h2>
                      <p className="text-muted-foreground">Ready-to-install plugins for WordPress, Shopify, and any platform</p>
                    </div>
                  </div>
                </div>
                <CardContent className="p-6">
                  <div className="grid gap-4 md:grid-cols-3">
                    {[
                      { icon: ShoppingCart, title: "WordPress / WooCommerce", desc: "Full automation plugin with workflow management, event triggers & monitoring", color: "text-purple-600" },
                      { icon: ShoppingBag, title: "Shopify", desc: "Theme snippet & webhook integration for tracking & automation", color: "text-green-600" },
                      { icon: Globe, title: "Universal Webhook", desc: "Webhook receiver for any platform — Magento, BigCommerce, custom", color: "text-blue-600" },
                    ].map(p => (
                      <div key={p.title} className="p-4 border rounded-lg text-center hover:border-primary/50 transition-colors">
                        <p.icon className={`h-8 w-8 mx-auto ${p.color} mb-2`} />
                        <h5 className="font-semibold text-sm">{p.title}</h5>
                        <p className="text-xs text-muted-foreground mt-1">{p.desc}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* WordPress Plugin */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ShoppingCart className="h-5 w-5 text-purple-600" />
                    WordPress / WooCommerce Plugin v2.0
                  </CardTitle>
                  <CardDescription>Full workflow automation engine for WordPress — manage workflows, map WooCommerce events, monitor executions, track abandonment.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Download Button */}
                  <div className="flex items-center gap-4 p-4 rounded-lg border border-primary/20 bg-primary/5">
                    <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <Download className="h-6 w-6 text-primary" />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-foreground">Download Plugin (.zip)</p>
                      <p className="text-xs text-muted-foreground">Ready-to-install WordPress plugin. Upload directly via Plugins → Add New → Upload Plugin.</p>
                    </div>
                    <Button asChild>
                      <a href="/downloads/biztoribbd-automation.zip" download>
                        <Download className="h-4 w-4 mr-2" />
                        Download
                      </a>
                    </Button>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2">Installation</h4>
                    <ol className="space-y-2 text-sm">
                      {[
                        "Download the plugin .zip file using the button above",
                        "In WordPress Admin → Plugins → Add New → Upload Plugin → select the .zip",
                        "Click Install Now, then Activate",
                        "Go to BiztoriBD → Settings → enter your API Key",
                        "Go to BiztoriBD → Event Mappings → map WooCommerce events to workflows",
                      ].map((step, i) => (
                        <li key={i} className="flex gap-3">
                          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold shrink-0">{i + 1}</span>
                          <span>{step}</span>
                        </li>
                      ))}
                    </ol>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2">Plugin Capabilities</h4>
                    <div className="grid gap-2 md:grid-cols-2">
                      {[
                        { title: "Workflow Management", desc: "List, execute & monitor from WP admin" },
                        { title: "Event → Workflow Mapping", desc: "Auto-trigger on 9 WooCommerce events" },
                        { title: "Execution Logs", desc: "View input/output & node-level logs" },
                        { title: "Cart/Checkout Abandonment", desc: "Automatic JS tracking via sendBeacon" },
                        { title: "Payment Recovery", desc: "Declined cards trigger recovery workflows" },
                        { title: "Contact Sync", desc: "Customers auto-synced on order & registration" },
                      ].map(c => (
                        <div key={c.title} className="flex items-center gap-2 p-2 border rounded text-sm">
                          <CheckCircle className="h-4 w-4 text-green-500 shrink-0" />
                          <span><strong>{c.title}</strong> — {c.desc}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2">WooCommerce Event Mappings</h4>
                    <div className="grid gap-2 md:grid-cols-3">
                      {[
                        "new_order", "order_completed", "payment_failed",
                        "order_cancelled", "order_refunded", "customer_created",
                        "product_updated", "cart_abandon", "checkout_abandon",
                      ].map(e => (
                        <div key={e} className="flex items-center gap-2 p-2 border rounded">
                          <Badge variant="outline" className="font-mono text-[10px]">{e}</Badge>
                          <ArrowRight className="h-3 w-3 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">→ Workflow</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold">Plugin Code</h4>
                      <Button size="sm" variant="outline" onClick={() => copyCode(wordpressPluginCode)}>
                        <Copy className="h-3 w-3 mr-1" /> Copy
                      </Button>
                    </div>
                    <pre className="bg-muted p-4 rounded-lg text-xs overflow-x-auto max-h-[400px]">{wordpressPluginCode}</pre>
                  </div>
                </CardContent>
              </Card>

              {/* Shopify */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ShoppingBag className="h-5 w-5 text-green-600" />
                    Shopify Integration
                  </CardTitle>
                  <CardDescription>Theme snippet for front-end tracking + webhook-based server-side integration.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <Tabs defaultValue="snippet">
                    <TabsList>
                      <TabsTrigger value="snippet">Theme Snippet</TabsTrigger>
                      <TabsTrigger value="webhooks">Shopify Webhooks</TabsTrigger>
                    </TabsList>
                    <TabsContent value="snippet" className="space-y-4 mt-4">
                      <ol className="space-y-2 text-sm">
                        <li className="flex gap-3">
                          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold shrink-0">1</span>
                          <span>In Shopify Admin → Online Store → Themes → Edit Code</span>
                        </li>
                        <li className="flex gap-3">
                          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold shrink-0">2</span>
                          <span>Open <code className="bg-muted px-1 rounded">theme.liquid</code> → paste before <code className="bg-muted px-1 rounded">&lt;/body&gt;</code></span>
                        </li>
                        <li className="flex gap-3">
                          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold shrink-0">3</span>
                          <span>Replace <code className="bg-muted px-1 rounded">bz_your_api_key_here</code> with your key</span>
                        </li>
                      </ol>
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-semibold text-sm">Liquid Snippet</h4>
                          <Button size="sm" variant="outline" onClick={() => copyCode(shopifySnippetCode)}>
                            <Copy className="h-3 w-3 mr-1" /> Copy
                          </Button>
                        </div>
                        <pre className="bg-muted p-4 rounded-lg text-xs overflow-x-auto max-h-[400px]">{shopifySnippetCode}</pre>
                      </div>
                    </TabsContent>
                    <TabsContent value="webhooks" className="space-y-4 mt-4">
                      <p className="text-sm text-muted-foreground">Configure Shopify webhooks for server-side tracking. Go to Settings → Notifications → Webhooks.</p>
                      <div className="bg-muted p-3 rounded-lg">
                        <p className="text-xs text-muted-foreground mb-1">Webhook URL:</p>
                        <div className="flex items-center gap-2">
                          <code className="text-sm flex-1 break-all">{API_BASE_URL}/webhooks/incoming?platform=shopify</code>
                          <Button size="sm" variant="ghost" onClick={() => copyCode(`${API_BASE_URL}/webhooks/incoming?platform=shopify`)}>
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                      <div className="space-y-2">
                        {[
                          { event: "checkouts/create", desc: "Checkout abandonment" },
                          { event: "orders/create", desc: "Completed purchases" },
                          { event: "orders/paid", desc: "Successful payment" },
                          { event: "orders/cancelled", desc: "Order cancellations" },
                          { event: "customers/create", desc: "New customer sync" },
                        ].map(w => (
                          <div key={w.event} className="flex items-center gap-3 p-2 border rounded text-sm">
                            <Badge variant="outline" className="font-mono text-xs">{w.event}</Badge>
                            <span className="text-muted-foreground text-xs">{w.desc}</span>
                          </div>
                        ))}
                      </div>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>

              {/* Universal Webhook */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><Globe className="h-5 w-5 text-blue-600" /> Universal Webhook Receiver</CardTitle>
                  <CardDescription>For any platform — send events to our universal endpoint.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="bg-muted p-3 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Badge className="bg-green-600 text-white">POST</Badge>
                      <code className="text-sm flex-1 break-all">{API_BASE_URL}/webhooks/incoming</code>
                      <Button size="sm" variant="ghost" onClick={() => copyCode(`${API_BASE_URL}/webhooks/incoming`)}>
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  <pre className="bg-muted p-4 rounded-lg text-xs overflow-x-auto">{`{
  "platform": "custom",
  "event": "checkout.abandoned",
  "customer": { "email": "jane@example.com", "first_name": "Jane" },
  "data": { "cart_value": 129.99, "items": [{ "name": "Product A", "price": 99.99, "quantity": 1 }] }
}`}</pre>
                  <div className="grid gap-2 md:grid-cols-3">
                    {["checkout.abandoned", "cart.abandoned", "payment.failed", "order.completed", "customer.created", "product.viewed"].map(e => (
                      <div key={e} className="flex items-center gap-2 p-2 border rounded">
                        <Badge variant="secondary" className="font-mono text-[10px]">{e}</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </div>
      </div>
      </main>
    </div>
  );
}
