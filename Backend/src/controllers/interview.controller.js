const pdfParse = require('pdf-parse');
const { generateInterviewReport } = require('../services/ai.service');
const interviewReportModel = require('../model/interviewReport.model');
const { generateResumePdf } = require('../services/ai.service');

async function generateInterviewReportController(req, res) {

    try {
        const resumeContent = await (new pdfParse.PDFParse(Uint8Array.from(req.file.buffer))).getText();
        const { selfDescription, jobDescription } = req.body;

        const interviewReportByAi = await generateInterviewReport({
            resume: resumeContent.text,
            selfDescription,
            jobDescription
        });

        const interviewReport = await interviewReportModel.create({
            user: req.user.id,
            jobDescription,
            resume: resumeContent.text,
            selfDescription,
            matchScore: interviewReportByAi.matchScore || 70,
            technicalQuestions: interviewReportByAi.technicalQuestions || [],
            behavioralQuestions: interviewReportByAi.behavioralQuestions || [],
            skillGaps: interviewReportByAi.skillGaps || [],
            preparationPlan: interviewReportByAi.preparationPlan || [],
            title: interviewReportByAi.title || "Software Engineer"
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

async function getInterviewReportByIdController(req, res) {

    const { interviewId } = req.params

    try {
        const interviewReport = await interviewReportModel.findOne({ _id: interviewId, user: req.user.id })
    
        if (!interviewReport) {
            return res.status(404).json({
                message: "Interview report not found."
            })
        }
    
        res.status(200).json({
            message: "Interview report fetched successfully.",
            interviewReport
        })
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching interview report',
            error: error.message
        });
    }
}

async function getAllInterviewReportsController(req, res) {
    try {
        const interviewReports = await interviewReportModel.find({ user: req.user.id }).sort({ createdAt: -1 }).select("-resume -selfDescription -jobDescription -__v -technicalQuestions -behavioralQuestions -skillGaps -preparationPlan")
    
        res.status(200).json({
            message: "Interview reports fetched successfully.",
            interviewReports
        })
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching interview reports',
            error: error.message
        });
    }
}

async function generateResumePdfController(req, res) {
    const { interviewReportId } = req.params

    const interviewReport = await interviewReportModel.findById(interviewReportId)

    if (!interviewReport) {
        return res.status(404).json({
            message: "Interview report not found."
        })
    }

    const { resume, jobDescription, selfDescription } = interviewReport

    const pdfBuffer = await generateResumePdf({ resume, jobDescription, selfDescription })

    res.set({
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename=resume_${interviewReportId}.pdf`
    })

    res.send(pdfBuffer)
}

module.exports = {
    generateInterviewReportController,
    getInterviewReportByIdController,
    getAllInterviewReportsController,
    generateResumePdfController
};