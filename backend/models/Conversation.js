const mongoose = require('mongoose');

// This schema defines a single message within a conversation
const messageSchema = new mongoose.Schema({
    role: {
        type: String,
        enum: ['user', 'model'], 
        required: true
    },
    parts: [{ 
        text: {
            type: String,
            required: true
        }
    }],
    videos: [{
        title: String,
        url: String,
        thumbnail: String,
        duration: String
    }],
    sources: [{
        title: String,
        url: String
    }],
    timestamp: {
        type: Date,
        default: Date.now
    }
});

// This schema defines the entire conversation history for a single user
const conversationSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true, 
        index: true
    },
    messages: [messageSchema], 
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Update the 'updatedAt' field on save
conversationSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

const Conversation = mongoose.model('Conversation', conversationSchema);
module.exports = Conversation;