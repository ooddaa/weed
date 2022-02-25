// API - Active Pharmaceutical Ingredient
const { log } = require("../stuff");
const { parseAPI } = require("../parsers");
const api = [
  // 0
  {
    thc: "20%",
    cbd: "18%",
  },
  // 1
  {
    thc: "<18%-22%",
    cbd: "<1%",
  },
  // 2
  {
    thc: "",
    cbd: "",
  },
  // 3
  {
    thc: "18 - 22%",
    cbd: "16.15%",
  },
  // 4
  {
    thc: "0.5 mg",
    cbd: "10 mg",
  },
  // 5
  {
    thc: "5 mg",
    cbd: "5 mg",
  },
  // 6
  {
    thc: "40.75%",
    cbd: "39.50%",
  },
  // 7
  {
    thc: "5 mg/ml",
    cbd: "100 mg/ml",
  },
  // 8 default
  {
    thc: "whatever",
    cbd: "N/A",
  },
  // 9
  {
    thc: "<2mg/ml",
    cbd: "50 mg/ml",
  },
];

describe("should find delimiters", () => {
  test("0 20%, 18%", () => {
    // [
    // '1%',
    // '1',
    // '%',
    // index: 0, input: '1%', groups: undefined ]
    const rv = parseAPI(api[0]);
    expect(rv["thc"]).toEqual(["20%", 0.2]);
    expect(rv["cbd"]).toEqual(["18%", 0.18]);
  });
  test("1 18%-22%, <1%", () => {
    const rv = parseAPI(api[1]);
    expect(rv["thc"]).toEqual(["<18%-22%", 0.2]);
    expect(rv["cbd"]).toEqual(["<1%", 0.01]);
  });
  test("2 nothing", () => {
    const rv = parseAPI(api[2]);
    expect(rv["thc"]).toEqual(["", null]);
    expect(rv["cbd"]).toEqual(["", null]);
  });
  test("3 18 - 22%, 16.15%", () => {
    const rv = parseAPI(api[3]);
    expect(rv["thc"]).toEqual(["18 - 22%", 0.2]);
    expect(rv["cbd"]).toEqual(["16.15%", 0.1615]);
  });
  test("4 0.5 mg, 10 mg", () => {
    const rv = parseAPI(api[4]);
    expect(rv["thc"]).toEqual(["0.5 mg", 0.005]);
    expect(rv["cbd"]).toEqual(["10 mg", 0.1]);
  });
  test("5 5 mg, 5 mg", () => {
    const rv = parseAPI(api[5]);
    expect(rv["thc"]).toEqual(["5 mg", 0.05]);
    expect(rv["cbd"]).toEqual(["5 mg", 0.05]);
  });
  test("6 40.75%, 39.50%", () => {
    const rv = parseAPI(api[6]);
    expect(rv["thc"]).toEqual(["40.75%", 0.4075]);
    expect(rv["cbd"]).toEqual(["39.50%", 0.395]);
  });
  test("7 5 mg/ml, 100 mg/ml", () => {
    const rv = parseAPI(api[7]);
    expect(rv["thc"]).toEqual(["5 mg", 0.05]);
    expect(rv["cbd"]).toEqual(["100 mg", 1]);
  });
  test("8 default", () => {
    const rv = parseAPI(api[8]);
    expect(rv["thc"]).toEqual([null, null]);
    expect(rv["cbd"]).toEqual([null, null]);
  });
  test("9 <2mg/ml", () => {
    const rv = parseAPI(api[9]);
    expect(rv["thc"]).toEqual(["<2mg", 0.02]);
    expect(rv["cbd"]).toEqual(["50 mg", 0.5]);
  });
});
