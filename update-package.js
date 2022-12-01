const fs = require("fs");
const path = require("path");
let names = require("all-the-package-names");

const groupSize = 1000;

function urlFriendly(name) {
  return name === encodeURIComponent(name);
}

function validScopedName(name) {
  const scopedPackagePattern = new RegExp("^(?:@([^/]+?)[/])?([^/]+?)$");
  const nameMatch = name.match(scopedPackagePattern);
  if (nameMatch) {
    return urlFriendly(nameMatch[1]) && urlFriendly(nameMatch[1]);
  }
}

function validName(name) {
  return name.length > 0 && (urlFriendly(name) || validScopedName(name));
}

function getVersion() {
  const date = new Date();
  const monthS = ("" + (date.getMonth() + 1)).padStart(2, "0");
  const dayS = ("" + date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}.${monthS}.${dayS}`;
}

function packageEntry(name) {
  return `        "${name}": "latest"`;
}

function buildGroupJSON(group) {
  return `
{
	"name": "no-one-left-behind-group-${group}",
	"version": "${getVersion()}",
	"description": "Every package is invited group",
	"license": "MIT",
	"dependencies": {
${names
  .slice(group * groupSize, group * groupSize + groupSize)
  .map(packageEntry)
  .join(",\n")}
	}
}
	`;
}

function numToGroupEntry(num) {
  return `        "no-one-left-behind-group-${num}": "file:groups/no-one-left-behind-group-${num}"`;
}

function buildMainJSON(numGroups) {
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
${[...Array(numGroups).keys()].map(numToGroupEntry).join(",\n")}
    }
}
`;
}

function createGroupPackage(group) {
  fs.writeFile(
    path.join(
      __dirname,
      "groups",
      "no-one-left-behind-group-" + group,
      "package.json"
    ),
    buildGroupJSON(group),
    () => {}
  );
}

function createMainPackage() {
  names.filter(validName);

  fs.mkdir(path.join(__dirname, "groups"), () => {});

  setTimeout(() => {
    let groupIndex = 0;
    let packageIndex = 0;
    while (packageIndex < names.length) {
      const i = groupIndex;
      fs.mkdir(
        path.join(
          __dirname,
          "groups",
          "no-one-left-behind-group-" + groupIndex
        ),
        () => createGroupPackage(i + "")
      );
      packageIndex += groupSize;
      groupIndex++;
    }

    fs.rm(path.join(__dirname, "package.json"), () => {
      fs.writeFile(
        path.join(__dirname, "package.json"),
        buildMainJSON(groupIndex),
        () => {}
      );
    });
  }, 0);
}
createMainPackage();
