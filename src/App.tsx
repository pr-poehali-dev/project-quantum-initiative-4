import { Toaster as Sonner } from "@/components/ui/sonner";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { Link } from "react-router-dom";
import Index from "./pages/Index";
import Thanks from "./pages/Thanks";
import Admin from "./pages/Admin";
import Contacts from "./pages/Contacts";
import Icon from "@/components/ui/icon";

function FloatingOrderButton() {
  const location = useLocation();
  if (location.pathname === "/" || location.pathname === "/admin") return null;

  return (
    <Link
      to="/"
      className="fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-[#c8d44a] hover:bg-[#d4e050] text-black font-bold text-base px-7 py-4 rounded-full shadow-2xl transition-all hover:scale-105 active:scale-95 border-2 border-white/30"
    >
      <Icon name="Car" size={20} />
      Заказать такси
    </Link>
  );
}

const App = () => (
  <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
    <Sonner />
    <FloatingOrderButton />
    <Routes>
      <Route path="/" element={<Index />} />
      <Route path="/thanks" element={<Thanks />} />
      <Route path="/admin" element={<Admin />} />
      <Route path="/contacts" element={<Contacts />} />
      <Route path="*" element={<Index />} />
    </Routes>
  </BrowserRouter>
);

export default App;