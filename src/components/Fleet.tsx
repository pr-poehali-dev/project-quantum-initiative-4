import { motion } from "framer-motion";
import Icon from "@/components/ui/icon";

const CARS = [
  {
    cls: "Эконом",
    models: "Hyundai Solaris, Kia Rio, VW Polo",
    seats: 4,
    price: "от 3 ₽/км",
    color: "bg-gray-100",
    badge: "bg-gray-200 text-gray-700",
    icon: "Car",
    features: ["Кондиционер", "Музыка", "Чистый салон"],
  },
  {
    cls: "Комфорт",
    models: "Toyota Camry, Kia K5, Skoda Octavia",
    seats: 4,
    price: "от 4 ₽/км",
    color: "bg-blue-50",
    badge: "bg-brand-blue text-white",
    icon: "Car",
    features: ["Кондиционер", "USB зарядка", "Вода"],
    popular: true,
  },
  {
    cls: "Минивэн",
    models: "Mercedes Vito, 7 мест",
    seats: 7,
    price: "от 5 ₽/км",
    color: "bg-yellow-50",
    badge: "bg-brand-yellow text-brand-dark",
    icon: "Bus",
    features: ["7 мест", "Большой багаж", "Детское кресло"],
  },
  {
    cls: "Бизнес",
    models: "Mercedes E-Class, BMW 5 Series",
    seats: 4,
    price: "от 7 ₽/км",
    color: "bg-slate-50",
    badge: "bg-slate-800 text-white",
    icon: "Car",
    features: ["Премиум салон", "Трансфер VIP", "Встреча с табличкой"],
  },
];

export default function Fleet() {
  return (
    <section className="py-16 sm:py-20 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <span className="text-brand-yellow font-semibold text-sm uppercase tracking-widest">Наш автопарк</span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-brand-dark mt-2">
            Выберите класс автомобиля
          </h2>
          <p className="text-gray-500 mt-3 max-w-lg mx-auto">
            Для любых нужд — семейная поездка, деловая встреча или путешествие большой компанией
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {CARS.map((car, i) => (
            <motion.div
              key={car.cls}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.1 }}
              className={`relative rounded-2xl p-6 ${car.color} border border-gray-100`}
            >
              {car.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-brand-yellow text-brand-dark text-xs font-bold px-3 py-1 rounded-full whitespace-nowrap">
                  Популярный
                </div>
              )}
              <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold mb-4 ${car.badge}`}>
                <Icon name={car.icon} size={14} />
                {car.cls}
              </div>
              <div className="mb-3">
                <p className="text-xs text-gray-500 mb-1">Модели</p>
                <p className="text-sm font-medium text-brand-dark">{car.models}</p>
              </div>
              <div className="flex items-center gap-2 mb-4">
                <Icon name="Users" size={14} className="text-gray-400" />
                <span className="text-sm text-gray-600">{car.seats} пассажира</span>
              </div>
              <ul className="space-y-1 mb-5">
                {car.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-xs text-gray-600">
                    <Icon name="Check" size={12} className="text-green-500" />
                    {f}
                  </li>
                ))}
              </ul>
              <div className="font-bold text-brand-blue text-lg">{car.price}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
