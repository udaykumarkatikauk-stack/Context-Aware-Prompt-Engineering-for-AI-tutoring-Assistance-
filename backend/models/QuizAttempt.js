const mongoose = require('mongoose');

const quizAttemptSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    conversationId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Conversation',
        required: true
    },
    question: {
        type: String,
        required: true,
        trim: true
    },
    options: {
        type: [String],
        required: true
    },

    // ✅ FIX: store index instead of text
    correctAnswerIndex: {
        type: Number,
        required: true
    },

    userAnswerIndex: {
        type: Number,
        default: null
    },
    isCorrect: {
        type: Boolean,
        default: null
    },
    askedAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('QuizAttempt', quizAttemptSchema);
