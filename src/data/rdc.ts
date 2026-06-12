export type KinshasaDistrict = 'Lukunga' | 'Funa' | 'Mont-Amba' | 'Tshangu'

export const kinshasaDistricts: Record<KinshasaDistrict, string[]> = {
  Lukunga: ['Barumbu', 'Gombe', 'Kinshasa', 'Kintambo', 'Lingwala', 'Ngaliema', 'Mont-Ngafula'],
  Funa: ['Bandalungwa', 'Bumbu', 'Kalamu', 'Kasa-Vubu', 'Makala', 'Ngiri-Ngiri', 'Selembao'],
  'Mont-Amba': ['Kisenso', 'Lemba', 'Limete', 'Matete', 'Ngaba'],
  Tshangu: ['Kimbanseke', 'Maluku', 'Masina', 'Ndjili', 'N\'Sele'],
}

export const kinshasaCommunes = Object.values(kinshasaDistricts).flat()

export const provinces = [
  { name: 'Kinshasa', communes: kinshasaCommunes, districts: kinshasaDistricts },
  { name: 'Kongo-Central', communes: ['Matadi', 'Boma', 'Muoanda'] },
  { name: 'Kwango', communes: ['Kenge', 'Kasongo-Lunda'] },
  { name: 'Kwilu', communes: ['Bandundu', 'Kikwit'] },
  { name: 'Mai-Ndombe', communes: ['Inongo', 'Kiri'] },
  { name: 'Kasaï', communes: ['Kananga', 'Luebo'] },
  { name: 'Kasaï-Central', communes: ['Kananga', 'Demba'] },
  { name: 'Kasaï-Oriental', communes: ['Mbuji-Mayi', 'Mwene-Ditu'] },
  { name: 'Lomami', communes: ['Kabongo', 'Mwene-Ditu'] },
  { name: 'Sankuru', communes: ['Lusambo', 'Mbuji-Mayi'] },
  { name: 'Maniema', communes: ['Kindu', 'Kasongo'] },
  { name: 'Sud-Kivu', communes: ['Bukavu', 'Uvira', 'Walungu'] },
  { name: 'Nord-Kivu', communes: ['Goma', 'Butembo', 'Beni'] },
  { name: 'Ituri', communes: ['Bunia', 'Aru'] },
  { name: 'Haut-Uélé', communes: ['Isiro', 'Watsa'] },
  { name: 'Bas-Uélé', communes: ['Buta', 'Aketi'] },
  { name: 'Tshopo', communes: ['Kisangani', 'Lubutu'] },
  { name: 'Tshuapa', communes: ['Boende', 'Djolu'] },
  { name: 'Équateur', communes: ['Mbandaka', 'Wangata'] },
  { name: 'Mongala', communes: ['Lisala', 'Bumba'] },
  { name: 'Nord-Ubangi', communes: ['Gbadolite', 'Mobayi-Mbongo'] },
  { name: 'Sud-Ubangi', communes: ['Gemena', 'Libenge'] },
  { name: 'Tanganyika', communes: ['Kalemie', 'Moba'] },
  { name: 'Haut-Katanga', communes: ['Lubumbashi', 'Likasi', 'Kolwezi'] },
  { name: 'Haut-Lomami', communes: ['Kamina', 'Mbuji-Mayi'] },
  { name: 'Lualaba', communes: ['Kolwezi', 'Likasi'] },
]

export function getCommunes(provinceName: string): string[] {
  const province = provinces.find(p => p.name === provinceName)
  return province ? province.communes : []
}

export function getAllProvinceNames(): string[] {
  return provinces.map(p => p.name)
}

export function getProvinceDistricts(provinceName: string): Record<string, string[]> | null {
  const province = provinces.find(p => p.name === provinceName)
  return province && 'districts' in province ? (province as any).districts : null
}
