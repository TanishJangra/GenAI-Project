const { GoogleGenAI } = require("@google/genai");
const { z } = require("zod");
const { zodToJsonSchema } = require("zod-to-json-schema");

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
  console.log("response from ai: ", response.text);
};

const groupIntoQA = (arr) => {
  if (!Array.isArray(arr)) return [];

  const result = [];

  for (let i = 0; i < arr.length; i += 6) {
    result.push({
      question: arr[i + 1] || "Default question",
      intention: arr[i + 3] || "Check understanding",
      answer: arr[i + 5] || "Provide structured answer"
    });
  }

  return result;
};

const normalizeSkillGaps = (arr) => {
  if (!Array.isArray(arr)) return [];

  const result = [];

  for (let i = 0; i < arr.length; i += 4) {
    result.push({
      skill: arr[i + 1] || "Unknown skill",
      severity: ["Low", "Medium", "High"].includes(arr[i + 3])
        ? arr[i + 3]
        : "Medium"
    });
  }

  return result;
};

const normalizePreparationPlan = (arr) => {
  if (!Array.isArray(arr)) return [];

  const result = [];

  for (let i = 0; i < arr.length; i += 3) {
    result.push({
      day: parseInt(arr[i]?.replace(/\D/g, "")) || (i / 3 + 1),
      focus: arr[i + 1] || "General Prep",
      tasks: [arr[i + 2] || "Study topic"]
    });
  }

  return result;
};

const normalizeInterviewReport = (data) => {
  return {
    matchScore: typeof data.matchScore === "number" ? data.matchScore : 70,

    technicalQuestions: groupIntoQA(data.technicalQuestions),
    behavioralQuestions: groupIntoQA(data.behavioralQuestions),

    skillGaps: normalizeSkillGaps(data.skillGaps),

    preparationPlan: normalizePreparationPlan(data.preparationPlan)
  };
};

const interviewReportSchema = z.object({
  matchScore: z
    .number()
    .min(0)
    .max(100)
    .describe(
      "The match score between the candidate and the job describe, which indicates how well the candidate's resume and self-describe match the requirements of the job describe",
    ),
  technicalQuestions: z
    .array(
      z.object({
        question: z
          .string()
          .describe("The technical question can be asked during the interview"),
        intention: z
          .string()
          .describe(
            "The intention of interviewer behind asking the technical question",
          ),
        answer: z
          .string()
          .describe(
            "How to answer this question, what points to cover, how to structure the answer, etc.",
          ),
      }),
    )
    .describe(
      "Technical questions that can be asked during the interview along with the intention behind asking those questions and how to answer them",
    ),
  behavioralQuestions: z
    .array(
      z.object({
        question: z
          .string()
          .describe(
            "The behavioral question can be asked during the interview",
          ),
        intention: z
          .string()
          .describe(
            "The intention of interviewer behind asking the behavioral question",
          ),
        answer: z
          .string()
          .describe(
            "How to answer this question, what points to cover, how to structure the answer, etc.",
          ),
      }),
    )
    .describe(
      "Behavioral questions that can be asked during the interview along with the intention behind asking those questions and how to answer them",
    ),
  skillGaps: z
    .array(
      z.object({
        skill: z
          .string()
          .describe("The skill in which the candidate is lacking"),
        severity: z
          .enum(["Low", "Medium", "High"])
          .describe("The severity of the skill gap"),
      }),
    )
    .describe(
      "The skills in which the candidate is lacking along with the severity of those skill gaps",
    ),
  preparationPlan: z
    .array(
      z.object({
        day: z.number().describe("The day number in the preparation plan"),
        focus: z
          .string()
          .describe(
            "The main focus of the day in the preparation plan e.g, data structures, system design, mock interviews, etc.",
          ),
        tasks: z
          .array(z.string())
          .describe(
            "The tasks to be completed on that day in the preparation plan",
          ),
      }),
    )
    .describe(
      "The preparation plan for the candidate to prepare for the interview, which includes the day number, main focus of the day, and the tasks to be completed on that day",
    ),
});

async function generateInterviewReport({
  resume,
  selfDescription,
  jobDescription,
}) {
  const prompt = `
    You are an expert technical interviewer.

    Analyze the following candidate:

    Resume:
    ${resume}

    Self Description:
    ${selfDescription}

    Job Description:
    ${jobDescription}

    IMPORTANT INSTRUCTIONS:
    - You MUST return a complete JSON object.
    - Do NOT return empty arrays.
    - matchScore must be between 0 and 100.
    - Provide at least:
    - 5 technical questions
    - 3 behavioral questions
    - 3 skill gaps
    - 5-day preparation plan
    - Be detailed and realistic.

    Each field MUST strictly follow this structure:
    - technicalQuestions: array of objects with question, intention, answer
    - behavioralQuestions: same structure
    - skillGaps: array of {skill, severity}
    - preparationPlan: array of {day, focus, tasks[]}

    Return ONLY valid JSON.
    `;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: [
    {
        role: "user",
        parts: [{ text: prompt }]
    }
    ],
    config: {
      responseMimeType: "application/json",
      responseJsonSchema: zodToJsonSchema(interviewReportSchema),
    },
  });
  const raw = JSON.parse(response.text);
  console.log("Raw AI Response: ", raw);
  const interviewReport = normalizeInterviewReport(raw);
  console.log("Generated Interview Report: ", interviewReport);
  return interviewReport;
}

module.exports = { invoke, generateInterviewReport };
