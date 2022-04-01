const fs = require("fs");

const example_output = fs.readFileSync("example_request.txt", "utf-8");

function readDHCPList(request_body){
  return request_body;
}

const devices = readDHCPList(example_output);

console.log(devices);
