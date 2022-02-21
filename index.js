
const { Buffer } = require("buffer");
const fs = require('fs').promises;
const path = require('path');
const AWS = require('aws-sdk');
const axios = require('axios');
const FileType = require('file-type');
const { dir } = require("tmp-promise");
const sharp = require('sharp');
const extractFramesFromVideo = require("./lib/extractFramesFromVideo");

/** Class for RekognitionWrapper */
class RekognitionWrapper {

	#rekognition = null;
	/**
	 * Rekognition Wrapper
	 * @param {Object} config - AWS credentialsWS region
	 * @param {number}  [config.maxSize] - Max size of the image to be uploaded
	 * @param {number} [config.MinConfidence] - Min confidence of the image to be uploaded
	 * @param {number} [config.maxDuration] - Max duration of the video to be uploaded
	*/
	constructor(config) {
		this.config = config;
		this.maxSize = config.maxSize || 100 * 1000 * 1000; // default maxSize as 100MB
		this.MinConfidence = config.MinConfidence || 50; // default MinConfidence as 50%
		this.maxDuration = config.maxDuration || 5 * 60; // default maxDuration as 5 minutes
		this.#rekognition = new AWS.Rekognition(this.config);
	}

	/**
	 * Returns moderation labels from AWS Rekognition
	 * @param {Object} data
	 * @param {string} data.Image - Image to be analyzed
	 * @param {string} data.MinConfidence - Minimum confidence to be considered as explicit
	 * @returns {Promise} - Returns the result of the analysis
	*/
	#detectImageModerationLabels = data => new Promise((resolve, reject) => {
		this.#rekognition.detectModerationLabels(data, (error, data) => {
			if (error) return reject(error);

			return resolve(data);
		});
	});

	/**
	 * Returns video duration
	 * @param {Buffer} arrayBuffer - ArrayBuffer of the video
	 * @returns {number} - Duration of the video
	*/
	#getVideoDuration = arrayBuffer => {
		const buffer = Buffer.from(arrayBuffer, 0, 100);
		const header = Buffer.from("mvhd");

		const start = buffer.indexOf(header) + 17;
		const duration = buffer.readUInt32BE(start + 4);
		const timeScale = buffer.readUInt32BE(start);

		const length = Math.floor((duration / timeScale) * 1000) / 1000;

		return length;
	};

	/**
	 * Returns video duration
	 * @param {Buffer} data - ArrayBuffer of the video
	 * @returns {Object} - Result from Rekognition
	 */
	#detectVideoModerationLabels = async data => {
		// Create a temporary directory
		const { path: tmpPath, cleanup } = await dir({
			unsafeCleanup: true,
		});

		// Copy video to temporary folder and create a subdirectory for frames
		const fd = path.join(tmpPath, `video.${this.ext}`);
		const outputPath = path.join(tmpPath, "frames/");

		await fs.mkdir(outputPath);
		await fs.writeFile(fd, new Uint8Array(data));

		// Extract frames from video
		await extractFramesFromVideo({
			filePath: fd,
			outputPath,
		});

		const frames = await fs.readdir(outputPath);

		// Detect content for all frames with AWS Rekognition
		const promises = frames.map(file => path.join(outputPath, file)).map(async img => {
			const byteArray = await fs.readFile(img);
			return this.#detectImageModerationLabels({
				Image: {
					Bytes: Buffer.from(byteArray),
				},
				MinConfidence: this.MinConfidence,
			});
		});

		// Wait for all promises to be resolved
		const rawResults = await Promise.allSettled(promises);
		const resultArray = rawResults.filter(res => res.status === "fulfilled").map(res => res.value);

		// Merge all results into an object with a single sorted ModerationLabels array
		const results = {
			ModerationLabels: resultArray.flatMap(o => o.ModerationLabels).sort((a, b) => b.Confidence - a.Confidence),
		};

		// Cleanup temporary directory
		cleanup();

		return results;
	};

	/**
	 * Detects explicit content with AWS Rekognition
	 * @param {Object} data - Data to be analyzed
	 * @param {string} [data.url] - URL of the image to be analyzed
	 * @param {Buffer} [data.blob] - Blob of the image to be analyzed
	 * @param {string} [data.base64] - Base64 of the image to be analyzed
	 * @param {string} [data.file] - Path of the image to be analyzed
	 * @param {Object} [config] - Additional Configuration
	 * @param {Object} [config.resize={ width: 1024 }] - Resize the image before being analyzed
	*/
	detectExplicitContent = async data => {
		let buffer;
		let response;

		// Check type of data and store Buffer value in buffer
		if (data === null || typeof data !== "object") throw new Error(`Invalid data type, must be an object. Instead received '${typeof data}'`);

		if (data.url) {
			const image = await axios.get(data.url, {
				responseType: 'arraybuffer',
			});
			buffer = Buffer.from(image.data);
		}

		else if (data.blob) buffer = data.blob;

		else if (data.base64) buffer = Buffer.from(data.base64, "base64");

		else if (data.file) {
			const byteArray = await fs.readFile(data.file);
			buffer = Buffer.from(byteArray);
		}

		// Throw error if no data was provided
		else throw new Error("Invalid data content, must be one of the following: url, blob, base64, file");

		// Check if file size is too large
		const size = Buffer.byteLength(buffer);
		if (size > this.maxSize) throw new Error(`File size too large, must be less than ${this.maxSize} bytes, instead received ${size} bytes`);

		// Get file type from buffer
		const type = await FileType.fromBuffer(buffer);

		// Check video and if video duration is too long
		if (type.mime === "video/mp4") {
			const duration = this.#getVideoDuration(buffer);
			if (duration > this.maxDuration) throw new Error(`Video duration too long, must be less than ${this.maxDuration} seconds, instead received ${duration} seconds`);
		}

		// Check if image, resize if necessary and check with AWS Rekognition
		if (type.mime.startsWith("image") && type.mime !== "image/gif") {
			const resizeBuf = await sharp(buffer).resize(data.config?.resize || { width: 1024 }).toBuffer();
			response = await this.#detectImageModerationLabels({
				Image: {
					Bytes: resizeBuf,
				},
				MinConfidence: this.MinConfidence,
			});
		}

		// Check if video or gif and check with AWS Rekognition
		else if (type.mime.startsWith("video") || type.mime === 'image/gif') response = await this.#detectVideoModerationLabels(buffer);
		else throw new Error(`Invalid file type, must be one of the following: image/*, video/*. Instead received '${type.mime}'`);

		return response;
	};
}

module.exports = RekognitionWrapper;
