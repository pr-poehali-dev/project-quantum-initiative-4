import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import Icon from "@/components/ui/icon";

const NAV_LINKS = [
  { label: "Главная", href: "/" },
  {
    label: "Клиенту", href: "/client",
    children: [
      { label: "Направления", href: "https://ug-transfer.online/directories/", external: true },
      { label: "Новости", href: "https://ug-transfer.online/news/", external: true },
      { label: "Тарифы", href: "https://ug-transfer.online/tariffs/", external: true },
      { label: "Отзывы", href: "https://yandex.ru/maps/org/yug_transfer/17195285841/reviews/?ll=99.505405%2C31.524850&z=2", external: true },
      { label: "Блог", href: "https://ug-transfer.online/blog/", external: true },
      { label: "Приложение для заказа такси", href: "https://ug-transfer.online/clients-app/", external: true },
    ],
  },
  {
    label: "Водителю", href: "/driver",
    children: [
      { label: "Вакансии", href: "/driver/jobs" },
      { label: "Условия работы", href: "/driver/terms" },
      { label: "Подключение", href: "/driver/connect" },
      { label: "Автопарк", href: "/driver/fleet" },
    ],
  },
  { label: "Контакты", href: "/contacts" },
];

const PHONE = "+7 (995) 614-14-14";
const PHONE_HREF = "tel:+79956141414";
const MAX_HREF = "https://max.ru/u/f9LHodD0cOLfcwdQZmP_TA1hXG1fSHf_rVVPptGTy_7FmQh-zvIFpGfU_lg";
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
          <a href="/" onClick={(e) => { e.preventDefault(); window.location.href = "/"; }} className="flex items-center gap-2 shrink-0 cursor-pointer">
            <img src="https://cdn.poehali.dev/projects/4e7661bb-56aa-4a32-b0f4-260fcdbc0e28/bucket/90692979-4a2c-4563-a738-77d8b0a6bbb0.jpg" alt="Наше такси" className="w-10 h-10 object-contain rounded-full bg-white" />
            <span className="font-bold text-lg leading-tight text-white">
              Наше <span className="text-brand-yellow">такси</span>
            </span>
          </a>

          {/* Nav links */}
          <nav className="flex items-center gap-1">
            {NAV_LINKS.map((link) =>
              link.children ? (
                <div key={link.href} className="relative group">
                  <Link to={link.href}
                    className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors flex items-center gap-1 ${
                      location.pathname.startsWith(link.href) ? "text-[#c8d44a]" : "text-white/70 hover:text-white"
                    }`}>
                    {link.label}
                    <Icon name="ChevronDown" size={14} className="transition-transform group-hover:rotate-180" />
                  </Link>
                  <div className="absolute top-full left-0 pt-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                    <div className="bg-[#222] border border-white/10 rounded-2xl shadow-2xl py-2 min-w-[260px]">
                      {link.children.map((child, i) =>
                        ("external" in child && child.external) ? (
                          <a key={child.href} href={child.href} target="_blank" rel="noopener noreferrer"
                            className={`block px-5 py-3 text-sm font-medium transition-colors hover:bg-white/5 text-white ${i < link.children!.length - 1 ? "border-b border-white/5" : ""}`}>
                            {child.label}
                          </a>
                        ) : (
                          <Link key={child.href} to={child.href}
                            className={`block px-5 py-3 text-sm font-medium transition-colors hover:bg-white/5 ${
                              location.pathname === child.href ? "text-[#c8d44a]" : "text-white"
                            } ${i < link.children!.length - 1 ? "border-b border-white/5" : ""}`}>
                            {child.label}
                          </Link>
                        )
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <Link key={link.href} to={link.href}
                  className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                    location.pathname === link.href ? "text-[#c8d44a]" : "text-white/70 hover:text-white"
                  }`}>
                  {link.label}
                </Link>
              )
            )}
          </nav>

          {/* Right: phone + messengers + burger */}
          <div className="flex items-center gap-4">
            <a href={MAX_HREF} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-sm text-purple-400 font-medium hover:text-purple-300 transition-colors">
              <Icon name="MessageSquare" size={16} /> Max
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
                <a href={MAX_HREF} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-sm text-purple-600 font-medium">
                  <Icon name="MessageSquare" size={18} /> Max
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
            <a href="/" onClick={(e) => { e.preventDefault(); window.location.href = "/"; }} className="flex items-center gap-2 cursor-pointer">
              <img src="https://cdn.poehali.dev/projects/4e7661bb-56aa-4a32-b0f4-260fcdbc0e28/bucket/90692979-4a2c-4563-a738-77d8b0a6bbb0.jpg" alt="Наше такси" className="w-10 h-10 object-contain rounded-full bg-white" />
              <span className="font-bold text-lg text-white">
                Наше <span className="text-brand-yellow">такси</span>
              </span>
            </a>
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
              <a href={MAX_HREF} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-2 bg-white/10 rounded-full px-4 py-2 text-white text-sm">
                <Icon name="MessageSquare" size={16} className="text-purple-400" />
                Max
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

            <p className="text-white/20 text-xs">© {new Date().getFullYear()} УГТрансфер. Все права защищены.</p>
          </div>
        </div>
      )}
    </>
  );
}