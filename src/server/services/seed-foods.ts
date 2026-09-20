import type { ServingUnit } from "@/db/schema/health";

export interface SeedFood {
  name: string;
  size: number;
  unit: ServingUnit;
  cal: number;
  p: number;
  c: number;
  f: number;
  fiber?: number;
}

// Approximate values per serving; fully editable by the user afterwards.
export const STARTER_FOODS: SeedFood[] = [
  { name: "Nasi putih", size: 100, unit: "g", cal: 130, p: 2.7, c: 28, f: 0.3, fiber: 0.4 },
  { name: "Nasi merah", size: 100, unit: "g", cal: 111, p: 2.6, c: 23, f: 0.9, fiber: 1.8 },
  { name: "Nasi goreng", size: 200, unit: "g", cal: 330, p: 8, c: 48, f: 11, fiber: 1.5 },
  { name: "Mie instan (rebus)", size: 1, unit: "piece", cal: 380, p: 8, c: 54, f: 14, fiber: 2 },
  { name: "Roti tawar", size: 1, unit: "slice", cal: 75, p: 2.5, c: 14, f: 1, fiber: 0.8 },
  { name: "Oatmeal (kering)", size: 40, unit: "g", cal: 150, p: 5, c: 27, f: 3, fiber: 4 },
  { name: "Kentang rebus", size: 100, unit: "g", cal: 87, p: 1.9, c: 20, f: 0.1, fiber: 1.8 },
  { name: "Ubi jalar rebus", size: 100, unit: "g", cal: 90, p: 2, c: 21, f: 0.2, fiber: 3.3 },
  { name: "Dada ayam (matang)", size: 100, unit: "g", cal: 165, p: 31, c: 0, f: 3.6 },
  { name: "Ayam goreng (paha)", size: 1, unit: "piece", cal: 250, p: 20, c: 8, f: 15 },
  { name: "Telur rebus", size: 1, unit: "piece", cal: 78, p: 6.3, c: 0.6, f: 5.3 },
  { name: "Telur dadar", size: 1, unit: "piece", cal: 110, p: 7, c: 1, f: 8.5 },
  { name: "Daging sapi (matang)", size: 100, unit: "g", cal: 250, p: 26, c: 0, f: 15 },
  { name: "Ikan salmon", size: 100, unit: "g", cal: 208, p: 20, c: 0, f: 13 },
  { name: "Ikan lele goreng", size: 100, unit: "g", cal: 240, p: 18, c: 6, f: 16 },
  { name: "Tuna kaleng", size: 100, unit: "g", cal: 116, p: 26, c: 0, f: 1 },
  { name: "Udang rebus", size: 100, unit: "g", cal: 99, p: 24, c: 0.2, f: 0.3 },
  { name: "Tempe goreng", size: 50, unit: "g", cal: 135, p: 9, c: 8, f: 8, fiber: 2 },
  { name: "Tahu goreng", size: 50, unit: "g", cal: 105, p: 7, c: 3, f: 7.5, fiber: 0.5 },
  { name: "Tahu putih", size: 100, unit: "g", cal: 76, p: 8, c: 1.9, f: 4.8, fiber: 0.3 },
  { name: "Kacang tanah", size: 30, unit: "g", cal: 170, p: 7.5, c: 5, f: 14, fiber: 2.5 },
  { name: "Selai kacang", size: 1, unit: "tbsp", cal: 95, p: 4, c: 3, f: 8, fiber: 1 },
  { name: "Susu sapi", size: 250, unit: "ml", cal: 150, p: 8, c: 12, f: 8 },
  { name: "Yogurt plain", size: 150, unit: "g", cal: 90, p: 5, c: 7, f: 5 },
  { name: "Whey protein", size: 30, unit: "g", cal: 120, p: 24, c: 3, f: 1.5 },
  { name: "Keju cheddar", size: 1, unit: "slice", cal: 70, p: 4.5, c: 0.5, f: 5.5 },
  { name: "Pisang", size: 1, unit: "piece", cal: 105, p: 1.3, c: 27, f: 0.4, fiber: 3 },
  { name: "Apel", size: 1, unit: "piece", cal: 95, p: 0.5, c: 25, f: 0.3, fiber: 4.4 },
  { name: "Jeruk", size: 1, unit: "piece", cal: 62, p: 1.2, c: 15, f: 0.2, fiber: 3.1 },
  { name: "Alpukat", size: 100, unit: "g", cal: 160, p: 2, c: 9, f: 15, fiber: 7 },
  { name: "Pepaya", size: 100, unit: "g", cal: 43, p: 0.5, c: 11, f: 0.3, fiber: 1.7 },
  { name: "Semangka", size: 100, unit: "g", cal: 30, p: 0.6, c: 7.6, f: 0.2, fiber: 0.4 },
  { name: "Brokoli rebus", size: 100, unit: "g", cal: 35, p: 2.4, c: 7, f: 0.4, fiber: 3.3 },
  { name: "Bayam rebus", size: 100, unit: "g", cal: 23, p: 3, c: 3.8, f: 0.3, fiber: 2.4 },
  { name: "Wortel", size: 100, unit: "g", cal: 41, p: 0.9, c: 10, f: 0.2, fiber: 2.8 },
  { name: "Tumis kangkung", size: 100, unit: "g", cal: 60, p: 2.5, c: 5, f: 3.5, fiber: 2 },
  { name: "Gado-gado", size: 1, unit: "cup", cal: 300, p: 12, c: 25, f: 17, fiber: 6 },
  { name: "Soto ayam", size: 1, unit: "cup", cal: 230, p: 15, c: 20, f: 9 },
  { name: "Bakso", size: 5, unit: "piece", cal: 220, p: 12, c: 16, f: 12 },
  { name: "Sate ayam (10 tusuk)", size: 1, unit: "piece", cal: 330, p: 30, c: 10, f: 18 },
  { name: "Rendang", size: 100, unit: "g", cal: 195, p: 22, c: 4, f: 10 },
  { name: "Kopi hitam", size: 200, unit: "ml", cal: 5, p: 0.3, c: 0, f: 0 },
  { name: "Kopi susu gula aren", size: 250, unit: "ml", cal: 190, p: 3, c: 32, f: 5 },
  { name: "Teh manis", size: 250, unit: "ml", cal: 90, p: 0, c: 23, f: 0 },
  { name: "Minyak goreng", size: 1, unit: "tbsp", cal: 120, p: 0, c: 0, f: 14 },
];
