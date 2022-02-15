// const { Engine, Builder, log, isFailure, Mango, search } = require("mango");
const {
  Engine,
  Builder,
  log,
  isFailure,
  Mango,
  search,
} = require("../mango/lib/index.js");
const { has, flatten } = require("lodash");
const { parsePrice } = require("./parsers.js");

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
  const [name, ...rest] = product["product"].split(" ");
  return builder.makeNode(["Manufacturer"], { NAME: name });
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
  return builder.makeNode(["Dispensary"], { NAME: product.dispensary });
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
  return await mango.findNode(["Product"], { NAME: name });
}
async function findProduct1(props) {
  return await mango.findNode(["Product"], props);
}
async function findManufacturer(name) {
  return await mango.findNode(["Manufacturer"], { NAME: name });
}
async function findManufacturer1(props) {
  return await mango.findNode(["Manufacturer"], { NAME: name });
}

async function bedrocan2() {
  /* Solving Bedrocan Product vs Manufacturer fail */
  /* make sure Bedrocan:Manufacturer exists */
  const bedrocan /* : Node */ = await mango.buildAndMergeNode(
    ["Manufacturer"],
    { NAME: "Bedrocan" }
  );

  /* we have a list of Products that Bedrocan makes, we want them to have MADE_BY relationships */

  async function findNodes(names, fn) {
    return flatten(await Promise.all(names.map(fn)));
  }

  // const products = await findNodes(
  //   ["Bedrobinol", "Bediol", "Bedrocan", "Bedrolite", "Bedica"],
  //   findProduct
  // );

  // log(products);

  // const products = await findNodes(
  //   [{ /* NAME: "Bediol", */ FORM: "Granulated Flower" }],
  //   findProduct1
  // );
  const products = await findNodes(
    [
      {
        // NAME: search("~", "Bed"),
        NAME: search("~", ["lite", "can", "Flos"]), // match (p:Product) where p.NAME CONTAINS 'lite' OR p.NAME CONTAINS 'can' return p
        // NAME: search("contains", ["lite", "can", "Flos"]), // match (p:Product) where p.NAME CONTAINS 'lite' OR p.NAME CONTAINS 'can' return p
        // FORM: "Granulated Flower",
      },
    ],
    findProduct1
  );

  // log(products);

  // for await (let product of products) {
  //   let rel = await mango.buildAndMergeRelationship(
  //     product,
  //     [
  //       ["MADE_BY"],
  //       "required",
  //       {
  //         descr: `(Product { NAME: '${product.properties["NAME"]}' })-[:MADE_BY]->(Manufacturer { NAME: 'Bedrocan' })`,
  //       },
  //     ],
  //     bedrocan
  //   );
  // }

  // // delete wrong Manufacturers
  // const manufacturers /* : EnhancedNode[] */ = flatten(
  //   await Promise.all(
  //     ["Bedrobinol", "Bediol", "Bedrolite", "Bedica"].map(findManufacturer)
  //   )
  // );

  // await engine.deleteNodes(manufacturers);
}
// worker2(getData()).then(log);
bedrocan2();
/**
 * I need a simple tool to take any POJO and turn it into a EnhancedNode.
 */
const item = {
  was: {
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
  },
  now: {
    product: "Noidecs T10:C15 Cannabis Oil",
    // product: extendOut(['Product'], { NAME: "Noidecs T10:C15 Cannabis Oil" }),

    form: "Full Spectrum Oil",
    // form: OutboundRelationship(['HAS_FORM'], { labels: ['Product'], NAME: "Full Spectrum Oil" }),

    /* déjà vu 👾  */
    // form: OutboundRelationship({
    //   type: ['HAS_FORM'],
    //   // props: {},
    //   endNode: { labels: ['Product'], NAME: "Full Spectrum Oil" }
    // }),

    form: {
      rel: [
        ["HAS_FORM"], // type
        "outbound", // direction
        {}, // props
      ],
      endNode: [
        ["Product"], // labels
        { NAME: "Full Spectrum Oil" }, // required props
        {}, // optional props
      ],
    },

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
  },
};

function getData() {
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
