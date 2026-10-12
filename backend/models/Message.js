const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
    roomId: String,
    payload: Object, 
    tempId: String, 
    createdAt: { type: Date, default: Date.now }
});

// This check prevents the OverwriteModelError
module.exports = mongoose.models.Message || mongoose.model("Message", messageSchema);