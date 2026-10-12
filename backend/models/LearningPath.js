const mongoose = require('mongoose');

const moduleSchema = new mongoose.Schema({
    title: { type: String, required: true },
    status: {
        type: String,
        enum: ['locked', 'unlocked', 'completed'],
        default: 'locked'
    },
    accuracy: { type: Number, default: 0 },
    attempts: { type: Number, default: 0 }
});

const learningPathSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        unique: true,
        required: true,
        index: true
    },
    subject: {
        type: String,
        required: true
    },
    currentModuleIndex: {
        type: Number,
        default: 0
    },
    modules: [moduleSchema],
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const LearningPath = mongoose.model('LearningPath', learningPathSchema);
module.exports = LearningPath;