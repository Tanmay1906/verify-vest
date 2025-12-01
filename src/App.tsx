import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppProvider } from "./contexts/AppContext";
import { Header } from "./components/Header";
import Index from "./pages/Index";
import DonorDashboard from "./pages/DonorDashboard";
import ApplicantDashboard from "./pages/ApplicantDashboard";
import VerifierDashboard from "./pages/VerifierDashboard";
import GrantDetail from "./pages/GrantDetail";
import Grants from "./pages/Grants";
import ProposalDetail from "./pages/ProposalDetail";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AppProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          {!(import.meta.env.VITE_MODULE_ADDRESS as string) && (
            <div style={{ background: '#fff3cd', color: '#664d03', padding: '8px 16px', borderBottom: '1px solid #ffecb5' }}>
              Missing VITE_MODULE_ADDRESS. Set the published Move module address in your .env (e.g., VITE_MODULE_ADDRESS=0x... ).
            </div>
          )}
          {!(import.meta.env.VITE_API_URL as string) && (
            <div style={{ background: '#f8d7da', color: '#842029', padding: '8px 16px', borderBottom: '1px solid #f5c2c7' }}>
              Missing VITE_API_URL. Set the backend API base URL in your .env (e.g., VITE_API_URL=http://localhost:4000).
            </div>
          )}
          <Header />
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/donor" element={<DonorDashboard />} />
            <Route path="/applicant" element={<ApplicantDashboard />} />
            <Route path="/verifier" element={<VerifierDashboard />} />
            <Route path="/grants" element={<Grants />} />
            <Route path="/grant/:id" element={<GrantDetail />} />
            <Route path="/proposal/:id" element={<ProposalDetail />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AppProvider>
  </QueryClientProvider>
);

export default App;
