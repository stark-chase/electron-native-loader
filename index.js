const loaderUtils = require('loader-utils');
const fs = require("fs");

const substitutionMapFile = "./ElectronNativeSubstitutionMap.json";

let dependencies = {};
if(fs.existsSync(substitutionMapFile)) {
    dependencies = JSON.parse(fs.readFileSync(substitutionMapFile).toString());
    fs.unlinkSync(substitutionMapFile);
} else {
    console.log("Warning: File " + substitutionMapFile + " not found.");
}

module.exports = function(source) {
    let modulePath = loaderUtils.interpolateName(this, "[name].[ext]", {context: "."});
    if(dependencies[modulePath])
        modulePath = dependencies[modulePath];
    if (modulePath[0] !== '.') {
        modulePath = './' + modulePath
    }   
    return 'module.exports = __non_webpack_require__(' + JSON.stringify(modulePath) + ')';
}