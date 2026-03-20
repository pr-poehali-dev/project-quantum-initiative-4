import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import Icon from "@/components/ui/icon";

const NAV_LINKS = [
  { label: "Главная", href: "/" },
  { label: "Направления", href: "/routes" },
  { label: "Тарифы", href: "/tariffs" },
  { label: "Контакты", href: "/contacts" },
];

const PHONE = "+7 (995) 614-14-14";
const PHONE_HREF = "tel:+79956141414";
const WHATSAPP_HREF = "https://wa.me/79956141414";
const TELEGRAM_HREF = "https://t.me/ug_transfer_online";

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? "bg-white shadow-md" : "bg-transparent"
      }`}
    >
      <div className="container mx-auto px-4 h-16 flex items-center justify-between gap-4">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 shrink-0">
          <div className="w-8 h-8 bg-brand-blue rounded-lg flex items-center justify-center">
            <Icon name="Car" size={18} className="text-white" />
          </div>
          <span
            className={`font-bold text-lg leading-tight transition-colors duration-300 ${
              scrolled ? "text-brand-dark" : "text-white"
            }`}
          >
            Юг-<span className="text-brand-yellow">Трансфер</span>
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden lg:flex items-center gap-6">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              to={link.href}
              className={`text-sm font-medium transition-colors duration-200 ${
                location.pathname === link.href
                  ? "text-brand-yellow"
                  : scrolled
                  ? "text-gray-700 hover:text-brand-blue"
                  : "text-white/90 hover:text-white"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Right: phone + messengers + CTA */}
        <div className="hidden lg:flex items-center gap-3">
          <a
            href={PHONE_HREF}
            className={`text-sm font-semibold transition-colors duration-200 ${
              scrolled ? "text-brand-dark" : "text-white"
            }`}
          >
            {PHONE}
          </a>
          <a
            href={WHATSAPP_HREF}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="WhatsApp"
            className={`transition-colors duration-200 ${
              scrolled ? "text-green-600 hover:text-green-700" : "text-white/80 hover:text-white"
            }`}
          >
            <Icon name="MessageCircle" size={20} />
          </a>
          <a
            href={TELEGRAM_HREF}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Telegram"
            className={`transition-colors duration-200 ${
              scrolled ? "text-blue-500 hover:text-blue-600" : "text-white/80 hover:text-white"
            }`}
          >
            <Icon name="Send" size={20} />
          </a>
          <Link
            to="/#order"
            className="bg-brand-yellow text-brand-dark text-sm font-bold px-4 py-2 rounded-lg hover:bg-yellow-400 transition-colors duration-200 whitespace-nowrap"
          >
            Заказать
          </Link>
        </div>

        {/* Mobile: phone + burger */}
        <div className="flex lg:hidden items-center gap-3">
          <a
            href={PHONE_HREF}
            className={`transition-colors duration-200 ${
              scrolled ? "text-brand-dark" : "text-white"
            }`}
          >
            <Icon name="Phone" size={20} />
          </a>
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Меню"
            className={`transition-colors duration-200 ${
              scrolled ? "text-brand-dark" : "text-white"
            }`}
          >
            <Icon name={mobileOpen ? "X" : "Menu"} size={24} />
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="lg:hidden bg-white border-t border-gray-100 shadow-lg">
          <nav className="container mx-auto px-4 py-4 flex flex-col gap-1">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                className={`py-3 px-2 text-base font-medium rounded-lg transition-colors ${
                  location.pathname === link.href
                    ? "text-brand-blue bg-blue-50"
                    : "text-gray-700 hover:bg-gray-50"
                }`}
              >
                {link.label}
              </Link>
            ))}
            <div className="flex items-center gap-4 pt-3 border-t border-gray-100 mt-2">
              <a href={PHONE_HREF} className="text-sm font-semibold text-brand-dark">
                {PHONE}
              </a>
              <a href={WHATSAPP_HREF} target="_blank" rel="noopener noreferrer" className="text-green-600">
                <Icon name="MessageCircle" size={20} />
              </a>
              <a href={TELEGRAM_HREF} target="_blank" rel="noopener noreferrer" className="text-blue-500">
                <Icon name="Send" size={20} />
              </a>
            </div>
            <Link
              to="/#order"
              className="mt-3 bg-brand-yellow text-brand-dark font-bold py-3 rounded-lg text-center hover:bg-yellow-400 transition-colors"
            >
              Заказать трансфер
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}