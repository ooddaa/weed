import { Builder } from "../../mango/lib/Builder/Builder";
// import { Node } from "../../mango/lib/Builder/templates/Node"
import { Node } from "../../mango/src/Builder/templates/Node";

// const { log } = require('mango')
import { log } from 'mango';
// const { disambiguate } = require('../parsers')
import { disambiguate } from'../parsers'
// const strains = require('../knowledge/strains')
import strains from '../knowledge/strains';

interface Class<T> {
    new(): T
}
/**
 * State behavioural pattern
 */
 class Strain {
    state: UnknownStrain | Sativa | Indica | Hybrid
    strains: Object
    constructor(strainName?: string) {
      this.state = new UnknownStrain();
      this.strains = {
        "Sativa": Sativa,
        "Indica": Indica,
        "Hybrid": Hybrid,
        UnknownStrain,
      };

      this.changeState(strainName);
    }
  
    makeNode(builder: Builder): Node {
      return this.state.makeNode(builder);
    }
  
    changeState(strainName?: string): void {
      let strain = disambiguate(strainName, strains)[0] || "UnknownStrain";
      this.state = new this.strains[strain]() || new UnknownStrain();
    }
  }
  
  class Sativa extends Strain {
    makeNode(builder: Builder): Node { 
      /* ignore untill I figure out how to utilze FlowJS types with tsc OR
       re-write Mango in TS, */
      //@ts-ignore 
      return builder.makeNode(["Strain", "Sativa"], { NAME: "Sativa" });
    }
  }
  class Indica extends Strain {
    makeNode(builder: Builder): Node {
      //@ts-ignore 
      return builder.makeNode(["Strain", "Indica"], { NAME: "Indica" });
    }
  }
  class Hybrid  extends Strain {
    makeNode(builder: Builder): Node {
      //@ts-ignore 
      return builder.makeNode(["Strain", "Hybrid"], { NAME: "Hybrid" });
    }
  }
  class UnknownStrain extends Strain {
    makeNode(builder: Builder): Node {
      //@ts-ignore 
      return builder.makeNode(["Strain", "UNKNOWN"], { NAME: "UNKNOWN" });
    }
  }

export default Strain;