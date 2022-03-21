const { log } = require('mango')
const { disambiguate } = require('./parsers')
const strainsKB = require('./strainsKB')

/**
 * State behavioural pattern
 */
 class Strain {
    constructor(strainName) {
      this.state = new UnknownStrain();
      this.strains = {
        "Sativa": Sativa,
        "Indica": Indica,
        "Hybrid": Hybrid,
        UnknownStrain,
      };

      this.changeState(strainName);
    }
  
    makeNode(builder) {
      return this.state.makeNode(builder);
    }
  
    changeState(strainName) {
      let strain = disambiguate(strainName, strainsKB)[0] || "UnknownStrain"
      // console.log(strainName, " == ", strain)
      this.state = new this.strains[strain]() || new UnknownStrain();
    }
  }
  
  class Sativa {
    makeNode(builder) {
      return builder.makeNode(["Strain", "Sativa"], { NAME: "Sativa" });
    }
  }
  class Indica {
    makeNode(builder) {
      return builder.makeNode(["Strain", "Indica"], { NAME: "Indica" });
    }
  }
  class Hybrid {
    // constructor () {
    //   this.makeNode = this.makeNode.bind(this)
    // }
    makeNode(builder) {
      return builder.makeNode(["Strain", "Hybrid"], { NAME: "Hybrid" });
    }
  }
  class UnknownStrain {
    makeNode(builder) {
      return builder.makeNode(["Strain", "UNKNOWN"], { NAME: "UNKNOWN" });
    }
  }

module.exports = Strain;