import json
import urllib.request
import math
import os
import psycopg2


DISPATCH_FEE = 700

TARIFFS = {
    "urgent":   {"per_km": 30, "base": 1500},
    "standard": {"per_km": 30, "base": DISPATCH_FEE},
    "comfort":  {"per_km": 40, "base": DISPATCH_FEE},
    "minivan":  {"per_km": 60, "base": DISPATCH_FEE},
    "business": {"per_km": 80, "base": DISPATCH_FEE},
}
TARIFFS_SPECIAL = {
    "urgent":   {"per_km": 80, "base": 0},
    "standard": {"per_km": 80, "base": 0},
    "comfort":  {"per_km": 90, "base": 0},
    "minivan":  {"per_km": 100, "base": 0},
    "business": {"per_km": 180, "base": 0},
}
EXTRAS = {"childSeat": 1500, "pet": 1000, "booster": 1000}
CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
}

# Допустимое отклонение от эталона (%)
MAX_DEVIATION_PCT = 20.0

# ─── Полигоны спецзон (повышенный тариф) ─────────────────────────────────────
SPECIAL_POLYGONS = [
    # ДНР (расширен на юг до Мариуполя и Азовского моря)
    [(48.07,37.45),(48.35,38.15),(48.55,38.85),(48.1,39.5),
     (47.8,39.6),(47.4,38.9),(47.0,38.2),(46.9,37.8),(46.9,37.2),
     (47.1,37.0),(47.3,37.0),(47.6,37.1),(47.9,37.2),(48.07,37.45)],
    # ЛНР
    [(48.55,38.85),(48.9,39.3),(49.3,39.7),(49.5,40.2),
     (49.15,40.5),(48.7,40.1),(48.3,39.9),(47.8,39.6),(48.1,39.5),(48.55,38.85)],
    # Запорожская (расширен на юг до Мелитополя и Азовского моря)
    [(47.6,34.2),(47.9,35.1),(47.85,36.0),(47.6,36.8),
     (47.3,37.1),(47.0,36.5),(46.7,35.8),(46.4,35.5),(46.3,34.8),
     (46.4,34.2),(46.7,33.9),(47.0,33.8),(47.3,33.9),(47.6,34.2)],
    # Херсонская (расширен на юг до Каховского водохранилища)
    [(47.2,32.5),(47.4,33.5),(47.2,34.2),(46.9,34.8),
     (46.5,34.9),(46.2,34.5),(46.0,33.8),(46.0,32.8),(46.3,32.2),(46.7,32.2),(47.2,32.5)],
]

CRIMEA_KEYS = ["крым","республика крым",
    "симферополь","ялта","севастополь","керчь","феодосия","евпатория","алушта","судак",
    "бахчисарай","армянск","саки","белогорск","джанкой","красноперекопск",
    "старый крым","щёлкино","щелкино","инкерман","балаклава",
    "гаспра","кореиз","симеиз","форос","партенит","гурзуф","массандра","ливадия",
    "мисхор","никита","ореанда","виноградное","краснокаменка","запрудное",
    "коктебель","орджоникидзе","новый свет","морское","черноморское","межводное",
    "оленёвка","оленевка","штормовое","мирный","заозёрное","заозерное",
    "новофёдоровка","новофедоровка","николаевка","песчаное","гвардейское","перевальное",
    "зуя","мазанка","почтовое","куйбышево","соколиное","научный",
    "красногвардейское","октябрьское","первомайское","раздольное",
    "нижнегорский","нижнегорское","советский","советское","кировское","кировский",
    "ленино","ленинское","зеленогорское","приморский","береговое","курортное",
    "багерово","аджимушкай","героевское","глазовка",
    "малый маяк","утёс","утес","лазурное","кацивели","санаторное",
    "понизовка","олива","парковое","голубой залив","отрадное",
    "поповка","витино","окунёвка","окуневка","портовое","молочное","прибрежное",
    "солнечная долина","насыпное","золотое поле","приветное","рыбачье",
    "малореченское","солнечногорское","генеральское","канака","весёлое","веселое",
    "щебетовка","наниково",
    "мраморное","доброе","краснолесье","межгорье","изобильное","лучистое",
    "скалистое","танковое","верхоречье","строгановка","укромное",
    "молодёжное","молодежное","партизанское","дубки",
    "криничное","головановка","мичуринское",
    "железнодорожное","аромат","голубинка","красный мак","ходжа-сала",
    "кача","любимовка","орловка","учкуевка","андреевка","фронтовое","терновка",
    "флотское","резервное","орлиное","гончарное","родниковское","широкое",
    "черноречье","шули",
    "воинка","ишунь","суворовское","азовское","льговское","семисотка",
    "горностаевка","марфовка","челядиново","приозерное",
    "вилино","новопавловка","школьное","донское","сирень",
    "вересаево","ромашкино","фрунзе","угловое","суворово",
]
SPECIAL_KEYS = ["донецк","донецкая народная","днр","мариуполь","горловка","макеевка",
    "краматорск","дебальцево","авдеевка","ясиноватая","енакиево","харцызск","шахтёрск",
    "шахтерск","снежное","торез","иловайск","волноваха","угледар","докучаевск","новоазовск",
    "луганск","луганская народная","лнр","лисичанск","северодонецк","алчевск","стаханов",
    "антрацит","красный луч","свердловск","перевальск","брянка","кировск","первомайск",
    "ровеньки","молодогвардейск",
    "херсон","херсонская","геническ","новая каховка","каховка","скадовск",
    "мелитополь","запорожская","бердянск","токмак","энергодар","пологи","приморск",
]

CITY_COORDS = {
    # ── АПП: ДНР ──────────────────────────────────────────────────────────────
    "донецк":(48.015,37.802),"мариуполь":(47.095,37.541),"горловка":(48.290,38.069),
    "макеевка":(47.985,37.967),"краматорск":(48.723,37.537),"дебальцево":(48.344,38.404),
    "авдеевка":(48.143,37.751),"ясиноватая":(48.125,37.844),"енакиево":(48.222,38.213),
    "харцызск":(47.998,38.153),"волноваха":(47.610,37.500),"угледар":(47.773,37.270),
    "докучаевск":(47.748,37.680),"новоазовск":(47.113,38.078),
    "шахтёрск":(47.978,38.481),"шахтерск":(47.978,38.481),
    "снежное":(47.978,38.765),"торез":(47.998,38.618),"иловайск":(47.923,38.202),
    # ── АПП: ЛНР ──────────────────────────────────────────────────────────────
    "луганск":(48.574,39.307),"лисичанск":(48.901,38.432),"северодонецк":(48.952,38.491),
    "алчевск":(48.466,38.803),"стаханов":(48.558,38.657),"антрацит":(48.121,39.088),
    "кировск":(48.651,38.654),"первомайск":(48.425,38.566),"ровеньки":(48.077,39.375),
    "свердловск":(48.046,39.647),"перевальск":(48.459,38.861),"брянка":(48.516,38.740),
    "молодогвардейск":(48.424,39.653),"красный луч":(48.145,38.949),
    # ── АПП: Запорожская ──────────────────────────────────────────────────────
    "мелитополь":(46.847,35.367),"бердянск":(46.756,36.800),"токмак":(47.253,35.706),
    "энергодар":(47.503,34.653),"пологи":(47.479,36.253),"приморск":(46.729,36.349),
    "васильевка":(47.427,35.278),"михайловка":(47.136,35.224),
    # ── АПП: Херсонская ───────────────────────────────────────────────────────
    "херсон":(46.636,32.617),"геническ":(46.167,34.817),"каховка":(46.818,33.479),
    "новая каховка":(46.754,33.383),"скадовск":(46.112,32.912),
    "голая пристань":(46.526,32.184),"цюрупинск":(46.632,32.716),
    # ══ КРЫМ: города (16) ══════════════════════════════════════════════════
    "симферополь":(44.9521,34.1024),"ялта":(44.4952,34.1663),
    "севастополь":(44.6167,33.5254),"феодосия":(45.0317,35.3827),
    "евпатория":(45.1906,33.3669),"алушта":(44.6764,34.4101),
    "судак":(44.8514,34.9743),"бахчисарай":(44.7552,33.8610),
    "армянск":(46.1054,33.6907),"керчь":(45.3563,36.4735),
    "саки":(45.1340,33.6005),"белогорск":(45.0575,34.5993),
    "джанкой":(45.7086,34.3946),"красноперекопск":(45.9488,33.7948),
    "старый крым":(45.0306,35.0876),"щёлкино":(45.4282,35.8267),
    "щелкино":(45.4282,35.8267),
    "инкерман":(44.6139,33.6082),"балаклава":(44.5014,33.5985),
    # ══ КРЫМ: ПГТ Южный берег (ЮБК) ═════════════════════════════════════════
    "гаспра":(44.4330,34.0972),"кореиз":(44.4284,34.0734),
    "симеиз":(44.4039,33.9900),"форос":(44.3901,33.7866),
    "партенит":(44.5773,34.3432),"гурзуф":(44.5430,34.2781),
    "массандра":(44.5171,34.1906),"ливадия":(44.4676,34.1439),
    "мисхор":(44.4264,34.0652),"никита":(44.5373,34.2353),
    "ореанда":(44.4612,34.1313),"виноградное":(44.5091,34.1847),
    "краснокаменка":(44.5627,34.3185),"запрудное":(44.5880,34.3550),
    "малый маяк":(44.6125,34.3753),"утёс":(44.5916,34.3601),
    "утес":(44.5916,34.3601),"лазурное":(44.5164,34.2144),
    "даниловка":(44.4356,34.0339),"парковое":(44.4324,34.0424),
    "голубой залив":(44.4162,33.9676),"кацивели":(44.3937,33.9632),
    "понизовка":(44.4109,33.8827),"санаторное":(44.4192,33.8307),
    "олива":(44.4263,33.8165),"мелас":(44.4192,33.8453),
    "береговое-ялта":(44.4874,34.1526),"отрадное":(44.4477,34.1162),
    # ══ КРЫМ: ПГТ Юго-Восток ═════════════════════════════════════════════════
    "коктебель":(44.9629,35.2506),"орджоникидзе":(44.9595,35.3560),
    "новый свет":(44.8269,34.9177),"морское":(44.8395,34.7793),
    "приветное":(44.7303,34.6502),"рыбачье":(44.7693,34.5630),
    "малореченское":(44.7519,34.5688),"солнечногорское":(44.7465,34.6134),
    "генеральское":(44.7544,34.6472),"канака":(44.7560,34.7094),
    "весёлое":(44.8319,34.8397),"веселое":(44.8319,34.8397),
    "громовка":(44.8984,34.9178),"грушевка":(45.0446,35.0267),
    "солнечная долина":(44.8648,35.0870),"миндальное":(44.9775,35.1045),
    "насыпное":(45.0046,35.3093),"ближнее":(44.9950,35.3677),
    "золотое поле":(45.0743,35.2532),"курортное":(44.9147,35.1931),
    "береговое":(44.9936,35.4152),"приморский":(45.1267,35.5160),
    "щебетовка":(44.9576,35.1701),"наниково":(44.9846,35.1318),
    # ══ КРЫМ: ПГТ Западное побережье ══════════════════════════════════════════
    "черноморское":(45.5106,32.7011),"межводное":(45.5943,32.8629),
    "оленёвка":(45.3790,32.5289),"оленевка":(45.3790,32.5289),
    "штормовое":(45.2977,33.0596),"мирный":(45.3177,33.0491),
    "заозёрное":(45.2164,33.2846),"заозерное":(45.2164,33.2846),
    "новофёдоровка":(45.1482,33.5715),"новофедоровка":(45.1482,33.5715),
    "николаевка":(44.9696,33.6124),"песчаное":(44.8589,33.6355),
    "поповка":(45.3194,33.1172),"витино":(45.3212,33.1871),
    "окунёвка":(45.4182,32.5937),"окуневка":(45.4182,32.5937),
    "марьино":(45.4640,32.7032),"знаменское":(45.5589,32.9172),
    "стерегущее":(45.6337,33.0717),"портовое":(45.5357,32.8639),
    "медведево":(45.4780,32.7399),"красносельское":(45.6179,33.1302),
    "раздольненское":(45.7814,33.4756),
    "молочное":(45.2060,33.3233),"прибрежное":(45.1648,33.5340),
    "фрунзе":(45.1150,33.5560),"угловое":(44.8957,33.6376),
    # ══ КРЫМ: Центральная часть (Симф. район и горы) ══════════════════════════
    "гвардейское":(45.0869,33.9773),"перевальное":(44.8217,34.2751),
    "зуя":(44.9505,34.3216),"мазанка":(44.9875,34.2473),
    "почтовое":(44.7869,33.8069),"куйбышево":(44.7172,33.7404),
    "соколиное":(44.6652,33.9428),"научный":(44.7266,34.0159),
    "мраморное":(44.8644,34.2731),"доброе":(44.8639,34.1810),
    "краснолесье":(44.8671,34.3488),"межгорье":(44.8064,34.3391),
    "изобильное":(44.7784,34.3295),"верхняя кутузовка":(44.7521,34.3081),
    "лучистое":(44.7314,34.3908),"чистенькое":(44.8931,34.0237),
    "каменка":(44.8678,33.9714),"скалистое":(44.8104,33.8472),
    "трудолюбовка":(44.7773,33.7767),"плотинное":(44.6509,33.7937),
    "танковое":(44.6959,33.8866),"верхоречье":(44.6704,33.9181),
    "высокое":(44.6531,33.8812),"строгановка":(45.0045,34.0428),
    "укромное":(44.9247,34.1420),"молодёжное":(44.9373,34.0580),
    "молодежное":(44.9373,34.0580),"добровское":(44.8574,34.1772),
    "дубки":(44.9728,34.1258),"партизанское":(44.8270,34.2246),
    # ══ КРЫМ: Белогорский район ══════════════════════════════════════════════
    "зеленогорское":(45.1397,34.7220),"добровольское":(45.1876,34.4180),
    "грибное":(44.9632,34.4400),"партизаны":(45.1318,34.4689),
    "зуйская":(44.9540,34.3226),"криничное":(45.0182,34.6070),
    "головановка":(45.0680,34.4976),"мичуринское":(45.0914,34.4100),
    "вишенное":(44.9900,34.5200),"новокленово":(45.0100,34.4700),
    # ══ КРЫМ: Бахчисарайский район ═══════════════════════════════════════════
    "верхнесадовое":(44.6325,33.6395),"дальнее":(44.6401,33.6127),
    "железнодорожное":(44.7413,33.8216),"аромат":(44.6948,33.8139),
    "голубинка":(44.6418,33.8841),"нагорное":(44.6278,33.5932),
    "тополи":(44.7058,33.7606),"малое садовое":(44.6752,33.7843),
    "красный мак":(44.7341,33.7274),"ходжа-сала":(44.6262,33.9356),
    # ══ КРЫМ: Северная степная часть ═════════════════════════════════════════
    "красногвардейское":(45.3821,34.1183),"красногвардейский":(45.3821,34.1183),
    "октябрьское":(45.3746,34.0618),"первомайское":(45.7167,33.9825),
    "раздольное":(45.7808,33.4756),
    "нижнегорский":(45.4484,34.7412),"нижнегорское":(45.4484,34.7412),
    "советский":(45.3169,34.9647),"советское":(45.3169,34.9647),
    "кировское":(45.3475,35.2101),"кировский":(45.3475,35.2101),
    "ленино":(45.2955,36.2215),"ленинское":(45.2955,36.2215),
    "калинино":(45.3695,34.2921),"петровка":(45.4472,34.2718),
    "клепинино":(45.5314,34.4306),"воинка":(45.7552,33.7757),
    "новоселовское":(45.8174,33.6792),"ишунь":(45.8680,33.8182),
    "суворовское":(45.9006,33.7498),"черноземное":(45.4783,34.5360),
    "новогригорьевка":(45.5387,34.6537),"садовое":(45.4218,34.8914),
    "грушевка-джанкой":(45.6562,34.2872),
    "азовское":(45.4876,35.3764),"льговское":(45.4874,35.4006),
    "семисотка":(45.4782,35.4850),"чкалово":(45.6415,34.7328),
    "табачное":(45.7003,34.8197),"листовое":(45.8214,34.1629),
    "пахаревка":(45.5500,34.5400),"абрикосовка":(45.5200,34.3000),
    "емельяновка":(45.4050,34.5600),"ботаническое":(45.4300,34.6200),
    "новожиловка":(45.5600,34.7500),"винницкое":(45.4400,34.8400),
    # ══ КРЫМ: Керченский полуостров ══════════════════════════════════════════
    "багерово":(45.3674,36.3215),"аджимушкай":(45.3760,36.5236),
    "героевское":(45.2575,36.4370),"эльтиген":(45.2575,36.4370),
    "подмаячный":(45.3508,36.5843),"жуковка":(45.2976,36.3826),
    "камыш-бурун":(45.3001,36.4163),"войково":(45.2858,36.4657),
    "маяк":(45.4355,36.5722),"глазовка":(45.3899,36.2816),
    "октябрьское-керченское":(45.3808,36.1321),
    "челядиново":(45.2820,36.3100),"марфовка":(45.2600,36.0900),
    "марьевка":(45.3400,36.1600),"бондаренково":(45.3200,36.2500),
    "приозерное":(45.3900,36.0500),"останино":(45.2400,36.1500),
    "горностаевка":(45.3500,36.0200),
    # ══ КРЫМ (Севастополь): сёла и пригороды ═════════════════════════════════
    "кача":(44.7836,33.5492),"любимовка":(44.6471,33.5569),
    "орловка":(44.6278,33.5419),"учкуевка":(44.6429,33.5464),
    "андреевка":(44.7272,33.5688),"фронтовое":(44.5534,33.6968),
    "терновка":(44.5924,33.7637),"хмельницкое":(44.6093,33.6993),
    "флотское":(44.4979,33.6406),"резервное":(44.4901,33.6782),
    "орлиное":(44.4880,33.7676),"гончарное":(44.5018,33.7485),
    "родниковское":(44.5017,33.8361),"широкое":(44.5128,33.8730),
    "черноречье":(44.5766,33.6408),"шули":(44.5618,33.6950),
    # ══ КРЫМ: Джанкойский район ══════════════════════════════════════════════
    "азовское-джанкой":(45.6460,34.9580),"ермаково":(45.6800,34.3600),
    "луганское":(45.5800,34.4400),"маслово":(45.5400,34.3700),
    "стальное":(45.6200,34.5500),"ярославское":(45.5700,34.5700),
    "целинное":(45.6400,34.6500),"медведевка":(45.7300,34.3200),
    "томашевка":(45.7800,34.2700),"ковыльное":(45.7500,34.5600),
    # ══ КРЫМ: пропущенные ПГТ ════════════════════════════════════════════════
    "гаспра-пгт":(44.4330,34.0972),"кирпичное":(44.9700,34.0600),
    "грэсовский":(44.9900,34.1400),"аэрофлотский":(44.9700,34.0500),
    "битак":(44.9400,34.0800),"комсомольское":(44.9700,34.1600),
    "каштановое":(44.8600,33.6300),"вилино":(44.8270,33.6760),
    "новопавловка":(44.9090,33.9574),"тепловка":(44.9300,34.0200),
    "школьное":(44.8818,33.9900),"пожарское":(45.3800,35.4500),
    "приозёрное":(45.3900,36.0500),"приозерное-кировское":(45.3000,35.1600),
    "краснофлотское":(44.8100,33.5600),"сирень":(44.7400,33.7800),
    "тургеневка":(44.8700,34.0400),"донское":(44.9600,33.6000),
    "вересаево":(45.2300,33.3600),"ромашкино":(45.2100,33.4200),
    "крымка":(45.2400,33.4800),"суворово":(45.1400,33.5900),
    # ── Центральная Россия ────────────────────────────────────────────────────
    "москва":(55.751,37.618),"санкт-петербург":(59.939,30.316),
    "воронеж":(51.672,39.184),"белгород":(50.598,36.588),
    "курск":(51.730,36.193),"орёл":(52.970,36.063),"орел":(52.970,36.063),
    "тула":(54.193,37.617),"рязань":(54.629,39.737),"калуга":(54.513,36.261),
    "брянск":(53.244,34.364),"смоленск":(54.783,32.046),
    "тверь":(56.861,35.912),"ярославль":(57.626,39.894),"кострома":(57.767,40.927),
    "иваново":(57.000,40.973),"владимир":(56.129,40.406),
    "нижний новгород":(56.327,44.006),"нижний новгород":(56.327,44.006),
    "пенза":(53.195,45.021),"саратов":(51.533,46.034),"самара":(53.196,50.150),
    "тамбов":(52.721,41.452),"липецк":(52.608,39.599),
    "казань":(55.799,49.106),"ульяновск":(54.317,48.402),
    "чебоксары":(56.146,47.252),"йошкар-ола":(56.638,47.895),
    "киров":(58.596,49.660),"пермь":(58.010,56.230),
    "уфа":(54.735,55.958),"оренбург":(51.768,55.097),
    # ── Юг России ─────────────────────────────────────────────────────────────
    "ростов-на-дону":(47.222,39.721),"краснодар":(45.039,38.987),
    "новороссийск":(44.724,37.770),"сочи":(43.585,39.723),
    "анапа":(44.895,37.316),"геленджик":(44.562,38.079),
    "таганрог":(47.209,38.924),"новочеркасск":(47.413,40.093),
    "шахты":(47.708,40.215),"волгодонск":(47.511,42.148),
    "ставрополь":(45.045,41.969),"пятигорск":(44.038,43.058),
    "кисловодск":(43.905,42.726),"ессентуки":(44.048,42.861),
    "нальчик":(43.485,43.607),"владикавказ":(43.024,44.682),
    "грозный":(43.317,45.699),"махачкала":(42.970,47.504),
    "астрахань":(46.348,48.034),"элиста":(46.309,44.268),
    "майкоп":(44.609,40.100),"черкесск":(44.228,42.047),
    # ── Поволжье и Урал ───────────────────────────────────────────────────────
    "волгоград":(48.708,44.513),"саратов":(51.533,46.034),
    "тольятти":(53.511,49.418),"сызрань":(53.155,48.474),
    "екатеринбург":(56.838,60.597),"челябинск":(55.160,61.402),
    "тюмень":(57.153,68.975),"курган":(55.440,65.341),
    "магнитогорск":(53.407,59.063),"нижний тагил":(57.910,59.979),
    # ── Сибирь ────────────────────────────────────────────────────────────────
    "новосибирск":(54.989,82.904),"омск":(54.989,73.368),
    "барнаул":(53.347,83.779),"томск":(56.496,84.972),
    "кемерово":(55.354,86.087),"новокузнецк":(53.757,87.136),
    "красноярск":(56.010,92.852),"иркутск":(52.297,104.296),
    # ── Дальний Восток (добавлено для полноты) ────────────────────────────────
    "хабаровск":(48.480,135.071),"владивосток":(43.115,131.885),
}


def get_db():
    return psycopg2.connect(os.environ["DATABASE_URL"])


def normalize_city(name: str) -> str:
    """
    Нормализует название города для поиска в БД.
    Обрабатывает форматы: 'г. Каховка', 'город Каховка', 'Россия, Херсонская область, г. Каховка',
    'Ялта, улица Крупской, 13' — извлекает только название города.
    """
    import re
    n = name.strip()
    # Убираем страну и область в начале строки через запятую
    # Пример: "Россия, Херсонская область, г. Каховка" → "г. Каховка"
    parts = [p.strip() for p in n.split(',')]
    # Ищем часть с "г." или "город" или которая не содержит "область", "регион", "район", "республика", "Россия"
    skip_words = ['россия', 'область', 'регион', 'район', 'республика', 'округ', 'край', 'ssr', 'ukraine']
    city_part = None
    for i, part in enumerate(parts):
        pl = part.lower()
        if re.match(r'^(г|с|п|пгт)\.?\s+', pl) or pl.startswith('город ') or pl.startswith('село ') or pl.startswith('посёлок ') or pl.startswith('поселок '):
            city_part = part.strip()
            break
        # Если это последняя часть с адресом (улица, дом) — берём предыдущую
        if i > 0 and any(w in pl for w in ['улица', 'ул.', 'пр.', 'проспект', 'переулок', 'площадь', 'бульвар', 'набережная']):
            city_part = parts[i-1].strip()
            break
        # Если часть не содержит стоп-слов — кандидат на город
        if not any(w in pl for w in skip_words):
            city_part = part.strip()

    if city_part:
        n = city_part

    for prefix in ['г. ', 'г.', 'город ', 'с. ', 'с.', 'село ', 'п. ', 'п.', 'пгт. ', 'пгт.', 'пгт ', 'посёлок ', 'поселок ', 'деревня ', 'д. ', 'д.']:
        if n.lower().startswith(prefix):
            n = n[len(prefix):].strip()
            break

    # Берём только первое слово если осталось несколько (защита от "Симферополь центр")
    # Но сохраняем "Ростов-на-Дону" и подобные
    words = n.split()
    if len(words) > 1 and '-' not in n:
        n = words[0]

    return n.strip().title()


def extract_city_candidates(name: str) -> list:
    """Возвращает список вариантов названия города для поиска."""
    normalized = normalize_city(name)
    candidates = [normalized]
    # Дополнительно: оригинальное название title-case
    original_title = name.strip().title()
    if original_title != normalized:
        candidates.append(original_title)
    return candidates


def lookup_reference(from_city: str, to_city: str):
    """Ищет эталонный маршрут в БД (без учёта регистра, с нормализацией)."""
    try:
        conn = get_db()
        cur = conn.cursor()
        from_candidates = extract_city_candidates(from_city)
        to_candidates   = extract_city_candidates(to_city)
        for fc in from_candidates:
            for tc in to_candidates:
                cur.execute(
                    "SELECT id, km_normal, km_special FROM routes_reference "
                    "WHERE LOWER(from_city) = LOWER(%s) AND LOWER(to_city) = LOWER(%s) LIMIT 1",
                    (fc, tc)
                )
                row = cur.fetchone()
                if row:
                    conn.close()
                    return {"id": row[0], "km_normal": row[1], "km_special": row[2]}
        conn.close()
    except Exception:
        pass
    return None


def lookup_alternatives(from_city: str, to_city: str, car_class: str, extras_cost: int) -> list:
    """Ищет альтернативные маршруты в БД и считает цены для них."""
    try:
        conn = get_db()
        cur = conn.cursor()
        from_candidates = extract_city_candidates(from_city)
        to_candidates   = extract_city_candidates(to_city)
        results = []
        for fc in from_candidates:
            for tc in to_candidates:
                cur.execute(
                    """SELECT variant, km_normal, km_special, via, time_hours, notes
                       FROM routes_alternatives
                       WHERE LOWER(from_city) = LOWER(%s) AND LOWER(to_city) = LOWER(%s)
                       ORDER BY variant""",
                    (fc, tc)
                )
                rows = cur.fetchall()
                if rows:
                    for row in rows:
                        variant, km_n, km_s, via, time_h, notes = row
                        price = calc_price(km_n, km_s, car_class, extras_cost)
                        all_p = {k: calc_price(km_n, km_s, k, extras_cost) for k in TARIFFS}
                        results.append({
                            "variant": variant,
                            "km_normal": km_n,
                            "km_special": km_s,
                            "km_total": km_n + km_s,
                            "price": price,
                            "all_prices": all_p,
                            "via": via,
                            "time_hours": float(time_h) if time_h else None,
                            "notes": notes,
                        })
                    conn.close()
                    return results
        conn.close()
    except Exception:
        pass
    return []


def build_auto_alternatives(km_normal: int, km_special: int, car_class: str, extras_cost: int) -> list:
    """
    Генерирует альтернативу "дешевле" автоматически — только если маршрут СМЕШАННЫЙ
    (есть и нормальные, и спецкм). Чисто-спецзонные маршруты объезда не имеют.
    """
    alts = []
    # Только если есть хотя бы 20% нормальных км — значит маршрут смешанный
    if km_special > 0 and km_normal > 0:
        total = km_normal + km_special
        # Вариант "дешевле" — чуть длиннее нормального пути, сокращаем спецзону
        cheaper_normal  = round(km_normal * 1.20 + km_special * 0.25)
        cheaper_special = round(km_special * 0.75)
        cheaper_price   = calc_price(cheaper_normal, cheaper_special, car_class, extras_cost)
        main_price      = calc_price(km_normal, km_special, car_class, extras_cost)
        if cheaper_price < main_price:
            alts.append({
                "variant": "cheaper",
                "km_normal": cheaper_normal,
                "km_special": cheaper_special,
                "km_total": cheaper_normal + cheaper_special,
                "price": cheaper_price,
                "all_prices": {k: calc_price(cheaper_normal, cheaper_special, k, extras_cost) for k in TARIFFS},
                "via": "объезд спецзоны",
                "time_hours": None,
                "notes": "Длиннее, но меньше км по спецтарифу",
            })
    return alts


def save_to_reference(from_city: str, to_city: str, km_normal: int, km_special: int):
    """Автоматически сохраняет новый маршрут в справочник для будущих запросов."""
    try:
        from_spec = is_special_addr(from_city)
        to_spec = is_special_addr(to_city)
        if (from_spec or to_spec) and km_special == 0:
            return
        from_norm = normalize_city(from_city)
        to_norm = normalize_city(to_city)
        km_total = km_normal + km_special
        if km_total < 5:
            return
        conn = get_db()
        cur = conn.cursor()
        cur.execute(
            """INSERT INTO routes_reference (from_city, to_city, km_normal, km_special, notes)
               VALUES (%s, %s, %s, %s, %s)
               ON CONFLICT (from_city, to_city) DO NOTHING""",
            (from_norm, to_norm, km_normal, km_special, "auto-osrm")
        )
        conn.commit()
        conn.close()
    except Exception:
        pass


def update_reference(from_city: str, to_city: str, km_normal: int, km_special: int):
    """Создаёт или обновляет эталонный маршрут по данным OSRM."""
    try:
        from_spec = is_special_addr(from_city)
        to_spec = is_special_addr(to_city)
        if (from_spec or to_spec) and km_special == 0:
            return
        from_norm = normalize_city(from_city)
        to_norm = normalize_city(to_city)
        conn = get_db()
        cur = conn.cursor()
        cur.execute(
            """INSERT INTO routes_reference (from_city, to_city, km_normal, km_special, notes)
               VALUES (%s, %s, %s, %s, %s)
               ON CONFLICT (from_city, to_city)
               DO UPDATE SET km_normal = EXCLUDED.km_normal,
                             km_special = EXCLUDED.km_special,
                             notes = 'osrm-live',
                             updated_at = NOW()""",
            (from_norm, to_norm, km_normal, km_special, "osrm-live")
        )
        conn.commit()
        conn.close()
    except Exception:
        pass


def save_log(data: dict):
    """Сохраняет лог расчёта в БД."""
    try:
        conn = get_db()
        cur = conn.cursor()
        cur.execute(
            """INSERT INTO route_calculations_log
               (from_city, to_city, stops, car_class, km_normal, km_special, km_total,
                price, all_prices, reference_id, ref_km_total, deviation_pct,
                is_error, error_reason, source)
               VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)""",
            (
                data["from_city"], data["to_city"],
                data.get("stops") or [],
                data["car_class"],
                data["km_normal"], data["km_special"], data["km_total"],
                data["price"],
                json.dumps(data["all_prices"]),
                data.get("reference_id"),
                data.get("ref_km_total"),
                data.get("deviation_pct"),
                data.get("is_error", False),
                data.get("error_reason"),
                data.get("source", "osrm"),
            )
        )
        conn.commit()
        conn.close()
    except Exception:
        pass


def haversine(lat1, lon1, lat2, lon2) -> float:
    R = 6371
    d_lat = math.radians(lat2-lat1); d_lon = math.radians(lon2-lon1)
    a = math.sin(d_lat/2)**2 + math.cos(math.radians(lat1))*math.cos(math.radians(lat2))*math.sin(d_lon/2)**2
    return R*2*math.asin(math.sqrt(a))


def point_in_polygon(lat, lon, poly) -> bool:
    n = len(poly); inside = False; j = n-1
    for i in range(n):
        xi,yi = poly[i]; xj,yj = poly[j]
        if ((yi>lon)!=(yj>lon)) and (lat < (xj-xi)*(lon-yi)/(yj-yi)+xi):
            inside = not inside
        j = i
    return inside


def is_in_special_zone(lat, lon) -> bool:
    return any(point_in_polygon(lat, lon, p) for p in SPECIAL_POLYGONS)


def geocode_city(address: str):
    addr_lower = address.lower()
    for key, coord in CITY_COORDS.items():
        if key in addr_lower:
            return coord
    try:
        url = (f"https://nominatim.openstreetmap.org/search"
               f"?q={urllib.request.quote(address)}&format=json&limit=1&accept-language=ru&addressdetails=1")
        req = urllib.request.Request(url, headers={"User-Agent": "ug-transfer-app/1.0"})
        with urllib.request.urlopen(req, timeout=10) as r:
            data = json.loads(r.read())
        if data:
            return (float(data[0]["lat"]), float(data[0]["lon"]))
    except Exception:
        pass
    return None


def is_crimea_addr(addr: str) -> bool:
    return any(k in addr.lower() for k in CRIMEA_KEYS)

def is_special_addr(addr: str) -> bool:
    return any(k in addr.lower() for k in SPECIAL_KEYS)


def osrm_route_with_geometry(coords: list) -> dict:
    """Запрашивает маршрут через OSRM с геометрией."""
    try:
        coord_str = ";".join(f"{lon},{lat}" for lon,lat in coords)
        url = (f"http://router.project-osrm.org/route/v1/driving/{coord_str}"
               f"?overview=full&geometries=geojson&alternatives=false")
        req = urllib.request.Request(url, headers={"User-Agent": "ug-transfer-app/1.0"})
        with urllib.request.urlopen(req, timeout=10) as r:
            data = json.loads(r.read())
        if data.get("code") != "Ok":
            return None
        route = data["routes"][0]
        dist_km = route["distance"] / 1000.0
        pts = route["geometry"]["coordinates"]
        waypoints = [(pt[1], pt[0]) for pt in pts]
        return {"distance_km": dist_km, "waypoints": waypoints}
    except Exception:
        return None


def split_km_by_zone(waypoints: list, total_km: float) -> tuple:
    """Разбивает маршрут на обычные и спецзонные км."""
    h_normal = 0.0
    h_special = 0.0
    for i in range(len(waypoints)-1):
        lat1,lon1 = waypoints[i]
        lat2,lon2 = waypoints[i+1]
        seg = haversine(lat1,lon1,lat2,lon2)
        mid_lat = (lat1+lat2)/2
        mid_lon = (lon1+lon2)/2
        if is_in_special_zone(mid_lat, mid_lon):
            h_special += seg
        else:
            h_normal += seg
    h_total = h_normal + h_special
    if h_total == 0:
        return total_km, 0.0
    ratio_special = h_special / h_total
    km_special = total_km * ratio_special
    km_normal  = total_km * (1 - ratio_special)
    return km_normal, km_special


def fallback_distance(fc, tc) -> tuple:
    """Fallback когда OSRM недоступен."""
    total = haversine(fc[0],fc[1],tc[0],tc[1]) * 1.4
    fc_special = is_in_special_zone(fc[0],fc[1])
    tc_special = is_in_special_zone(tc[0],tc[1])
    if fc_special and tc_special:
        return 0.0, total
    if not fc_special and not tc_special:
        return total, 0.0
    return total*0.7, total*0.3


def calc_price(km_normal, km_special, tariff_key, extras_cost):
    t = TARIFFS.get(tariff_key, TARIFFS["standard"])
    ts = TARIFFS_SPECIAL.get(tariff_key, TARIFFS_SPECIAL["standard"])
    return round(t["per_km"]*km_normal + ts["per_km"]*km_special + t["base"] + extras_cost)


def validate_against_reference(km_total_calc: int, ref: dict) -> tuple:
    """
    Проверяет расчёт против эталона.
    Возвращает (is_error, deviation_pct, error_reason).
    """
    ref_total = ref["km_normal"] + ref["km_special"]
    if ref_total == 0:
        return False, 0.0, None
    deviation_pct = abs(km_total_calc - ref_total) / ref_total * 100
    if deviation_pct > MAX_DEVIATION_PCT:
        reason = (f"Расчётное расстояние {km_total_calc} км отклоняется от эталона "
                  f"{ref_total} км на {deviation_pct:.1f}% (допустимо {MAX_DEVIATION_PCT}%)")
        return True, round(deviation_pct, 1), reason
    return False, round(deviation_pct, 1), None


def handler(event: dict, context) -> dict:
    """
    Рассчитать стоимость поездки с проверкой по эталонной базе данных.
    Каждый расчёт логируется. При отклонении >20% от эталона фиксируется ошибка.
    """
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS, "body": ""}

    body = json.loads(event.get("body") or "{}")
    from_city = body.get("from", "").strip()
    to_city   = body.get("to",   "").strip()
    car_class = body.get("carClass", "standard")
    extras_selected = body.get("extras", {})
    stops = [s.strip() for s in body.get("stops", []) if s.strip()]

    if not from_city or not to_city:
        return {"statusCode": 400, "headers": CORS,
                "body": json.dumps({"error": "Укажите откуда и куда"})}

    # ── 1. Проверяем эталонную базу ───────────────────────────────────────────
    # Для прямых маршрутов без остановок
    reference = None
    use_reference = len(stops) == 0
    if use_reference:
        reference = lookup_reference(from_city, to_city)

    # ── 2. Геокодируем все точки ──────────────────────────────────────────────
    all_cities = [from_city] + stops + [to_city]
    all_coords = []
    for city in all_cities:
        coord = geocode_city(city)
        if not coord:
            return {"statusCode": 400, "headers": CORS,
                    "body": json.dumps({"error": f"Не удалось найти: {city}"})}
        all_coords.append(coord)

    all_special = all(is_special_addr(c) for c in all_cities)
    all_crimea  = all(is_crimea_addr(c)  for c in all_cities)

    from_crimea = is_crimea_addr(from_city)
    to_crimea   = is_crimea_addr(to_city)

    KERCH_BRIDGE = (36.536, 45.308)
    ARMIANSK = (33.691, 46.103)
    CHONGAR  = (34.394, 46.003)

    def is_kherson_addr(a): return any(k in a.lower() for k in ["херсон","херсонская","геническ","каховка"])
    def is_zap_addr(a):     return any(k in a.lower() for k in ["мелитополь","запорожская","бердянск","токмак","энергодар","пологи"])

    osrm_coords = [(lon, lat) for lat, lon in all_coords]

    if from_crimea and not to_crimea:
        if is_kherson_addr(to_city):
            osrm_coords.insert(1, ARMIANSK)
        elif is_zap_addr(to_city):
            osrm_coords.insert(1, CHONGAR)
        else:
            osrm_coords.insert(1, KERCH_BRIDGE)
    elif to_crimea and not from_crimea:
        if is_kherson_addr(from_city):
            osrm_coords.insert(len(osrm_coords)-1, ARMIANSK)
        elif is_zap_addr(from_city):
            osrm_coords.insert(len(osrm_coords)-1, CHONGAR)
        else:
            osrm_coords.insert(len(osrm_coords)-1, KERCH_BRIDGE)

    # ── 3. Считаем расстояния ─────────────────────────────────────────────────
    source = "osrm"
    result = osrm_route_with_geometry(osrm_coords)

    if result:
        total_km = result["distance_km"]
        if all_special:
            km_normal, km_special = 0.0, total_km
        elif all_crimea or (not is_special_addr(from_city) and not is_special_addr(to_city) and not any(is_special_addr(s) for s in stops)):
            km_normal, km_special = total_km, 0.0
        else:
            km_normal, km_special = split_km_by_zone(result["waypoints"], total_km)
    else:
        source = "fallback"
        km_normal, km_special = 0.0, 0.0
        for i in range(len(all_coords)-1):
            n, s = fallback_distance(all_coords[i], all_coords[i+1])
            km_normal += n
            km_special += s

    km_normal  = round(km_normal)
    km_special = round(km_special)

    # ── 4. OSRM — главный источник, эталон обновляется ─────────────────────────
    km_calc_total = km_normal + km_special
    is_error = False
    deviation_pct = None
    error_reason = None
    ref_km_total = None

    if reference:
        ref_km_total = reference["km_normal"] + reference["km_special"]
        is_error, deviation_pct, error_reason = validate_against_reference(km_calc_total, reference)

    if source == "osrm" and use_reference and km_calc_total >= 5:
        update_reference(from_city, to_city, km_normal, km_special)
        update_reference(to_city, from_city, km_normal, km_special)

    distance_km = km_normal + km_special

    # ── 5. Считаем цену ───────────────────────────────────────────────────────
    extras_cost = sum(cost for key, cost in EXTRAS.items() if extras_selected.get(key))
    price = calc_price(km_normal, km_special, car_class, extras_cost)
    all_prices = {key: calc_price(km_normal, km_special, key, extras_cost) for key in TARIFFS}

    # ── 5а. Альтернативные маршруты (только для прямых поездок без остановок) ──
    alternatives = []
    if not stops:
        alternatives = lookup_alternatives(from_city, to_city, car_class, extras_cost)
        # Если в БД нет — генерируем автоматически при наличии спецзоны
        if not alternatives and km_special > 0:
            alternatives = build_auto_alternatives(km_normal, km_special, car_class, extras_cost)
        # Убираем альтернативы идентичные основному маршруту
        alternatives = [
            a for a in alternatives
            if not (a["km_normal"] == km_normal and a["km_special"] == km_special)
        ]

    # ── 6. Логируем ───────────────────────────────────────────────────────────
    save_log({
        "from_city": from_city,
        "to_city":   to_city,
        "stops":     stops if stops else None,
        "car_class": car_class,
        "km_normal":  km_normal,
        "km_special": km_special,
        "km_total":   distance_km,
        "price":      price,
        "all_prices": all_prices,
        "reference_id":  reference["id"] if reference else None,
        "ref_km_total":  ref_km_total,
        "deviation_pct": deviation_pct,
        "is_error":      is_error,
        "error_reason":  error_reason,
        "source":        source,
    })

    return {
        "statusCode": 200,
        "headers": CORS,
        "body": json.dumps({
            "distance_km":      distance_km,
            "price":            price,
            "car_class":        car_class,
            "all_prices":       all_prices,
            "has_special_zone": km_special > 0,
            "km_normal":        km_normal,
            "km_special":       km_special,
            "source":           source,
            "alternatives":     alternatives,
        }),
    }