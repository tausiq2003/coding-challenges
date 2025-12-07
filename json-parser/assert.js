const fs = require("fs");
const exec = require("child_process").exec;

const foo = fs.readdirSync("test");

foo.map((fileName) => {
    //run the fileName
    exec(
        `node json-parse.js test/${fileName}`,
        function (error, stdout, stderr) {
            console.log("stdout: " + fileName + " has " + stdout);
            if (error !== null) {
                console.log("exec error: " + error);
            }
        },
    );
});
