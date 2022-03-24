const main = require('../knowledge/main')
const bedrocan = require('../knowledge/bedrocan')
const strains= require('../knowledge/strains')

interface KBEntry  {
    pattern: RegExp,
    preferredName: string,
    aliases: string[]
  }

class KnowledgeBase {
    main: KBEntry[]
    bedrocan: KBEntry[]
    strains: KBEntry[]

    constructor() {
        this.main = main    
        this.bedrocan = bedrocan    
        this.strains = strains    
    }

    getMain(): KBEntry[] {
        return this.main
    }
    getBedrocan(): KBEntry[] {
        return this.bedrocan
    }
    getStrains(): KBEntry[] {
        return this.strains
    }
}

module.exports = KnowledgeBase