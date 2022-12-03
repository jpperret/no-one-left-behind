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
  .map((name) => `        "${name}": "latest"`)
  .join(",\n")}
	}
}
`;
}

function getAggJSON(aggNum) {
  function numToGroupEntry(num) {
    // helper function for main package.json
    return `        "no-one-left-behind-group-${num}": "file:groups/no-one-left-behind-group-${num}"`;
  }

  return `
{
	"name": "no-one-left-behind-agg-${aggNum}",
	"version": "${getVersion()}",
	"description": "Every package is invited",
	"license": "MIT",
	"dependencies": {
${[...Array(1000).keys()]
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
    return `        "no-one-left-behind-agg-${num}": "file:groups/no-one-left-behind-agg-${num}"`;
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

function createGroupPackage(groupNum) {
  fs.mkdir(
    path.join(__dirname, "groups", "no-one-left-behind-group-" + groupNum),
    () => {}
  );

  fs.writeFile(
    path.join(
      __dirname,
      "groups",
      "no-one-left-behind-group-" + groupNum,
      "package.json"
    ),
    getGroupJSON(groupNum),
    () => {}
  );
}

function createAggPackage(aggNum) {
  // create groups
  for (let i = 0; i < groupSize; i++) {
    createGroupPackage(aggNum * groupSize + i);
  }

  fs.writeFile(
    path.join(
      __dirname,
      "groups",
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
  fs.mkdir(path.join(__dirname, "groups"), () => {});

  setTimeout(() => {
    let aggIndex = 0;
    let packageIndex = 0;
    while (packageIndex < allPackageNames.length) {
      const i = aggIndex;
      // create folder then create package.json for each group
      fs.mkdir(
        path.join(__dirname, "groups", "no-one-left-behind-agg-" + aggIndex),
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

createMainPackage();
