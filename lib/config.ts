export const PROJECTS = [
  {
    id: "peterson-sfb-b140",
    name: "Peterson SFB - Bldg 140",
    lat: 38.8258,
    lon: -104.7042, // Peterson SFB
    location: "Colorado Springs, CO",
    defaultMaterials: ["green-lock-plus", "r-mer-seal"]
  },
  {
    id: "aspen-es-roof",
    name: "Aspen Elementary School Roof",
    lat: 39.1908689,
    lon: -106.8498341, // Aspen
    location: "Aspen, CO",
    defaultMaterials: ["general-roofing"]
  }
];

export const API_KEY = process.env.OPENWEATHERMAP_API_KEY || "";
