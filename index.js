require('dotenv').config();

const process = require("process");
const { Buffer } = require("buffer");
const fs = require('fs').promises;
const AWS = require('aws-sdk');
const axios = require('axios');

const rekognition = new AWS.Rekognition({
	accessKeyId: process.env.AWS_ACCESS_KEY_ID,
	secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
	region: "ap-south-1",
});

const detectModerationLabels = data => new Promise((resolve, reject) => {
	rekognition.detectModerationLabels(data, (error, data) => {
		if (error) {
			return reject(error);
		}

		return resolve(data);
	});
});

const detectExplicitContent = async data => {
	let blob;

	if (data === null || typeof data !== "object") {
		throw new Error(`Invalid config type, must be an object. Instead received '${typeof data}'`);
	}

	if (data.url) {
		const image = await axios.get(data.url, {
			responseType: 'arraybuffer',
		});
		blob = Buffer.from(image.data);
	}
	else if (data.blob) {
		blob = data.blob;
	}
	else if (data.base64) {
		blob = Buffer.from(data.base64, "base64");
	}
	else if (data.file) {
		const byteArray = await fs.readFile(data.file);
		blob = Buffer.from(byteArray);
	}
	else {
		throw new Error("Invalid config data, must be one of the following: url, blob, base64, file");
	}

	const response = await detectModerationLabels({
		Image: {
			Bytes: blob,
		},
		MinConfidence: 0.5,
	});
	return response;
};

module.exports = detectExplicitContent;
