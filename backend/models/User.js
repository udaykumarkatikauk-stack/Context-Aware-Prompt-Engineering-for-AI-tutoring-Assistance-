const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true, select: false },
    isVerified: { type: Boolean, default: false },
    // --- Student Profile Fields ---
    age: { type: Number, min: 5, max: 100, default: null },
    current_education: { type: String, trim: true, default: null },
    course_enrolled: { type: String, trim: true, default: null },
    knowledge_level: { type: String, enum: ['Beginner', 'Intermediate', 'Expert', null], default: null },
    // --- OTP fields ---
    otp: String,
    otpExpires: Date,
    otpPurpose: { type: String, enum: ['signup', 'password_reset'], default: 'signup' },
    resetToken: String,
    createdAt: { type: Date, default: Date.now, index: { expires: '6m', partialFilterExpression: { isVerified: false, otpPurpose: 'signup' } } }
});

userSchema.pre('save', async function (next) { 
    if (this.isModified('password')) { 
        this.password = await bcrypt.hash(this.password, 10); 
    } 
    next(); 
});

const User = mongoose.model('User', userSchema);
module.exports = User;