import { useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Icon from "@/components/ui/icon";

const ALL_ROUTES = [
  {
    from: "Москва",
    to: "Ростов-на-Дону",
    distance: "1070 км",
    time: "~11 ч",
    price: "от 8 500 ₽",
    popular: true,
    desc: "Прямой рейс без пересадок. Выезд утром — прибытие вечером.",
    tag: "Популярный",
  },
  {
    from: "Ясиноватая",
    to: "Анапа",
    distance: "980 км",
    time: "~10 ч",
    price: "от 7 900 ₽",
    popular: true,
    desc: "Маршрут на черноморское побережье. Подача к дому.",
    tag: "Популярный",
  },
  {
    from: "Ростов-на-Дону",
    to: "Краснодар",
    distance: "290 км",
    time: "~3.5 ч",
    price: "от 2 400 ₽",
    popular: true,
    desc: "Частые рейсы. Удобно для деловых поездок.",
    tag: "Популярный",
  },
  {
    from: "Донецк",
    to: "Сочи",
    distance: "1050 км",
    time: "~11 ч",
    price: "от 8 200 ₽",
    popular: false,
    desc: "Прямой маршрут через Краснодарский край.",
    tag: "",
  },
  {
    from: "Луганск",
    to: "Москва",
    distance: "1350 км",
    time: "~14 ч",
    price: "от 11 000 ₽",
    popular: false,
    desc: "Дальний маршрут с возможностью остановки.",
    tag: "",
  },
  {
    from: "Ростов-на-Дону",
    to: "Анапа",
    distance: "370 км",
    time: "~4.5 ч",
    price: "от 3 100 ₽",
    popular: true,
    desc: "На море без пересадок. Семейные поездки приветствуются.",
    tag: "Популярный",
  },
  {
    from: "Краснодар",
    to: "Сочи",
    distance: "290 км",
    time: "~3.5 ч",
    price: "от 2 500 ₽",
    popular: false,
    desc: "Трансфер в Сочи и Адлер. Встреча в аэропорту.",
    tag: "",
  },
  {
    from: "Ростов-на-Дону",
    to: "Ставрополь",
    distance: "350 км",
    time: "~4 ч",
    price: "от 2 900 ₽",
    popular: false,
    desc: "Деловой и туристический маршрут.",
    tag: "",
  },
  {
    from: "Донецк",
    to: "Краснодар",
    distance: "890 км",
    time: "~9.5 ч",
    price: "от 7 200 ₽",
    popular: false,
    desc: "Прямой маршрут без пересадок через Ростов.",
    tag: "",
  },
  {
    from: "Москва",
    to: "Краснодар",
    distance: "1350 км",
    time: "~14 ч",
    price: "от 10 500 ₽",
    popular: false,
    desc: "Долгий маршрут с комфортными остановками.",
    tag: "",
  },
  {
    from: "Ростов-на-Дону",
    to: "Геленджик",
    distance: "400 км",
    time: "~5 ч",
    price: "от 3 400 ₽",
    popular: false,
    desc: "Курортный трансфер на побережье.",
    tag: "",
  },
  {
    from: "Луганск",
    to: "Ростов-на-Дону",
    distance: "310 км",
    time: "~3.5 ч",
    price: "от 2 600 ₽",
    popular: false,
    desc: "Регулярный маршрут с гибким расписанием.",
    tag: "",
  },
  {
    from: "Ясиноватая",
    to: "Москва",
    distance: "1300 км",
    time: "~13 ч",
    price: "от 10 200 ₽",
    popular: false,
    desc: "Прямой рейс в столицу без пересадок.",
    tag: "",
  },
  {
    from: "Краснодар",
    to: "Анапа",
    distance: "150 км",
    time: "~2 ч",
    price: "от 1 400 ₽",
    popular: false,
    desc: "Короткий курортный трансфер.",
    tag: "",
  },
  {
    from: "Ростов-на-Дону",
    to: "Волгоград",
    distance: "480 км",
    time: "~5.5 ч",
    price: "от 4 000 ₽",
    popular: false,
    desc: "Северное направление по трассе М6.",
    tag: "",
  },
];

export default function Routes() {
  const [search, setSearch] = useState("");

  const filtered = ALL_ROUTES.filter(
    (r) =>
      r.from.toLowerCase().includes(search.toLowerCase()) ||
      r.to.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      {/* Hero */}
      <section className="bg-gradient-to-br from-brand-dark via-blue-900 to-blue-800 pt-28 pb-12 px-4">
        <div className="container mx-auto text-center">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white mb-3">
            Направления трансфера
          </h1>
          <p className="text-white/70 mb-8 max-w-lg mx-auto">
            Перевозки по югу России, Донбассу и центральной России. Подача от двери до двери.
          </p>
          <div className="relative max-w-md mx-auto">
            <Icon name="Search" size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Найти маршрут (город отправления или назначения)"
              className="w-full pl-11 pr-4 py-3 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-yellow"
            />
          </div>
        </div>
      </section>

      {/* Cards */}
      <section className="flex-1 bg-gray-50 py-12 px-4">
        <div className="container mx-auto">
          {filtered.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <Icon name="MapOff" size={48} className="mx-auto mb-4 opacity-40" />
              <p>Маршруты не найдены. Попробуйте другой город.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {filtered.map((route, i) => (
                <motion.div
                  key={`${route.from}-${route.to}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, delay: i * 0.04 }}
                  className="bg-white rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow border border-gray-100"
                >
                  {route.popular && (
                    <span className="inline-block bg-brand-yellow text-brand-dark text-xs font-bold px-2 py-0.5 rounded-full mb-3">
                      Популярный
                    </span>
                  )}
                  <div className="flex items-center gap-2 mb-3">
                    <span className="font-bold text-brand-dark text-base">{route.from}</span>
                    <Icon name="ArrowRight" size={16} className="text-brand-blue shrink-0" />
                    <span className="font-bold text-brand-dark text-base">{route.to}</span>
                  </div>
                  <p className="text-gray-500 text-sm mb-4 leading-relaxed">{route.desc}</p>
                  <div className="flex items-center gap-4 text-xs text-gray-400 mb-4">
                    <span className="flex items-center gap-1">
                      <Icon name="Route" size={13} />
                      {route.distance}
                    </span>
                    <span className="flex items-center gap-1">
                      <Icon name="Clock" size={13} />
                      {route.time}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-brand-blue text-lg">{route.price}</span>
                    <Link
                      to="/#order"
                      className="bg-brand-yellow hover:bg-yellow-400 text-brand-dark font-semibold text-xs px-4 py-2 rounded-lg transition-colors"
                    >
                      Заказать
                    </Link>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>
      <Footer />
    </div>
  );
}
