// moviegen.js
const videoshow = require("videoshow");
const fs = require("fs").promises;
const path = require("path");
const sharp = require("sharp");

/**
 * Resizes images in the specified directory to the given width and height.
 * Reduces resolution and quality to speed up processing.
 * @param {string} imagesPath - Path to the directory containing images.
 * @param {number} resizedWidth - The width to resize images to.
 * @param {number} resizedHeight - The height to resize images to.
 * @returns {Promise<void>}
 */
async function resizeImages(imagesPath, resizedWidth, resizedHeight) {
  try {
    const files = await fs.readdir(imagesPath);

    // Filter out non-image files and resize images concurrently
    const imageFiles = files.filter(file => {
      const extension = path.extname(file).toLowerCase();
      return [".jpg", ".jpeg", ".png", ".gif"].includes(extension);
    });

    // Resize images in parallel with reduced quality
    await Promise.all(
      imageFiles.map(async (file) => {
        const imagePath = path.join(imagesPath, file);
        const tempPath = path.join(imagesPath, `resized_${file}`);

        // Resize and reduce quality (e.g., JPEG quality to 50)
        await sharp(imagePath)
          .resize(resizedWidth, resizedHeight, {
            fit: sharp.fit.cover,
            withoutEnlargement: true,
          })
          .jpeg({ quality: 50 }) // Adjust quality as needed
          .toFile(tempPath);

        // Replace original image with resized version
        await fs.unlink(imagePath);
        await fs.rename(tempPath, imagePath);
      })
    );

    console.log("Images resized and optimized for speed.");
  } catch (error) {
    console.error("Error resizing images:", error.message);
    throw error;
  }
}

/**
 * Creates a video slideshow from images and audio with optimized settings.
 * @param {string} imagesPath - Path to the directory containing images.
 * @param {string} audioPath - Path to the audio file.
 * @param {string} outputPath - Path to save the generated video.
 * @returns {Promise<void>}
 */
async function createVideoSlideshow(imagesPath, audioPath, outputPath) {
  try {
    // Define lower resolution and minimal transitions for speed
    const resizedWidth = 640; // Reduced width
    const resizedHeight = 360; // Reduced height

    // Resize images with optimized settings
    await resizeImages(imagesPath, resizedWidth, resizedHeight);

    // Gather image paths
    const files = await fs.readdir(imagesPath);
    const images = files
      .filter(file => {
        const extension = path.extname(file).toLowerCase();
        return [".jpg", ".jpeg", ".png", ".gif"].includes(extension);
      })
      .map(file => path.join(imagesPath, file));

    if (images.length === 0) {
      throw new Error("No images found to create a video slideshow.");
    }

    // Define minimal video options for speed
    const videoOptions = {
      fps: 15, // Lower frame rate
      loop: 2, // Shorter display duration per image
      transition: false, // Remove transitions
      videoBitrate: 512, // Lower bitrate
      videoCodec: "libx264",
      size: `${resizedWidth}x${resizedHeight}`, // Use resized dimensions
      audioBitrate: "64k", // Lower audio bitrate
      audioChannels: 1, // Mono audio
      format: "mp4",
      pixelFormat: "yuv420p",
      useSubRipSubtitles: false,
    };

    // Create the video slideshow
    await new Promise((resolve, reject) => {
      videoshow(images, videoOptions)
        .audio(audioPath)
        .save(outputPath)
        .on("start", (command) => {
          console.log(`FFmpeg process started with command: ${command}`);
        })
        .on("error", (err, stdout, stderr) => {
          console.error("Error creating video slideshow:", err.message);
          console.error("FFmpeg stderr:", stderr);
          reject(err);
        })
        .on("end", (output) => {
          console.log("Video created successfully:", output);
          resolve();
        });
    });
  } catch (error) {
    console.error("Error in createVideoSlideshow:", error.message);
    throw error;
  }
}

module.exports = { createVideoSlideshow };