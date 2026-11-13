export interface PresetLocation {
  id: string;
  name: string;
  category: "transit" | "business" | "residential" | "commercial";
  lat: number;
  lng: number;
  description: string;
}

export const PRESET_LOCATIONS: PresetLocation[] = [
  {
    id: "loc-1",
    name: "Central Railway Station Hub",
    category: "transit",
    lat: 12.9784,
    lng: 77.5683,
    description: "City Railway Hub, West Ward",
  },
  {
    id: "loc-2",
    name: "Downtown Commercial Center",
    category: "commercial",
    lat: 12.9716,
    lng: 77.5946,
    description: "Financial & Retail District",
  },
  {
    id: "loc-3",
    name: "Tech Park East Campus",
    category: "business",
    lat: 12.9850,
    lng: 77.6050,
    description: "IT & Software Business Corridor",
  },
  {
    id: "loc-4",
    name: "Metro Exchange North",
    category: "transit",
    lat: 12.9900,
    lng: 77.5800,
    description: "Rapid Transit Interchange",
  },
  {
    id: "loc-5",
    name: "Greenwood Residential Sector",
    category: "residential",
    lat: 12.9300,
    lng: 77.5850,
    description: "Southern Residential Ward",
  },
  {
    id: "loc-6",
    name: "University Innovation Complex",
    category: "business",
    lat: 12.9600,
    lng: 77.5400,
    description: "Academic & Research Park",
  },
];

