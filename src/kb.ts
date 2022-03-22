const strainsKB = require('../strainsKB')

interface KBEntry  {
    pattern: RegExp,
    preferredName: string,
    aliases: string[]
  }

class KnowledgeBase {
    strains: KBEntry[]
    constructor() {
        this.strains = strainsKB
    }

    getStrains(): KBEntry[] {
        return this.strains
    }
}

module.exports = KnowledgeBase