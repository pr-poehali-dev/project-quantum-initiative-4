import { Link } from "react-router-dom";
import Header from "@/components/Header";
import Icon from "@/components/ui/icon";

const PHONE = "+7 (984) 334-87-24";
const PHONE_HREF = "tel:+79843348724";
const TELEGRAM_HREF = "https://t.me/ug_transfer_online";
const MAX_HREF = "https://max.ru/u/f9LHodD0cOLfcwdQZmP_TA1hXG1fSHf_rVVPptGTy_7FmQh-zvIFpGfU_lg";

export default function Contacts() {
  return (
    <div className="min-h-screen bg-[#111] flex flex-col">
      <Header />

      <main className="flex-1 pt-20 sm:pt-24 pb-12 px-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-8">Наши контакты</h1>

          <p className="text-gray-300 text-lg mb-6">
            Вы можете заказать трансфер или задать вопросы по номеру телефона:
          </p>

          <a href={PHONE_HREF} className="inline-flex items-center gap-3 text-[#c8d44a] text-2xl sm:text-3xl font-bold hover:text-[#d4e050] transition-colors mb-8">
            <Icon name="Phone" size={28} />
            {PHONE}
          </a>

          <p className="text-gray-300 text-lg mb-4">А также через наши социальные сети:</p>

          <div className="flex gap-3 mb-12">
            <a href={TELEGRAM_HREF} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-2 bg-white/10 hover:bg-white/15 rounded-full px-5 py-3 text-white text-sm font-medium transition-colors">
              <Icon name="Send" size={18} className="text-blue-400" />
              Telegram
            </a>
            <a href={MAX_HREF} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-2 bg-white/10 hover:bg-white/15 rounded-full px-5 py-3 text-white text-sm font-medium transition-colors">
              <Icon name="MessageSquare" size={18} className="text-purple-400" />
              Max
            </a>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 mb-12">
            <a href="#" className="text-[#c8d44a] hover:underline text-sm">Агентский договор</a>
            <a href="#" className="text-[#c8d44a] hover:underline text-sm">Политика конфиденциальности</a>
          </div>

          <div className="bg-[#1a1a1a] rounded-2xl p-6 sm:p-8">
            <h2 className="text-xl font-bold text-white mb-5">Реквизиты</h2>
            <div className="grid grid-cols-1 sm:grid-cols-[auto_1fr] gap-x-8 gap-y-3">
              {[
                ["Наименование", "ИП Хоменко Владимир Владимирович"],
                ["ИНН", "910238307053"],
                ["ОГРНИП", "322911200095120"],
                ["Дата регистрации", "20.12.2022"],
              ].map(([label, value]) => (
                <div key={label} className="contents">
                  <span className="text-gray-400 text-sm">{label}</span>
                  <span className="text-white text-sm font-medium">{value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>

      <footer className="bg-[#0a0a0a] border-t border-white/10 pt-10 pb-6 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-10">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <img src="https://cdn.poehali.dev/projects/4e7661bb-56aa-4a32-b0f4-260fcdbc0e28/bucket/90692979-4a2c-4563-a738-77d8b0a6bbb0.jpg" alt="Юг-трансфер" className="w-10 h-10 rounded-full bg-white object-contain" />
                <span className="text-white font-bold text-lg">Юг-трансфер</span>
              </div>
              <p className="text-gray-400 text-sm leading-relaxed">
                Надёжный трансфер по Краснодарскому краю и России
              </p>
              <div className="flex gap-2 mt-4">
                <a href={MAX_HREF} target="_blank" rel="noopener noreferrer"
                  className="w-9 h-9 rounded-full bg-white/10 hover:bg-purple-500/30 flex items-center justify-center transition-colors">
                  <Icon name="MessageSquare" size={16} className="text-purple-400" />
                </a>
                <a href={TELEGRAM_HREF} target="_blank" rel="noopener noreferrer"
                  className="w-9 h-9 rounded-full bg-white/10 hover:bg-blue-500/30 flex items-center justify-center transition-colors">
                  <Icon name="Send" size={16} className="text-blue-400" />
                </a>
              </div>
            </div>

            <div>
              <h3 className="text-white font-semibold text-sm mb-3 uppercase tracking-wide">Услуги</h3>
              <div className="flex flex-col gap-2">
                <Link to="/" className="text-gray-400 hover:text-white text-sm transition-colors">Заказать такси</Link>
                <Link to="/client/tariffs" className="text-gray-400 hover:text-white text-sm transition-colors">Тарифы</Link>
                <Link to="/client/directions" className="text-gray-400 hover:text-white text-sm transition-colors">Направления</Link>
                <Link to="/client/app" className="text-gray-400 hover:text-white text-sm transition-colors">Мобильное приложение</Link>
              </div>
            </div>

            <div>
              <h3 className="text-white font-semibold text-sm mb-3 uppercase tracking-wide">Информация</h3>
              <div className="flex flex-col gap-2">
                <Link to="/client/news" className="text-gray-400 hover:text-white text-sm transition-colors">Новости</Link>
                <Link to="/client/blog" className="text-gray-400 hover:text-white text-sm transition-colors">Блог</Link>
                <Link to="/client/reviews" className="text-gray-400 hover:text-white text-sm transition-colors">Отзывы</Link>
                <Link to="/contacts" className="text-gray-400 hover:text-white text-sm transition-colors">Контакты</Link>
              </div>
            </div>

            <div>
              <h3 className="text-white font-semibold text-sm mb-3 uppercase tracking-wide">Контакты</h3>
              <div className="flex flex-col gap-2">
                <a href={PHONE_HREF} className="text-gray-400 hover:text-white text-sm transition-colors flex items-center gap-2">
                  <Icon name="Phone" size={14} className="text-[#c8d44a]" />
                  {PHONE}
                </a>
                <a href="mailto:help@ug-transfer.com" className="text-gray-400 hover:text-white text-sm transition-colors flex items-center gap-2">
                  <Icon name="Mail" size={14} className="text-[#c8d44a]" />
                  help@ug-transfer.com
                </a>
              </div>
              <div className="mt-4 flex items-center gap-2 bg-white/5 rounded-xl px-3 py-2">
                <Icon name="Star" size={16} className="text-yellow-400" />
                <span className="text-gray-300 text-xs">Рейтинг Яндекс</span>
              </div>
            </div>
          </div>

          <div className="border-t border-white/10 pt-5 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-gray-500 text-xs">© 2026 Юг-трансфер. Все права защищены.</p>
            <a href="#" className="text-gray-500 hover:text-gray-300 text-xs transition-colors">Политика конфиденциальности</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
