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

async function createStatus(message) {
	/*
		Turn the message into a GitHub status
	*/
	return true
}

async function deleteMessage(message) {
	return {}
}

async function handleMessage() {
	let message = await retrieveMessage();
	console.log(`fn=handleMessage at=message`)

	let result = await createStatus(message)
	console.log(`fn=handleMessage at=process`)
	if (!result) {
		console.log(`fn=handleMessage at=process result=${result}`)
		return;
	}

	await deleteMessage(message)
	console.log(`fn=handleMessage at=deleted`)
}

async function sleep(ms) {
    return new Promise(resolve => {
        setTimeout(resolve, ms)
    });
}

async function main() {
	while (true) {
		console.log(`fn=main at=start`)

		try {
			await handleMessage()
			await sleep(5000);
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
