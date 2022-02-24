// API - Active Pharmaceutical Ingredient
const { log } = require("../stuff");
const { parseAPI } = require("../parsers");
const api = [
  {
    thc: "20%",
    cbd: "18%",
  },
  // {
  //   thc: ["20%", 0.2],
  //   cbd: ["18%", 0.01],

  // },
  {
    thc: "<18%-22%",
    cbd: "<1%",
  },
  // {
  //   thc: ["<18%-22%", 0.2],
  //   cbd: ["<1%", 0.01],
  // },
  // {
  //   thc: "<18%-22%",
  //   cbd: "<1%",
  // },
];

describe("should find delimiters", () => {
  test("20%, 18%", () => {
    // [
    // '1%',
    // '1',
    // '%',
    // index: 0, input: '1%', groups: undefined ]
    const rv = parseAPI(api[0]);
    expect(rv["thc"]).toEqual(["20%", 0.2]);
    expect(rv["cbd"]).toEqual(["18%", 0.18]);
  });
  test("18%-22%, <1%", () => {
    const rv = parseAPI(api[1]);
    expect(rv["thc"]).toEqual(["<18%-22%", 0.2]);
    expect(rv["cbd"]).toEqual(["<1%", 0.01]);
  });
});
