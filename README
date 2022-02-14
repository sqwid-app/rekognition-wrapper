# rekognition-wrapper

Moderating image content through AWS Rekognition SDK

## Installation

Use either [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/) to
install rekognition-wrapper.

```bash
npm  i @sqwid/rekognition-wrapper
```

or

```bash
yarn add @sqwid/rekognition-wrapper
```

## Usage

```javascript
/*
    https://docs.aws.amazon.com/general/latest/gr/aws-sec-cred-types.html#access-keys-and-secret-access-keys
    https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/Concepts.RegionsAndAvailabilityZones.html
*/
const config = {
	accessKeyId: "your-aws-access-key-id",
	secretAccessKey: "your-aws-secret-access-key",
	region: "region-closest-to-your-server-location-for-minimum-latency",
};

const verifier = new RekognitionWrapper(config);

verifier
	.detectExplicitContent({
		url: "https://img.huffingtonpost.com/asset/6197f71f20000047aa8d3089.jpeg?cache=dLXWffeF86&ops=scalefit_720_noupscale",
	})
	.then(result => {
		console.log(result);
	})
	.catch(error => {
		console.log(error);
	});
```

## Contributing

Pull requests are welcome. For major changes, please open an issue first to
discuss what you would like to change.

Please make sure to update [tests](tests/index.test.js) as appropriate.

## License

[MIT](LICENSE.md)
