import { Suspense, lazy } from "react";
import { Toaster } from "@/shared/ui/toaster";
import { Toaster as Sonner } from "@/shared/ui/sonner";
import { TooltipProvider } from "@/shared/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { LanguageProvider } from "@/shared/providers/LanguageContext";
import Layout from "@/shared/components/Layout";
import { AdminRoute } from "@/features/admin/components/AdminRoute";

const Index = lazy(() => import("@/features/marketing/pages/Index"));
const Transfers = lazy(() => import("@/features/marketing/pages/Transfers"));
const Activities = lazy(() => import("@/features/marketing/pages/Activities"));
const ActivityDetail = lazy(() => import("@/features/marketing/pages/ActivityDetail"));
const Book = lazy(() => import("@/features/booking/pages/Book"));
const BookActivities = lazy(() => import("@/features/booking/pages/BookActivities"));
const Contact = lazy(() => import("@/features/marketing/pages/Contact"));
const Portfolio = lazy(() => import("@/features/marketing/pages/Portfolio"));
const Admin = lazy(() => import("@/features/admin/pages/Admin"));
const AdminLogin = lazy(() => import("@/features/admin/pages/AdminLogin"));
const Confirmation = lazy(() => import("@/features/booking/pages/Confirmation"));
const Checkout = lazy(() => import("@/features/booking/pages/Checkout"));
const CheckoutSuccess = lazy(() => import("@/features/booking/pages/CheckoutSuccess"));
const CheckoutCancel = lazy(() => import("@/features/booking/pages/CheckoutCancel"));
const HotelPage = lazy(() => import("@/features/marketing/pages/HotelPage"));
const NotFound = lazy(() => import("@/shared/pages/NotFound"));
const Terms = lazy(() => import("@/features/marketing/pages/Terms"));
const Privacy = lazy(() => import("@/features/marketing/pages/Privacy"));

const queryClient = new QueryClient();

const RouteFallback = () => (
  <div className="min-h-[50vh] flex items-center justify-center px-4">
    <div className="rounded-2xl border border-border bg-card/70 px-6 py-4 text-sm text-muted-foreground backdrop-blur-sm">
      Loading...
    </div>
  </div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <LanguageProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Suspense fallback={<RouteFallback />}>
            <Routes>
              <Route element={<Layout />}>
                <Route path="/" element={<Index />} />
                <Route path="/transfers" element={<Transfers />} />
                <Route path="/activities" element={<Activities />} />
                <Route path="/activities/:slug" element={<ActivityDetail />} />
                <Route path="/hotels/:slug" element={<HotelPage />} />
                <Route path="/book" element={<Book />} />
                <Route path="/book-activities" element={<BookActivities />} />
                <Route path="/contact" element={<Contact />} />
                <Route path="/portfolio" element={<Portfolio />} />
                <Route path="/gallery" element={<Navigate to="/portfolio" replace />} />
                <Route path="/confirmation" element={<Confirmation />} />
                <Route path="/checkout" element={<Checkout />} />
                <Route path="/checkout/success" element={<CheckoutSuccess />} />
                <Route path="/checkout/cancel" element={<CheckoutCancel />} />
                <Route path="/terms" element={<Terms />} />
                <Route path="/privacy" element={<Privacy />} />
              </Route>
              <Route path="/admin/login" element={<AdminLogin />} />
              <Route
                path="/admin"
                element={
                  <AdminRoute>
                    <Admin />
                  </AdminRoute>
                }
              />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </TooltipProvider>
    </LanguageProvider>
  </QueryClientProvider>
);

export default App;
