// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AnyRef = any;

export const SPECIAL_ZONES = [
  {
    name: "ДНР",
    coords: [
      [48.07, 37.45], [48.35, 38.15], [48.55, 38.85], [48.1, 39.5],
      [47.8, 39.6], [47.4, 38.9], [47.1, 38.2], [47.3, 37.5],
      [47.6, 37.1], [47.9, 37.2], [48.07, 37.45],
    ],
  },
  {
    name: "ЛНР",
    coords: [
      [48.55, 38.85], [48.9, 39.3], [49.3, 39.7], [49.5, 40.2],
      [49.15, 40.5], [48.7, 40.1], [48.3, 39.9], [47.8, 39.6],
      [48.1, 39.5], [48.55, 38.85],
    ],
  },
  {
    name: "Запорожская",
    coords: [
      [47.6, 34.2], [47.9, 35.1], [47.85, 36.0], [47.6, 36.8],
      [47.3, 37.1], [47.0, 36.5], [46.7, 35.8], [46.6, 34.8],
      [46.9, 34.2], [47.3, 33.9], [47.6, 34.2],
    ],
  },
  {
    name: "Херсонская",
    coords: [
      [47.0, 32.5], [47.2, 33.5], [46.9, 34.2], [46.6, 34.8],
      [46.4, 34.4], [46.35, 33.6], [46.4, 32.8], [46.6, 32.3],
      [47.0, 32.5],
    ],
  },
];

const CRIMEA_KEYWORDS = ["ялта", "симферополь", "севастополь", "керчь", "феодосия", "евпатория", "крым", "алушта", "судак", "бахчисарай"];
const DNR_LNR_KEYWORDS = ["донецк", "луганск", "мариуполь", "горловка", "макеевка", "днр", "лнр", "краматорск", "северодонецк", "лисичанск"];
const KHERSON_KEYWORDS = ["херсон", "херсонская", "геническ", "каховка", "скадовск"];
const ZAP_KEYWORDS = ["мелитополь", "бердянск", "токмак", "энергодар", "запорожская", "запорожье", "пологи"];
const KHERSON_ZAP_KEYWORDS = [...KHERSON_KEYWORDS, ...ZAP_KEYWORDS];

export const isCrimea = (addr: string) => CRIMEA_KEYWORDS.some(k => addr.toLowerCase().includes(k));
export const isDnrLnr = (addr: string) => DNR_LNR_KEYWORDS.some(k => addr.toLowerCase().includes(k));
export const isKherson = (addr: string) => KHERSON_KEYWORDS.some(k => addr.toLowerCase().includes(k));
export const isZap = (addr: string) => ZAP_KEYWORDS.some(k => addr.toLowerCase().includes(k));
export const isKhersonZap = (addr: string) => KHERSON_ZAP_KEYWORDS.some(k => addr.toLowerCase().includes(k));
export const isSpecialZone = (addr: string) => isKhersonZap(addr) || isDnrLnr(addr) || isCrimea(addr);
