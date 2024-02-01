const { v4: uuidv4 } = require("uuid");
const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const axios = require("axios");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const gtts = require("gtts");
require("dotenv").config();
const videoshow = require("videoshow");
const sharp = require("sharp");

const { get_text_wrapper } = require("./llm_get.js");
const { makeFolder } = require("./folderstuff.js");
const { searchImages, downloadImages } = require("./imgget.js");
const { generateVoiceover } = require("./audiogen.js");
const { createVideoSlideshow } = require("./moviegen.js");
const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static("./static"));

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.post("/text", async (req, res) => {
  const fullUuid = uuidv4();
  const text = req.body.text;

  let txt = await get_text_wrapper(
    `Write a small paragraph about ${text} (don't add any styles or links. Just a plain paragraph.)`
  );

  console.log(txt);
  const user_id = fullUuid.substring(0, 7);
  makeFolder(user_id, "static");

  let keywords = await get_text_wrapper(
    `Give me a few (about seven) comma separated values from ${txt} (no extra text or spaces)`
  );

  keywords = keywords.split(",");
  keywords = keywords.map((keyword) => keyword.trim());

  searchImages(keywords)
    .then((imageUrls) => downloadImages(imageUrls, `static/${user_id}/images`))
    .then(() => res.send({ text: txt, user_id: user_id }))
    .catch((error) => console.error(`Error: ${error.message}`));

  //   await res.send({ text: txt,  user_id: user_id });
});

app.post("/edittext", async (req, res) => {
  //Get the text from the user and user_id
  const text = req.body.text;
  const user_id = req.body.user_id;
  //Generate the voiceover
  const voiceoverPath = `static/${user_id}/audio/voiceover.mp3`;
  await generateVoiceover(text, voiceoverPath);
  await createVideoSlideshow(
    `static/${user_id}/images`,
    `${voiceoverPath}`,
    `static/${user_id}/video/video.mp4`
  )
    .then(res.send({ videoUrl: `${user_id}/video/video.mp4` }))
    .catch((error) => console.error(`Error: ${error.message}`));
});

const server = app.listen(0, () => {
  const port = 3000;
  console.log(`app listening on port ${port}!`);
});
