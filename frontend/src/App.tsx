import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { IDELayout } from "@/components/layout/IDELayout";
import Dashboard from "./pages/Dashboard";
import AdversarialLab from "./pages/AdversarialLab";
import InclusionHeatmap from "./pages/InclusionHeatmap";
import SystemDesignCanvas from "./pages/SystemDesignCanvas";
import ProgressPage from "./pages/ProgressPage";
import SettingsPage from "./pages/SettingsPage";
import NotFound from "./pages/NotFound";

import { useEffect } from "react";
import { devforgeExtension } from "./devforge/extension";
import { DevForgeOverlay } from "./devforge/layers/layer1-overlay";

const queryClient = new QueryClient();

const App = () => {
  useEffect(() => {
    devforgeExtension.initialize();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <DevForgeOverlay store={devforgeExtension.store} />
          <BrowserRouter>
            <Routes>
              <Route element={<IDELayout />}>
                <Route path="/" element={<Dashboard />} />
                <Route path="/lab" element={<AdversarialLab />} />
                <Route path="/heatmap" element={<InclusionHeatmap />} />
                <Route path="/design" element={<SystemDesignCanvas />} />
                <Route path="/progress" element={<ProgressPage />} />
                <Route path="/settings" element={<SettingsPage />} />
              </Route>
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
};


export default App;
