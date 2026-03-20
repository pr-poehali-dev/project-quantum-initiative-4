import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Icon from "@/components/ui/icon";

const TARIFFS = [
  {
    id: "economy",
    name: "Эконом",
    icon: "Car",
    models: "Solaris, Rio, Polo",
    pricePerKm: "15 ₽/км",
    minOrder: "",
    capacity: "до 3 пассажиров",
    luggage: "2 чемодана",
    color: "border-gray-200",
    badge: "bg-gray-100 text-gray-700",
    features: [
      "Кондиционер",
      "Аудиосистема",
      "Чистый салон",
      "Вода по запросу",
    ],
    routes: [
      { name: "Москва → Ростов-на-Дону", price: "от 12 000 ₽" },
      { name: "Ясиноватая → Анапа", price: "от 8 000 ₽" },
      { name: "Москва → Цимлянск", price: "от 14 000 ₽" },
    ],
  },
  {
    id: "comfort",
    name: "Комфорт",
    icon: "Car",
    models: "Camry, Octavia, K5",
    pricePerKm: "20 ₽/км",
    minOrder: "",
    capacity: "до 4 пассажиров",
    luggage: "3 чемодана",
    color: "border-brand-blue",
    badge: "bg-brand-blue text-white",
    popular: true,
    features: [
      "Кондиционер",
      "USB зарядка",
      "Вода в подарок",
      "Широкий салон",
      "Тихая музыка",
    ],
    routes: [
      { name: "Москва → Ростов-на-Дону", price: "от 16 000 ₽" },
      { name: "Ясиноватая → Анапа", price: "от 10 700 ₽" },
      { name: "Москва → Цимлянск", price: "от 18 700 ₽" },
    ],
  },
  {
    id: "business",
    name: "Бизнес",
    icon: "Car",
    models: "E-Class, 5 Series",
    pricePerKm: "35 ₽/км",
    minOrder: "",
    capacity: "до 3 пассажиров",
    luggage: "2 чемодана",
    color: "border-slate-700",
    badge: "bg-slate-800 text-white",
    features: [
      "Премиум салон",
      "Встреча с табличкой",
      "Помощь с багажом",
      "Тихий режим",
      "Wi-Fi по запросу",
    ],
    routes: [
      { name: "Москва → Ростов-на-Дону", price: "от 28 000 ₽" },
      { name: "Ясиноватая → Анапа", price: "от 18 700 ₽" },
      { name: "Москва → Цимлянск", price: "от 32 700 ₽" },
    ],
  },
  {
    id: "minivan",
    name: "Минивэн",
    icon: "Bus",
    models: "Vito, H-1, Transit",
    pricePerKm: "25 ₽/км",
    minOrder: "",
    capacity: "до 7 пассажиров",
    luggage: "7+ мест для багажа",
    color: "border-brand-yellow",
    badge: "bg-brand-yellow text-brand-dark",
    features: [
      "7 пассажирских мест",
      "Большой багажник",
      "Кондиционер",
      "Детское кресло",
      "Откидные сиденья",
    ],
    routes: [
      { name: "Москва → Ростов-на-Дону", price: "от 20 000 ₽" },
      { name: "Ясиноватая → Анапа", price: "от 13 400 ₽" },
      { name: "Москва → Цимлянск", price: "от 23 300 ₽" },
    ],
  },
];

const EXTRAS = [
  { label: "Детское кресло 0+", price: "300 ₽" },
  { label: "Детское кресло 1–4 года", price: "300 ₽" },
  { label: "Детское кресло 5–12 лет", price: "200 ₽" },
  { label: "Животное в переноске", price: "400 ₽" },
  { label: "Негабаритный багаж", price: "500 ₽" },
  { label: "Встреча в аэропорту/ж/д", price: "400 ₽" },
];

export default function Tariffs() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      {/* Hero */}
      <section className="bg-gradient-to-br from-brand-dark via-blue-900 to-blue-800 pt-28 pb-12 px-4">
        <div className="container mx-auto text-center">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white mb-3">
            Тарифы на трансфер
          </h1>
          <p className="text-white/70 max-w-lg mx-auto">
            Прозрачные цены без скрытых доплат. Окончательная стоимость рассчитывается по маршруту.
          </p>
        </div>
      </section>

      {/* Tariff cards */}
      <section className="bg-gray-50 py-14 px-4">
        <div className="container mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-14">
            {TARIFFS.map((t, i) => (
              <motion.div
                key={t.id}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.1 }}
                className={`relative bg-white rounded-2xl p-6 border-2 ${t.color} shadow-sm`}
              >
                {t.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-brand-yellow text-brand-dark text-xs font-bold px-3 py-1 rounded-full whitespace-nowrap">
                    Популярный
                  </div>
                )}
                <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold mb-4 ${t.badge}`}>
                  <Icon name={t.icon} size={14} />
                  {t.name}
                </div>
                <p className="text-xs text-gray-500 mb-1">Модели</p>
                <p className="text-sm font-medium text-brand-dark mb-4">{t.models}</p>

                <div className="text-3xl font-black text-brand-blue mb-4">{t.pricePerKm}</div>

                <div className="flex flex-col gap-1 text-xs text-gray-500 mb-5">
                  <span className="flex items-center gap-1">
                    <Icon name="Users" size={12} /> {t.capacity}
                  </span>
                  <span className="flex items-center gap-1">
                    <Icon name="Luggage" size={12} /> {t.luggage}
                  </span>
                </div>

                <ul className="space-y-1.5 mb-6">
                  {t.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-xs text-gray-600">
                      <Icon name="Check" size={12} className="text-green-500 shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>

                <div className="border-t border-gray-100 pt-4">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Примеры маршрутов</p>
                  <ul className="space-y-1">
                    {t.routes.map((r) => (
                      <li key={r.name} className="flex justify-between text-xs">
                        <span className="text-gray-600">{r.name}</span>
                        <span className="font-semibold text-brand-blue">{r.price}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Extras */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 max-w-2xl mx-auto mb-10">
            <h3 className="font-bold text-brand-dark text-lg mb-4">Дополнительные услуги</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {EXTRAS.map((e) => (
                <div key={e.label} className="flex justify-between items-center py-2 border-b border-gray-50">
                  <span className="text-sm text-gray-600">{e.label}</span>
                  <span className="font-semibold text-brand-blue text-sm">{e.price}</span>
                </div>
              ))}
            </div>
          </div>

          {/* CTA */}
          <div className="text-center">
            <p className="text-gray-500 text-sm mb-4">
              Точную стоимость рассчитаем по вашему маршруту — просто оставьте заявку
            </p>
            <Link
              to="/#order"
              className="inline-block bg-brand-yellow hover:bg-yellow-400 text-brand-dark font-bold text-base px-8 py-4 rounded-xl transition-colors shadow-lg"
            >
              Рассчитать стоимость →
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}