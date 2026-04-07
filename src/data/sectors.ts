export const sectors = [
  {
    name: "BTP & Construction",
    services: [
      "Maçonnerie", "Plomberie", "Électricité", "Peinture",
      "Carrelage", "Menuiserie", "Couture & Ferronnerie", "Toiture",
      "Climatisation", "Alarme & Sécurité"
    ]
  },
  {
    name: "Technologie & Digital",
    services: [
      "Développement Web", "Développement Mobile", "Design Graphique",
      "Réseaux & Sécurité informatique", "Maintenance informatique",
      "Community Management", "Photographie & Vidéo", "Montage vidéo"
    ]
  },
  {
    name: "Services à domicile",
    services: [
      "Ménage", "Cuisine & Traiteur", "Garde d'enfants",
      "Jardinage", "Coiffure & Beauté", "Lavage & Repassage",
      "Déménagement", "Guardiennage"
    ]
  },
  {
    name: "Transport & Logistique",
    services: [
      "Transport de marchandises", "Transport de personnes",
      "Déménagement", "Livraison", "Location de véhicules",
      "Courrier & Express"
    ]
  },
  {
    name: "Commerce & Négoce",
    services: [
      "Import/Export", "Vente en gros", "Vente au détail",
      "Distribution", "Courtage", "Conseil en affaires"
    ]
  },
  {
    name: "Santé & Bien-être",
    services: [
      "Médecine générale", "Pharmacie", "Dentisterie",
      "Optique", "Kinésithérapie", "Nutrition",
      "Psychologie", "Coaching personnel"
    ]
  },
  {
    name: "Éducation & Formation",
    services: [
      "Cours particuliers", "Formation professionnelle",
      "Langues étrangères", "Informatique", "Comptabilité",
      "Management", "Arts & Culture"
    ]
  },
  {
    name: "Juridique & Administratif",
    services: [
      "Conseil juridique", "Rédaction d'actes", "Comptabilité",
      "Gestion administrative", "Immigration", "Assurance"
    ]
  },
  {
    name: "Événementiel & Divertissement",
    services: [
      "Organisation d'événements", "DJ & Animation", "Catering",
      "Décoration", "Photographie", "Location de matériel",
      "Sonorisation"
    ]
  },
  {
    name: "Agriculture & Élevage",
    services: [
      "Agriculture", "Élevage", "Pêche", "Transformation alimentaire",
      "Commerce de produits agricoles", "Conseil agricole"
    ]
  }
];

export function getServicesBySector(sectorName: string): string[] {
  const sector = sectors.find(s => s.name === sectorName);
  return sector ? sector.services : [];
}

export function getAllSectorNames(): string[] {
  return sectors.map(s => s.name);
}

export function getAllServices(): string[] {
  return sectors.flatMap(s => s.services);
}
