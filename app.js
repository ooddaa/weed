const { Engine, Builder, log, isFailure, Mango } = require("mango");
const { has, flatten } = require("lodash");
const { parsePrice, processName } = require("./parsers.js");
const dg = require('./datasets/220209_dg')
const ipc = require('./datasets/220209_ipc')

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

async function worker(data) {
  const nodes = data.map((product) => {
    // log(product)
    const newNode = {
      PRODUCT: product.product,
      FORM: product.form,
      ...product,
    };
    const node = builder.makeNode(
      ["Product"],
      {
        PRODUCT: product.product,
        FORM: product.form,
      },
      product
    );
    return node;
  });
  // log(nodes.length)
  const result = await engine.mergeNodes(nodes);
  // log(result)
  return result;
}

// getDg().then(worker)

/**
 * Merge Enodes
 * @param {*} data
 */
async function worker2(data) {
  const enodes = data.map(productToEnode);
  const result = await engine.mergeEnhancedNodes(enodes);
  return result;
}
// getDg().then(worker2);

function pickStrain({ strain }) /* : Node */ {
  switch (strain) {
    case "Sativa":
      return builder.makeNode(["Strain"], { NAME: "Sativa" });
    case "Indica":
      return builder.makeNode(["Strain"], { NAME: "Indica" });
    case "Hybrid":
      return builder.makeNode(["Strain"], { NAME: "Hybrid" });
    default:
      return builder.makeNode(["Strain"], { NAME: "Unknown" });
  }
}

function pickCultivar({ cultivar }) /* : Node */ {
  const node = builder.makeNode(["Cultivar"], { NAME: cultivar });
  return node;
}

function createManufacturer(product) /* : Node */ {
  // parse 'Khiron THC Rich'
  /**
   * @TODO write choseManufacturer(product) that intelligently matches manufacturer
   * mb even should consult KnowlegeBase
   */
   const kb = [
    { pattern: new RegExp('tilray', 'i'), preferredName: 'Tilray', aliases: ['Tilray', 'TILRAY'] },
    { pattern: new RegExp('aurora', 'i'), preferredName: 'Aurora', aliases: ['Aurora', "PEDANIOS"] },
    { pattern: new RegExp('columbia', 'i'), preferredName: 'Columbia Care', aliases: ['Columbia', 'Columbia Care', 'COLUMBIA'] },
    { pattern: new RegExp('bedrocan', 'i'), preferredName: 'Bedrocan', aliases: ['Bedrocan', 'BEDROCAN', ] },
    { pattern: new RegExp('bedrolite', 'i'), preferredName: 'Bedrocan', aliases: ['bedrolite'] },
    { pattern: new RegExp('bediol', 'i'), preferredName: 'Bedrocan', aliases: ['bediol'] },
    { pattern: new RegExp('bedrobinol', 'i'), preferredName: 'Bedrocan', aliases: ['bedrobinol'] },
    { pattern: new RegExp('bedica', 'i'), preferredName: 'Bedrocan', aliases: ['bedica'] },
  ]

  const [name, ...rest] = product["product"].split(" ");
  const [preferredName] = processName(name, kb) // entity resolution module
  
  return builder.makeNode(["Manufacturer"], { NAME: preferredName });
}

function createProductBrand(product) /* : Node */ {
  // parse product Name 'Khiron THC Rich'
  const [name, ...rest] = product["product"].split(" ");
  return builder.makeNode(["ProductBrand"], { NAME: name });
}

function pickForm({ form }) /* : Node */ {
  return builder.makeNode(["Form"], { NAME: form });
}

function extractPrices(product) /* : RelationshipCandidate[] */ {
  const prices = parsePrice(product.privateprescriptionpricingapprox);
  const priceNodes = prices.map((price) => {
    return builder.makeNode(["Price"], {
      NAME: price.sourceStr,
      ...price,
    });
  });
  return priceNodes.map((node) => {
    return builder.makeRelationshipCandidate(
      ["HAS_PRICE"],
      {},
      "outbound",
      node
    );
  });
}

function pickDispensary(product) {
  return builder.makeNode(["Dispensary"], { NAME: product.dispensary || 'UNKNOWN' });
}

function productToEnode(product) {
  // log(endNode)
  const newEnode = builder.makeEnhancedNode(
    builder.makeNode(
      ["Product"],
      {
        NAME: product.product,
        FORM: product.form,
      },
      product
    ),
    [
      builder.makeRelationshipCandidate(
        ["FROM_STRAIN"],
        {},
        "outbound",
        pickStrain(product)
      ),
      builder.makeRelationshipCandidate(
        ["FROM_CULTIVAR"],
        {},
        "outbound",
        pickCultivar(product)
      ),
      builder.makeRelationshipCandidate(
        ["MADE_BY"],
        {},
        "outbound",
        createManufacturer(product)
      ),
      builder.makeRelationshipCandidate(
        ["HAS_FORM"],
        {},
        "outbound",
        pickForm(product)
      ),
      builder.makeRelationshipCandidate(
        ["AT_DISPENSARY"],
        {},
        "outbound",
        pickDispensary(product)
      ),
    ]
  );
  // log(newEnode)
  return newEnode;
}



const manufacturers = {
  Bedrocan: ["Bedrobinol", "Bedrocan", "Bedrolite", "Bedica"],
};

/* 
match (p:Price) where size((p)<-[:HAS_PRICE]-(:Product)) > 1 return (p)<-[:HAS_PRICE]-(:Product)-[:MADE_BY]->(:Manufacturer)
*/

/**@TODO I botched Bedrocan Manufacturer, need to create one and delete  */
async function bedrocan() {
  // create Manufacturer
  const bedrocan = builder.makeNode(["Manufacturer"], { NAME: "Bedrocan" });

  // find and delete current Manufacturers with ["Bedrobinol", "Bedrocan", "Bedrolite", "Bedica"] names
  // in this case Bedrocan is both Manufacturer's and their main product's name.
  const products = [
    "Bedrobinol",
    "Bediol",
    /* "Bedrocan", */ "Bedrolite",
    "Bedica",
  ];

  const pnodes /* : PartialNode[] */ = await builder.buildPartialNodes(
    [
      {
        labels: ["Manufacturer"],
        properties: {
          NAME: {
            isCondition: true,
            type: "string",
            key: "NAME",
            value: [
              {
                in: products,
              },
            ],
          },
        },
      },
    ],
    { extract: true }
  );
  const matched /* : EnhancedNode[] */ = await engine.matchPartialNodes(
    pnodes,
    {
      extract: true,
      flatten: true,
    }
  );
  // log(matched);
  await engine.deleteNodes(matched, {
    deletePermanently: true,
  });

  // connect products with manufacturer
  const productPnodes /* : PartialNode[] */ = await builder.buildPartialNodes(
    [
      {
        labels: ["Product"],
        properties: {
          NAME: {
            isCondition: true,
            type: "string",
            key: "PRODUCT",
            value: [
              {
                in: products,
              },
            ],
          },
        },
      },
    ],
    { extract: true }
  );
  const bedrocanManufacturerPnode /* : PartialNode[] */ =
    await builder.buildPartialNodes(
      [
        {
          labels: ["Manufacturer"],
          properties: {
            NAME: {
              key: "NAME",
              value: ["Bedrocan"],
            },
          },
        },
      ],
      { extract: true }
    );

  const productEnodes = await engine.matchPartialNodes(productPnodes, {
    extract: true,
    flatten: true,
  });
  const [bedrocanManufacturerEnode] /* : EnahncedNode */ =
    await engine.matchPartialNodes(bedrocanManufacturerPnode, {
      extract: true,
      flatten: true,
    });

  // add (bedrocanManufacturer)<-[:MADE_BY]-(productEnode)
  const MADE_BY_rcs = productEnodes.map((product) => {
    const rcs /* : RelationshipCandidate */ = builder.makeRelationshipCandidate(
      ["MADE_BY"],
      {},
      "inbound",
      product
    );
    return rcs;
    // const rels = builder.buildRelationships1([rcs], { extract: true });
    // return rels;
  });
  // log(MADE_BY_rcs);
  const bedrocanEnodetoMerge = builder.makeEnhancedNode(
    bedrocanManufacturerEnode,
    MADE_BY_rcs
  );
  // log(bedrocanEnodetoMerge);

  const result = await engine.mergeEnhancedNodes([bedrocanEnodetoMerge]);
  // log(result);
}
// bedrocan();

async function findProduct(name) {
  return await mango.findNode(["Product"], { NAME: name })
}
async function findManufacturer(name) {
  return await mango.findNode(["Manufacturer"], { NAME: name })
}

async function bedrocan2() {
  /* Solving Bedrocan Product vs Manufacturer fail */
  /* make sure Bedrocan:Manufacturer exists */
  const bedrocan/* : Node */ = await mango.buildAndMergeNode(["Manufacturer"], { NAME: "Bedrocan"});

  /* we have a list of Products that Bedrocan makes, we want them to have MADE_BY relationships */
  const products /* : EnhancedNode[] */ = flatten(await Promise.all(["Bedrobinol", "Bediol", "Bedrocan", "Bedrolite", "Bedica"].map(findProduct)))
  
  for await (let product of products) {
    
    let rel = await mango.buildAndMergeRelationship(
      product,
      [["MADE_BY"], "required", { descr: `(Product { NAME: '${product.properties["NAME"]}' })-[:MADE_BY]->(Manufacturer { NAME: 'Bedrocan' })` }],
      bedrocan,
    )
  }
  
  // delete wrong Manufacturers
  const manufacturers /* : EnhancedNode[] */ = flatten(await Promise.all(["Bedrobinol", "Bediol", "Bedrolite", "Bedica"].map(findManufacturer)))

  // await engine.deleteNodes(manufacturers)
  for await (let manufacturer of manufacturers) {
    let rv = await mango.deleteNode(manufacturer)
    log(rv)
  }
}


worker2(getData(dg)).then(() => {
  worker2(getData(ipc)).then(() =>{
    bedrocan2()
  })
})
// worker2(getData(dg))
// worker2(getData(ipc))
// bedrocan2();

function getData(dataset) {
  return dataset
}
function getData1() {
  return [
    {
      product: "420 Natural 18/1",
      form: "Whole Flower",
      strain: "Hybrid",
      cultivar: "GORILLA GLUE",
      thc: "18%-22%",
      cbd: "<1%",
      size: "10g",
      privateprescriptionpricingapprox: "10g pots from £85",
      availableonprojecttwenty21: "Unknown",
      productsize: "",
      monthlyamountcappedat15: "",
      pharmacyt21: "",
      notes: "",
      levelsinstockuk: "High (501 +)",
      atpharmacy: "Coming Soon",
      moreinformationreviews: null,
    },
    {
      product: "Adven Flos 20 | 0",
      form: "Whole Flower",
      strain: "Indica",
      cultivar: "EMT - 2",
      thc: "20%",
      cbd: "1%",
      size: "10g",
      privateprescriptionpricingapprox: "10g pots from £50",
      availableonprojecttwenty21: "No",
      productsize: "",
      monthlyamountcappedat15: "",
      pharmacyt21: "",
      notes: "",
      levelsinstockuk: "",
      atpharmacy: "",
      moreinformationreviews: null,
    },
    {
      product: "Althea THC 18",
      form: "Whole Flower",
      strain: "Indica",
      cultivar: "SKYWALKER KUSH",
      thc: "18%",
      cbd: "1%",
      size: "10g",
      privateprescriptionpricingapprox: "10g pots from £116",
      availableonprojecttwenty21: "No",
      productsize: "",
      monthlyamountcappedat15: "",
      pharmacyt21: "",
      notes: "",
      levelsinstockuk: "Coming Soon",
      atpharmacy: "",
      moreinformationreviews: null,
    },
    {
      product: "Aurora 20/1",
      form: "Whole Flower",
      strain: "Indica",
      cultivar: "PINK KUSH",
      thc: "20%",
      cbd: "1%",
      size: "10g",
      privateprescriptionpricingapprox:
        "5g pots from £70 - 10g pots from £125 - 20g from £240 - 30g from £350",
      availableonprojecttwenty21: "No",
      productsize: "",
      monthlyamountcappedat15: "",
      pharmacyt21: "",
      notes: "",
      levelsinstockuk: "High (501 +)",
      atpharmacy: "Next Day",
      moreinformationreviews: null,
    },
    {
      product: "Aurora 22/1",
      form: "Whole Flower",
      strain: "Sativa",
      cultivar: "DELAHAZE",
      thc: "22%",
      cbd: "1%",
      size: "10g",
      privateprescriptionpricingapprox:
        "5g pots from £70 - 10g pots from £125 - 20g from £240 - 30g from £350",
      availableonprojecttwenty21: "No",
      productsize: "",
      monthlyamountcappedat15: "",
      pharmacyt21: "",
      notes: "Stock due 25.1.22",
      levelsinstockuk: "Coming Soon",
      atpharmacy: "No",
      moreinformationreviews: null,
    },
    {
      product: "Bedica",
      form: "Grantulated Flower",
      strain: "Indica",
      cultivar: "TALEA",
      thc: "14%",
      cbd: "1%",
      size: "5g",
      privateprescriptionpricingapprox: "5g from £60.20",
      availableonprojecttwenty21: "No",
      productsize: "",
      monthlyamountcappedat15: "",
      pharmacyt21: "",
      notes: "",
      levelsinstockuk: "Out Of Stock",
      atpharmacy: "No",
      moreinformationreviews: null,
    },
    {
      product: "Bediol",
      form: "Granulated Flower",
      strain: "Sativa",
      cultivar: "ELIDA",
      thc: "6%",
      cbd: "8%",
      size: "5g",
      privateprescriptionpricingapprox: "5g from £60.20",
      availableonprojecttwenty21: "No",
      productsize: "",
      monthlyamountcappedat15: "",
      pharmacyt21: "",
      notes: "",
      levelsinstockuk: "Not Available",
      atpharmacy: "No",
      moreinformationreviews: null,
    },
    {
      product: "Bedrobinol",
      form: "Whole Flower",
      strain: "Sativa",
      cultivar: "LUDINA",
      thc: "13%",
      cbd: "1%",
      size: "5g",
      privateprescriptionpricingapprox: "5g from £60.20",
      availableonprojecttwenty21: "No",
      productsize: "",
      monthlyamountcappedat15: "",
      pharmacyt21: "",
      notes: "",
      levelsinstockuk: "Low (100 or less)",
      atpharmacy: "Yes",
      moreinformationreviews: null,
    },
    {
      product: "Bedrocan",
      form: "Whole Flower",
      strain: "Sativa",
      cultivar: "AFINA / JACK HERER",
      thc: "22%",
      cbd: "1%",
      size: "5g",
      privateprescriptionpricingapprox: "5g from £60.20",
      availableonprojecttwenty21: "No",
      productsize: "",
      monthlyamountcappedat15: "",
      pharmacyt21: "",
      notes: "",
      levelsinstockuk: "Out Of Stock",
      atpharmacy: "No",
      moreinformationreviews: null,
    },
    {
      product: "Bedrolite",
      form: "Granulated Flower",
      strain: "Sativa",
      cultivar: "RENSINA",
      thc: "1%",
      cbd: "9%",
      size: "5g",
      privateprescriptionpricingapprox: "5g from £60.20",
      availableonprojecttwenty21: "No",
      productsize: "",
      monthlyamountcappedat15: "",
      pharmacyt21: "",
      notes: "",
      levelsinstockuk: "Out Of Stock",
      atpharmacy: "No",
      moreinformationreviews: null,
    },
    {
      product: "Cellen Satoline Flos",
      form: "Whole Flower",
      strain: "Sativa",
      cultivar: "WHITE WIDOW",
      thc: "18%",
      cbd: "1%",
      size: "10g",
      privateprescriptionpricingapprox:
        "10g from £65 (£120 for 20g/£150 for 30g)",
      availableonprojecttwenty21: "Yes",
      productsize: "30g packet",
      monthlyamountcappedat15: "upto 30g",
      pharmacyt21: "CBPM Access & Dispensary Green",
      notes: "",
      levelsinstockuk: "Medium (101-500)",
      atpharmacy: "Yes",
      moreinformationreviews: null,
    },
    {
      product: "Khiron 1/14",
      form: "Whole Flower",
      strain: "Hybrid",
      cultivar: "God Bud",
      thc: "1%",
      cbd: "14%",
      size: "10g",
      privateprescriptionpricingapprox: "10g from £85",
      availableonprojecttwenty21: "Yes",
      productsize: "10g Jar",
      monthlyamountcappedat15: "upto 30g",
      pharmacyt21: "CBPM Access & Dispensary Green",
      notes: "",
      levelsinstockuk: "Next Day",
      atpharmacy: "No",
      moreinformationreviews: null,
    },
  ];
}

function updateManufacturers() {
  /* Take existing KG and update Manufacturers with this info */
  /* Assume that all manufacturers already have proper _hash, => new props must be optional? */
  /* or if we consider new props REQUIRED, then we need to recalculate hashes */
  /* we don't really need any more REQUIRED props as long as each Manufacturer is already unique by NAME */
  
  const legalPersons = [
    { NAME: 'Aurora', _label: ['Manufacturer', 'LegalPerson'], links: ['https://www.auroramedicine.com'], aliases: ['Aurora Deutschland'], associatedEntities: ['Pedanios'] },
    { NAME: 'Cellen', _label: ['Manufacturer', 'LegalPerson'], links: ['https://www.cellenhealth.com/'], aliases: ['Aurora Deutschland'], associatedEntities: ['Cellen Therapeutics', "Leva Clinic"], addresses: ['Cannon Place, 78 Cannon Street, London, United Kingdom, EC4N 6AF'] },
    { NAME: 'Leva Clinic', _label: ['Dispensary', 'Clinic', 'LegalPerson'], links: ['https://www.levaclinic.com/'], aliases: ['Leva'], associatedEntities: ['Cellen'] },

    { NAME: 'Khiron', _label: ['Manufacturer', 'LegalPerson'], links: ['https://khironmed.co.uk/', 'https://khiron.ca/en/'], aliases: ['Khiron Life Sciences Corp'], addresses: ['Bogotá, Colombia,Carrera 11 # 84 - 09, (+57) 1 7442064, info@khiron.ca'] },

    { NAME: 'MedCan', _label: ['Manufacturer', 'LegalPerson'], links: ['https://www.medcan.co.za/'], aliases: [], addresses: ['South Africa'] },

    { NAME: 'Bedrocan', _label: ['Manufacturer', 'LegalPerson'], links: ['https://bedrocan.com/'], aliases: [], addresses: ['Bedrocan International, De Zwaaikom 4, 9641 KV Veendam, Netherlands,t: +31 598 62 37 31'] },

    { NAME: 'Spectrum', _label: ['Manufacturer', 'LegalPerson'], links: ['https://www.spectrumtherapeutics.com/'], aliases: ['Spectrum Therapeutics'], addresses: [] },


    { NAME: 'Rokshaw Laboratories', _label: ['SpecialsManufacturer', 'Supplier', 'LegalPerson'], activities: ['manufactures unlicenced specials', "supplies pharmacies in UK", 'supplies NHS'], links:['https://rokshaw.co.uk/'] },
    { NAME: 'Curaleaf', _label: ['Producer', 'Distributor', 'Manufacturer', 'Group', 'LegalPerson'], activities: ['production, development, and distribution in Europe', 'owns Rokshaw Laboratories and CBPMAccess'], links: ['https://curaleaf.com/','https://curaleafinternational.com/our-international-companies/'], aliases: ['Curaleaf Holdings, Inc.', 'Curaleaf International'], associatedEntities: ['Adven'], },

    { NAME: 'CBPMAccess', _label: ['Pharmacy', 'LegalPerson'], activities: ['manufactures specials', 'dispensing'], links: ['https://www.cbpmaccess.co.uk/'], },

    { NAME: 'Tilray', _label: ['Manufacturer', 'LegalPerson'], links: ['https://www.tilray.com/', 'https://en.wikipedia.org/wiki/Tilray', 'https://www.nasdaq.com/market-activity/stocks/tlry', 'https://money.tmx.com/en/quote/TLRY'] },

    { NAME: 'Columbia Care', _label: ['Manufacturer', 'LegalPerson'], links: ['https://col-care.com/'], aliases: ['ColCare'] },

    { NAME: 'Althea', _label: ['Manufacturer', 'LegalPerson', 'ProductBrand'], links: ['https://althea.life/'] },

    { NAME: 'Columbia Care', _label: ['Manufacturer', 'LegalPerson'], links: ['https://col-care.com/'], aliases: ['ColCare'] },
    { NAME: 'LGP', _label: ['Manufacturer', 'LegalPerson'], links: ['https://www.littlegreenpharma.com/'], aliases: ['Little Green Pharma'] },
    { NAME: 'Bod Pharma', _label: ['Manufacturer', 'LegalPerson'], links: ['https://bodaustralia.com/', 'https://www.marketindex.com.au/asx/bda'], aliases: ['BOD', 'Bod Australia Ltd'], countries: ['Australia'] },
    { NAME: 'BOL Pharma', _label: ['Manufacturer', 'LegalPerson'], links: ['https://www.bolpharma.com/'], aliases: ['Breath Of Life'], countries: ['Israel'] },
    { NAME: 'Cann Group', _label: ['Manufacturer', 'LegalPerson'], activities: ['R&D', 'production', 'exports'], links: ['https://www.canngrouplimited.com/'], aliases: ['Cann Group Limited'], countries: ['Australia'] },
  ]
}

const news = [
  { link: 'https://ir.curaleaf.com/2021-04-07-Curaleaf-Completes-Acquisition-of-EMMAC-and-Secures-US-130-Million-Investment-from-a-Single-Strategic-Institutional-Investor', summary: 'Curaleaf Holdings, Inc. acquired EMMAC which produces Adven', datePosted: [2021, 4, 7] },
  { link: 'https://lyphegroup.com/northern-green-canada-partnership/', summary: 'LYPHE Group imports Northern Green Canada into the U.K. market as supply to the medical cannabis brand, NOIDECS.', datePosted: [2022, 2, 15] },
]
