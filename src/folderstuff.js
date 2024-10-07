// folderstuff.js
const fs = require("fs");
const path = require("path");

/**
 * Creates a main folder with subfolders for images, audio, and video.
 * @param {string} name - The name of the main folder.
 * @param {string} basePath - The base path where the folder will be created.
 */
function makeFolder(name, basePath) {
  const folderPath = path.join(__dirname, basePath, name);

  try {
    // Create main folder and subfolders
    fs.mkdirSync(path.join(folderPath, "images"), { recursive: true });
    fs.mkdirSync(path.join(folderPath, "audio"), { recursive: true });
    fs.mkdirSync(path.join(folderPath, "video"), { recursive: true });
  } catch (error) {
    console.error(`Error creating folders: ${error.message}`);
    throw error;
  }
}

module.exports = { makeFolder };