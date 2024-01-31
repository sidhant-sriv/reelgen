const videoshow = require('videoshow');
const fs = require('fs').promises; // Use fs.promises for async file operations
const path = require('path');
const sharp = require('sharp');

async function resizeImages(imagesPath, resizedWidth, resizedHeight) {
    try {
        const files = await fs.readdir(imagesPath);

        // Filter out non-image files
        await Promise.all(files.map(async (file) => {
            const extension = path.extname(file).toLowerCase();
            if (['.jpg', '.jpeg', '.png', '.gif'].includes(extension)) {
                const imagePath = path.join(imagesPath, file);
                const resizedImage = await sharp(imagePath)
                    .resize(resizedWidth, resizedHeight)
                    .toBuffer();
                await fs.writeFile(imagePath, resizedImage, 'binary');
            }
        }));
    } catch (error) {
        console.error('Error resizing images:', error);
    }
}

async function createVideoSlideshow(imagesPath, audioPath, outputPath) {
    try {
        // Resize images
        const resizedWidth = 900;
        const resizedHeight = 1600;
        await resizeImages(imagesPath, resizedWidth, resizedHeight);

        // Continue with video creation
        const images = [];
        const files = await fs.readdir(imagesPath);

        // Filter out non-image files
        files.forEach(file => {
            const extension = path.extname(file).toLowerCase();
            if (['.jpg', '.jpeg', '.png', '.gif'].includes(extension)) {
                images.push(path.join(imagesPath, file));
            }
        });

        const videoOptions = {
            fps: 25,
            loop: 5,
            transition: true,
            transitionDuration: 1,
            videoBitrate: 1024,
            videoCodec: 'libx264',
            size: '640x?',
            audioBitrate: '128k',
            audioChannels: 2,
            format: 'mp4',
            pixelFormat: 'yuv420p',
            useSubRipSubtitles: false,
        };

        await new Promise((resolve, reject) => {
            videoshow(images, videoOptions)
                .audio(audioPath)
                .save(outputPath)
                .on('start', command => {
                    console.log(`ffmpeg process started: ${command}`);
                })
                .on('error', (err, stdout, stderr) => {
                    console.error('Error:', err);
                    console.error('ffmpeg stderr:', stderr);
                    reject(err);
                })
                .on('end', output => {
                    console.log('Video created in:', output);
                    resolve();
                });
        });
    } catch (error) {
        console.error('Error creating video slideshow:', error);
    }
}


createVideoSlideshow('static/0088dd0/images','static/0088dd0/audio/voiceover.mp3', 'static/0088dd0/video/video.mp4')