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

const interviewReportSchema = z.object({
    matchScore: z.number().min(0).max(100).describe("The match score between the candidate and the job describe, which indicates how well the candidate's resume and self-describe match the requirements of the job describe"),
    technicalQuestions: z.array(z.object({
        question: z.string().describe("The technical question can be asked during the interview"),
        intention: z.string().describe("The intention of interviewer behind asking the technical question"),
        answer: z.string().describe("How to answer this question, what points to cover, how to structure the answer, etc."),
    })).describe("Technical questions that can be asked during the interview along with the intention behind asking those questions and how to answer them"),
    behavioralQuestions: z.array(z.object({
        question: z.string().describe("The behavioral question can be asked during the interview"),
        intention: z.string().describe("The intention of interviewer behind asking the behavioral question"),
        answer: z.string().describe("How to answer this question, what points to cover, how to structure the answer, etc."),
    })).describe("Behavioral questions that can be asked during the interview along with the intention behind asking those questions and how to answer them"),
    skillGaps: z.array(z.object({
        skill: z.string().describe("The skill in which the candidate is lacking"),
        severity: z.enum(['Low', 'Medium', 'High']).describe("The severity of the skill gap"),
    })).describe("The skills in which the candidate is lacking along with the severity of those skill gaps"),
    preparationPlan: z.array(z.object({
        day: z.number().describe("The day number in the preparation plan"),
        focus: z.string().describe("The main focus of the day in the preparation plan e.g, data structures, system design, mock interviews, etc."),
        tasks: z.array(z.string()).describe("The tasks to be completed on that day in the preparation plan"),
    })).describe("The preparation plan for the candidate to prepare for the interview, which includes the day number, main focus of the day, and the tasks to be completed on that day")
});

async function generateInterviewReport({resume, selfDescription, jobDescription}) {
    
    const prompt = `Generate an interview report for a candidate with the following details:
                        Resume: ${resume}
                        Self Description: ${selfDescription}
                        Job Description: ${jobDescription}`

    const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseJsonSchema: zodToJsonSchema(interviewReportSchema),
        }
    });

    const interviewReport = JSON.parse(response.text);
    console.log("Generated Interview Report: ", interviewReport);
    return interviewReport;
}

module.exports = { invoke, generateInterviewReport };