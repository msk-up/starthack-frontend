import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import SearchPage from "./pages/SearchPage";
import NegotiationPage from "./pages/NegotiationPage";
import SupplierDetailPage from "./pages/SupplierDetailPage";
import ComparePage from "./pages/ComparePage";
import NegotiationsHistoryPage from "./pages/NegotiationsHistoryPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<SearchPage />} />
          <Route path="/negotiation" element={<NegotiationPage />} />
          <Route path="/negotiation/:supplierId" element={<SupplierDetailPage />} />
          <Route path="/negotiations-history" element={<NegotiationsHistoryPage />} />
          <Route path="/compare" element={<ComparePage />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
