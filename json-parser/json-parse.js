const fs = require("fs");
let fileDetails = "";
try {
    fileDetails = fs.readFileSync(`${process.argv[2]}`, "utf8").trim();
} catch (err) {
    console.error("Error reading file: ", err.message);
    process.exit(1);
}
const LEFTBRACE = "{";
const RIGHTBRACE = "}";
const DOUBLEQUOTE = '"';
const COMMA = ",";
const COLON = ":";
function checkBraces(arr) {
    return arr[0] === LEFTBRACE && arr[arr.length - 1] === RIGHTBRACE;
}
function separateCommas(innerParts) {
    const keyValueList = [];
    let part = "";
    let turnOn = false;
    for (let i = 0; i < innerParts.length; i++) {
        const char = innerParts[i];
        if (char === DOUBLEQUOTE) {
            turnOn = !turnOn;
        }
        if (char === COMMA && !turnOn) {
            keyValueList.push(part.trim());
            part = "";
        } else {
            part += char;
        }
    }
    if (part) {
        keyValueList.push(part.trim());
    }
    if (innerParts[innerParts.length - 1] === COMMA) {
        keyValueList.push("");
    }
    return keyValueList;
}
function checkKV(kvPair, colonPtr) {
    if (!kvPair) return false;

    let key = kvPair.slice(0, colonPtr).trim();
    let value = kvPair.slice(colonPtr + 1).trim();

    if (!(key[0] === DOUBLEQUOTE && key[key.length - 1] === DOUBLEQUOTE)) {
        return false;
    }

    try {
        if (
            value[0] === DOUBLEQUOTE &&
            value[value.length - 1] === DOUBLEQUOTE
        ) {
            return true;
        }

        let parsedValue = JSON.parse(value);

        if (
            typeof parsedValue === "boolean" ||
            typeof parsedValue === "number" ||
            parsedValue === null ||
            typeof parsedValue === "object"
        ) {
            return true;
        }
    } catch (err) {
        return false;
    }

    return false;
}
function checkKVHandler(keyValueList) {
    let res = true;
    for (let i = 0; i < keyValueList.length; i++) {
        let turnOn = false;
        if (!keyValueList[i]) {
            return false;
        }
        for (let j = 0; j < keyValueList[0].length; j++) {
            if (keyValueList[i][j] === DOUBLEQUOTE) {
                turnOn = !turnOn;
            }
            if (keyValueList[i][j] === COLON && !turnOn) {
                res = checkKV(keyValueList[i], j);
                if (!res) {
                    return false;
                }
                break;
            }
        }
    }
    return res;
}
function isJSON() {
    const fileStr = fileDetails.trim();
    const arr = fileStr.split("");
    if (!checkBraces(arr)) {
        return false;
    }
    const innerParts = fileStr.slice(1, fileStr.length - 1).trim();
    const keyValueList = separateCommas(innerParts);
    return checkKVHandler(keyValueList);
}
function main() {
    if (isJSON() === true) {
        console.log("Valid JSON.");
        process.exit(0);
    } else {
        console.log("Invalid JSON. ");
        process.exit(1);
    }
}
main();
