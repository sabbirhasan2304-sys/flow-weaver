import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import WorkflowPage from "./pages/WorkflowPage";
import Templates from "./pages/Templates";
import Marketplace from "./pages/Marketplace";
import Executions from "./pages/Executions";
import Credentials from "./pages/Credentials";
import Admin from "./pages/Admin";
import Billing from "./pages/Billing";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/workflow/:id" element={<WorkflowPage />} />
          <Route path="/templates" element={<Templates />} />
          <Route path="/marketplace" element={<Marketplace />} />
          <Route path="/executions" element={<Executions />} />
          <Route path="/credentials" element={<Credentials />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/billing" element={<Billing />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
