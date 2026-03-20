import { motion } from "framer-motion";
import Icon from "@/components/ui/icon";
import { Link } from "react-router-dom";

const STEPS = [
  {
    step: "01",
    icon: "ClipboardList",
    title: "Заполните форму",
    text: "Укажите маршрут, дату, время и класс авто в форме на сайте или позвоните нам.",
  },
  {
    step: "02",
    icon: "PhoneCall",
    title: "Подтверждение",
    text: "Наш менеджер перезвонит в течение 5 минут, уточнит детали и подтвердит заказ.",
  },
  {
    step: "03",
    icon: "Car",
    title: "Подача автомобиля",
    text: "В назначенное время водитель приедет по адресу. Вы получите SMS с данными водителя.",
  },
  {
    step: "04",
    icon: "MapPin",
    title: "Комфортная поездка",
    text: "Наслаждайтесь поездкой. Оплата по завершению — наличными или картой.",
  },
];

export default function HowToOrder() {
  return (
    <section className="py-16 sm:py-20 bg-brand-dark">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <span className="text-brand-yellow font-semibold text-sm uppercase tracking-widest">Просто и быстро</span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white mt-2">
            Как заказать трансфер
          </h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          {STEPS.map((step, i) => (
            <motion.div
              key={step.step}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.1 }}
              className="relative"
            >
              {i < STEPS.length - 1 && (
                <div className="hidden lg:block absolute top-8 left-full w-full h-px bg-white/10 z-0" />
              )}
              <div className="relative z-10 bg-white/5 border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-colors">
                <div className="text-brand-yellow text-4xl font-black mb-4 leading-none">{step.step}</div>
                <div className="w-10 h-10 bg-brand-yellow/20 rounded-xl flex items-center justify-center mb-4">
                  <Icon name={step.icon} size={20} className="text-brand-yellow" />
                </div>
                <h3 className="text-white font-bold text-base mb-2">{step.title}</h3>
                <p className="text-white/60 text-sm leading-relaxed">{step.text}</p>
              </div>
            </motion.div>
          ))}
        </div>
        <div className="text-center">
          <Link
            to="/#order"
            className="inline-block bg-brand-yellow hover:bg-yellow-400 text-brand-dark font-bold text-base px-8 py-4 rounded-xl transition-colors duration-200 shadow-lg"
          >
            Заказать трансфер →
          </Link>
        </div>
      </div>
    </section>
  );
}
