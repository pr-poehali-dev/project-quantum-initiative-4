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
    distance: "~1 070 км",
    time: "14–16 ч",
    price: "от 12 000 ₽",
    popular: true,
    desc: "Прямой рейс без пересадок. Выезд утром — прибытие вечером.",
    tag: "Популярный",
  },
  {
    from: "Ясиноватая",
    to: "Анапа",
    distance: "~980 км",
    time: "8–11 ч",
    price: "от 8 000 ₽",
    popular: true,
    desc: "Маршрут на черноморское побережье. Подача к дому.",
    tag: "Популярный",
  },
  {
    from: "Москва",
    to: "Цимлянск",
    distance: "~1 100 км",
    time: "15–18 ч",
    price: "от 14 000 ₽",
    popular: false,
    desc: "Прямой маршрут до Цимлянска без пересадок.",
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