const {GoogleGenAI} = require("@google/genai");
const {z} = require("zod");
const {zodToJsonSchema} = require("zod-to-json-schema");

const ai = new GoogleGenAI({
    apiKey: process.env.GOOGLE_API_KEY,
});

const invoke = async () => {
    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [
      {
        role: "user",
        parts: [{ text: "Hello, how are you?" }],
      },
    ],
    });
    console.log("response from ai: ",response.text);
}

async function generateInterviewReport({resume, selfDescription, jobDescription}) {
    const schema = z.object({
        strengths: z.array(z.string()),
        weaknesses: z.array(z.string()),
        suggestions: z.array(z.string()),
    });
    const jsonSchema = zodToJsonSchema(schema);
    const response = await ai.models.generateContent({
        model: "gemini-2.0-flash",
        contents: [
            {
                role: "system",
                parts: [{ text: "You are an expert career counselor providing feedback on job applications." }]
            },
            {
                role: "user",
                parts: [{ text: `Please analyze the following resume, self-description, and job description to provide feedback on the candidate's strengths, weaknesses, and suggestions for improvement. Format your response according to the following JSON schema: ${JSON.stringify(jsonSchema)}. Resume: ${resume} Self-description: ${selfDescription} Job Description: ${jobDescription}` }]
            }
        ]
    });
    return response.choices[0].message.parts[0].text;
}

module.exports = { invoke, generateInterviewReport };