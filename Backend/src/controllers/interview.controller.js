const pdfParse = require('pdf-parse');
const { generateInterviewReport } = require('../services/ai.service');
const InterviewReportModel = require('../model/interviewReport.model');

async function generateInterviewReportController(req, res) {

    try {
        const resumeContent = await (new pdfParse.PDFParse(Uint8Array.from(req.file.buffer))).getText();
        const { selfDescription, jobDescription } = req.body;

        const interviewReportByAi = await generateInterviewReport({
            resume: resumeContent.text,
            selfDescription,
            jobDescription
        });

        const interviewReport = await InterviewReportModel.create({
            user: req.user.id,
            jobDescription,
            resume: resumeContent.text,
            selfDescription,
            matchScore: interviewReportByAi.matchScore || 70,
            technicalQuestions: interviewReportByAi.technicalQuestions || [],
            behavioralQuestions: interviewReportByAi.behavioralQuestions || [],
            skillGaps: interviewReportByAi.skillGaps || [],
            preparationPlan: interviewReportByAi.preparationPlan || []
        });

        res.status(201).json({
            success: true,
            message: 'Interview report generated successfully',
            interviewReport
        });


    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error generating interview report',
            error: error.message
        });
    }

}

module.exports = {
    generateInterviewReportController
};