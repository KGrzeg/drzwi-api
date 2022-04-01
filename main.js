const fs = require("fs");

function tryToRequire(path, default_value) {
  try {
    return require(path);
  } catch (err) {
    if (err.code == 'MODULE_NOT_FOUND') {
      return default_value;
    }
  }
}

const settings = tryToRequire("./settings.json", {
  ignored_hosts: []
});


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

function filterIgnoredDevices(devices) {
  return devices.filter(device => settings.ignored_hosts.indexOf(device.MAC) === -1);
}

const devices = readDHCPList(example_output);

console.table(filterIgnoredDevices(devices));
