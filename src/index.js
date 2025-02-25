const utils = require("./utils");
const legacy = require("./legacy/index");
const angular = require("./angular/index");

(async () => {
    if(utils.isLegacyNeptunPage()){
        console.log("legacy init");
        legacy.init();
    }
    else if(utils.isNeptunPage()){
        console.log("angular init");
        angular.init();
    }
  })();