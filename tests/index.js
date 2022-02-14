const detectExplicitContent = require("../src/detectExplicitContent")

detectExplicitContent({
	// file: "./img.jpg"
	url: "https://static01.nyt.com/images/2021/09/14/science/07CAT-STRIPES/07CAT-STRIPES-mediumSquareAt3X-v2.jpg",
	// base64: b64

})
	.then(res => {
		console.log("🦊 | file: index.js | line 10 | res", res);
	})
	.catch(err => {
		console.log("🦊 | file: index.js | line 14 | err", err);
	})