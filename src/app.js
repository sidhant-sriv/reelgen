// app.js
const { v4: uuidv4 } = require("uuid");
const express = require("express");
const cors = require("cors");
require("dotenv").config();
const app = express();

// Import custom modules
const { get_text_wrapper } = require("./llm_get.js");
const { makeFolder } = require("./folderstuff.js");
const { searchImages, downloadImages } = require("./imgget.js");
const { generateVoiceover } = require("./audiogen.js");
const { createVideoSlideshow } = require("./moviegen.js");

app.use(cors());
app.use(express.json());
app.use(express.static("./static"));

// Root endpoint
app.get("/", (req, res) => {
  res.send("Hello World!");
});

// Sanity check endpoint
app.post("/sanity", (req, res) => {
  res.send(req.body);
});

// Endpoint to generate text and images
app.post("/text", async (req, res) => {
  try {
    const fullUuid = uuidv4();
    const text = req.body.text;

    // Generate a paragraph about the input text
    const promptParagraph = `Write a small paragraph about ${text} (don't add any styles or links. Just a plain paragraph.)`;
    const generatedText = await get_text_wrapper(promptParagraph);
    console.log(generatedText);

    // Create a unique user ID and necessary folders
    const user_id = fullUuid.substring(0, 7);
    makeFolder(user_id, "static");

    // Extract keywords from the generated text
    const promptKeywords = `Give me a few (about seven) comma separated values from ${generatedText} (no extra text or spaces)`;
    let keywords = await get_text_wrapper(promptKeywords);
    keywords = keywords.split(",").map((keyword) => keyword.trim());

    // Search and download images based on keywords
    const imageUrls = await searchImages(keywords);
    await downloadImages(imageUrls, `static/${user_id}/images`);

    // Send the generated text and user ID back to the client
    res.send({ text: generatedText, user_id: user_id });
  } catch (error) {
    console.error(`Error in /text endpoint: ${error.message}`);
    res.status(500).send({ error: "An error occurred while processing your request." });
  }
});

// Endpoint to generate voiceover and video
app.post("/edittext", async (req, res) => {
  try {
    const text = req.body.text;
    const user_id = req.body.user_id;

    // Generate voiceover from the provided text
    const voiceoverPath = `static/${user_id}/audio/voiceover.mp3`;
    await generateVoiceover(text, voiceoverPath);

    // Create video slideshow using images and voiceover
    const imagesPath = `static/${user_id}/images`;
    const videoOutputPath = `static/${user_id}/video/video.mp4`;
    await createVideoSlideshow(imagesPath, voiceoverPath, videoOutputPath);

    // Send the video URL back to the client
    res.send({ videoUrl: `${user_id}/video/video.mp4` });
  } catch (error) {
    console.error(`Error in /edittext endpoint: ${error.message}`);
    res.status(500).send({ error: "An error occurred while processing your request." });
  }
});

// Start the server
const server = app.listen(3000, "0.0.0.0", () => {
  const port = server.address().port;
  console.log(`App listening on port ${port}!`);
});