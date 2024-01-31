const { GoogleGenerativeAI } = require("@google/generative-ai");
require("dotenv").config();

// Access your API key as an environment variable (see "Set up your API key" above)
const genAI = new GoogleGenerativeAI(process.env.GEMINIAPI);

async function get_text(prompt) {
  try {
    // For text-only input, use the gemini-pro model
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = await response.text(); // Await here to get the actual text value
    return text;
  } catch (error) {
    console.error(`Error in get_text: ${error.message}`);
    throw error; // Re-throw the error for handling in the calling code, if needed
  }
}

async function get_text_wrapper(prompt) {
    try {
      const generatedText = await generateText(prompt);
      return generatedText;
    } catch (error) {
      console.error(`Error in get_text_wrapper: ${error.message}`);
      throw error;
    }
  }

