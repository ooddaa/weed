const util = require("util");

const log = (...items) =>
  items.forEach((item) =>
    console.log(util.inspect(item, { depth: null, colors: true }))
  );

const currencies = {
  "£": "GBP",
  $: "USD",
};

function formatPrice(str) {
  if (typeof str !== "string") {
    throw new Error("formatPrice: the first argument must be a string.");
  }

  let totalPrice,
    currency,
    currencySymbol,
    productTotalAmount,
    productMeasurementUnit,
    productQuantity;
  totalPrice = str.match(/([£$])([0-9]*)/);

  if (totalPrice != null && !isNaN(totalPrice[2])) {
    currencySymbol = totalPrice[1];
    currency = currencies[currencySymbol];
    totalPrice = Number(totalPrice[2]);
  } else {
    currencySymbol = null;
    currency = null;
    totalPrice = null;
  }

  // 50ml bottle from | 10g from
  let matched = str.match(/([0-9]*)(g|mg|ml)\s+(bottle)?/);
  if (matched !== null && !isNaN(matched[1])) {
    productTotalAmount = matched[0].trim();
    productQuantity = Number(matched[1]);
    productMeasurementUnit = matched[2];
  } else {
    productTotalAmount = null;
    productQuantity = null;
    productMeasurementUnit = null;
  }

  return {
    sourceStr: str,
    totalPrice,
    currency,
    currencySymbol,
    productTotalAmount,
    productQuantity,
    productMeasurementUnit,
  };
}

describe("should extract price per quantity", () => {
  test("fails", () => {
    // privateprescriptionpricingapprox: "50ml bottle from £175",
    const input = "fails";

    expect(formatPrice(input)).toMatchObject({
      sourceStr: input,
      totalPrice: null,
      currency: null,
      currencySymbol: null,
      // productTotalAmount: null,
      // productMeasurementUnit: null,
      // productQuantity: null,
    });
  });

  test("50ml bottle from £175", () => {
    // privateprescriptionpricingapprox: "50ml bottle from £175",
    const input = "50ml bottle from £175";

    expect(formatPrice(input)).toMatchObject({
      sourceStr: input,
      totalPrice: 175,
      currency: "GBP",
      currencySymbol: "£",
      productTotalAmount: "50ml bottle",
      productQuantity: 50,
      productMeasurementUnit: "ml",
    });
  });

  test("10g from £85", () => {
    // privateprescriptionpricingapprox: "10g from £85",
    const input = "10g from £85";

    expect(formatPrice(input)).toMatchObject({
      sourceStr: input,
      totalPrice: 85,
      currency: "GBP",
      currencySymbol: "£",
      productTotalAmount: "10g",
      productQuantity: 10,
      productMeasurementUnit: "g",
    });
  });
});
