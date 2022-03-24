var main = require('../knowledge/main');
var bedrocan = require('../knowledge/bedrocan');
var strains = require('../knowledge/strains');
var KnowledgeBase = /** @class */ (function () {
    function KnowledgeBase() {
        this.main = main;
        this.bedrocan = bedrocan;
        this.strains = strains;
    }
    KnowledgeBase.prototype.getMain = function () {
        return this.main;
    };
    KnowledgeBase.prototype.getBedrocan = function () {
        return this.bedrocan;
    };
    KnowledgeBase.prototype.getStrains = function () {
        return this.strains;
    };
    return KnowledgeBase;
}());
module.exports = KnowledgeBase;
