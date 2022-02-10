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
  let howMany = str.match(/\r/g);
  // log(howMany);
  return str.split(/\r/).map(formatPrice);
}
function formatPrice(str) /*: Object */ {
  /* set all to null for default case */
  let totalPrice =
    (currency =
    currencySymbol =
    productTotalAmount =
    productMeasurementUnit =
    productQuantity =
    productPackaging =
      null);

  // CASE 1
  // 50ml bottle from £175 | 10g from £85
  // let matchedCase1 = str.match(/([£$])([0-9]*)/);
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
  */
  let matchedCase1 = str.match(
    /(([0-9]*)(g|mg|ml))\s+(bottle\s+)?from\s+([£$])([0-9]*)/
  );
  // log(matchedCase1);
  /* check if we can extract price as a Number */
  if (matchedCase1 != null && !isNaN(matchedCase1[6])) {
    // log("matchedCase1");
    currencySymbol = matchedCase1[5] || null;
    currency = currencies[currencySymbol] || null;
    totalPrice = Number(matchedCase1[6]) || null;
    productTotalAmount = matchedCase1[1] || null;
    productQuantity = !isNaN(matchedCase1[2]) ? Number(matchedCase1[2]) : null;
    productMeasurementUnit = matchedCase1[3];
    productPackaging =
      typeof matchedCase1[4] == "string" ? matchedCase1[4].trim() : null;
  }

  // CASE 2
  // £88 for 5g
  let matchedCase2 = str.match(/(£)([0-9]*) for (([0-9]*)(g|mg))/);
  /* 
  [
      '£88 for 5g',
      '£',
      '88',
      '5g',
      '5',
      'g',
      index: 0,
      input: '£88 for 5g',
      groups: undefined
    ]
  */
  // log(matchedCase2);
  if (matchedCase2 != null && !isNaN(matchedCase2[2])) {
    // log("matchedCase2");
    currencySymbol = matchedCase2[1] || null;
    currency = currencies[currencySymbol] || null;
    totalPrice = Number(matchedCase2[2]) || null;
    productTotalAmount = matchedCase2[3] || null;
    productQuantity = !isNaN(matchedCase2[4]) ? Number(matchedCase2[4]) : null;
    productMeasurementUnit = matchedCase2[5] || null;
    productPackaging = null;
  }

  return {
    sourceStr: str,
    totalPrice,
    currency,
    currencySymbol,
    productTotalAmount,
    productQuantity,
    productMeasurementUnit,
    productPackaging,
  };
}

describe("should extract price per quantity", () => {
  test("fails", () => {
    // privateprescriptionpricingapprox: "50ml bottle from £175",
    const input = "fails";
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

  test("50ml bottle from £175", () => {
    // privateprescriptionpricingapprox: "50ml bottle from £175",
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

  test("10g from £85", () => {
    // privateprescriptionpricingapprox: "10g from £85",
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

  test("£88 for 5g", () => {
    // privateprescriptionpricingapprox: "£88 for 5g",
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
});
