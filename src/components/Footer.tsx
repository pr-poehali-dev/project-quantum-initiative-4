import { Link } from "react-router-dom";
import Icon from "@/components/ui/icon";

const PHONE = "+7 (995) 614-14-14";
const PHONE_HREF = "tel:+79956141414";
const EMAIL = "help@ug-transfer.online";
const WHATSAPP_HREF = "https://wa.me/79956141414";
const TELEGRAM_HREF = "https://t.me/ug_transfer_online";

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-brand-dark text-white">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-10">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <img src="https://cdn.poehali.dev/projects/4e7661bb-56aa-4a32-b0f4-260fcdbc0e28/bucket/ada7ecb8-4358-4599-9ef2-20a722789a54.png" alt="Такси Сокол" className="w-10 h-10 object-contain" />
              <span className="font-bold text-lg">
                Такси <span className="text-brand-yellow">Сокол</span>
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
                "Москва → Ростов-на-Дону",
                "Ясиноватая → Анапа",
                "Москва → Цимлянск",
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
            © {year} Такси Сокол. Все права защищены.
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