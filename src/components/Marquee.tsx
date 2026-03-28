const messages = [
  "🔥 Такси «Юг-Трансфер»: скидка 10% на первый заказ! Подача от 30 минут. Звоните +7 (995) 614-14-14",
  "✈️ Встретим в аэропорту с табличкой! Фиксированные цены на трансферы. «Юг-Трансфер» — надёжно.",
];

const separator = "   ★   ";
const text = messages.join(separator);

const Marquee = () => {
  return (
    <div className="w-full bg-[#111] border-t border-white/10 overflow-hidden whitespace-nowrap">
      <div className="animate-marquee-rtl py-2 text-sm text-gray-300 inline-flex gap-0">
        <span className="px-4">{text}</span>
        <span className="px-4">{separator}{text}</span>
      </div>
    </div>
  );
};

export default Marquee;
