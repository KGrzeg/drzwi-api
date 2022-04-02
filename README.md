# drzwi-api

The script is supposed to be run periodically, by cron for example. The script connect to the local router, authenticate by cookie and try to download a list of devices in networks. Sometime response doesn't contain a list (router shows login screen for some reason), then you need to run script twice. You can save the output of the script as JSON to file and serve it as public API.
If there are at least one device that is not in ignored list, then the space is consider as **open**.
If a error occurred (i.e. Network problem or router's response does not contain devices list), the api return `{"status": "closed"}` and send error message to the [stderr](https://man7.org/linux/man-pages/man3/stdout.3.html).

## Setup script
You should look into `settings.json.example`, move it or copy and save as `settings.json` then adjust the content.

| Name            	| Description                                                                                                           	|
|-----------------	|-----------------------------------------------------------------------------------------------------------------------	|
| `ignored_hosts` 	| The list of ignored devices' MACs. Ignored devices are those, that can be online while Hackerspace is consider empty. 	|
| `api_url`       	| For now, it is the IP address of the main router.                                                                     	|
| `cookie`        	| Cookie header's value that can be used to authenticate to the router.                                                   	|

Install dependencies with
```sh
🐧 npm install
```

## Run script
You have to use `-s` or `--silent` flag when run script by npm, otherwise the output will be contaminated by npm's info.
```sh
🐧 npm start -s > state.json
🐧 cat state.json
{"status":"open"}
```

## Development
Todo: complete this paragraph when need.
