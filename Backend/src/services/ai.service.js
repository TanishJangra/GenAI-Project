const { GoogleGenAI } = require("@google/genai");
const { z } = require("zod");
const { zodToJsonSchema } = require("zod-to-json-schema");
const puppeteer = require("puppeteer");

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
    title: data.title || "Software Engineer",
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
    title: z.string().describe("The title of the job for which the interview report is generated"),
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
    - Include a "title" field (job title based on job description)
    - technicalQuestions: array of objects with question, intention, answer
    - behavioralQuestions: same structure
    - skillGaps: array of {skill, severity}
    - preparationPlan: array of {day, focus, tasks[]}

    Return ONLY valid JSON.
    `;

  try {
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
    
  } catch (error) {
    console.error("Error generating interview report:", error);
    throw error;
  }
}

async function generatePdfFromHtml(htmlContent) {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.setContent(htmlContent, { waitUntil: "networkidle0" });

    const pdfBuffer = await page.pdf({
        format: "A4", margin: {
            top: "20mm",
            bottom: "20mm",
            left: "15mm",
            right: "15mm"
        }
    });

    await browser.close();

    return pdfBuffer;
}

async function generateResumePdf({ resume, selfDescription, jobDescription }) {

    const resumePdfSchema = z.object({
        html: z.string().describe("The HTML content of the resume which can be converted to PDF using any library like puppeteer")
    })

    const prompt = `Generate resume for a candidate with the following details:
                        Resume: ${resume}
                        Self Description: ${selfDescription}
                        Job Description: ${jobDescription}

                        the response should be a JSON object with a single field "html" which contains the HTML content of the resume which can be converted to PDF using any library like puppeteer.
                        The resume should be tailored for the given job description and should highlight the candidate's strengths and relevant experience. The HTML content should be well-formatted and structured, making it easy to read and visually appealing.
                        The content of resume should be not sound like it's generated by AI and should be as close as possible to a real human-written resume.
                        you can highlight the content using some colors or different font styles but the overall design should be simple and professional.
                        The content should be ATS friendly, i.e. it should be easily parsable by ATS systems without losing important information.
                        The resume should not be so lengthy, it should ideally be 1-2 pages long when converted to PDF. Focus on quality rather than quantity and make sure to include all the relevant information that can increase the candidate's chances of getting an interview call for the given job description.
                    `

    const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: zodToJsonSchema(resumePdfSchema),
        }
    })


    const jsonContent = JSON.parse(response.text);

    const pdfBuffer = await generatePdfFromHtml(jsonContent.html);

    return pdfBuffer;

}

module.exports = { invoke, generateInterviewReport, generateResumePdf };
