const mongoose = require('mongoose');

const lessonSchema = new mongoose.Schema({
    id: Number,
    type: { type: String, enum: ['info', 'quiz', 'codeChallenge', 'code_fill_in_the_blank'] },
    title: String,
    content: String,
    question: String,
    options: [String],
    correct: String,
    expectedAnswer: String,
    starterCode: String,
    placeholders: mongoose.Schema.Types.Mixed,
    blocks: [String],
    language: String
});

const moduleSchema = new mongoose.Schema({
    id: Number,
    title: String,
    lessons: [lessonSchema]
});

const courseSchema = new mongoose.Schema({
    title: String,
    level: Number, // 1, 2, or 3
    language: String, // 'htmlcssjs' or 'prompt_engineering'
    modules: [moduleSchema]
}, { timestamps: true });

// Create a unique index to prevent duplicate levels for the same language
courseSchema.index({ language: 1, level: 1 }, { unique: true });

module.exports = mongoose.model('Course', courseSchema);