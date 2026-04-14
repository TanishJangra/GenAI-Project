const mongoose = require('mongoose');

const technicalQuestionSchema = new mongoose.Schema({
    question: { type: String, required: [true, 'Question is required'] },
    intention: { type: String, required: [true, 'Intention is required'] },
    answer: { type: String, required: [true, 'Answer is required'] },
}, { _id: false });

const behavioralQuestionSchema = new mongoose.Schema({
    question: { type: String, required: [true, 'Question is required'] },
    intention: { type: String, required: [true, 'Intention is required'] },
    answer: { type: String, required: [true, 'Answer is required'] },
}, { _id: false });

const skillGapSchema = new mongoose.Schema({
    skill: { type: String, required: [true, 'Skill is required'] },
    severity: { type: String, enum: ['Low', 'Medium', 'High'], required: [true, 'Severity is required'] }
}, { _id: false });

const preparationPlanSchema = new mongoose.Schema({
    day: { type: Number, required: [true, 'Day is required'] },
    focus: { type: String, required: [true, 'Focus is required'] },
    tasks: { type: [String], required: [true, 'Tasks are required'] }
}, { _id: false });

const interviewReportSchema = new mongoose.Schema({
    jobDescription: { type: String, required: [true, 'Job description is required'] },
    resume: { type: String },
    selfDescription: { type: String },
    matchScore: { type: Number, required: [true, 'Match score is required'], min: 0, max: 100 },
    technicalQuestions: { type: [technicalQuestionSchema], required: [true, 'Technical questions are required'] },
    behavioralQuestions: { type: [behavioralQuestionSchema], required: [true, 'Behavioral questions are required'] },
    skillGaps: { type: [skillGapSchema], required: [true, 'Skill gaps are required'] },
    preparationPlan: { type: [preparationPlanSchema], required: [true, 'Preparation plan is required'] },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'User reference is required']
    }

}, { timestamps: true });

const InterviewReportModel = mongoose.model('InterviewReport', interviewReportSchema);

module.exports = InterviewReportModel;