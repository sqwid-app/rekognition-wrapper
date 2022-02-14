
const { Buffer } = require("buffer");
const fs = require('fs').promises;
const AWS = require('aws-sdk');
const axios = require('axios');
class ImageModeration {

	#rekognition = null;

	constructor(config) {
		this.config = config;
		this.#rekognition = new AWS.Rekognition(this.config);
	}

	#detectModerationLabels = data => new Promise((resolve, reject) => {
		this.#rekognition.detectModerationLabels(data, (error, data) => {
			if (error) {
				return reject(error);
			}

			return resolve(data);
		});
	});

	detectExplicitContent = async data => {
		let blob;

		if (data === null || typeof data !== "object") {
			throw new Error(`Invalid data type, must be an object. Instead received '${typeof data}'`);
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
			throw new Error("Invalid data content, must be one of the following: url, blob, base64, file");
		}

		const response = await this.#detectModerationLabels({
			Image: {
				Bytes: blob,
			},
			MinConfidence: 0.5,
		});
		return response;
	};
}

module.exports = ImageModeration;
