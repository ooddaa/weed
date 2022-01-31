import { Engine, Builder, log, isFailure } from 'mango';
import fetch from 'node-fetch'; // https://www.npmjs.com/package/node-fetch
import _ from 'lodash';

const { has } = _

/* Instantiate Engine */
const engine = new Engine({ 
    neo4jUsername: 'neo4j', 
    neo4jPassword: 'pass', 
    ip: "0.0.0.0", 
    port: "7687",
    database: "neo4j"
});

/* Start Neo4j Driver */
engine.startDriver();

/* Check connection to Neo4j */
engine.verifyConnectivity({ database: "neo4j" }).then(log);

const builder = new Builder();

async function addProduct(product) {
    const node = builder.makeNode(['Product', 'Oil'], product)
    const result = await engine.mergeNodes([node])
    return result
}

async function getDg() {
  const dg = await fetch("https://thecannabispages.co.uk/wp-admin/admin-ajax.php?action=wp_ajax_ninja_tables_public_action&table_id=4459&target_action=get-all-data&default_sorting=old_first&ninja_table_public_nonce=4f5bced4c3", {
    "headers": {
      "accept": "*/*",
      "accept-language": "en-GB,en-US;q=0.9,en;q=0.8,ru;q=0.7",
      "sec-ch-ua": "\" Not;A Brand\";v=\"99\", \"Google Chrome\";v=\"97\", \"Chromium\";v=\"97\"",
      "sec-ch-ua-mobile": "?0",
      "sec-ch-ua-platform": "\"Windows\"",
      "sec-fetch-dest": "empty",
      "sec-fetch-mode": "cors",
      "sec-fetch-site": "same-origin",
      "sec-gpc": "1",
      "x-requested-with": "XMLHttpRequest",
      "cookie": "cookielawinfo-checkbox-necessary=yes; _tccl_visitor=265cf2db-1459-4528-b569-0bc951771ab3; cookielawinfo-checkbox-functional=yes; cookielawinfo-checkbox-performance=yes; cookielawinfo-checkbox-analytics=yes; cookielawinfo-checkbox-advertisement=yes; cookielawinfo-checkbox-others=yes; CookieLawInfoConsent=eyJuZWNlc3NhcnkiOnRydWUsImZ1bmN0aW9uYWwiOnRydWUsInBlcmZvcm1hbmNlIjp0cnVlLCJhbmFseXRpY3MiOnRydWUsImFkdmVydGlzZW1lbnQiOnRydWUsIm90aGVycyI6dHJ1ZX0=; viewed_cookie_policy=yes; _tccl_visit=265d0a3f-8980-465c-9648-0d9a380960e5",
      "Referer": "https://thecannabispages.co.uk/cbmps-stock-checker/",
      "Referrer-Policy": "strict-origin-when-cross-origin"
    },
    "body": null,
    "method": "GET"
  })
  const data = await dg.json();
  return data
}
async function worker(data) {
    const nodes = data.map(product => {
      // log(product)
      const newNode = {
        PRODUCT: product.product,
        FORM: product.form,
        ...product
      }
      const node = builder.makeNode(['Product'], {
        PRODUCT: product.product,
        FORM: product.form,
      }, product)
      return node
    })
    // log(nodes.length)
    const result = await engine.mergeNodes(nodes)
    // log(result)
    return result
}

// getDg().then(worker)

/**
 * Merge Enodes
 * @param {*} data 
 */
async function worker2(data) {
  const enodes = data.map(productToEnode)
  const result = await engine.mergeEnhancedNodes(enodes)
  return result
}
getDg().then(worker2)

function pickStrain(strain) /* : Node */ {
  switch(strain) {
    case 'Sativa': return builder.makeNode(['Strain'], { NAME: 'Sativa' });
    case 'Indica': return builder.makeNode(['Strain'], { NAME: 'Indica' });
    case 'Hybrid': return builder.makeNode(['Strain'], { NAME: 'Hybrid' });
    default: return builder.makeNode(['Strain'], { NAME: 'Unknown' })
  }
}

function pickCultivar(cultivar) /* : Node */ {
  const node = builder.makeNode(['Cultivar'], { NAME: cultivar });
  return node;
}

function pickManufacturer(productName) /* : Node */ {
  // parse 'Khiron THC Rich'
  const [name, ...rest] = productName.split(" ");
  return builder.makeNode(['Manufacturer'], { NAME: name });
}

function pickForm(form) {
  return builder.makeNode(['Form'], { NAME: form });
}

function productToEnode(product) {
  // log(endNode)
  const newEnode = builder.makeEnhancedNode(
    builder.makeNode(['Product'], {
      PRODUCT: product.product,
      FORM: product.form,
    }, product),
    [
      builder.makeRelationshipCandidate(
        ['FROM_STRAIN'],
        { },
        'outbound',
        pickStrain(product.strain),
      ),
      builder.makeRelationshipCandidate(
        ['FROM_CULTIVAR'],
        { },
        'outbound',
        pickCultivar(product.cultivar),
      ),
      builder.makeRelationshipCandidate(
        ['MADE_BY'],
        { },
        'outbound',
        pickManufacturer(product.product),
      ),
      builder.makeRelationshipCandidate(
        ['HAS_FORM'],
        { },
        'outbound',
        pickForm(product.form),
      ),
    ]
  )
  // log(newEnode)
  return newEnode
}

const item = {
  product: 'Noidecs T10:C15 Cannabis Oil',
  form: 'Full Spectrum Oil',
  strain: 'Sativa',
  cultivar: 'N/A',
  thc: '10 mg/ml',
  cbd: '15 mg/ml',
  size: '50ml',
  privateprescriptionpricingapprox: '50ml bottle from £175',       
  availableonprojecttwenty21: 'Yes',
  productsize: '50ml bottle',
  monthlyamountcappedat15: 'upto 50ml',
  pharmacyt21: 'Dispensary Green',
  notes: '',
  levelsinstockuk: 'Out Of Stock',
  atpharmacy: 'No',
  moreinformationreviews: null
}

// productToEnode(item)
// match p=((sat:Sativa)<-[:FROM_STRAIN]-()) return size(collect(p))
/* {
              product: 'Khiron THC Rich',
              form: 'Whole Flower',
              strain: 'Sativa',
              cultivar: 'Unknown',
              thc: '14%',
              cbd: '1%',
              size: '10g',
              privateprescriptionpricingapprox: '10g from £85',       
              availableonprojecttwenty21: 'Yes',
              productsize: '30g packet',
              monthlyamountcappedat15: 'upto 30g',
              pharmacyt21: 'CBPM Access',
              notes: '',
              levelsinstockuk: 'Not Available',
              atpharmacy: 'Not Available',
              moreinformationreviews: null, */