import { Link } from "react-router-dom";
import Icon from "@/components/ui/icon";

const PHONE = "+7 (900) 000-00-00";
const PHONE_HREF = "tel:+79000000000";
const EMAIL = "info@ug-transfer.ru";
const WHATSAPP_HREF = "https://wa.me/79000000000";
const TELEGRAM_HREF = "https://t.me/transfer_service";

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-brand-dark text-white">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-10">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-brand-blue rounded-lg flex items-center justify-center">
                <Icon name="Car" size={18} className="text-white" />
              </div>
              <span className="font-bold text-lg">
                УГ<span className="text-brand-yellow">Трансфер</span>
              </span>
            </div>
            <p className="text-white/60 text-sm leading-relaxed mb-4">
              Межгородской трансфер по югу России и Донбассу. Надёжно, комфортно, вовремя.
            </p>
            <div className="flex gap-3">
              <a href={WHATSAPP_HREF} target="_blank" rel="noopener noreferrer"
                className="w-9 h-9 bg-white/10 rounded-lg flex items-center justify-center hover:bg-green-600 transition-colors">
                <Icon name="MessageCircle" size={16} />
              </a>
              <a href={TELEGRAM_HREF} target="_blank" rel="noopener noreferrer"
                className="w-9 h-9 bg-white/10 rounded-lg flex items-center justify-center hover:bg-blue-500 transition-colors">
                <Icon name="Send" size={16} />
              </a>
            </div>
          </div>

          {/* Navigation */}
          <div>
            <h4 className="font-semibold text-sm uppercase tracking-wide text-white/50 mb-4">Сервис</h4>
            <ul className="space-y-2">
              {[
                { label: "Направления", href: "/routes" },
                { label: "Тарифы", href: "/tariffs" },
                { label: "Контакты", href: "/contacts" },
                { label: "Заказать трансфер", href: "/#order" },
              ].map((l) => (
                <li key={l.href}>
                  <Link to={l.href} className="text-white/70 hover:text-white text-sm transition-colors">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Popular routes */}
          <div>
            <h4 className="font-semibold text-sm uppercase tracking-wide text-white/50 mb-4">Популярные маршруты</h4>
            <ul className="space-y-2">
              {[
                "Москва → Ростов",
                "Ростов → Краснодар",
                "Ясиноватая → Анапа",
                "Донецк → Сочи",
                "Луганск → Москва",
              ].map((r) => (
                <li key={r}>
                  <Link to="/routes" className="text-white/70 hover:text-white text-sm transition-colors">
                    {r}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contacts */}
          <div>
            <h4 className="font-semibold text-sm uppercase tracking-wide text-white/50 mb-4">Контакты</h4>
            <ul className="space-y-3">
              <li>
                <a href={PHONE_HREF} className="flex items-center gap-2 text-white hover:text-brand-yellow transition-colors text-sm">
                  <Icon name="Phone" size={15} className="text-brand-yellow" />
                  {PHONE}
                </a>
              </li>
              <li>
                <a href={`mailto:${EMAIL}`} className="flex items-center gap-2 text-white/70 hover:text-white transition-colors text-sm">
                  <Icon name="Mail" size={15} className="text-brand-yellow" />
                  {EMAIL}
                </a>
              </li>
              <li>
                <div className="flex items-center gap-2 text-white/70 text-sm">
                  <Icon name="Clock" size={15} className="text-brand-yellow" />
                  Работаем 24/7
                </div>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-white/10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-white/40 text-xs">
            © {year} УГТрансфер. Все права защищены.
          </p>
          <div className="flex gap-4">
            <Link to="/offer" className="text-white/40 hover:text-white/70 text-xs transition-colors">
              Публичная оферта
            </Link>
            <Link to="/privacy" className="text-white/40 hover:text-white/70 text-xs transition-colors">
              Политика конфиденциальности
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
