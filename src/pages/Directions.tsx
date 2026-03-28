import { Link } from "react-router-dom";
import Header from "@/components/Header";
import Icon from "@/components/ui/icon";

const DIRECTIONS = [
  { city: "Москва", desc: "Трансфер из/в Москву и аэропорты Шереметьево, Домодедово, Внуково" },
  { city: "Краснодар", desc: "Трансфер в аэропорт Пашковский и по городу" },
  { city: "Сочи", desc: "Аэропорт Адлер, Красная Поляна, Роза Хутор" },
  { city: "Анапа", desc: "Аэропорт Витязево, Джемете, Сукко" },
  { city: "Геленджик", desc: "Аэропорт Геленджик, Кабардинка, Дивноморское" },
  { city: "Новороссийск", desc: "Порт, вокзал, междугородние маршруты" },
  { city: "Ростов-на-Дону", desc: "Аэропорт Платов, ж/д вокзал, по городу" },
  { city: "Симферополь", desc: "Аэропорт Симферополь, по Крыму" },
  { city: "Ялта", desc: "Трансфер по ЮБК, Алушта, Севастополь" },
  { city: "Минеральные Воды", desc: "Аэропорт МинВоды, Пятигорск, Кисловодск, Ессентуки" },
  { city: "Волгоград", desc: "Междугородний трансфер, аэропорт" },
  { city: "Ставрополь", desc: "Аэропорт, ж/д вокзал, по городу" },
  { city: "Астрахань", desc: "Междугородний трансфер, аэропорт" },
  { city: "Майкоп", desc: "Республика Адыгея, по городу" },
  { city: "Керчь", desc: "Крымский мост, паром, по Крыму" },
  { city: "Донецк", desc: "Трансфер ДНР, междугородний" },
  { city: "Луганск", desc: "Трансфер ЛНР, междугородний" },
  { city: "Мариуполь", desc: "Трансфер, междугородний" },
];

export default function Directions() {
  return (
    <div className="min-h-screen bg-[#111] flex flex-col">
      <Header />

      <main className="flex-1 pt-20 sm:pt-24 pb-12 px-4">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3">Направления</h1>
          <p className="text-gray-400 text-lg mb-8">
            Трансфер и такси межгород по всей России: Краснодарский край, Крым, аэропорты и вокзалы
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {DIRECTIONS.map((d) => (
              <Link
                key={d.city}
                to="/"
                className="bg-[#1a1a1a] hover:bg-[#222] border border-white/5 hover:border-[#c8d44a]/30 rounded-2xl p-5 transition-all group"
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#c8d44a]/10 flex items-center justify-center shrink-0 group-hover:bg-[#c8d44a]/20 transition-colors">
                    <Icon name="MapPin" size={18} className="text-[#c8d44a]" />
                  </div>
                  <div>
                    <h3 className="text-white font-semibold text-base group-hover:text-[#c8d44a] transition-colors">{d.city}</h3>
                    <p className="text-gray-400 text-sm mt-1">{d.desc}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          <div className="mt-10 bg-[#1a1a1a] rounded-2xl p-6 sm:p-8 text-center">
            <h2 className="text-white text-xl font-bold mb-2">Не нашли своё направление?</h2>
            <p className="text-gray-400 mb-5">Мы работаем по всей России. Позвоните нам или оставьте заявку — рассчитаем стоимость за 5 минут.</p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <a href="tel:+79843348724" className="flex items-center gap-2 bg-[#c8d44a] hover:bg-[#d4e050] text-black font-bold px-6 py-3 rounded-full transition-colors">
                <Icon name="Phone" size={18} />
                +7 (984) 334-87-24
              </a>
              <Link to="/" className="flex items-center gap-2 bg-white/10 hover:bg-white/15 text-white font-medium px-6 py-3 rounded-full transition-colors">
                <Icon name="FileText" size={18} />
                Оставить заявку
              </Link>
            </div>
          </div>
        </div>
      </main>

      <footer className="bg-[#0a0a0a] border-t border-white/10 py-6 px-4 text-center">
        <p className="text-gray-500 text-xs">© 2026 Юг-трансфер. Все права защищены.</p>
      </footer>
    </div>
  );
}
