import { Toaster as Sonner } from "@/components/ui/sonner";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Thanks from "./pages/Thanks";
import Admin from "./pages/Admin";

const App = () => (
  <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
    <Sonner />
    <Routes>
      <Route path="/" element={<Index />} />
      <Route path="/thanks" element={<Thanks />} />
      <Route path="/admin" element={<Admin />} />
      <Route path="*" element={<Index />} />
    </Routes>
  </BrowserRouter>
);

export default App;