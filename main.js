"use strict"
const axios = require("axios");

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
  ignored_hosts: [],
  "api_url": "192.168.1.1",
  "cookie": "Authorization=I%20am%20not%20a%20real%20cookie%2C%20you%20know"
});


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

function fetchData() {
  const url = `http://${settings.api_url}/userRpm/AssignedIpAddrListRpm.html`;
  const Referer = `http://${settings.api_url}userRpm/MenuRpm.htm`;
  const Cookie = settings.cookie;

  return axios({
    url,
    method: "GET",
    headers: {
      Referer,
      Cookie,
      Connection: 'keep-alive',
      Pragma: 'no-cache',
      DNT: '1',
      Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9',
      'Cache-Control': 'no-cache',
      'Upgrade-Insecure-Requests': '1',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) PotatoBrowser/69(DOS) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/99.0.4844.82 Safari/537.36',
      'Accept-Language': 'en-US,en;q=0.9,pl-PL;q=0.8,pl;q=0.7',
    }
  })
}

async function getDevices() {
  const response = await fetchData();
  const { data } = response;
  const devices = readDHCPList(data);

  if (!devices)
    return undefined;

  return filterIgnoredDevices(devices);
}

async function main() {
  let devices;

  if (process.env.NODE_ENV == "dev") {
    const fs = require("fs");
    try {
      const example_output = fs.readFileSync("example_request.txt", "utf-8");
      devices = readDHCPList(example_output);
      devices = filterIgnoredDevices(devices);
    } catch (err) {
      console.log(err.message);
      devices = undefined;
    }

  } else {
    try {
      devices = await getDevices();
    } catch (err) {
      if (axios.isAxiosError(err)) {
        console.log(err.message);
        devices = undefined;
      } else {
        throw err;
      }
    }
  }

  if (devices) {
    console.table(devices);
  } else {
    console.log("Devices not found");
  }
}

main();
