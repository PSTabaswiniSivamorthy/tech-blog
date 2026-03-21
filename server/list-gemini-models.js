const fetch = require("node-fetch");

const apiKey = "AIzaSyC2PTOzpJyxwsHdn5d2M75fZLjy1xuS5rA";

async function listModels() {
  try {
    console.log("Attempting to list available Gemini models...\n");
    
    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
    console.log("Endpoint:", url.replace(apiKey, "***API_KEY***"));
    
    const response = await fetch(url);
    const data = await response.json();
    
    if (!response.ok) {
      console.log("\n❌ API Error:");
      console.log("Status:", response.status);
      console.log("Response:", JSON.stringify(data, null, 2));
      return;
    }
    
    console.log("\n✅ Available Models:");
    if (data.models && Array.isArray(data.models)) {
      data.models.forEach(model => {
        console.log(`\n📦 ${model.name}`);
        console.log(`   Display Name: ${model.displayName}`);
        console.log(`   Description: ${model.description}`);
        if (model.supportedGenerationMethods) {
          console.log(`   Methods: ${model.supportedGenerationMethods.join(", ")}`);
        }
      });
    } else {
      console.log(JSON.stringify(data, null, 2));
    }
  } catch (error) {
    console.error("Error:", error.message);
  }
}

listModels();
