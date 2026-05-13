import type { Wilaya } from "./types";

// 58 official Algerian wilayas
export const WILAYAS: Wilaya[] = [
  { code: "01", nameFr: "Adrar", nameAr: "أدرار", region: "South" },
  { code: "02", nameFr: "Chlef", nameAr: "الشلف", region: "North" },
  { code: "03", nameFr: "Laghouat", nameAr: "الأغواط", region: "Highlands" },
  { code: "04", nameFr: "Oum El Bouaghi", nameAr: "أم البواقي", region: "East" },
  { code: "05", nameFr: "Batna", nameAr: "باتنة", region: "East" },
  { code: "06", nameFr: "Béjaïa", nameAr: "بجاية", region: "North" },
  { code: "07", nameFr: "Biskra", nameAr: "بسكرة", region: "Highlands" },
  { code: "08", nameFr: "Béchar", nameAr: "بشار", region: "South" },
  { code: "09", nameFr: "Blida", nameAr: "البليدة", region: "Center" },
  { code: "10", nameFr: "Bouira", nameAr: "البويرة", region: "Center" },
  { code: "11", nameFr: "Tamanrasset", nameAr: "تمنراست", region: "South" },
  { code: "12", nameFr: "Tébessa", nameAr: "تبسة", region: "East" },
  { code: "13", nameFr: "Tlemcen", nameAr: "تلمسان", region: "West" },
  { code: "14", nameFr: "Tiaret", nameAr: "تيارت", region: "Highlands" },
  { code: "15", nameFr: "Tizi Ouzou", nameAr: "تيزي وزو", region: "North" },
  { code: "16", nameFr: "Alger", nameAr: "الجزائر", region: "Center" },
  { code: "17", nameFr: "Djelfa", nameAr: "الجلفة", region: "Highlands" },
  { code: "18", nameFr: "Jijel", nameAr: "جيجل", region: "North" },
  { code: "19", nameFr: "Sétif", nameAr: "سطيف", region: "East" },
  { code: "20", nameFr: "Saïda", nameAr: "سعيدة", region: "West" },
  { code: "21", nameFr: "Skikda", nameAr: "سكيكدة", region: "North" },
  { code: "22", nameFr: "Sidi Bel Abbès", nameAr: "سيدي بلعباس", region: "West" },
  { code: "23", nameFr: "Annaba", nameAr: "عنابة", region: "East" },
  { code: "24", nameFr: "Guelma", nameAr: "قالمة", region: "East" },
  { code: "25", nameFr: "Constantine", nameAr: "قسنطينة", region: "East" },
  { code: "26", nameFr: "Médéa", nameAr: "المدية", region: "Center" },
  { code: "27", nameFr: "Mostaganem", nameAr: "مستغانم", region: "West" },
  { code: "28", nameFr: "M'Sila", nameAr: "المسيلة", region: "Highlands" },
  { code: "29", nameFr: "Mascara", nameAr: "معسكر", region: "West" },
  { code: "30", nameFr: "Ouargla", nameAr: "ورقلة", region: "South" },
  { code: "31", nameFr: "Oran", nameAr: "وهران", region: "West" },
  { code: "32", nameFr: "El Bayadh", nameAr: "البيض", region: "Highlands" },
  { code: "33", nameFr: "Illizi", nameAr: "إليزي", region: "South" },
  { code: "34", nameFr: "Bordj Bou Arreridj", nameAr: "برج بوعريريج", region: "East" },
  { code: "35", nameFr: "Boumerdès", nameAr: "بومرداس", region: "Center" },
  { code: "36", nameFr: "El Tarf", nameAr: "الطارف", region: "East" },
  { code: "37", nameFr: "Tindouf", nameAr: "تندوف", region: "South" },
  { code: "38", nameFr: "Tissemsilt", nameAr: "تيسمسيلت", region: "Highlands" },
  { code: "39", nameFr: "El Oued", nameAr: "الوادي", region: "South" },
  { code: "40", nameFr: "Khenchela", nameAr: "خنشلة", region: "East" },
  { code: "41", nameFr: "Souk Ahras", nameAr: "سوق أهراس", region: "East" },
  { code: "42", nameFr: "Tipaza", nameAr: "تيبازة", region: "Center" },
  { code: "43", nameFr: "Mila", nameAr: "ميلة", region: "East" },
  { code: "44", nameFr: "Aïn Defla", nameAr: "عين الدفلى", region: "Center" },
  { code: "45", nameFr: "Naâma", nameAr: "النعامة", region: "Highlands" },
  { code: "46", nameFr: "Aïn Témouchent", nameAr: "عين تموشنت", region: "West" },
  { code: "47", nameFr: "Ghardaïa", nameAr: "غرداية", region: "South" },
  { code: "48", nameFr: "Relizane", nameAr: "غليزان", region: "West" },
  { code: "49", nameFr: "Timimoun", nameAr: "تيميمون", region: "South" },
  { code: "50", nameFr: "Bordj Badji Mokhtar", nameAr: "برج باجي مختار", region: "South" },
  { code: "51", nameFr: "Ouled Djellal", nameAr: "أولاد جلال", region: "Highlands" },
  { code: "52", nameFr: "Béni Abbès", nameAr: "بني عباس", region: "South" },
  { code: "53", nameFr: "In Salah", nameAr: "عين صالح", region: "South" },
  { code: "54", nameFr: "In Guezzam", nameAr: "عين قزام", region: "South" },
  { code: "55", nameFr: "Touggourt", nameAr: "تقرت", region: "South" },
  { code: "56", nameFr: "Djanet", nameAr: "جانت", region: "South" },
  { code: "57", nameFr: "El M'Ghair", nameAr: "المغير", region: "South" },
  { code: "58", nameFr: "El Meniaa", nameAr: "المنيعة", region: "South" }
];

export const WILAYAS_BY_CODE: Record<string, Wilaya> = Object.fromEntries(
  WILAYAS.map((w) => [w.code, w])
);

export function wilayaName(code: string, lang: "fr" | "ar" | "en" = "fr"): string {
  const w = WILAYAS_BY_CODE[code];
  if (!w) return code;
  return lang === "ar" ? w.nameAr : w.nameFr;
}
