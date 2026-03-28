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
      { label: "Подключение", href: "https://ug-transfer.online/mobile-drivers/", external: true },
      { label: "Автопарк", href: "https://ug-transfer.online/rent-car/", external: true },
      { label: "Эвакуатор", href: "https://evacrimea.ru/", external: true },
    ],
  },
  {
    label: "Партнёры", href: "/partners",
    children: [
      { label: "Экскурсии", href: "https://exursyalta.ru/", external: true },
      { label: "Заказать такси", href: "https://ug-transfer.online/", external: true },
    ],
  },
  { label: "Контакты", href: "/contacts" },
];

const PHONE = "+7 (995) 614-14-14";
const PHONE_HREF = "tel:+79956141414";
const MAX_HREF = "https://max.ru/u/f9LHodD0cOLfcwdQZmP_TA1hXG1fSHf_rVVPptGTy_7FmQh-zvIFpGfU_lg";
const TELEGRAM_HREF = "https://t.me/ug_transfer_online";


export default function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({});
  const location = useLocation();

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  const isActive = (href: string) =>
    href === "/" ? location.pathname === "/" : location.pathname.startsWith(href);

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 hidden md:block pt-3 px-4">
        <div className="max-w-[1400px] mx-auto bg-black/70 backdrop-blur-md border border-white/10 rounded-full px-6 h-16 flex items-center justify-between gap-6">
          <a href="/" onClick={(e) => { e.preventDefault(); window.location.href = "/"; }} className="flex items-center gap-3 shrink-0 cursor-pointer">
            <img
              src="https://cdn.poehali.dev/projects/4e7661bb-56aa-4a32-b0f4-260fcdbc0e28/bucket/90692979-4a2c-4563-a738-77d8b0a6bbb0.jpg"
              alt="Наше такси"
              className="w-10 h-10 object-contain rounded-full"
            />
            <span className="font-bold text-base leading-tight text-white whitespace-nowrap">
              Наше <span className="text-[#F5A623]">такси</span>
            </span>
          </a>

          <nav className="flex items-center gap-1">
            {NAV_LINKS.map((link) =>
              link.children ? (
                <div key={link.href} className="relative group">
                  <Link
                    to={link.href}
                    className={`px-4 py-2 text-[15px] font-medium transition-colors flex items-center gap-1 border-b-2 ${
                      isActive(link.href)
                        ? "text-[#F5A623] border-[#F5A623]"
                        : "text-white/80 border-transparent hover:text-white"
                    }`}
                  >
                    {link.label}
                    <Icon name="ChevronDown" size={14} className="opacity-60 transition-transform group-hover:rotate-180" />
                  </Link>
                  <div className="absolute top-full left-0 pt-3 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                    <div className="bg-black/90 backdrop-blur-md border border-white/10 rounded-2xl shadow-2xl py-2 min-w-[260px]">
                      {link.children.map((child, i) =>
                        ("external" in child && child.external) ? (
                          <a key={child.href} href={child.href} target="_blank" rel="noopener noreferrer"
                            className={`block px-5 py-3 text-sm font-medium transition-colors hover:bg-white/10 text-white/80 hover:text-white ${i < link.children!.length - 1 ? "border-b border-white/5" : ""}`}>
                            {child.label}
                          </a>
                        ) : (
                          <Link key={child.href} to={child.href}
                            className={`block px-5 py-3 text-sm font-medium transition-colors hover:bg-white/10 ${
                              location.pathname === child.href ? "text-[#F5A623]" : "text-white/80 hover:text-white"
                            } ${i < link.children!.length - 1 ? "border-b border-white/5" : ""}`}>
                            {child.label}
                          </Link>
                        )
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <Link
                  key={link.href}
                  to={link.href}
                  className={`px-4 py-2 text-[15px] font-medium transition-colors border-b-2 ${
                    isActive(link.href)
                      ? "text-[#F5A623] border-[#F5A623]"
                      : "text-white/80 border-transparent hover:text-white"
                  }`}
                >
                  {link.label}
                </Link>
              )
            )}
          </nav>

          <div className="flex items-center gap-4 shrink-0">
            <a href={PHONE_HREF} className="text-sm font-semibold text-white hover:text-[#F5A623] transition-colors hidden lg:block whitespace-nowrap">
              {PHONE}
            </a>
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label="Меню"
              className="w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
            >
              <Icon name={mobileOpen ? "X" : "Menu"} size={20} />
            </button>
          </div>
        </div>
      </header>

      <div className="md:hidden fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 pt-3 pb-2">
        <a
          href={PHONE_HREF}
          className="flex items-center gap-2 bg-black/60 backdrop-blur-sm text-white text-sm font-bold px-3 py-2 rounded-full"
        >
          <Icon name="Phone" size={14} className="text-[#F5A623]" />
          {PHONE}
        </a>
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Меню"
          className="w-10 h-10 flex items-center justify-center bg-black/60 backdrop-blur-sm rounded-full text-white"
        >
          <Icon name={mobileOpen ? "X" : "Menu"} size={22} />
        </button>
      </div>

      {mobileOpen && (
        <div className="fixed inset-0 z-[60] bg-[#111111] flex flex-col">
          <div className="flex items-center justify-between px-4 pt-3 pb-2">
            <a href="/" onClick={(e) => { e.preventDefault(); window.location.href = "/"; }} className="flex items-center gap-2 cursor-pointer">
              <img src="https://cdn.poehali.dev/projects/4e7661bb-56aa-4a32-b0f4-260fcdbc0e28/bucket/90692979-4a2c-4563-a738-77d8b0a6bbb0.jpg" alt="Наше такси" className="w-10 h-10 object-contain rounded-full" />
              <span className="font-bold text-lg text-white">
                Наше <span className="text-[#F5A623]">такси</span>
              </span>
            </a>
            <button
              onClick={() => setMobileOpen(false)}
              className="w-10 h-10 flex items-center justify-center bg-white/10 rounded-full text-white"
            >
              <Icon name="X" size={22} />
            </button>
          </div>

          <nav className="flex-1 flex flex-col px-4 pt-6 gap-1 overflow-y-auto">
            {NAV_LINKS.map((link) =>
              link.children ? (
                <div key={link.href}>
                  <button
                    onClick={() => setOpenSections(s => ({ ...s, [link.href]: !s[link.href] }))}
                    className={`w-full flex items-center justify-between py-4 px-4 text-xl font-semibold rounded-2xl transition-colors ${
                      openSections[link.href] ? "text-[#F5A623] bg-white/5" : "text-white hover:bg-white/5"
                    }`}
                  >
                    {link.label}
                    <Icon name="ChevronDown" size={20} className={`transition-transform ${openSections[link.href] ? "rotate-180" : ""}`} />
                  </button>
                  {openSections[link.href] && (
                    <div className="flex flex-col gap-0.5 ml-4 mb-2">
                      {link.children.map((child) =>
                        ("external" in child && child.external) ? (
                          <a key={child.href} href={child.href} target="_blank" rel="noopener noreferrer"
                            className="py-3 px-4 text-base text-white/70 hover:text-white hover:bg-white/5 rounded-xl transition-colors">
                            {child.label}
                          </a>
                        ) : (
                          <Link key={child.href} to={child.href}
                            className={`py-3 px-4 text-base rounded-xl transition-colors ${
                              location.pathname === child.href ? "text-[#F5A623] bg-white/5" : "text-white/70 hover:text-white hover:bg-white/5"
                            }`}>
                            {child.label}
                          </Link>
                        )
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <Link
                  key={link.href}
                  to={link.href}
                  className={`py-4 px-4 text-xl font-semibold rounded-2xl transition-colors ${
                    isActive(link.href)
                      ? "text-[#F5A623] bg-white/5"
                      : "text-white hover:bg-white/5"
                  }`}
                >
                  {link.label}
                </Link>
              )
            )}
          </nav>

          <div className="px-4 pb-10 flex flex-col gap-4 border-t border-white/10 pt-5 overflow-y-auto">
            <div className="flex flex-col gap-2">
              <a href={PHONE_HREF} className="flex items-center gap-2 text-white font-bold text-base">
                <Icon name="Phone" size={16} className="text-[#F5A623]" />
                {PHONE}
              </a>
              <a href="mailto:help@ug-transfer.online" className="flex items-center gap-2 text-white/60 text-sm">
                <Icon name="Mail" size={16} className="text-[#F5A623]" />
                help@ug-transfer.online
              </a>
              <div className="flex items-center gap-2 text-white/60 text-sm">
                <Icon name="Clock" size={16} className="text-[#F5A623]" />
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