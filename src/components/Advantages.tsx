import { motion } from "framer-motion";
import Icon from "@/components/ui/icon";

const ITEMS = [
  {
    icon: "Shield",
    title: "Безопасность",
    text: "Все водители проверены, авто застрахованы. Отслеживаем каждый рейс.",
  },
  {
    icon: "Clock",
    title: "Точно в срок",
    text: "Выезжаем по расписанию. Никаких задержек — ваше время ценно.",
  },
  {
    icon: "BadgeCheck",
    title: "Фиксированная цена",
    text: "Цена известна заранее — никаких счётчиков и сюрпризов в дороге.",
  },
  {
    icon: "Headphones",
    title: "Поддержка 24/7",
    text: "Звоните в любое время. Поможем с маршрутом и изменением заказа.",
  },
  {
    icon: "MapPin",
    title: "Подача до двери",
    text: "Подаём авто к вашему адресу — без поиска машины на парковке.",
  },
  {
    icon: "Star",
    title: "Комфорт в пути",
    text: "Чистый салон, кондиционер, вода. Поездка — уже отдых.",
  },
];

export default function Advantages() {
  return (
    <section className="py-16 sm:py-20 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <span className="text-brand-yellow font-semibold text-sm uppercase tracking-widest">Почему выбирают нас</span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-brand-dark mt-2">
            Преимущества сервиса
          </h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {ITEMS.map((item, i) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.08 }}
              className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center mb-4">
                <Icon name={item.icon} size={24} className="text-brand-blue" />
              </div>
              <h3 className="font-bold text-brand-dark text-lg mb-2">{item.title}</h3>
              <p className="text-gray-500 text-sm leading-relaxed">{item.text}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
