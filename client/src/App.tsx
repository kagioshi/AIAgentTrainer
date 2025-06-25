import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import Dashboard from "@/pages/dashboard";
import TenantManagement from "@/pages/tenant-management";
import AiTraining from "@/pages/ai-training";
import CallManagement from "@/pages/call-management";
import FlowBuilder from "@/pages/flow-builder";
import ProviderManagement from "@/pages/provider-management";
import Analytics from "@/pages/analytics";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/tenant-management" component={TenantManagement} />
      <Route path="/ai-training" component={AiTraining} />
      <Route path="/call-management" component={CallManagement} />
      <Route path="/flow-builder" component={FlowBuilder} />
      <Route path="/providers" component={ProviderManagement} />
      <Route path="/analytics" component={Analytics} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
