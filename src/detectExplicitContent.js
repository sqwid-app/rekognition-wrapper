require('dotenv').config()
const AWS = require('aws-sdk');
const axios = require('axios');
const fs = require('fs').promises;

const rekognition = new AWS.Rekognition({
	accessKeyId: process.env.AWS_ACCESS_KEY_ID,
	secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
	region: "ap-south-1"
});

const detectModerationLabels = (data) => {
	return new Promise((resolve, reject) => {
		rekognition.detectModerationLabels(data, (err, data) => {
			if (err) {
				return reject(err)
			}
			return resolve(data)
		})
	})
}

const detectExplicitContent = async (data) => {
	let blob;
	if (data.url) {
		let image = await axios.get(data.url, {
			responseType: 'arraybuffer'
		});
		blob = Buffer.from(image.data)
	}
	if (data.blob) {
		blob = data.blob
	}
	if (data.base64) {
		blob = Buffer.from(data.base64, "base64");
	}
	if (data.file) {
		let byteArray = await fs.readFile(data.file)
		blob = Buffer.from(byteArray)
	}
	const res = await detectModerationLabels({
		Image: {
			Bytes: blob,
		},
		MinConfidence: 0.5

	})
	return res
}

module.exports = detectExplicitContent