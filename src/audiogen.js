const gtts = require('gtts');

const generateVoiceover = async (text, outputPath) => {
    return new Promise((resolve, reject) => {
        const gttsInstance = new gtts(text, 'en');

        gttsInstance.save(outputPath, (err) => {
            if (err) {
                console.error(`Error generating voiceover: ${err.message}`);
                reject(err);
            } else {
                console.log(`Voiceover generated and saved at: ${outputPath}`);
                resolve();
            }
        });
    });
};

module.exports = { generateVoiceover };