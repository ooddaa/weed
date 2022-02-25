// import { parsePrice, formatPrice } from "../parsers.mjs";
const { parsePrice, formatPrice } = require("../parsers.js");
const { log } = require("../stuff");

const altea = {
  product: "Althea CBD100",
  form: "Full Spectrum Oil",
  strain: "Sativa",
  cultivar: "N/A",
  thc: "0.8 mg/ml",
  cbd: "100 mg/ml",
  size: "25ml",
  privateprescriptionpricingapprox: "£199",
  availableonprojecttwenty21: "No",
  productsize: "",
  monthlyamountcappedat15: "",
  pharmacyt21: "",
  notes: "",
  levelsinstockuk: "Low (100 or less)",
  atpharmacy: "Yes",
  moreinformationreviews: null,
};

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
  test("the first argument must be product", () => {
    expect(() => {
      parsePrice();
    }).toThrow("parsePrice: the first argument must be product.");
  });
  test("nothing", () => {
    const input = {};
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

  test("£199, 25ml", () => {
    const input = {
      privateprescriptionpricingapprox: "£199",
      size: "25ml",
    };
    const result = parsePrice(input);

    expect(result).toBeInstanceOf(Array);
    expect(result[0]).toMatchObject({
      sourceStr: input.privateprescriptionpricingapprox,
      totalPrice: 199,
      currency: "GBP",
      currencySymbol: "£",
      productTotalAmount: "25ml",
      productQuantity: 25,
      productMeasurementUnit: "ml",
      productPackaging: null,
    });
  });
  test("£199, .5ml", () => {
    const input = {
      privateprescriptionpricingapprox: "£199",
      size: ".5ml",
    };
    const result = parsePrice(input);

    expect(result).toBeInstanceOf(Array);
    expect(result[0]).toMatchObject({
      sourceStr: input.privateprescriptionpricingapprox,
      totalPrice: 199,
      currency: "GBP",
      currencySymbol: "£",
      productTotalAmount: ".5ml",
      productQuantity: 0.5,
      productMeasurementUnit: "ml",
      productPackaging: null,
    });
  });
  test("£199, 0.9ml", () => {
    const input = {
      privateprescriptionpricingapprox: "£199",
      size: "0.9ml",
    };
    const result = parsePrice(input);

    expect(result).toBeInstanceOf(Array);
    expect(result[0]).toMatchObject({
      sourceStr: input.privateprescriptionpricingapprox,
      totalPrice: 199,
      currency: "GBP",
      currencySymbol: "£",
      productTotalAmount: "0.9ml",
      productQuantity: 0.9,
      productMeasurementUnit: "ml",
      productPackaging: null,
    });
  });

  test("£199.99", () => {
    const input = {
      privateprescriptionpricingapprox: "£199.99",
    };
    const result = parsePrice(input);

    expect(result).toBeInstanceOf(Array);
    expect(result[0]).toMatchObject({
      sourceStr: input.privateprescriptionpricingapprox,
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
    const input = {
      privateprescriptionpricingapprox: "50ml bottle from £175",
    };
    const result = parsePrice(input);

    expect(result).toBeInstanceOf(Array);
    expect(result[0]).toMatchObject({
      sourceStr: input.privateprescriptionpricingapprox,
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
    const input = {
      privateprescriptionpricingapprox: "40ml from £162.50",
    };
    const result = parsePrice(input);

    expect(result).toBeInstanceOf(Array);
    expect(result[0]).toMatchObject({
      sourceStr: input.privateprescriptionpricingapprox,
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
    const input = {
      privateprescriptionpricingapprox: "10g from £85",
    };
    const result = parsePrice(input);

    expect(result).toBeInstanceOf(Array);
    expect(result[0]).toMatchObject({
      sourceStr: input.privateprescriptionpricingapprox,
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
    const input = {
      privateprescriptionpricingapprox: "10g from £85.99",
    };
    const result = parsePrice(input);

    expect(result).toBeInstanceOf(Array);
    expect(result[0]).toMatchObject({
      sourceStr: input.privateprescriptionpricingapprox,
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
    const input = {
      privateprescriptionpricingapprox: "£88 for 5g",
    };
    const result = parsePrice(input);

    expect(result).toBeInstanceOf(Array);
    expect(result[0]).toMatchObject({
      sourceStr: input.privateprescriptionpricingapprox,
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
    const input = {
      privateprescriptionpricingapprox: "£88.99 for 5g",
    };
    const result = parsePrice(input);

    expect(result).toBeInstanceOf(Array);
    expect(result[0]).toMatchObject({
      sourceStr: input.privateprescriptionpricingapprox,
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
    const input = {
      privateprescriptionpricingapprox: "£75 for 10g£150 for 20g£225 for 30g",
    };
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
    const input = {
      privateprescriptionpricingapprox:
        "£88 for 5g\r£176 for 20g\r£212 for 30g",
    };
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
    const input = {
      privateprescriptionpricingapprox:
        "5g pots from £70 - 10g pots from £125 - 20g from £240 - 30g from £350",
    };
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
    const input = {
      privateprescriptionpricingapprox:
        "30 capsules from £125 - 60 capsules from £169.99",
    };
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
