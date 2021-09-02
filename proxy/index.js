const octokit = require('octokit')
const axios = require('axios')
const https = require('https')

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
	GITHUB_URL, e.g. https://github.acme-inc.com/api/v3
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

const apiGateway = axios.create({
	baseURL: apiGatewayUrl,
	timeout: 5000,
	headers: {
		'X-Api-Key': apiGatewayKey,
		'Accept': 'application/json'
	}
});

console.log(`fn=index.js at=apiGateway key=${apiGatewayKey.replace(/./g, '*')} url=${apiGatewayUrl}`)

githubAccessToken = requireEnv('GITHUB_ACCESS_TOKEN');
githubUrl = requireEnv('GITHUB_URL');

// DANGERZONE, our GHE instance has a self signed certificate
const httpsAgent = new https.Agent({ rejectUnauthorized: false });

const github = new octokit.Octokit({
	auth: githubAccessToken,
	baseUrl: githubUrl,
	request: {
		agent: httpsAgent,
	}
});

console.log(`fn=index.js at=github token=${githubAccessToken.replace(/./g, '*')} url=${githubUrl}`)

async function retrieveMessage() {
	const response = await apiGateway.get(`/message`);

	const body = response.data;

	const status = response.status;
	if (status != 200) {
		throw `Could not retrieve message from API Gateway: ${body}`;
	}

	// TODO error checking the body
	const message = body['ReceiveMessageResponse']['ReceiveMessageResult']['messages'][0];
	console.log(`fn=retrieveMessage at=response messageId=${message['MessageId']}`)

	return message
}

async function createStatus(message) {
	console.log(`fn=createStatus messageId=${message['MessageId']}`)
	/*
		Turn the message into a GitHub status
	*/

	const buildkiteEvent = JSON.parse(message.Body)

	const buildNumber = buildkiteEvent['build']['number']
	const repository = buildkiteEvent['pipeline']['repo']
	const commit = buildkiteEvent['build']['commit']
	const orgSlug = buildkiteEvent['organization']['slug']
	const pipelineSlug = buildkiteEvent['pipeline']['slug']
	const buildkiteState = buildkiteEvent['build']['state']

	let [owner, repo] = parseNwo(repository)
	let state = githubStatusForBuildkiteState(buildkiteState)
	let targetUrl = `https://buildkite.com/${orgSlug}/${pipelineSlug}/build/${buildNumber}`
	let description = ""
	let context = pipelineSlug

	console.log(`fn=createStatus messageId=${message['MessageId']} at=request owner=${owner} repo=${repo} sha=${commit} context=${context}`)

	// TODO if this fails, we could quickly end up head of line blocking the
	// whole queue
	let response = await github.request("POST /repos/{owner}/{repo}/statuses/{sha}", {
		owner: owner,
		repo: repo,
		sha: commit,
		state: state,
		target_url: targetUrl,
		description: description,
		context: context,
	});

	console.log(`fn=createStatus messageId=${message['MessageId']} at=response`)

	return true
}

// Can be given an https://github.com/owner/name or git@github.com:owner/name url
// Returns tuple of [owner, name]
function parseNwo(repository) {
	if (repository.startsWith("git@github.com")) {
		var [_, nwo] = repository.split(":")
		var [owner, name_with_git] = nwo.split("/")
		var [_, name] = name_with_git.split(".")
		return [owner, name]
	}

	if (repository.startsWith("https")) {
		return repository.split("/").slice(3)
	}

	throw `Unknown repository format to parse name with owner: ${repository}`
}

/*
	Can return one of "error", "failure", "pending", or "success"
*/
function githubStatusForBuildkiteState(state) {
	switch (state) {
		case "passed":
			return "success";
		case "failed":
			return "failure";
		default:
			return "pending";
	}
}

async function deleteMessage(message) {
	console.log(`fn=deleteMessage messageId=${message['MessageId']}`)

	let receiptHandle = message['ReceiptHandle'];

	const response = await apiGateway.delete(`/message`, {
		params: {
			receiptHandle: receiptHandle,
		}
	});

	console.log(`fn=deleteMessage messageId=${message['MessageId']} at=response`)

	const body = response.data;

	const status = response.status;
	if (status != 200) {
		throw `Could not delete message on API Gateway: ${body}`;
	}
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
		try {
			await handleMessage()
		}
		catch (err) {
			console.log(`fn=main at=error message=${err}`)
		}

		await sleep(5000);
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
