const octokit = require('octokit')
const axios = require('axios')

/*
	1. Grab GitHub Enterprise Access Token from environment
	1. Grab API Gateway Access Token from environment
	1. Loop forever polling the API Gateway for messages, apply to GH:E, delete from API Gateway
*/

/*
	API Gateway
	API_KEY
	API_URL, e.g. https://rest-id.execute-api.us-east-1.amazonaws.com/Prod/

	GitHub
	GITHUB_ACCESS_TOKEN
	GITHUB_URL, e.g. https://api.ghe.io/
*/

function requireEnv(key) {
	const value = process.env[key];
	if (value === undefined) {
		throw `Required environment key missing: ${key}`;
	}
	return value;
}

api_gateway_key = requireEnv('API_KEY');
api_gateway_url = requireEnv('API_URL');

github_access_token = requireEnv('GITHUB_ACCESS_TOKEN');
github_url = requireEnv('GITHUB_URL');

async function retrieveMessage() {
	return {}
}

async function processMessage(message) {
	/*
		Turn the message into a GitHub status
	*/
}

async function deleteMessage(message) {

}

async function main() {
	while (true) {
		console.log(`fn=main at=start`)

		try {
			let message = await retrieveMessage();
			console.log(`fn=main at=message`)

			await processMessage(message)
			console.log(`fn=main at=process`)

			await deleteMessage(message)
			console.log(`fn=main at=deleted`)
		}
		catch (err) {
			console.log(`fn=main at=error message=${err}`)
		}
	}
}

process.on('SIGINT', function () {
	process.exit();
});

(async () => {
	await main();
})().catch(err => {
	console.log(`fn=index.js at=error message=${err}`)
});
