require('dotenv').config();
const process = require("process");
const RekognitionWrapper = require("..");

/*
	Config can be used in multiple ways,
	Choose any one of the following ways to pass the data to the function
	* url: "https://www.google.com/images/branding/googlelogo/2x/googlelogo_color_272x92dp.png" || <image url>
	* blob: Buffer.from(data) || <blob data>
	* base64EncodedData: <base64 string>
	* file: "path/to/file" <path to file>
*/

// https://docs.aws.amazon.com/general/latest/gr/aws-sec-cred-types.html#access-keys-and-secret-access-keys

const config = {
	accessKeyId: process.env.AWS_ACCESS_KEY_ID,
	secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
	region: "ap-south-1", // region closest to your server location for minimum latency (https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/Concepts.RegionsAndAvailabilityZones.html)
};

const verifier = new RekognitionWrapper(config);

verifier.detectExplicitContent({
	url: "https://img.huffingtonpost.com/asset/6197f71f20000047aa8d3089.jpeg?cache=dLXWffeF86&ops=scalefit_720_noupscale",
})
	.then(result => {
		console.log("🦊 | file: index.js | line 13 | result", result);
	})
	.catch(error => {
		console.log("🦊 | file: index.js | line 16 | error", error);
	});
