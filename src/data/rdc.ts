export const provinces = [
  { name: "Kinshasa", communes: ["Gombe", "Lukunga", "Mont-Amba", "Tshangu", "Funa"] },
  { name: "Kongo-Central", communes: ["Matadi", "Boma", "Muoanda"] },
  { name: "Kwango", communes: ["Kenge", "Kasongo-Lunda"] },
  { name: "Kwilu", communes: ["Bandundu", "Kikwit"] },
  { name: "Mai-Ndombe", communes: ["Inongo", "Kiri"] },
  { name: "Kasaï", communes: ["Kananga", "Luebo"] },
  { name: "Kasaï-Central", communes: ["Kananga", "Demba"] },
  { name: "Kasaï-Oriental", communes: ["Mbuji-Mayi", "Mwene-Ditu"] },
  { name: "Lomami", communes: ["Kabongo", "Mwene-Ditu"] },
  { name: "Sankuru", communes: ["Lusambo", "Mbuji-Mayi"] },
  { name: "Maniema", communes: ["Kindu", "Kasongo"] },
  { name: "Sud-Kivu", communes: ["Bukavu", "Uvira", "Walungu"] },
  { name: "Nord-Kivu", communes: ["Goma", "Butembo", "Beni"] },
  { name: "Ituri", communes: ["Bunia", "Aru"] },
  { name: "Haut-Uélé", communes: ["Isiro", "Watsa"] },
  { name: "Bas-Uélé", communes: ["Buta", "Aketi"] },
  { name: "Tshopo", communes: ["Kisangani", "Lubutu"] },
  { name: "Bas-Uele", communes: ["Buta", "Aketi"] },
  { name: "Tshuapa", communes: ["Boende", "Djolu"] },
  { name: "Équateur", communes: ["Mbandaka", "Wangata"] },
  { name: "Mongala", communes: ["Lisala", "Bumba"] },
  { name: "Nord-Ubangi", communes: ["Gbadolite", "Mobayi-Mbongo"] },
  { name: "Sud-Ubangi", communes: ["Gemena", "Libenge"] },
  { name: "Tanganyika", communes: ["Kalemie", "Moba"] },
  { name: "Haut-Katanga", communes: ["Lubumbashi", "Likasi", "Kolwezi"] },
  { name: "Haut-Lomami", communes: ["Kamina", "Mbuji-Mayi"] },
  { name: "Lualaba", communes: ["Kolwezi", "Likasi"] },
  { name: "Kasaï", communes: ["Luebo", "Dekese"] },
];

export const kinshasaCommunes = [
  "Gombe", "Lukunga", "Mont-Amba", "Tshangu", "Funa",
  "Barumbu", "Bumbu", "Kalamu", "Kasavubu", "Kimbanseke",
  "Kingabwa", "Kintambo", "Lemba", "Limete", "Makala",
  "Maluku", "Masina", "Matete", "Ndjili", "Ngaba",
  "Ngaliema", "Nsele", "Selembao"
];

export function getCommunes(provinceName: string): string[] {
  if (provinceName === "Kinshasa") return kinshasaCommunes;
  const province = provinces.find(p => p.name === provinceName);
  return province ? province.communes : [];
}

export function getAllProvinceNames(): string[] {
  return [...new Set(provinces.map(p => p.name))];
}
