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
    <>
      {/* ── DESKTOP шапка ── */}
      <header className="fixed top-0 left-0 right-0 z-50 hidden sm:block bg-[#1a1a1a] shadow-lg">
        <div className="container mx-auto px-6 h-14 flex items-center justify-between gap-4">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 shrink-0">
            <div className="w-8 h-8 bg-brand-blue rounded-lg flex items-center justify-center">
              <Icon name="Car" size={18} className="text-white" />
            </div>
            <span className="font-bold text-lg leading-tight text-white">
              Юг-<span className="text-brand-yellow">Трансфер</span>
            </span>
          </Link>

          {/* Right: phone + messengers + burger */}
          <div className="flex items-center gap-4">
            <a href={WHATSAPP_HREF} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-sm text-green-400 font-medium hover:text-green-300 transition-colors">
              <Icon name="MessageCircle" size={16} /> WhatsApp
            </a>
            <a href={TELEGRAM_HREF} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-sm text-blue-400 font-medium hover:text-blue-300 transition-colors">
              <Icon name="Send" size={16} /> Telegram
            </a>
            <a href={PHONE_HREF} className="text-sm font-semibold text-white hover:text-brand-yellow transition-colors">
              {PHONE}
            </a>
            <button onClick={() => setMobileOpen(!mobileOpen)} aria-label="Меню" className="text-white hover:text-brand-yellow transition-colors">
              <Icon name={mobileOpen ? "X" : "Menu"} size={22} />
            </button>
          </div>
        </div>

        {/* Desktop burger dropdown */}
        {mobileOpen && (
          <div className="bg-white border-t border-gray-100 shadow-lg">
            <nav className="container mx-auto px-4 py-4 flex flex-col gap-1">
              {NAV_LINKS.map((link) => (
                <Link key={link.href} to={link.href}
                  className={`py-3 px-2 text-base font-medium rounded-lg transition-colors ${
                    location.pathname === link.href ? "text-brand-blue bg-blue-50" : "text-gray-700 hover:bg-gray-50"
                  }`}>
                  {link.label}
                </Link>
              ))}
              <div className="flex items-center gap-4 pt-3 border-t border-gray-100 mt-2">
                <a href={WHATSAPP_HREF} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-sm text-green-600 font-medium">
                  <Icon name="MessageCircle" size={18} /> WhatsApp
                </a>
                <a href={TELEGRAM_HREF} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-sm text-blue-500 font-medium">
                  <Icon name="Send" size={18} /> Telegram
                </a>
              </div>
              <Link to="/#order" className="mt-3 bg-brand-yellow text-brand-dark font-bold py-3 rounded-lg text-center hover:bg-yellow-400 transition-colors">
                Заказать трансфер
              </Link>
            </nav>
          </div>
        )}
      </header>

      {/* ── MOBILE шапка (поверх Hero) ── */}
      <div className="sm:hidden fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 pt-3 pb-2">
        {/* Телефон слева */}
        <a
          href={PHONE_HREF}
          className="flex items-center gap-2 bg-black/60 backdrop-blur-sm text-white text-sm font-bold px-3 py-2 rounded-full"
        >
          <Icon name="Phone" size={14} className="text-[#c8d44a]" />
          {PHONE}
        </a>

        {/* Бургер справа */}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Меню"
          className="w-10 h-10 flex items-center justify-center bg-black/60 backdrop-blur-sm rounded-full text-white"
        >
          <Icon name={mobileOpen ? "X" : "Menu"} size={22} />
        </button>
      </div>

      {/* ── MOBILE бургер-панель (тёмная, на весь экран) ── */}
      {mobileOpen && (
        <div className="sm:hidden fixed inset-0 z-40 bg-[#111111] flex flex-col">
          {/* Шапка панели */}
          <div className="flex items-center justify-between px-4 pt-3 pb-2">
            <Link to="/" className="flex items-center gap-2" onClick={() => setMobileOpen(false)}>
              <div className="w-8 h-8 bg-brand-blue rounded-lg flex items-center justify-center">
                <Icon name="Car" size={18} className="text-white" />
              </div>
              <span className="font-bold text-lg text-white">
                Юг-<span className="text-brand-yellow">Трансфер</span>
              </span>
            </Link>
            <button
              onClick={() => setMobileOpen(false)}
              className="w-10 h-10 flex items-center justify-center bg-white/10 rounded-full text-white"
            >
              <Icon name="X" size={22} />
            </button>
          </div>

          {/* Навигация */}
          <nav className="flex-1 flex flex-col px-4 pt-6 gap-1">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                className={`py-4 px-4 text-xl font-semibold rounded-2xl transition-colors ${
                  location.pathname === link.href
                    ? "text-[#c8d44a] bg-white/5"
                    : "text-white hover:bg-white/5"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Подвал внутри бургер-панели */}
          <div className="px-4 pb-10 flex flex-col gap-4 border-t border-white/10 pt-5 overflow-y-auto">
            <div className="flex flex-col gap-2">
              <a href={PHONE_HREF} className="flex items-center gap-2 text-white font-bold text-base">
                <Icon name="Phone" size={16} className="text-[#c8d44a]" />
                {PHONE}
              </a>
              <a href="mailto:help@ug-transfer.online" className="flex items-center gap-2 text-white/60 text-sm">
                <Icon name="Mail" size={16} className="text-[#c8d44a]" />
                help@ug-transfer.online
              </a>
              <div className="flex items-center gap-2 text-white/60 text-sm">
                <Icon name="Clock" size={16} className="text-[#c8d44a]" />
                Работаем 24/7
              </div>
            </div>
            <div className="flex gap-3">
              <a href={WHATSAPP_HREF} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-2 bg-white/10 rounded-full px-4 py-2 text-white text-sm">
                <Icon name="MessageCircle" size={16} className="text-green-400" />
                WhatsApp
              </a>
              <a href={TELEGRAM_HREF} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-2 bg-white/10 rounded-full px-4 py-2 text-white text-sm">
                <Icon name="Send" size={16} className="text-blue-400" />
                Telegram
              </a>
            </div>
            <div>
              <p className="text-white/40 text-xs uppercase tracking-wide mb-2">Популярные маршруты</p>
              <div className="flex flex-col gap-1">
                {["Москва → Ростов-на-Дону", "Ясиноватая → Анапа", "Москва → Цимлянск"].map((r) => (
                  <span key={r} className="text-white/60 text-sm">{r}</span>
                ))}
              </div>
            </div>
            <div className="flex gap-4 flex-wrap">
              <a href="/offer" className="text-white/30 text-xs hover:text-white/60 transition-colors">Публичная оферта</a>
              <a href="/privacy" className="text-white/30 text-xs hover:text-white/60 transition-colors">Политика конфиденциальности</a>
            </div>
            <p className="text-white/20 text-xs">© {new Date().getFullYear()} УГТрансфер. Все права защищены.</p>
          </div>
        </div>
      )}
    </>
  );
}