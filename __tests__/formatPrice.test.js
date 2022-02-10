const util = require("util");

const log = (...items) =>
  items.forEach((item) =>
    console.log(util.inspect(item, { depth: null, colors: true }))
  );

const currencies = {
  "£": "GBP",
  $: "USD",
};

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

describe("should find delimiters", () => {
  test("/r", () => {
    const input = "£88 for 5g\r£176 for 20g\r£212 for 30g";
    expect(input.match(/\r/g)).toEqual(["\r", "\r"]);
    expect(input.match(/\s-\s/g)).toEqual(null);
  });

  test(" - ", () => {
    const input =
      "5g pots from £70 - 10g pots from £125 - 20g from £240 - 30g from £350";
    expect(input.match(/\s-\s/g)).toEqual([" - ", " - ", " - "]);
  });

  test("10g£150", () => {
    const input = "£75 for 10g£150 for 20g£225 for 30g";
    const input2 =
      "5g pots from £70 - 10g pots from £125 - 20g from £240 - 30g from £350";
    const pattern = /\w£\b/g;

    expect(input.match(pattern)).toEqual(["g£", "g£"]);
    expect(input2.match(pattern)).toEqual(null);
  });

  test("clean £", () => {
    const input = "£75 for 10g£150 for 20g£225 for 30g";
    const result = input
      .split(/£\b/)
      .filter((x) => x)
      .map((str) => "£" + str);

    expect(result).toEqual(["£75 for 10g", "£150 for 20g", "£225 for 30g"]);
  });
});

describe("should extract price per quantity", () => {
  test("nothing", () => {
    const input = "";
    const result = parsePrice(input);

    expect(result).toBeInstanceOf(Array);
    expect(result[0]).toMatchObject({
      sourceStr: input,
      totalPrice: null,
      currency: null,
      currencySymbol: null,
      productTotalAmount: null,
      productMeasurementUnit: null,
      productQuantity: null,
      productPackaging: null,
    });
  });

  test("£199", () => {
    const input = "£199";
    const result = parsePrice(input);

    expect(result).toBeInstanceOf(Array);
    expect(result[0]).toMatchObject({
      sourceStr: input,
      totalPrice: 199,
      currency: "GBP",
      currencySymbol: "£",
      productTotalAmount: null,
      productQuantity: null,
      productMeasurementUnit: null,
      productPackaging: null,
    });
  });

  test("£199.99", () => {
    const input = "£199.99";
    const result = parsePrice(input);

    expect(result).toBeInstanceOf(Array);
    expect(result[0]).toMatchObject({
      sourceStr: input,
      totalPrice: 199.99,
      currency: "GBP",
      currencySymbol: "£",
      productTotalAmount: null,
      productQuantity: null,
      productMeasurementUnit: null,
      productPackaging: null,
    });
  });

  test("50ml bottle from £175", () => {
    const input = "50ml bottle from £175";
    const result = parsePrice(input);

    expect(result).toBeInstanceOf(Array);
    expect(result[0]).toMatchObject({
      sourceStr: input,
      totalPrice: 175,
      currency: "GBP",
      currencySymbol: "£",
      productTotalAmount: "50ml",
      productQuantity: 50,
      productMeasurementUnit: "ml",
      productPackaging: "bottle",
    });
  });

  test("40ml from £162.50", () => {
    const input = "40ml from £162.50";
    const result = parsePrice(input);

    expect(result).toBeInstanceOf(Array);
    expect(result[0]).toMatchObject({
      sourceStr: input,
      totalPrice: 162.5,
      currency: "GBP",
      currencySymbol: "£",
      productTotalAmount: "40ml",
      productQuantity: 40,
      productMeasurementUnit: "ml",
      productPackaging: null,
    });
  });

  test("10g from £85", () => {
    const input = "10g from £85";
    const result = parsePrice(input);

    expect(result).toBeInstanceOf(Array);
    expect(result[0]).toMatchObject({
      sourceStr: input,
      totalPrice: 85,
      currency: "GBP",
      currencySymbol: "£",
      productTotalAmount: "10g",
      productQuantity: 10,
      productMeasurementUnit: "g",
      productPackaging: null,
    });
  });

  test("10g from £85.50", () => {
    const input = "10g from £85.99";
    const result = parsePrice(input);

    expect(result).toBeInstanceOf(Array);
    expect(result[0]).toMatchObject({
      sourceStr: input,
      totalPrice: 85.99,
      currency: "GBP",
      currencySymbol: "£",
      productTotalAmount: "10g",
      productQuantity: 10,
      productMeasurementUnit: "g",
      productPackaging: null,
    });
  });

  test("£88 for 5g", () => {
    const input = "£88 for 5g";
    const result = parsePrice(input);

    expect(result).toBeInstanceOf(Array);
    expect(result[0]).toMatchObject({
      sourceStr: "£88 for 5g",
      totalPrice: 88,
      currency: "GBP",
      currencySymbol: "£",
      productTotalAmount: "5g",
      productQuantity: 5,
      productMeasurementUnit: "g",
      productPackaging: null,
    });
  });

  test("£88.99 for 5g", () => {
    const input = "£88.99 for 5g";
    const result = parsePrice(input);

    expect(result).toBeInstanceOf(Array);
    expect(result[0]).toMatchObject({
      sourceStr: "£88.99 for 5g",
      totalPrice: 88.99,
      currency: "GBP",
      currencySymbol: "£",
      productTotalAmount: "5g",
      productQuantity: 5,
      productMeasurementUnit: "g",
      productPackaging: null,
    });
  });

  test("£75 for 10g£150 for 20g£225 for 30g", () => {
    // privateprescriptionpricingapprox: "£88 for 5g",
    const input = "£75 for 10g£150 for 20g£225 for 30g";
    const result = parsePrice(input);

    expect(result).toBeInstanceOf(Array);
    expect(result).toHaveLength(3);
    expect(result[0]).toMatchObject({
      sourceStr: "£75 for 10g",
      totalPrice: 75,
      currency: "GBP",
      currencySymbol: "£",
      productTotalAmount: "10g",
      productQuantity: 10,
      productMeasurementUnit: "g",
      productPackaging: null,
    });
    expect(result[1]).toMatchObject({
      sourceStr: "£150 for 20g",
      totalPrice: 150,
      currency: "GBP",
      currencySymbol: "£",
      productTotalAmount: "20g",
      productQuantity: 20,
      productMeasurementUnit: "g",
      productPackaging: null,
    });
    expect(result[2]).toMatchObject({
      sourceStr: "£225 for 30g",
      totalPrice: 225,
      currency: "GBP",
      currencySymbol: "£",
      productTotalAmount: "30g",
      productQuantity: 30,
      productMeasurementUnit: "g",
      productPackaging: null,
    });
  });

  test("£88 for 5g £176 for 20g £212 for 30g", () => {
    // privateprescriptionpricingapprox: "£88 for 5g\r£176 for 20g\r£212 for 30g",
    const input = "£88 for 5g\r£176 for 20g\r£212 for 30g";
    const result = parsePrice(input);

    expect(result).toBeInstanceOf(Array);
    expect(result).toHaveLength(3);
    expect(result[0]).toMatchObject({
      sourceStr: "£88 for 5g",
      totalPrice: 88,
      currency: "GBP",
      currencySymbol: "£",
      productTotalAmount: "5g",
      productQuantity: 5,
      productMeasurementUnit: "g",
      productPackaging: null,
    });
    expect(result[1]).toMatchObject({
      sourceStr: "£176 for 20g",
      totalPrice: 176,
      currency: "GBP",
      currencySymbol: "£",
      productTotalAmount: "20g",
      productQuantity: 20,
      productMeasurementUnit: "g",
      productPackaging: null,
    });
    expect(result[2]).toMatchObject({
      sourceStr: "£212 for 30g",
      totalPrice: 212,
      currency: "GBP",
      currencySymbol: "£",
      productTotalAmount: "30g",
      productQuantity: 30,
      productMeasurementUnit: "g",
      productPackaging: null,
    });
  });

  test("5g pots from £70 - 10g pots from £125 - 20g from £240 - 30g from £350", () => {
    const input =
      "5g pots from £70 - 10g pots from £125 - 20g from £240 - 30g from £350";
    const result = parsePrice(input);

    expect(result).toBeInstanceOf(Array);
    expect(result).toHaveLength(4);
    expect(result[0]).toMatchObject({
      sourceStr: "5g pots from £70",
      totalPrice: 70,
      currency: "GBP",
      currencySymbol: "£",
      productTotalAmount: "5g",
      productQuantity: 5,
      productMeasurementUnit: "g",
      productPackaging: "pots",
    });
    expect(result[1]).toMatchObject({
      sourceStr: "10g pots from £125",
      totalPrice: 125,
      currency: "GBP",
      currencySymbol: "£",
      productTotalAmount: "10g",
      productQuantity: 10,
      productMeasurementUnit: "g",
      productPackaging: "pots",
    });
    expect(result[2]).toMatchObject({
      sourceStr: "20g from £240",
      totalPrice: 240,
      currency: "GBP",
      currencySymbol: "£",
      productTotalAmount: "20g",
      productQuantity: 20,
      productMeasurementUnit: "g",
      productPackaging: null,
    });
    expect(result[3]).toMatchObject({
      sourceStr: "30g from £350",
      totalPrice: 350,
      currency: "GBP",
      currencySymbol: "£",
      productTotalAmount: "30g",
      productQuantity: 30,
      productMeasurementUnit: "g",
      productPackaging: null,
    });
  });

  test("30 capsules from £125 - 60 capsules from £169.99", () => {
    const input = "30 capsules from £125 - 60 capsules from £169.99";
    const result = parsePrice(input);

    expect(result).toBeInstanceOf(Array);
    expect(result).toHaveLength(2);
    expect(result[0]).toMatchObject({
      sourceStr: "30 capsules from £125",
      totalPrice: 125,
      currency: "GBP",
      currencySymbol: "£",
      productTotalAmount: "30",
      productQuantity: 30,
      productMeasurementUnit: null,
      productPackaging: "capsules",
    });
    expect(result[1]).toMatchObject({
      sourceStr: "60 capsules from £169.99",
      totalPrice: 169.99,
      currency: "GBP",
      currencySymbol: "£",
      productTotalAmount: "60",
      productQuantity: 60,
      productMeasurementUnit: null,
      productPackaging: "capsules",
    });
  });
});
