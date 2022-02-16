
const { Buffer } = require("buffer");
const fs = require('fs').promises;
const path = require('path');
const AWS = require('aws-sdk');
const axios = require('axios');
const FileType = require('file-type');
const { dir } = require("tmp-promise");
const extractFramesFromVideo = require("./lib/extractFramesFromVideo");

class RekognitionWrapper {

	#rekognition = null;

	constructor(config) {
		this.config = config;
		this.MinConfidence = config.MinConfidence || 50;
		this.#rekognition = new AWS.Rekognition(this.config);
	}

	#detectImageModerationLabels = data => new Promise((resolve, reject) => {
		this.#rekognition.detectModerationLabels(data, (error, data) => {
			if (error) {
				return reject(error);
			}

			return resolve(data);
		});
	});

	#detectVideoModerationLabels = async data => {
		const { path: tmpPath, cleanup } = await dir({
			unsafeCleanup: true,
		});

		const fd = path.join(tmpPath, `video.${this.ext}`);
		const outputPath = path.join(tmpPath, "frames/");

		await fs.mkdir(outputPath);
		await fs.writeFile(fd, new Uint8Array(data));

		await extractFramesFromVideo({
			filePath: fd,
			outputPath,
		});

		const frames = await fs.readdir(outputPath);

		const promises = frames.map(file => path.join(outputPath, file)).map(async img => {
			const byteArray = await fs.readFile(img);
			return this.#detectImageModerationLabels({
				Image: {
					Bytes: Buffer.from(byteArray),
				},
				MinConfidence: this.MinConfidence,
			});
		});

		const rawResults = await Promise.allSettled(promises);
		const resultArray = rawResults.filter(res => res.status === "fulfilled").map(res => res.value);
		const results = {
			ModerationLabels: resultArray.flatMap(o => o.ModerationLabels).sort((a, b) => b.Confidence - a.Confidence),
		};

		cleanup();

		return results;
	};

	detectExplicitContent = async data => {
		let buffer;

		if (data === null || typeof data !== "object") {
			throw new Error(`Invalid data type, must be an object. Instead received '${typeof data}'`);
		}

		if (data.url) {
			const image = await axios.get(data.url, {
				responseType: 'arraybuffer',
			});
			buffer = Buffer.from(image.data);
			console.log("🦊 | file: index.js | line 82 | RekognitionWrapper | buffer", buffer);
		}
		else if (data.blob) {
			buffer = data.blob;
		}
		else if (data.base64) {
			buffer = Buffer.from(data.base64, "base64");
		}
		else if (data.file) {
			const byteArray = await fs.readFile(data.file);
			buffer = Buffer.from(byteArray);
		}
		else {
			throw new Error("Invalid data content, must be one of the following: url, blob, base64, file");
		}

		let response;

		const type = await FileType.fromBuffer(buffer);
		if (type.mime.startsWith("image")) {
			response = await this.#detectImageModerationLabels({
				Image: {
					Bytes: buffer,
				},
				MinConfidence: this.MinConfidence,
			});
		}
		else if (type.mime.startsWith("video")) {
			response = await this.#detectVideoModerationLabels(buffer);
		}
		else {
			throw new Error(`Invalid file type, must be one of the following: image/*, video/*. Instead received '${type.mime}'`);
		}

		return response;
	};
}

module.exports = RekognitionWrapper;
