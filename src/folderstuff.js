//Write a function that takes a string and makes a folder with that name and makes 3 folders images, audio and video with in the new folder

const fs = require('fs');
const path = require('path');

function makeFolder(name, basePath) {
    const folderPath = path.join(__dirname, basePath, name);

    fs.mkdirSync(folderPath);
    fs.mkdirSync(path.join(folderPath, 'images'));
    fs.mkdirSync(path.join(folderPath, 'audio'));
    fs.mkdirSync(path.join(folderPath, 'video'));
}

// export { makeFolder };
// Example usage
