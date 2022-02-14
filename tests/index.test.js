require('dotenv').config();
const process = require("process");
const ImageModeration = require("..");

const config = {
	accessKeyId: process.env.AWS_ACCESS_KEY_ID,
	secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
	region: "ap-south-1",
};

const verifier = new ImageModeration(config);

/*
	Config can be used in multiple ways,
	Choose any one of the following ways to pass the data to the function
	* url: "https://www.google.com/images/branding/googlelogo/2x/googlelogo_color_272x92dp.png" || <image url>
	* blob: Buffer.from(data) || <blob data>
	* base64EncodedData: <base64 string>
	* file: "path/to/file" <path to file>
*/

describe("Errors", () => {
	describe("Should throw error for not having a proper config type", () => {
		it("String", async () => {
			await expect(verifier.detectExplicitContent('hello')).rejects.toThrow(/Invalid data type, must be an object\. Instead received 'string'/);
		});

		it("Number", async () => {
			await expect(verifier.detectExplicitContent(123)).rejects.toThrow(/Invalid data type, must be an object\. Instead received 'number'/);
		});

		it("Boolean", async () => {
			await expect(verifier.detectExplicitContent(true)).rejects.toThrow(/Invalid data type, must be an object\. Instead received 'boolean'/);
		});
		it("Undefined", async () => {
			await expect(verifier.detectExplicitContent(undefined)).rejects.toThrow(/Invalid data type, must be an object\. Instead received 'undefined'/);
		});
		it("Null", async () => {
			await expect(verifier.detectExplicitContent(null)).rejects.toThrow(/Invalid data type, must be an object\. Instead received 'object'/);
		});
	});
	it("Should throw error for not having proper config data", async () => {
		await expect(verifier.detectExplicitContent({})).rejects.toThrow(/Invalid data content, must be one of the following: url, blob, base64, file/);
	});
});

