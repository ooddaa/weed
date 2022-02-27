/**
 * https://jsdoc.app/tags-typedef.html
 * @typedef {Object} LegalPerson
 *
 */

// declare type LegalPerson = {
//   NAME: string,
//   _labels: string[],
//   links?: string[],
//   aliases?: string[],
//   associatedEntities?: string[],
//   addresses?: string[],
//   countries: string[]
// };

// module.exports = { LegalPerson };

const legalPersons = [
  {
    NAME: "Aurora",
    _labels: ["Manufacturer", "LegalPerson"],
    links: ["https://www.auroramedicine.com"],
    aliases: ["Aurora Deutschland"],
    associatedEntities: ["Pedanios"],
  },
  {
    NAME: "Cellen",
    _labels: ["Manufacturer", "LegalPerson"],
    links: ["https://www.cellenhealth.com/"],
    aliases: ["Aurora Deutschland"],
    associatedEntities: ["Cellen Therapeutics", "Leva Clinic"],
    addresses: [
      "Cannon Place, 78 Cannon Street, London, United Kingdom, EC4N 6AF",
    ],
  },
  {
    NAME: "Leva Clinic",
    _labels: ["Dispensary", "Clinic", "LegalPerson"],
    links: ["https://www.levaclinic.com/"],
    aliases: ["Leva"],
    associatedEntities: ["Cellen"],
  },

  {
    NAME: "Khiron",
    _labels: ["Manufacturer", "LegalPerson"],
    links: ["https://khironmed.co.uk/", "https://khiron.ca/en/"],
    aliases: ["Khiron Life Sciences Corp"],
    addresses: [
      "Bogotá, Colombia,Carrera 11 # 84 - 09, (+57) 1 7442064, info@khiron.ca",
    ],
  },

  {
    NAME: "MedCan",
    _labels: ["Manufacturer", "LegalPerson"],
    links: ["https://www.medcan.co.za/"],
    aliases: [],
    addresses: ["South Africa"],
  },

  {
    NAME: "Bedrocan",
    _labels: ["Manufacturer", "LegalPerson"],
    links: ["https://bedrocan.com/"],
    aliases: [],
    addresses: [
      "Bedrocan International, De Zwaaikom 4, 9641 KV Veendam, Netherlands,t: +31 598 62 37 31",
    ],
  },

  {
    NAME: "Spectrum",
    _labels: ["Manufacturer", "LegalPerson"],
    links: ["https://www.spectrumtherapeutics.com/"],
    aliases: ["Spectrum Therapeutics"],
    addresses: [],
  },

  {
    NAME: "Rokshaw Laboratories",
    _labels: ["SpecialsManufacturer", "Supplier", "LegalPerson"],
    activities: [
      "manufactures unlicenced specials",
      "supplies pharmacies in UK",
      "supplies NHS",
    ],
    links: ["https://rokshaw.co.uk/"],
  },
  {
    NAME: "Curaleaf",
    _labels: [
      "Producer",
      "Distributor",
      "Manufacturer",
      "Group",
      "LegalPerson",
    ],
    activities: [
      "production, development, and distribution in Europe",
      "owns Rokshaw Laboratories and CBPMAccess",
    ],
    links: [
      "https://curaleaf.com/",
      "https://curaleafinternational.com/our-international-companies/",
    ],
    aliases: ["Curaleaf Holdings, Inc.", "Curaleaf International"],
    associatedEntities: ["Adven"],
  },

  {
    NAME: "CBPMAccess",
    _labels: ["Pharmacy", "LegalPerson"],
    activities: ["manufactures specials", "dispensing"],
    links: ["https://www.cbpmaccess.co.uk/"],
  },

  {
    NAME: "Tilray",
    _labels: ["Manufacturer", "LegalPerson"],
    links: [
      "https://www.tilray.com/",
      "https://en.wikipedia.org/wiki/Tilray",
      "https://www.nasdaq.com/market-activity/stocks/tlry",
      "https://money.tmx.com/en/quote/TLRY",
    ],
  },

  {
    NAME: "Columbia Care",
    _labels: ["Manufacturer", "LegalPerson"],
    links: ["https://col-care.com/"],
    aliases: ["ColCare"],
  },

  {
    NAME: "Althea",
    _labels: ["Manufacturer", "LegalPerson", "ProductBrand"],
    links: ["https://althea.life/"],
  },

  {
    NAME: "Columbia Care",
    _labels: ["Manufacturer", "LegalPerson"],
    links: ["https://col-care.com/"],
    aliases: ["ColCare"],
  },
  {
    NAME: "LGP",
    _labels: ["Manufacturer", "LegalPerson"],
    links: ["https://www.littlegreenpharma.com/"],
    aliases: ["Little Green Pharma"],
  },
  {
    NAME: "Bod Pharma",
    _labels: ["Manufacturer", "LegalPerson"],
    links: [
      "https://bodaustralia.com/",
      "https://www.marketindex.com.au/asx/bda",
    ],
    aliases: ["BOD", "Bod Australia Ltd"],
    countries: ["Australia"],
  },
  {
    NAME: "BOL Pharma",
    _labels: ["Manufacturer", "LegalPerson"],
    links: ["https://www.bolpharma.com/"],
    aliases: ["Breath Of Life"],
    countries: ["Israel"],
  },
  {
    NAME: "Cann Group",
    _labels: ["Manufacturer", "LegalPerson"],
    activities: ["R&D", "production", "exports"],
    links: ["https://www.canngrouplimited.com/"],
    aliases: ["Cann Group Limited"],
    countries: ["Australia"],
  },
];

module.exports = legalPersons;
