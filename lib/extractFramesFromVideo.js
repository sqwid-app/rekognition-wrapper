const path = require('path');
const util = require('util');
const exec = util.promisify(require('child_process').exec);

const extractFramesFromVideo = async ({
	filePath,
	outputPath,
	threshold = 50,
	framesPerScene = 1,
	logFile = null,
	fileName = "frame_$SCENE_NUMBER", // add $IMAGe_NUMBER to the end of the file name if framesPerScene > 1
}) => {
	const command = `scenedetect ${(logFile === null) ? `` : `-l ${path.resolve(logFile)}`} -i ${path.resolve(filePath)} detect-content -t ${threshold} save-images -o ${path.resolve(outputPath)} -n ${framesPerScene} -f ${fileName}`;
	await exec(command);
};

module.exports = extractFramesFromVideo;
