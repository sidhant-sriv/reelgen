const { v4: uuidv4 } = require('uuid');
const express = require('express');
const cors = require('cors');
const fs = require('fs').promises;
const path = require('path');
const axios = require('axios');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const gtts = require('gtts');
require('dotenv').config();
const videoshow = require('videoshow');
const sharp = require('sharp');

// const { get_text_wrapper } = require('./llm_get.js');
// const { makeFolder } = require('./folderstuff.js');
// const { downloadImages } = require('./imgget.js');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static('./static'));

app.get('/', (req, res) => {
  res.send('Hello World!');
});

app.post('/text', async (req, res) => {
  const fullUuid = uuidv4();
  const text = req.body.text;

  let txt = await get_text_wrapper(
    `Write a small paragraph about ${text} (don't add any styles or links. Just a plain paragraph.)`
  );

  console.log(txt);
  const user_id = fullUuid.substring(0, 7);
  makeFolder(user_id, 'static');

  let keywords = await get_text_wrapper(
    `Give me a few comma separated values from ${txt} (no extra text or spaces)`
  );

  keywords = keywords.split(',');
  keywords = keywords.map((keyword) => keyword.trim());

  searchImages(keywords)
    .then((imageUrls) => downloadImages(imageUrls, `static/${user_id}/images`))
    .catch((error) => console.error(`Error: ${error.message}`));

  const images = fs.readdirSync(`static/${user_id}/images`);
  const imageUrls = images.map((image) => `static/${user_id}/images/${image}`);

  await res.send({ text: txt,  user_id: user_id });
});

app.post('/edittext', async (req, res) => {
    //Get the text from the user and user_id
    const text = req.body.text;
    const user_id = req.body.user_id;
    //Generate the voiceover
    const voiceoverPath = `static/${user_id}/audio/voiceover.mp3`;
    await generateVoiceover(text, voiceoverPath);
    await createVideoSlideshow(`static/${user_id}/images`, `${voiceoverPath}`, `static/${user_id}/video/video.mp4`); 
    res.send({"videoUrl": `${user_id}/video/video.mp4`});

});

app.listen(5001, () => {
  console.log('Example app listening on port 5001!');
});

const genAI = new GoogleGenerativeAI(process.env.GEMINIAPI);

async function get_text(prompt) {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = await response.text();
    return text;
  } catch (error) {
    console.error(`Error in get_text: ${error.message}`);
    throw error;
  }
}

async function get_text_wrapper(prompt) {
  try {
    const generatedText = await get_text(prompt);
    return generatedText;
  } catch (error) {
    console.error(`Error in get_text_wrapper: ${error.message}`);
    throw error;
  }
}

function makeFolder(name, basePath) {
  const folderPath = path.join(__dirname, basePath, name);

  fs.mkdirSync(folderPath);
  fs.mkdirSync(path.join(folderPath, 'images'));
  fs.mkdirSync(path.join(folderPath, 'audio'));
  fs.mkdirSync(path.join(folderPath, 'video'));
}

async function searchImages(keywords, perPage = 1) {
  const url = 'https://api.pexels.com/v1/search';
  const headers = {
    Authorization: process.env.PEXELSAPI,
  };

  const imageUrls = [];

  for (const keyword of keywords) {
    const params = {
      query: keyword,
      per_page: perPage,
    };

    try {
      const response = await axios.get(url, { headers, params });

      if (response.status === 200) {
        const data = response.data;
        const photos = data.photos || [];

        if (!photos.length) {
          console.log(`No photos found for keyword: ${keyword}`);
        } else {
          imageUrls.push(photos[0].src.original);
        }
      } else {
        console.log(`Error for keyword ${keyword}: ${response.status}`);
      }
    } catch (error) {
      console.error(`Error for keyword ${keyword}: ${error.message}`);
    }
  }

  return imageUrls;
}

async function downloadImages(urlList, outDir) {
  fs.mkdirSync(outDir, { recursive: true });

  for (const url of urlList) {
    try {
      const response = await axios.get(url, { responseType: 'arraybuffer' });

      if (response.status === 200) {
        const filename = path.join(outDir, path.basename(url));
        fs.writeFileSync(filename, response.data, 'binary');
        console.log(`Image downloaded: ${filename}`);
      } else {
        console.log(`Failed to download image from ${url}. Status code: ${response.status}`);
      }
    } catch (error) {
      console.error(`Failed to download image from ${url}: ${error.message}`);
    }
  }
}

async function generateVoiceover(text, outputPath) {
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
  }

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