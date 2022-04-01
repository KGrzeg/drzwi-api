const fs = require("fs");

const example_output = fs.readFileSync("example_request.txt", "utf-8");

function readDHCPList(request_body) {
  const scriptsRe = /<script[^>]*>([^]*?)<\/script>/igm;
  const scriptTags = [...request_body.matchAll(scriptsRe)];
  const scriptBodies = scriptTags.map(scr => typeof scr[1] == 'string' ? scr[1].trim() : '');
  const interestingScript = scriptBodies.find(src => src.startsWith('var DHCPDynList'));

  if (!interestingScript)
    return undefined;

  let lines = interestingScript.split("\n");
  lines = lines.slice(1, -1);                             //drop first and last lines
  let data = lines.map(
    line => line.split(",")                               //split line into fields
      .map(field => field.trim())                         //trim spaces near commas
      .map(field => field.substring(1, field.length - 1)) //removes quotes
      .filter(field => field)                             //remove empty strings
  );

  data = data.map(fields => ({
    name: fields[0],
    MAC: fields[1],
    IP: fields[2],
    lease_time: fields[3]
  }));

  return data;
}

const devices = readDHCPList(example_output);

console.table(devices);
