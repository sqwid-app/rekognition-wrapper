require('dotenv').config();
const process = require("process");
const ImageModeration = require("..");

const config = {
	accessKeyId: process.env.AWS_ACCESS_KEY_ID,
	secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
	region: "ap-south-1",
};

const verifier = new ImageModeration(config);

verifier.detectExplicitContent({
	url: "https://img.huffingtonpost.com/asset/6197f71f20000047aa8d3089.jpeg?cache=dLXWffeF86&ops=scalefit_720_noupscale",
})
	.then(result => {
		console.log("🦊 | file: index.js | line 13 | result", result);
	})
	.catch(error => {
		console.log("🦊 | file: index.js | line 16 | error", error);
	});
