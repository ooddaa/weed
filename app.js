// const { Engine, Builder, log, isFailure, Mango, search } = require("mango");
const {
  Engine,
  Builder,
  log,
  isFailure,
  Mango,
  search,
} = require("../mango/lib/index.js");
const { has, flatten, isArray } = require("lodash");
const { parsePrice, processName, parseAPI } = require("./parsers.js");
const dg = require("./datasets/220209_dg");
const ipc = require("./datasets/220209_ipc");
const { isNode } = require("../mango/lib/Builder/index.js");

/* Instantiate Engine */
const engine = new Engine({
  neo4jUsername: "neo4j",
  neo4jPassword: "pass",
  ip: "0.0.0.0",
  port: "7687",
  database: "neo4j",
});

/* Start Neo4j Driver */
engine.startDriver();

/* Check connection to Neo4j */
engine.verifyConnectivity({ database: "neo4j" }).then(log);

const builder = new Builder();
const mango = new Mango({ builder, engine });

function addDispensary(dispensary) {
  return function inner(product) {
    return { ...product, dispensary };
  };
}
/**
 * Merge Enodes
 * @param {*} data
 */
async function worker(data, dispensary) {
  const addDG = addDispensary(dispensary);
  const enodes = data.map(addDG).map(productToEnode);
  const result = await engine.mergeEnhancedNodes(enodes);
  return result;
}

/**
 * @TODO mb do signature (product: Object, fn: Function, args: Object)
 * where  fn will be called with product or args
 * which may add additional properties to Node
 */
function createStrain(product) /* : Node */ {
  switch (product["strain"]) {
    case "Sativa":
      return builder.makeNode(["Strain"], { NAME: "Sativa" });
    case "Indica":
      return builder.makeNode(["Strain"], { NAME: "Indica" });
    case "Hybrid":
      return builder.makeNode(["Strain"], { NAME: "Hybrid" });
    default:
      return builder.makeNode(["Strain"], { NAME: "UNKNOWN" });
  }
}

/**
 * Interface to declare which Node's properties should be extracted
 * into a Relationship and how (via extractionFunction).
 * @param {Object|Node|EnhancedNode} extractFrom
 * @returns {Function}
 */
function extractPropertyAsRelationshipFrom(extractFrom) {
  /**
   * Creates RelationshipCandidate[] for builder.makeEnhancedNode(coreNode, RelationshipCandidate[]).
   * We want to specify how we want to enhance our Node.
   * @param {Object} config
   * @returns {RelationshipCandidate[]}
   */
  function inner({
    type /* : String|String[] */,
    props /* : Object */,
    direction /* '>'|'<' */,
    propToExtract /* : String */,
    extractionFunction /* : Function */,
  }) /* : RelationshipCandidate[] */ {
    if ([">", "outbound", "<", "inbound"].includes(direction) != true) {
      throw new Error(
        `extractPropertyAsRelationshipFrom: expected direction to be one of ">" | "outbound" | "<" | "inbound".\ndirection: ${JSON.stringify(
          direction
        )}`
      );
    }
    /**@TODO guard against missing both propToExtract & extractionFunction */

    const partner /* : Node|Node[] */ = extractionFunction
      ? extractionFunction(extractFrom, propToExtract)
      : builder.makeNode([propToExtract || "ExtractedProp"], {
          NAME: extractFrom[propToExtract] || "extractedProp",
        });

    const rcs = [];
    if (isArray(partner)) {
      partner.forEach((node) => {
        rcs.push(
          builder.makeRelationshipCandidate(
            type || ["DEFAULT_REL_TYPE"],
            props ||
              {
                // DEFAULT_REL_PROP: "created by extractPropertyAsRelationship",
              },
            direction == ">" ? "outbound" : "inbound",
            node
          )
        );
      });
    } else {
      if (isNode(partner) !== true) {
        throw new Error(
          `extractPropertyAsRelationshipFrom: expected to end up with a partner Node.\npartner: ${JSON.stringify(
            partner
          )}`
        );
      }
      rcs.push(
        builder.makeRelationshipCandidate(
          type || ["DEFAULT_REL_TYPE"],
          props ||
            {
              // DEFAULT_REL_PROP: "created by extractPropertyAsRelationship",
            },
          direction == ">" ? "outbound" : "inbound",
          partner
        )
      );
    }

    return rcs;
  }
  return inner;
}

function createCultivar(product) /* : Node */ {
  return builder.makeNode(["Cultivar"], { NAME: product.cultivar });
}

function createManufacturer(product) /* : Node */ {
  // parse 'Khiron THC Rich'
  /**
   * @TODO write choseManufacturer(product) that intelligently matches manufacturer
   * mb even should consult KnowlegeBase
   */
  const kb = [
    {
      pattern: new RegExp("tilray", "i"),
      preferredName: "Tilray",
      aliases: ["Tilray", "TILRAY"],
    },
    {
      pattern: new RegExp("aurora", "i"),
      preferredName: "Aurora",
      aliases: ["Aurora", "PEDANIOS"],
    },
    {
      pattern: new RegExp("columbia", "i"),
      preferredName: "Columbia Care",
      aliases: ["Columbia", "Columbia Care", "COLUMBIA"],
    },
    {
      pattern: new RegExp("bedrocan", "i"),
      preferredName: "Bedrocan",
      aliases: ["Bedrocan", "BEDROCAN"],
    },
    {
      pattern: new RegExp("bedrolite", "i"),
      preferredName: "Bedrocan",
      aliases: ["bedrolite"],
    },
    {
      pattern: new RegExp("bediol", "i"),
      preferredName: "Bedrocan",
      aliases: ["bediol"],
    },
    {
      pattern: new RegExp("bedrobinol", "i"),
      preferredName: "Bedrocan",
      aliases: ["bedrobinol"],
    },
    {
      pattern: new RegExp("bedica", "i"),
      preferredName: "Bedrocan",
      aliases: ["bedica"],
    },
  ];

  const [name, ...rest] = product["product"].split(" ");
  const [preferredName] = processName(name, kb); // entity resolution module

  return builder.makeNode(["Manufacturer"], { NAME: preferredName });
}

function createProductBrand(product) /* : Node */ {
  // parse product Name 'Khiron THC Rich'
  const [name, ...rest] = product["product"].split(" ");
  return builder.makeNode(["ProductBrand"], { NAME: name });
}

function createForm(product) /* : Node */ {
  return builder.makeNode(["Form"], { NAME: product.form || "UNKNOWN" });
}

function createPrices(product) /* : Node[] */ {
  const prices = parsePrice(product);
  const priceNodes = prices.map((price) => {
    return builder.makeNode(["Price"], {
      NAME: price.sourceStr,
      PRODUCTTOTALAMOUNT: price.productTotalAmount,
      ...price,
    });
  });
  return priceNodes;
}

function createDispensary(product) /* : Node */ {
  return builder.makeNode(["Dispensary"], {
    NAME: product.dispensary || "UNKNOWN",
  });
}

/**
 * Turns a POJO into an EnhancedNode to be added to Neo4j.
 * @param {Object} product - Product POJO from https://thecannabispages.co.uk/cbmps-stock-checker/
 * @returns {EnhancedNode}
 */
function productToEnode(product, dispensary) /* : EnhancedNode */ {
  // log(endNode)
  const extract /* : Function */ = extractPropertyAsRelationshipFrom(product);
  const { thc, cbd } = parseAPI(product);
  // log(thc, cbd);
  const newEnode /* : EnhancedNode */ = builder.makeEnhancedNode(
    builder.makeNode(
      ["Product"],
      {
        NAME: product.product,
        FORM: product.form,
        // THC: thc,
        // CBD: cbd,
      },
      { ...product, thcContentPrc: thc[1], cbdContentPrc: cbd[1] }
      // thc,
      // cbd
      // ...parseAPI(product) // adds thc/cbd contents
    ),
    [
      ...extract({
        type: ["FROM_STRAIN"],
        direction: ">",
        propToExtract: "strain",
        extractionFunction: createStrain,
      }),
      ...extract({
        type: ["FROM_CULTIVAR"],
        direction: ">",
        extractionFunction: createCultivar,
      }),
      ...extract({
        type: ["MADE_BY"],
        direction: ">",
        extractionFunction: createManufacturer,
      }),
      // "HAS_FORM"
      ...extract({
        type: ["HAS_FORM"],
        direction: ">",
        extractionFunction: createForm,
      }),
      // "AT_DISPENSARY"
      ...extract({
        type: ["AT_DISPENSARY"],
        direction: ">",
        extractionFunction: createDispensary,
      }),
      // "HAS_PRICE"
      ...extract({
        type: ["HAS_PRICE"],
        direction: ">",
        extractionFunction: createPrices,
      }),
    ]
  );
  // log(newEnode)
  return newEnode;
}

function productToEnode1() {
  const original = {
    product: "Noidecs T10:C15 Cannabis Oil",
    form: "Full Spectrum Oil",
    strain: "Sativa",
    cultivar: "N/A",
    thc: "10 mg/ml",
    cbd: "15 mg/ml",
    size: "50ml",
    privateprescriptionpricingapprox: "50ml bottle from £175",
    availableonprojecttwenty21: "Yes",
    productsize: "50ml bottle",
    monthlyamountcappedat15: "upto 50ml",
    pharmacyt21: "Dispensary Green",
    notes: "",
    levelsinstockuk: "Out Of Stock",
    atpharmacy: "No",
    moreinformationreviews: null,
    dispensary: "dg",
  };
  const enode = {
    // product: makeCoreNode("Noidecs T10:C15 Cannabis Oil"),
    // form: relationshipOut(["HAS_FORM"], createForm),
  };
}

/* 
match (p:Price) where size((p)<-[:HAS_PRICE]-(:Product)) > 1 return (p)<-[:HAS_PRICE]-(:Product)-[:MADE_BY]->(:Manufacturer)
*/

async function findProduct(name) {
  return await mango.findNode(["Product"], { NAME: name });
}
async function findProduct1(props) {
  return await mango.findNode(["Product"], props);
}
async function findManufacturer(name) {
  return await mango.findNode(["Manufacturer"], { NAME: name });
}
async function findManufacturer1(props) {
  return await mango.findNode(["Manufacturer"], props);
}

async function bedrocan2() {
  /* Solving Bedrocan Product vs Manufacturer fail */
  /* make sure Bedrocan:Manufacturer exists */
  const bedrocan /* : Node */ = await mango.buildAndMergeNode(
    ["Manufacturer"],
    { NAME: "Bedrocan" }
  );

  /* we have a list of Products that Bedrocan makes, we want them to have MADE_BY relationships */
  const duplicates = [
    "BEDIOL",
    "Bediol",
    "bediol",
    "BEDROLITE",
    "Bedrolite",
    "bedrolite",
    "BEDROBINOL",
    "Bedrobinol",
    "bedrobinol",
    "BEDICA",
    "Bedica",
    "bedica",
  ];
  const duplicateProducts = await findNodes(
    ["BEDIOL", "BEDROLITE", "BEDROBINOL", "BEDICA", "BEDROCAN"],
    findProduct
  );

  async function findNodes(names, fn) {
    return flatten(await Promise.all(names.map(fn)));
  }
  const manufacturers = await findNodes(duplicates, findManufacturer);
  // log(manufacturers);
  for await (let manufacturer of manufacturers) {
    let rv = await mango.deleteNode(manufacturer);
    // log(rv)
  }
  for await (let product of duplicateProducts) {
    let rv = await mango.deleteNode(product);
    // log(rv);
  }
}

worker(getData(dg), "Dispensary Green").then(() => {
  worker(getData(ipc), "IPS").then(() => {
    bedrocan2().then(() => log("ok"));
  });
});

// worker2(getData(dg))
// worker2(getData(ipc))
// bedrocan2();

function getData(dataset) {
  return dataset;
}

function updateManufacturers() {
  /* Take existing KG and update Manufacturers with this info */
  /* Assume that all manufacturers already have proper _hash, => new props must be optional? */
  /* or if we consider new props REQUIRED, then we need to recalculate hashes */
  /* we don't really need any more REQUIRED props as long as each Manufacturer is already unique by NAME */

  const legalPersons = [
    {
      NAME: "Aurora",
      _label: ["Manufacturer", "LegalPerson"],
      links: ["https://www.auroramedicine.com"],
      aliases: ["Aurora Deutschland"],
      associatedEntities: ["Pedanios"],
    },
    {
      NAME: "Cellen",
      _label: ["Manufacturer", "LegalPerson"],
      links: ["https://www.cellenhealth.com/"],
      aliases: ["Aurora Deutschland"],
      associatedEntities: ["Cellen Therapeutics", "Leva Clinic"],
      addresses: [
        "Cannon Place, 78 Cannon Street, London, United Kingdom, EC4N 6AF",
      ],
    },
    {
      NAME: "Leva Clinic",
      _label: ["Dispensary", "Clinic", "LegalPerson"],
      links: ["https://www.levaclinic.com/"],
      aliases: ["Leva"],
      associatedEntities: ["Cellen"],
    },

    {
      NAME: "Khiron",
      _label: ["Manufacturer", "LegalPerson"],
      links: ["https://khironmed.co.uk/", "https://khiron.ca/en/"],
      aliases: ["Khiron Life Sciences Corp"],
      addresses: [
        "Bogotá, Colombia,Carrera 11 # 84 - 09, (+57) 1 7442064, info@khiron.ca",
      ],
    },

    {
      NAME: "MedCan",
      _label: ["Manufacturer", "LegalPerson"],
      links: ["https://www.medcan.co.za/"],
      aliases: [],
      addresses: ["South Africa"],
    },

    {
      NAME: "Bedrocan",
      _label: ["Manufacturer", "LegalPerson"],
      links: ["https://bedrocan.com/"],
      aliases: [],
      addresses: [
        "Bedrocan International, De Zwaaikom 4, 9641 KV Veendam, Netherlands,t: +31 598 62 37 31",
      ],
    },

    {
      NAME: "Spectrum",
      _label: ["Manufacturer", "LegalPerson"],
      links: ["https://www.spectrumtherapeutics.com/"],
      aliases: ["Spectrum Therapeutics"],
      addresses: [],
    },

    {
      NAME: "Rokshaw Laboratories",
      _label: ["SpecialsManufacturer", "Supplier", "LegalPerson"],
      activities: [
        "manufactures unlicenced specials",
        "supplies pharmacies in UK",
        "supplies NHS",
      ],
      links: ["https://rokshaw.co.uk/"],
    },
    {
      NAME: "Curaleaf",
      _label: [
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
      _label: ["Pharmacy", "LegalPerson"],
      activities: ["manufactures specials", "dispensing"],
      links: ["https://www.cbpmaccess.co.uk/"],
    },

    {
      NAME: "Tilray",
      _label: ["Manufacturer", "LegalPerson"],
      links: [
        "https://www.tilray.com/",
        "https://en.wikipedia.org/wiki/Tilray",
        "https://www.nasdaq.com/market-activity/stocks/tlry",
        "https://money.tmx.com/en/quote/TLRY",
      ],
    },

    {
      NAME: "Columbia Care",
      _label: ["Manufacturer", "LegalPerson"],
      links: ["https://col-care.com/"],
      aliases: ["ColCare"],
    },

    {
      NAME: "Althea",
      _label: ["Manufacturer", "LegalPerson", "ProductBrand"],
      links: ["https://althea.life/"],
    },

    {
      NAME: "Columbia Care",
      _label: ["Manufacturer", "LegalPerson"],
      links: ["https://col-care.com/"],
      aliases: ["ColCare"],
    },
    {
      NAME: "LGP",
      _label: ["Manufacturer", "LegalPerson"],
      links: ["https://www.littlegreenpharma.com/"],
      aliases: ["Little Green Pharma"],
    },
    {
      NAME: "Bod Pharma",
      _label: ["Manufacturer", "LegalPerson"],
      links: [
        "https://bodaustralia.com/",
        "https://www.marketindex.com.au/asx/bda",
      ],
      aliases: ["BOD", "Bod Australia Ltd"],
      countries: ["Australia"],
    },
    {
      NAME: "BOL Pharma",
      _label: ["Manufacturer", "LegalPerson"],
      links: ["https://www.bolpharma.com/"],
      aliases: ["Breath Of Life"],
      countries: ["Israel"],
    },
    {
      NAME: "Cann Group",
      _label: ["Manufacturer", "LegalPerson"],
      activities: ["R&D", "production", "exports"],
      links: ["https://www.canngrouplimited.com/"],
      aliases: ["Cann Group Limited"],
      countries: ["Australia"],
    },
  ];
}

const news = [
  {
    link: "https://ir.curaleaf.com/2021-04-07-Curaleaf-Completes-Acquisition-of-EMMAC-and-Secures-US-130-Million-Investment-from-a-Single-Strategic-Institutional-Investor",
    summary: "Curaleaf Holdings, Inc. acquired EMMAC which produces Adven",
    datePosted: [2021, 4, 7],
    nodes: ["Curaleaf"],
  },
  {
    link: "https://lyphegroup.com/northern-green-canada-partnership/",
    summary:
      "LYPHE Group imports Northern Green Canada into the U.K. market as supply to the medical cannabis brand, NOIDECS.",
    datePosted: [2022, 2, 15],
    nodes: ["LYPHE Group"],
  },
  {
    link: "https://cannabiswealth.co.uk/2022/02/22/kanabo-14m-acquisition-telehealth-gp-service/",
    summary:
      "Kanabo makes £14m acquisition of telehealth GP serviceLYPHE Group imports Northern Green Canada into the U.K. market as supply to the medical cannabis brand, NOIDECS.",
    datePosted: [2022, 2, 2],
    nodes: ["Kanabo"],
  },
];

const find_thc_cbd = `MATCH (p:Product WHERE p.form contains 'Oil' and p.thcContentPrc >= .1 and p.cbdContentPrc >= .15 ) RETURN p`;
const compare_two_oils_by_price_per_ml = `UNWIND ["Noidecs T10 Cannabis Oil", "Spectrum Therapeutics Blue Cannabis Oil"] as name
match (oil:Product { NAME: name})
match path=(oil)-[:HAS_PRICE]->(price:Price)
return oil.NAME, oil.size, oil.thcContentPrc, oil.cbdContentPrc, price.productQuantity, price.totalPrice , price.totalPrice/price.productQuantity`;

/* 
match (p:Product WHERE p.FORM contains 'Oil')-[:AT_DISPENSARY]->(d:Dispensary WHERE NOT(d.NAME contains 'Green')) return p limit 4
*/
