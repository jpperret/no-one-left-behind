const fs = require("fs");
const path = require("path");
let allPackageNames = require("all-the-package-names");
module.exports = { confirmCreated };

const groupSize = 1000;

function confirmCreated() {
  // looks through all aggs and groups to make sure all folders and package.jsons exist
  let allExist = true;
  const numAggs = allPackageNames.length / groupSize / groupSize;
  for (let aggNum = 0; aggNum < numAggs; aggNum++) {
    if (
      !fs.existsSync(
        path.join(
          __dirname,
          "node_modules",
          "no-one-left-behind-agg-" + aggNum,
          "package.json"
        )
      )
    ) {
      console.log(
        "No file " + "no-one-left-behind-agg-" + aggNum + "/package.json"
      );
      allExist = false;
    }
    for (
      let groupNum = aggNum * groupSize;
      groupNum < aggNum * groupSize + groupSize;
      groupNum++
    ) {
      if (groupNum * groupSize > allPackageNames.length) {
        break;
      }
      if (
        !fs.existsSync(
          path.join(
            __dirname,
            "node_modules",
            "no-one-left-behind-agg-" + aggNum,
            "no-one-left-behind-group-" + groupNum,
            "package.json"
          )
        )
      ) {
        console.log(
          "No file " +
            "no-one-left-behind-agg-" +
            aggNum +
            "/no-one-left-behind-group-" +
            groupNum +
            "/package.json created "
        );
        allExist = false;
      }
    }
  }
  return allExist;
}

if (!confirmCreated()) {
  throw "All files not created";
} else {
  console.log("All package.json files created as expected");
}
