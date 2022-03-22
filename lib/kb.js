var strainsKB = require('../strainsKB');
var KnowledgeBase = /** @class */ (function () {
    function KnowledgeBase() {
        this.strains = strainsKB;
    }
    KnowledgeBase.prototype.getStrains = function () {
        return this.strains;
    };
    return KnowledgeBase;
}());
module.exports = KnowledgeBase;
