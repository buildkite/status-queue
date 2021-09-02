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

apiGatewayKey = requireEnv('API_KEY');
apiGatewayUrl = requireEnv('API_URL');

const instance = axios.create({
	baseURL: apiGatewayUrl,
	timeout: 5000,
	headers: {
		'X-Api-Key': apiGatewayKey,
		'Accept': 'application/json'
	}
});

githubAccessToken = requireEnv('GITHUB_ACCESS_TOKEN');
githubUrl = requireEnv('GITHUB_URL');

async function retrieveMessage() {
	const response = await instance.get(`/message`);

	const body = response.data;

	const status = response.status;
	if (status != 200) {
		throw `Could not retrieve message from API Gateway: ${body}`;
	}

	// TODO error checking the body
	const message = body['ReceiveMessageResponse']['ReceiveMessageResult']['messages'][0];
	console.log(`fn=retrieveMessage at=retreived messageId=${message['MessageId']} receiptHandle=${message['ReceiptHandle']}`)

	return message
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
