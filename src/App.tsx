import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HashRouter, Routes, Route } from "react-router-dom";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Dashboard } from "@/components/Dashboard";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Analytics from "./pages/Analytics";
import Feedbacks from "./pages/Feedbacks";
import FormBuilder from "./pages/FormBuilder";

import InsightsHistory from "./pages/InsightsHistory";
import Forms from "./pages/Forms";
import FormCreate from "./pages/FormCreate";
import PublicForm from "./pages/PublicForm";
import FormResponses from "./pages/FormResponses";
import MarketDataStudio from "./pages/MarketDataStudio";
import Login from "./pages/Login";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <HashRouter>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/form/:id" element={<PublicForm />} />
          
          <Route path="/" element={
            <ProtectedRoute>
              <SidebarProvider>
                <div className="flex min-h-screen w-full">
                  <AppSidebar />
                  <Dashboard />
                </div>
              </SidebarProvider>
            </ProtectedRoute>
          }>
            <Route index element={<Analytics />} />
            <Route path="feedbacks" element={<Feedbacks />} />
            <Route path="forms" element={<Forms />} />
            <Route path="forms/create" element={<FormCreate />} />
            <Route path="forms/edit/:id" element={<FormCreate />} />
            <Route path="forms/:id/responses" element={<FormResponses />} />
            <Route path="form-builder" element={<FormBuilder />} />
            <Route path="market-data" element={<MarketDataStudio />} />
            <Route path="insights-history" element={<InsightsHistory />} />
            <Route path="settings" element={<Settings />} />
          </Route>
          
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </HashRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
