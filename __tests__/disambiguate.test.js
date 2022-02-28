const { disambiguate } = require("../parsers.js");
const knowledgeBase = require("../knowledgeBase.js");

const kb = [
  {
    pattern: new RegExp("tilray", "i"),
    preferredName: "Tilray",
    aliases: ["Tilray", "TILRAY"],
  },
  {
    pattern: new RegExp("aurora", "i"),
    preferredName: "Aurora",
    aliases: ["Aurora", "PEDANIOS"],
  },
  {
    pattern: new RegExp("columbia", "i"),
    preferredName: "Columbia Care",
    aliases: ["Columbia", "Columbia Care", "COLUMBIA"],
  },
  {
    pattern: new RegExp("bedrocan", "i"),
    preferredName: "Bedrocan",
    aliases: ["Bedrocan", "BEDROCAN"],
  },
];

describe("create regex patter from name", () => {
  test("tilray", () => {
    const pattern = new RegExp("tilray", "i");
    const rv = pattern.test("TILRAY");
    expect(rv).toEqual(true);
  });
  test("Columbia Care", () => {
    const pattern = new RegExp("columbia", "i");
    const rv = pattern.test("Columbia Care");
    expect(rv).toEqual(true);
  });
  test("all", () => {
    /* if pattern matches at least one of the aliases, we choose preferredName - can also give a score  */
    const rv = kb.map(({ pattern, preferredName, aliases }) => {
      const matches = [];
      aliases.forEach((alias) => {
        if (pattern.test(alias)) {
          matches.push(true);
        } else {
          matches.push(false);
        }
      });
      return matches.includes(true) ? preferredName : null;
    });
    // console.log(rv)
    const names = kb.map(({ preferredName }) => preferredName);
    // console.log(names)
    expect(rv).toEqual(names);
  });
  test("disambiguate TILRAY", () => {
    const rv = disambiguate("TILRAY", kb);
    expect(rv).toEqual(["Tilray"]);
  });
  test("disambiguate ColuMbIa", () => {
    const rv = disambiguate("ColuMbIa", kb);
    expect(rv).toEqual(["Columbia Care"]);
  });
  test("disambiguate ColuMbIa", () => {
    const rv = disambiguate("ColuMbIa", kb);
    expect(rv).toEqual(["Columbia Care"]);
  });
});
