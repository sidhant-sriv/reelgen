// llm_get.js
const { GoogleGenerativeAI } = require("@google/generative-ai");
require("dotenv").config();

console.log("Loaded API_KEY:", process.env.API_KEY);

/**
 * Generates text using the language model based on the provided prompt.
 * @param {string} prompt - The prompt to generate text from.
 * @returns {Promise<string>} - The generated text.
 */
async function get_text(prompt) {
  try {
    // Initialize the Google Generative AI client with your API key
    const genAI = new GoogleGenerativeAI(process.env.API_KEY);

    // Get the generative model
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // Generate content based on the prompt
    const result = await model.generateContent(prompt);

    // Retrieve the generated text
    const text = await result.response.text();

    return text;
  } catch (error) {
    console.error(`Error in get_text: ${error.message}`);
    throw error;
  }
}

/**
 * Wrapper function for get_text to handle additional processing if needed.
 * @param {string} prompt - The prompt to generate text from.
 * @returns {Promise<string>} - The generated text.
 */
async function get_text_wrapper(prompt) {
  try {
    const generatedText = await get_text(prompt);
    return generatedText;
  } catch (error) {
    console.error(`Error in get_text_wrapper: ${error.message}`);
    throw error;
  }
}

module.exports = { get_text_wrapper };