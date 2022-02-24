function parsePrice(str) /*: Object[] */ {
  if (typeof str !== "string") {
    throw new Error("parsePrice: the first argument must be a string.");
  }

  // test how many prices are there in the string

  // "£88 for 5g\r£176 for 20g\r£212 for 30g"
  let ret = /\r/;
  if (str.match(ret) !== null) {
    // log("ret matched");
    return str.split(ret).map(formatPrice);
  }

  // "5g pots from £70 - 10g pots from £125 - 20g from £240 - 30g from £350"
  let dashes = /\s-\s/;
  if (str.match(dashes) !== null) {
    // log("dashes matched");
    return str.split(dashes).map(formatPrice);
  }

  // "£75 for 10g£150 for 20g£225 for 30g"
  if (str.match(/\w£\b/g) !== null) {
    const result = str
      .split(/£\b/)
      .filter((x) => x)
      .map((str) => "£" + str);
    return result.map(formatPrice);
  }

  return [str].map(formatPrice);
}

function formatPrice(str) /*: Object */ {
  const currencies = {
    "£": "GBP",
    $: "USD",
  };

  // CASE 1
  // 50ml bottle from £175 | 10g pots from £125 | 10g from £85
  /* 
  [
      '50ml bottle from £175',
      '50ml',
      '50',
      'ml',
      'bottle ',
      '£',
      '175',
      index: 0,
      input: '50ml bottle from £175',
      groups: undefined
    ]
    [
      0 '10g from £85',
      1 '10g', // productTotalAmount
      2 '10',  // productQuantity
      3 'g',   // productMeasurementUnit
      4 undefined,
      5 '£',  // currencySymbol
      6 '85', // totalPrice
      index: 0,
      input: '10g from £85',
      groups: undefined
    ]
    [
      '10g pots from £125',
      '10g',
      '10',
      'g',
      'pots ',
      '£',
      '125',
      index: 0,
      input: '10g pots from £125',
      groups: undefined
    ]
  */
  let matchedCase1 = str.match(
    /(([0-9]*)(g|mg|ml))\s+(bottle\s+|pots\s+)?from\s+([£$])([0-9]*(.[0-9]*)?)/
  );
  // log(matchedCase1);
  /* check if we can extract price as a Number */
  if (matchedCase1 != null && !isNaN(matchedCase1[6])) {
    // log("matchedCase1");
    return {
      sourceStr: str,
      totalPrice: Number(matchedCase1[6]) || null,
      currency: currencies[matchedCase1[5]] || null,
      currencySymbol: matchedCase1[5] || null,
      productTotalAmount: matchedCase1[1] || null,
      productQuantity: !isNaN(matchedCase1[2]) ? Number(matchedCase1[2]) : null,
      productMeasurementUnit: matchedCase1[3],
      productPackaging:
        typeof matchedCase1[4] == "string" ? matchedCase1[4].trim() : null,
    };
  }

  // CASE 2
  // £88 for 5g
  let matchedCase2 = str.match(/(£)([0-9]*(.[0-9]*)?) for (([0-9]*)(g|mg))/);
  // let matchedCase2 = str.match(/(£)([0-9]*) for (([0-9]*)(g|mg))/);
  /* 
    [
      0 '£88 for 5g',
      1 '£',
      2 '88',
      3 undefined,
      4 '5g',
      5 '5',
      6 'g',
      7 index: 0,
      input: '£88 for 5g',
      groups: undefined
    ]
    [
      0 '£88.99 for 5g',
      1 '£',
      2 '88.99',
      3 '.99',
      4 '5g',
      5 '5',
      6 'g',
      index: 0,
      input: '£88.99 for 5g',
      groups: undefined
    ]
  */
  // log(matchedCase2);
  if (matchedCase2 != null && !isNaN(matchedCase2[2])) {
    // log("matchedCase2");
    return {
      sourceStr: str,
      totalPrice: Number(matchedCase2[2]) || null,
      currency: currencies[matchedCase2[1]] || null,
      currencySymbol: matchedCase2[1] || null,
      productTotalAmount: matchedCase2[4] || null,
      productQuantity: !isNaN(matchedCase2[5]) ? Number(matchedCase2[5]) : null,
      productMeasurementUnit: matchedCase2[6] || null,
      productPackaging: null,
    };
  }

  // CASE 3
  // 60 capsules from £169 | 60 capsules from £169.99
  let matchedCase3 = str.match(
    /([0-9]*) (capsules) from ([£$])([0-9]*(.[0-9]*)?)/
  );
  /* 
    [
        0 '60 capsules from £169',
        1 '60',
        2 'capsules',
        3 '£',
        4 '169',
        index: 0,
        input: '60 capsules from £169',
        groups: undefined
      ]
  */
  // log(matchedCase3);
  if (matchedCase3 != null && !isNaN(matchedCase3[4])) {
    // log("matchedCase3");
    return {
      sourceStr: str,
      totalPrice: Number(matchedCase3[4]) || null,
      currencySymbol: matchedCase3[3] || null,
      currency: currencies[matchedCase3[3]] || null,
      productTotalAmount: matchedCase3[1] || null,
      productQuantity: !isNaN(matchedCase3[1]) ? Number(matchedCase3[1]) : null,
      productMeasurementUnit: null,
      productPackaging: matchedCase3[2],
    };
  }

  // CASE 4
  // £199 | £199.99
  let matchedCase4 = str.match(/([£$])([0-9]*(.[0-9]*)?)/);
  // log(matchedCase4);
  /* [ 
    0 '£199', 
    1 '£', 
    2 '199', 
    index: 0, input: '£199', groups: undefined ] */
  if (matchedCase4 != null && !isNaN(matchedCase4[2])) {
    // log("matchedCase4");
    return {
      sourceStr: str,
      totalPrice: Number(matchedCase4[2]) || null,
      currencySymbol: matchedCase4[1] || null,
      currency: currencies[matchedCase4[1]] || null,
      productTotalAmount: null,
      productQuantity: null,
      productMeasurementUnit: null,
      productPackaging: null,
    };
  }

  return {
    sourceStr: str,
    totalPrice: null,
    currency: null,
    currencySymbol: null,
    productTotalAmount: null,
    productQuantity: null,
    productMeasurementUnit: null,
    productPackaging: null,
  };
}

/**
 * entity resolution module
 * @param {*} name
 * @param {*} kb
 * @returns
 */
function processName(name, kb) /* : String[] | Array<null> */ {
  const rv = kb.map(({ preferredName, aliases }) => {
    const matches = [];
    aliases.forEach((alias) => {
      const pattern = new RegExp(name, "i");
      if (pattern.test(alias)) {
        matches.push(true);
      } else {
        matches.push(false);
      }
    });
    return matches.includes(true) ? preferredName : null;
  });
  const result = rv.filter((x) => x);
  if (result.length == 0) {
    return [name];
  } else {
    return result;
  }
}

/**
 * Parses Active Pharmaceutical Ingredients: THC and CBD contents.
 * @param {Object} product - Product POJO from https://thecannabispages.co.uk/cbmps-stock-checker/
 * @returns {{ thc: [string, number], cbd: [string, number]}} - api: [parsedValue:string, percentageValue:number]
 * @example
 *
 * // ignores <1%
 * const rv = parseAPI({
 *  thc: "20%",
 *  cbd: "<1%",
 * });
 * console.log(rv); // { thc: ["20%", .2], cbd: ["<1%", .01]}
 *
 * // takes average of two
 * const rv2 = parseAPI({
 *  thc: "18%-22%",
 *  cbd: "<1%",
 * });
 * console.log(rv2); // { thc: ["18%-22%", .2], cbd: ["<1%", .01]}
 *
 */
function parseAPI({ thc, cbd }) {
  let thcMatch, cbdMatch, thcMatchPrc, cbdMatchPrc;
  if (/-/.test(thc)) {
    // 18%-22%
    // take average
    thcMatch = thc.match(/(<?([0-9]*)(%))-(<?([0-9]*)(%))/);
    let [a, b] = [thcMatch[2], thcMatch[5]];

    // [
    //   '<18%-22%',
    //   '<18%',
    //   '18',
    //   '%',
    //   '22%',
    //   '22',
    //   '%',
    //   index: 0,
    //   input: '<18%-22%',
    //   groups: undefined
    // ]
    if (isNaN(a) || isNaN(b)) {
      throw new Error(`parseAPI: value is NaN.\nrv: ${JSON.stringify(rv)}`);
    } else {
      thcMatchPrc = (Number(a) + Number(b)) / 200; // == (/ 2 / 100);
    }
  } else {
    thcMatch = thc.match(/<?([0-9]*)(%)/);
    if (isNaN(thcMatch[1])) {
      throw new Error(
        `parseAPI: thc value is NaN.\nthcMatch: ${JSON.stringify(thcMatch)}`
      );
    } else {
      thcMatchPrc = Number(thcMatch[1]) / 100;
    }
  }

  if (/-/.test(cbd)) {
    // 18%-22%
    // take average
    cbdMatch = cbd.match(/(<?([0-9]*)(%))-(<?([0-9]*)(%))/);
    let [a, b] = [cbdMatch[2], cbdMatch[5]];

    // [
    //   '<18%-22%',
    //   '<18%',
    //   '18',
    //   '%',
    //   '22%',
    //   '22',
    //   '%',
    //   index: 0,
    //   input: '<18%-22%',
    //   groups: undefined
    // ]
    if (isNaN(a) || isNaN(b)) {
      throw new Error(`parseAPI: value is NaN.\nrv: ${JSON.stringify(rv)}`);
    } else {
      cbdMatchPrc = (Number(a) + Number(b)) / 2;
    }
  } else {
    cbdMatch = cbd.match(/<?([0-9]*)(%)/);
    if (isNaN(cbdMatch[1])) {
      throw new Error(
        `parseAPI: cbd value is NaN.\ncbdMatch: ${JSON.stringify(cbdMatch)}`
      );
    } else {
      cbdMatchPrc = Number(cbdMatch[1]) / 100;
    }
  }
  const rv = {
    thc: [thcMatch[0], thcMatchPrc],
    cbd: [cbdMatch[0], cbdMatchPrc],
  };
  return rv;
}

// export default { parsePrice, formatPrice };
module.exports = { parsePrice, formatPrice, processName, parseAPI };
// module.exports = parsePrice;
