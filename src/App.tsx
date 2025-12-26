import { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";

// Eager load critical pages
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import CreateEvent from "./pages/CreateEvent";
import NotFound from "./pages/NotFound";

// Lazy load secondary pages
const Dashboard = lazy(() => import("./pages/Dashboard"));
const RSVPPage = lazy(() => import("./pages/RSVPPage"));
const EventDetail = lazy(() => import("./pages/EventDetail"));
const Pricing = lazy(() => import("./pages/Pricing"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30000,
      gcTime: 5 * 60 * 1000,
    },
  },
});

// Loading fallback
const PageLoader = () => (
  <div className="h-dvh w-full flex items-center justify-center bg-background">
    <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
  </div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/rsvp/:token" element={<RSVPPage />} />
            
            {/* Organiser routes */}
            <Route path="/create" element={<CreateEvent />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/events/:id" element={<EventDetail />} />
            <Route path="/pricing" element={<Pricing />} />
            
            {/* Catch-all */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
