import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import Pipeline from "./pages/Pipeline";
import Leads from "./pages/Leads";
import NotFound from "./pages/NotFound";
import Login from "./pages/Login"; // 🔥 nova importação
import Settings from "./pages/Settings"; // ⬅️ importa a nova página
import AuthGuard from "@/components/auth/AuthGuard";



const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/pipeline" element={<Pipeline />} />
          <Route path="/leads" element={<Leads />} />
          <Route path="/login" element={<Login />} /> {/* 🔥 nova rota */}
          <Route path="/settings" element={<Settings />} /> {/* 👈 novo */}
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/dashboard"element={<AuthGuard><Dashboard /></AuthGuard>}/>
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
