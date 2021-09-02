const octokit = require('octokit')

/*
	1. Grab GitHub Enterprise Access Token from environment
	1. Grab API Gateway Access Token from environment
	1. Loop forever polling the API Gateway for messages, apply to GH:E, delete from API Gateway
*/
