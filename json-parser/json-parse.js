const fs = require("fs");
let fileDetails = "";
try {
    fileDetails = fs.readFileSync(process.argv[2], "utf8").trim();
} catch (err) {
    console.error("Error reading file: ", err.message);
    process.exit(1);
}
const LEFTBRACE = "{";
const RIGHTBRACE = "}";
const DOUBLEQUOTE = '"';
const COMMA = ",";
const COLON = ":";
const LEFTSQUARE = "[";
const RIGHTSQUARE = "]";

function checkBraces(arr) {
    return arr[0] === LEFTBRACE && arr[arr.length - 1] === RIGHTBRACE;
}

function checkArrayBrackets(arr) {
    return arr[0] === LEFTSQUARE && arr[arr.length - 1] === RIGHTSQUARE;
}

function separateCommas(innerParts) {
    const keyValueList = [];
    let part = "";
    let inString = false;
    let braceDepth = 0;
    let bracketDepth = 0;

    for (let i = 0; i < innerParts.length; i++) {
        const char = innerParts[i];

        if (char === DOUBLEQUOTE) {
            let numBackslashes = 0;
            let j = i - 1;
            while (j >= 0 && innerParts[j] === "\\") {
                numBackslashes++;
                j--;
            }

            if (numBackslashes % 2 === 0) {
                inString = !inString;
            }
        }

        if (!inString) {
            if (char === LEFTBRACE) braceDepth++;
            if (char === RIGHTBRACE) braceDepth--;
            if (char === LEFTSQUARE) bracketDepth++;
            if (char === RIGHTSQUARE) bracketDepth--;
        }

        if (
            char === COMMA &&
            !inString &&
            braceDepth === 0 &&
            bracketDepth === 0
        ) {
            const trimmed = part.trim();
            if (!trimmed) {
                return null;
            }
            keyValueList.push(trimmed);
            part = "";
        } else {
            part += char;
        }
    }

    const trimmed = part.trim();
    if (trimmed) {
        keyValueList.push(trimmed);
    } else if (keyValueList.length > 0) {
        return null;
    }

    return keyValueList;
}

function checkKV(kvPair, colonPtr, depth = 0) {
    if (!kvPair) return false;
    let key = kvPair.slice(0, colonPtr).trim();
    let value = kvPair.slice(colonPtr + 1).trim();

    if (!(key[0] === DOUBLEQUOTE && key[key.length - 1] === DOUBLEQUOTE)) {
        return false;
    }

    if (!isValidString(key)) {
        return false;
    }

    if (!value) return false;

    try {
        if (value[0] === LEFTBRACE && value[value.length - 1] === RIGHTBRACE) {
            return isJSON(value, depth + 1);
        }

        if (
            value[0] === LEFTSQUARE &&
            value[value.length - 1] === RIGHTSQUARE
        ) {
            return isArray(value, depth + 1);
        }

        if (
            value[0] === DOUBLEQUOTE &&
            value[value.length - 1] === DOUBLEQUOTE
        ) {
            return isValidString(value);
        }

        let parsedValue = JSON.parse(value);
        if (
            typeof parsedValue === "boolean" ||
            typeof parsedValue === "number" ||
            parsedValue === null
        ) {
            if (typeof parsedValue === "number") {
                return isValidNumber(value);
            }
            return true;
        }
    } catch (err) {
        return false;
    }
    return false;
}

function isValidString(str) {
    if (str.length < 2) return false;
    if (str[0] !== DOUBLEQUOTE || str[str.length - 1] !== DOUBLEQUOTE)
        return false;

    let i = 1;
    while (i < str.length - 1) {
        const charCode = str.charCodeAt(i);

        if (charCode < 0x20) {
            return false;
        }

        if (str[i] === "\\") {
            i++;
            if (i >= str.length - 1) return false;
            const escaped = str[i];

            if (
                escaped === '"' ||
                escaped === "\\" ||
                escaped === "/" ||
                escaped === "b" ||
                escaped === "f" ||
                escaped === "n" ||
                escaped === "r" ||
                escaped === "t"
            ) {
                i++;
            } else if (escaped === "u") {
                if (i + 4 >= str.length) return false;
                for (let j = 1; j <= 4; j++) {
                    const c = str[i + j];
                    if (
                        !(
                            (c >= "0" && c <= "9") ||
                            (c >= "a" && c <= "f") ||
                            (c >= "A" && c <= "F")
                        )
                    ) {
                        return false;
                    }
                }
                i += 5;
            } else {
                return false;
            }
        } else if (str[i] === DOUBLEQUOTE) {
            return false;
        } else {
            i++;
        }
    }
    return true;
}

function isValidNumber(numStr) {
    numStr = numStr.trim();

    if (
        numStr.length > 1 &&
        numStr[0] === "0" &&
        numStr[1] >= "0" &&
        numStr[1] <= "9"
    ) {
        return false;
    }

    if (numStr.startsWith("0x") || numStr.startsWith("0X")) {
        return false;
    }

    try {
        const parsed = JSON.parse(numStr);
        return typeof parsed === "number" && !isNaN(parsed);
    } catch {
        return false;
    }
}

function checkKVHandler(keyValueList, depth = 0) {
    if (!keyValueList) return false;

    for (let i = 0; i < keyValueList.length; i++) {
        let inString = false;
        let foundColon = false;
        let colonCount = 0;
        let colonPtr = -1;
        let braceDepth = 0;
        let bracketDepth = 0;

        if (!keyValueList[i]) {
            return false;
        }

        for (let j = 0; j < keyValueList[i].length; j++) {
            if (keyValueList[i][j] === DOUBLEQUOTE) {
                let numBackslashes = 0;
                let k = j - 1;
                while (k >= 0 && keyValueList[i][k] === "\\") {
                    numBackslashes++;
                    k--;
                }

                if (numBackslashes % 2 === 0) {
                    inString = !inString;
                }
            }

            if (!inString) {
                if (keyValueList[i][j] === LEFTBRACE) braceDepth++;
                if (keyValueList[i][j] === RIGHTBRACE) braceDepth--;
                if (keyValueList[i][j] === LEFTSQUARE) bracketDepth++;
                if (keyValueList[i][j] === RIGHTSQUARE) bracketDepth--;
            }

            if (
                keyValueList[i][j] === COLON &&
                !inString &&
                braceDepth === 0 &&
                bracketDepth === 0
            ) {
                colonCount++;
                if (colonPtr === -1) {
                    colonPtr = j;
                }
            }
        }

        if (colonCount !== 1) {
            return false;
        }

        if (colonPtr !== -1) {
            if (!checkKV(keyValueList[i], colonPtr, depth)) {
                return false;
            }
            foundColon = true;
        }

        if (!foundColon) return false;
    }
    return true;
}

function isArray(fileData, depth = 0) {
    if (depth >= 19) {
        return false;
    }

    const fileStr = fileData.trim();
    const arr = fileStr.split("");

    if (!checkArrayBrackets(arr)) {
        return false;
    }

    const innerParts = fileStr.slice(1, fileStr.length - 1).trim();

    if (!innerParts) return true;

    const elements = separateCommas(innerParts);
    if (!elements) return false;

    for (let element of elements) {
        element = element.trim();
        if (!element) return false;

        if (
            element[0] === LEFTBRACE &&
            element[element.length - 1] === RIGHTBRACE
        ) {
            if (!isJSON(element, depth + 1)) return false;
        } else if (
            element[0] === LEFTSQUARE &&
            element[element.length - 1] === RIGHTSQUARE
        ) {
            if (!isArray(element, depth + 1)) return false;
        } else if (
            element[0] === DOUBLEQUOTE &&
            element[element.length - 1] === DOUBLEQUOTE
        ) {
            if (!isValidString(element)) return false;
        } else {
            try {
                let parsed = JSON.parse(element);
                if (typeof parsed === "number") {
                    if (!isValidNumber(element)) return false;
                } else if (typeof parsed !== "boolean" && parsed !== null) {
                    return false;
                }
            } catch (err) {
                return false;
            }
        }
    }
    return true;
}

function isJSON(fileData, depth = 0) {
    if (depth >= 19) {
        return false;
    }

    const fileStr = fileData.trim();
    const arr = fileStr.split("");

    if (!checkBraces(arr)) {
        return false;
    }
    const innerParts = fileStr.slice(1, fileStr.length - 1).trim();
    if (!innerParts) return true;
    const keyValueList = separateCommas(innerParts);
    if (!keyValueList) return false;

    return checkKVHandler(keyValueList, depth);
}

function isValidJSON(fileData) {
    const fileStr = fileData.trim();
    if (!fileStr) return false;

    if (fileStr[0] === LEFTBRACE) {
        return isJSON(fileStr);
    } else if (fileStr[0] === LEFTSQUARE) {
        return isArray(fileStr);
    }
    return false;
}

function main() {
    const result = isValidJSON(fileDetails);
    if (result === true) {
        console.log("Valid JSON.");
        process.exit(0);
    } else {
        console.log("Invalid JSON.");
        process.exit(0);
    }
}
main();
