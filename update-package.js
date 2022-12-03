const fs = require("fs");
const path = require("path");
let allPackageNames = require("all-the-package-names");

const groupSize = 1000;

function getVersion() {
  const date = new Date();
  const monthS = ("" + (date.getMonth() + 1)).padStart(2, "0");
  const dayS = ("" + date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}.${monthS}.${dayS}`;
}

function getGroupJSON(group) {
  return `
{
	"name": "no-one-left-behind-group-${group}",
	"version": "${getVersion()}",
	"description": "Every package is invited group",
	"license": "MIT",
	"dependencies": {
${allPackageNames
  .slice(group * groupSize, group * groupSize + groupSize)
  .map((name) => `        "${name}": ""`) // most recent version of each package
  .join(",\n")}
	}
}
`;
}

function getAggJSON(aggNum) {
  function numToGroupEntry(num) {
    // helper function for main package.json
    return `        "no-one-left-behind-group-${num}": "file:no-one-left-behind-group-${num}"`;
  }

  return `
{
	"name": "no-one-left-behind-agg-${aggNum}",
	"version": "${getVersion()}",
	"description": "Every package is invited",
	"license": "MIT",
	"dependencies": {
${[...Array(groupSize).keys()]
  .map((groupIndex) => (groupIndex += aggNum * groupSize))
  .map(numToGroupEntry)
  .join(",\n")}
	}
}
`;
}

function getMainJSON(numAggs) {
  function numToAggEntry(num) {
    // helper function for main package.json
    return `        "no-one-left-behind-agg-${num}": "file:no-one-left-behind-agg-${num}"`;
  }

  return `
{
    "name": "no-one-left-behind",
    "version": "${getVersion()}",
    "description": "Every package is invited",
    "repository": "Zalastax/no-one-left-behind",
    "scripts": {
        "update-packages": "node update-package.js",
        "deploy": "node deploy.js"
    },
    "license": "MIT",
    "dependencies": {
${[...Array(numAggs).keys()].map(numToAggEntry).join(",\n")}
    }
}
`;
}

function createGroupPackage(aggNum, groupNum) {
  fs.mkdir(
    path.join(
      __dirname,
      "node_modules",
      "no-one-left-behind-agg-" + aggNum,
      "no-one-left-behind-group-" + groupNum
    ),
    () => {}
  );

  fs.writeFile(
    path.join(
      __dirname,
      "node_modules",
      "no-one-left-behind-agg-" + aggNum,
      "no-one-left-behind-group-" + groupNum,
      "package.json"
    ),
    getGroupJSON(groupNum),
    () => {}
  );
}

function createAggPackage(aggNum) {
  fs.mkdir(
    path.join(__dirname, "node_modules", "no-one-left-behind-agg-" + aggNum),
    () => {}
  );
  // create groups
  for (let i = 0; i < groupSize; i++) {
    createGroupPackage(aggNum, aggNum * groupSize + i);
  }

  fs.writeFile(
    path.join(
      __dirname,
      "node_modules",
      "no-one-left-behind-agg-" + aggNum,
      "package.json"
    ),
    getAggJSON(aggNum),
    () => {}
  );
}

function createMainPackage() {
  // TODO any package name filtering?

  // create directory to store groups
  fs.mkdir(path.join(__dirname, "node_modules"), () => {});

  setTimeout(() => {
    let aggIndex = 0;
    let packageIndex = 0;
    while (packageIndex < allPackageNames.length) {
      const i = aggIndex;
      // create folder then create package.json for each group
      fs.mkdir(
        path.join(
          __dirname,
          "node_modules",
          "no-one-left-behind-agg-" + aggIndex
        ),
        () => createAggPackage(i + "")
      );
      packageIndex += groupSize * groupSize; // groupSize groups with groupSize packages in each agg group
      aggIndex++;
    }

    // remove old package.json and write new one
    fs.rm(path.join(__dirname, "package.json"), () => {
      fs.writeFile(
        path.join(__dirname, "package.json"),
        getMainJSON(aggIndex),
        () => {}
      );
    });
  }, 0);
}

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

createMainPackage();
confirmCreated();
