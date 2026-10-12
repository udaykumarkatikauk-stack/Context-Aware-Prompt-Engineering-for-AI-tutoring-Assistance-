const mongoose = require('mongoose');

const agentConfigSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    twilioSid: { type: String, default: "" },
    twilioToken: { type: String, default: "" },
    twilioNumber: { type: String, default: "" },
    customerMongoUri: { type: String, default: "" },
    // Array of objects representing conversation steps
    nodes: { type: Array, default: [] }, 
    updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('AgentConfig', agentConfigSchema);