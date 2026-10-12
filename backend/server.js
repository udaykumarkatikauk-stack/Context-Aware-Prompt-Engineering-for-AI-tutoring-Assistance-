// Load environment variables from .env file
require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs'); 
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const Groq = require("groq-sdk");
const http = require('http');
const { Server } = require("socket.io"); 
const ytSearch = require('yt-search');
const axios = require('axios');
const { pipeline } = require('@xenova/transformers');



const connectDB = require('./db');


const User = require('./models/User');
const Conversation = require('./models/Conversation');
const QuizAttempt = require('./models/QuizAttempt'); 
const LearningPath = require('./models/LearningPath');
const Project = require('./models/Project');
const Course = require('./models/Course');
const UserProgress = require('./models/UserProgress');
const Message = require('./models/Message'); // Line 30-ish
const AgentConfig = require('./models/AgentConfig');


// --- Configuration ---
const app = express();
const port = process.env.PORT || 5000;
const uri = process.env.MONGODB_URI;
const JWT_SECRET = process.env.JWT_SECRET;

const httpServer = http.createServer(app); 

const io = new Server(httpServer, {
    cors: { origin: "*" }
});

// --- AI Configuration (Groq) ---
const GROQ_API_KEY = process.env.GROQ_API_KEY;

if (!GROQ_API_KEY) {
    console.warn("⚠️ GROQ_API_KEY missing. AI chat will not work.");
}

// Initialize Groq
const groq = new Groq({ apiKey: GROQ_API_KEY });

// Nodemailer Config
const GMAIL_USER = process.env.GMAIL_USER;
const GMAIL_PASS = process.env.GMAIL_PASS; 

// --- Middlewares ---
app.use(cors());
app.use(express.json());

io.on("connection", (socket) => {
    console.log("New client connected to secure chat");

    socket.on("join-room", async (roomId) => {
        socket.join(roomId);
        // Send history to the user who just joined
        const messages = await Message.find({ roomId }).sort({ createdAt: 1 });
        socket.emit("previous-messages", messages);
    });

    socket.on("send-message", async ({ roomId, payload, tempId }) => {
    // 1. Save the message to DB
    const msg = await Message.create({ 
        roomId, 
        payload, 
        tempId,
        senderId: socket.id // <-- ADD THIS: Track which socket sent it
    });

    // 2. Broadcast to everyone in the room
    io.to(roomId).emit("receive-message", msg);
});
    socket.on("delete-messages", async ({ roomId, messageIds }) => {
        try {
            const objectIds = messageIds.map(id => new mongoose.Types.ObjectId(id));
            await Message.deleteMany({ _id: { $in: objectIds }, roomId });
            io.to(roomId).emit("messages-deleted", { messageIds });
        } catch (error) {
            console.error("Delete error:", error);
        }
    });

    socket.on("disconnect", () => console.log("Client disconnected"));
});


// =======================================================
// 0. NODEMAILER SETUP
// =======================================================

let transporter;
if (GMAIL_USER && GMAIL_PASS) {
    transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: GMAIL_USER, 
            pass: GMAIL_PASS, 
        },
    });
} else {
    console.warn("⚠️ Nodemailer credentials missing. Email sending functionality is disabled.");
}

// =======================================================
// 2. MIDDLEWARE (Authentication)
// =======================================================

// Check for token in headers (Bearer token)
const protect = (req, res, next) => {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];
            const decoded = jwt.verify(token, JWT_SECRET);
            req.userId = decoded.id;
            next();
        } catch (error) {
            console.error('Token verification error:', error.message);
            return res.status(401).json({ message: 'Not authorized, token failed or expired.' });
        }
    }
    if (!token) {
        return res.status(401).json({ message: 'Not authorized, no token.' });
    }
};

// =======================================================
// 3. UTILITY FUNCTIONS (OTP Generation/Email)
// =======================================================

const generateOTP = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * Sends the OTP email using Nodemailer.
 */
const sendOTP = async (email, otp, purpose) => {
    if (!transporter) {
        throw new Error("Email sending failed: Transporter not configured.");
    }
    
    const subject = purpose === 'password_reset' 
        ? 'Password Reset Verification Code' 
        : 'Account Verification Code';
    
    try {
        await transporter.sendMail({
            from: GMAIL_USER,
            to: email,
            subject: `Task Manager - ${subject}`,
            html: `
                <div style="font-family: Arial, sans-serif; padding: 20px;">
                    <h2>${subject}</h2>
                    <p>Please use the following code to complete your request:</p>
                    <div style="font-size: 24px; font-weight: bold; color: #3498db; margin: 15px 0; padding: 10px; border: 1px solid #ccc; display: inline-block;">
                        ${otp}
                    </div>
                    <p>This code is valid for 5 minutes.</p>
                </div>
            `,
        });
        console.log(`[EMAIL] OTP sent successfully to ${email} for ${purpose}.`);
    } catch (error) {
        console.error(`[EMAIL ERROR] Failed to send OTP email to ${email}:`, error); 
        throw new Error("Email sending failed due to configuration or network issue.");
    }
};

// --- DURATION FORMATTING UTILITY ---
const formatDuration = (millis) => {
    if (millis < 60000) return "Less than a minute";
    
    let days = Math.floor(millis / (1000 * 60 * 60 * 24));
    millis %= (1000 * 60 * 60 * 24);
    let hours = Math.floor(millis / (1000 * 60 * 60));
    millis %= (1000 * 60 * 60);
    let minutes = Math.floor(millis / (1000 * 60));

    let parts = [];
    if (days > 0) parts.push(`${days} day${days > 1 ? 's' : ''}`);
    if (hours > 0) parts.push(`${hours} hour${hours > 1 ? 's' : ''}`);
    if (minutes > 0) parts.push(`${minutes} minute${minutes > 1 ? 's' : ''}`);
    
    return parts.join(', ');
};


 // 🔹 System Prompt for AI Tutor
const systemPrompt = `
You are an expert AI Tutor.

Rules:
1. Explain clearly and encouragingly.
2. Determine if the user is asking a "Learning Question" (e.g. asking to explain a concept) or "Casual/Personal" (e.g. "Hi", "How are you?").
3. If it is a Learning Question, generate ONE MCQ and a YouTube search query in strict JSON at the very end. 
4. If it is Casual/Personal, do NOT generate any JSON. Just reply normally.

FORMAT FOR LEARNING QUESTIONS:
\`\`\`json
{
  "searchQuery": "A concise 2-3 word YouTube search query for this topic",
  "question": "Question text",
  "options": ["Option 0", "Option 1", "Option 2", "Option 3"],
  "correctAnswerIndex": 2
}
\`\`\`
`;

// =======================================================
// 4. HANDLERS (Controllers)
// =======================================================

// A. Signup Handler
const signupHandler = async (req, res) => {
    const { name, email, password } = req.body;

    try {
        let user = await User.findOne({ email });

        if (user && user.isVerified) {
            return res.status(400).json({ message: 'User already exists and is verified.' });
        }
        
        const otp = generateOTP();
        const otpExpires = Date.now() + (5 * 60 * 1000); // 5 minutes validity

        if (user) {
            // Update existing unverified user
            user.name = name;
            user.password = password; 
            user.otp = otp;
            user.otpExpires = otpExpires;
            user.isVerified = false; 
            user.otpPurpose = 'signup'; 
        } else {
            // Create new temporary user
            user = new User({ name, email, password, otp, otpExpires, otpPurpose: 'signup' });
        }
        
        await user.save();
        
        await sendOTP(email, otp, 'signup'); 

        res.status(201).json({ 
            message: 'User registered. Please check your email for the verification OTP.',
        });

    } catch (error) {
        console.error('Signup error:', error);
        // Clean up unverified user if save succeeded but email failed
        if (error.message && error.message.includes("Email sending failed")) {
             await User.deleteOne({ email, isVerified: false });
        }
        res.status(500).json({ message: 'Server error during registration.' });
    }
};

// B. OTP Verification Handler (for Signup)
const verifyOtpHandler = async (req, res) => {
    const { email, otp } = req.body;

    try {
        const user = await User.findOne({ email });

        if (!user || user.otpPurpose !== 'signup') {
            return res.status(404).json({ message: 'User not found or verification flow is incorrect.' });
        }

        if (user.isVerified) {
            return res.status(200).json({ message: 'Account is already verified.' });
        }

        if (user.otpExpires < Date.now()) {
            return res.status(400).json({ message: 'OTP expired. Please sign up again.' });
        }

        if (user.otp !== otp) {
            return res.status(400).json({ message: 'Invalid OTP.' });
        }

        // SUCCESS: Finalize user profile
        user.isVerified = true;
        user.otp = undefined;
        user.otpExpires = undefined;
        user.otpPurpose = undefined;
        await user.save();

        res.status(200).json({ 
            message: 'OTP verified successfully. User profile created!'
        });

    } catch (error) {
        console.error('Verification error:', error);
        res.status(500).json({ message: 'Server error during OTP verification.' });
    }
};

// C. Signin Handler
const signinHandler = async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await User.findOne({ email }).select('+password');

        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials.' });
        }

        if (!user.isVerified) {
            return res.status(401).json({ message: 'Account is not verified.' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials.' });
        }

        // Generate JWT
        const token = jwt.sign(
            { id: user._id, email: user.email }, 
            JWT_SECRET, 
            { expiresIn: '1d' }
        );

        res.status(200).json({
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email
            },
            message: 'Login successful.'
        });

    } catch (error) {
        console.error('Signin error:', error);
        res.status(500).json({ message: 'Server error during signin.' });
    }
};

// D. Forgot Password Handler (Initiates Reset)
const forgotPasswordHandler = async (req, res) => {
    const { email } = req.body;

    try {
        const user = await User.findOne({ email });

        if (!user || !user.isVerified) {
            return res.status(200).json({ message: 'If an account exists, a password reset link has been sent to your email.' });
        }

        const otp = generateOTP();
        const otpExpires = Date.now() + (5 * 60 * 1000); 

        user.otp = otp;
        user.otpExpires = otpExpires;
        user.otpPurpose = 'password_reset';
        user.resetToken = undefined; 
        
        await user.save();

        await sendOTP(email, otp, 'password_reset');

        res.status(200).json({
            message: 'Password reset OTP sent to your email.'
        });

    } catch (error) {
        console.error('Forgot password error:', error);
        res.status(500).json({ message: 'Server error during password reset request.' });
    }
};

// E. Verify Reset OTP Handler
const verifyResetOtpHandler = async (req, res) => {
    const { email, otp } = req.body;

    try {
        const user = await User.findOne({ email });

        if (!user || user.otpPurpose !== 'password_reset') {
            return res.status(400).json({ message: 'Invalid email or reset request not initiated.' });
        }

        if (user.otpExpires < Date.now()) {
            return res.status(400).json({ message: 'OTP expired. Please restart the password reset process.' });
        }

        if (user.otp !== otp) {
            return res.status(400).json({ message: 'Invalid OTP.' });
        }

        const resetToken = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '10m' });

        user.resetToken = resetToken;
        user.otp = undefined;
        user.otpExpires = undefined;
        user.otpPurpose = undefined;
        await user.save();

        res.status(200).json({
            message: 'OTP verified. Use the provided token to reset your password.',
            resetToken: resetToken 
        });

    } catch (error) {
        console.error('Verify reset OTP error:', error);
        res.status(500).json({ message: 'Server error during OTP verification.' });
    }
};

// F. Reset Password Handler
const resetPasswordHandler = async (req, res) => {
    const { email, newPassword, resetToken } = req.body;

    try {
        const user = await User.findOne({ email }).select('+password');

        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }
        
        if (!user.resetToken || user.resetToken !== resetToken) {
            return res.status(401).json({ message: 'Invalid or expired reset authorization token.' });
        }
        
        jwt.verify(resetToken, JWT_SECRET, (err, decoded) => {
            if (err) {
                user.resetToken = undefined;
                user.save();
                return res.status(401).json({ message: 'Reset authorization token has expired. Please restart the forgot password process.' });
            }
        });

        user.password = newPassword; 
        user.resetToken = undefined;
        
        await user.save();

        res.status(200).json({ message: 'Password has been successfully reset. You can now sign in.' });

    } catch (error) {
        console.error('Reset password error:', error);
        res.status(500).json({ message: 'Server error during password reset.' });
    }
};

// G. Update Profile Handler
const updateProfileHandler = async (req, res) => {
    const userId = req.userId;
    const { name, age, current_education, course_enrolled, knowledge_level } = req.body;

    try {
        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ message: 'User not found.' });

        if (name) user.name = name;
        if (age) user.age = age;
        if (current_education) user.current_education = current_education;
        if (course_enrolled) user.course_enrolled = course_enrolled;
        if (knowledge_level) user.knowledge_level = knowledge_level;
        await user.save();

        if (course_enrolled) {
            // Pull Level 1 from seeded Courses
            const courseData = await Course.findOne({ language: course_enrolled, level: 1 });
            if (courseData) {
                const modulesForPath = courseData.modules.map((mod, index) => ({
                    title: mod.title,
                    status: index === 0 ? 'unlocked' : 'locked',
                }));

                await LearningPath.findOneAndUpdate(
                    { userId },
                    { userId, subject: course_enrolled, modules: modulesForPath },
                    { upsert: true }
                );

                await UserProgress.findOneAndUpdate(
                    { userId, courseId: courseData._id },
                    { userId, courseId: courseData._id },
                    { upsert: true }
                );
            }
        }
        res.status(200).json({ message: 'Profile updated.', user });
    } catch (error) { res.status(500).json({ message: 'Update error.' }); }
};

// Learning Path Handler
const getLearningPathHandler = async (req, res) => {
    try {
        const path = await LearningPath.findOne({ userId: req.userId });
        if (!path) return res.status(404).json({ message: 'Learning path not found. Please update your profile.' });
        res.json(path);
    } catch (error) { res.status(500).json({ message: 'Error fetching path.' }); }
};

// H. Get Profile Handler
const getProfileHandler = async (req, res) => {
    try {
        const user = await User.findById(req.userId).select('-password');
        res.json(user);
    } catch (error) { res.status(500).json({ message: 'Error fetching profile.' }); }
};


// Helper to initialize the local embedding model (compatible with your Python script)
// =======================================================
// GLOBAL VARIABLES & RAG HELPER
// =======================================================

let embedder; // Declared globally to persist the model in memory

/**
 * Performs a vector search in the MongoDB 'knowledge_base' collection
 * to find relevant college materials based on the user's query.
 */
const getKnowledgeContext = async (query) => {
    try {
        if (!embedder) {
            embedder = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
        }
        const output = await embedder(query, { pooling: 'mean', normalize: true });
        const vector = Array.from(output.data);

        const contextDocs = await mongoose.connection.db.collection("knowledge_base").aggregate([
            {
                "$vectorSearch": {
                    "index": "vector_index",
                    "path": "embedding",
                    "queryVector": vector,
                    "numCandidates": 100,
                    "limit": 5
                }
            },
            {
                "$project": {
                    "content": 1,
                    "metadata": 1, 
                    "score": { "$meta": "vectorSearchScore" }
                }
            }
        ]).toArray();
        return contextDocs;
    } catch (error) {
        console.error("Vector Search Error:", error);
        return [];
    }
};



// --- EVALUATION UTILITY FOR IEEE PAPER ---
const calculateSemanticAccuracy = async (botAnswer, groundTruth) => {
    try {
        if (!embedder) {
            embedder = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
        }
        // Generate embeddings for both
        const out1 = await embedder(botAnswer, { pooling: 'mean', normalize: true });
        const out2 = await embedder(groundTruth, { pooling: 'mean', normalize: true });
        
        const vec1 = Array.from(out1.data);
        const vec2 = Array.from(out2.data);

        // Calculate Cosine Similarity (Dot Product of normalized vectors)
        const similarity = vec1.reduce((acc, val, i) => acc + val * vec2[i], 0);
        return similarity; 
    } catch (err) {
        console.error("Evaluation Error:", err);
        return 0;
    }
};





// =======================================================
// CHAT HANDLER (WITH RAG & HYPER SEARCH)
// =======================================================

// --- UPDATED CHAT HANDLER (Natural Phrasing) ---
const chatHandler = async (req, res) => {
    const { message } = req.body;
    const userId = req.userId;

    try {
        const contextDocs = await getKnowledgeContext(message);
        
        const uniqueSourceNames = [...new Set(contextDocs.map(d => d.metadata?.source))].filter(Boolean);
        const sourceObjects = uniqueSourceNames.map(name => ({ name: String(name) }));

        const contextString = contextDocs.length > 0 
            ? contextDocs.map(d => `[Source: ${d.metadata?.source || 'Notes'}]: ${d.content}`).join("\n\n")
            : "No specific documents found. Use general knowledge.";

        let conversation = await Conversation.findOne({ userId });
        if (!conversation) conversation = new Conversation({ userId, messages: [] });

        const history = conversation.messages.slice(-8).map(msg => ({
            role: msg.role === 'model' ? 'assistant' : 'user',
            content: msg.parts[0]?.text || ""
        }));

        // MODIFIED SYSTEM PROMPT BELOW
        const ragSystemPrompt = `
        You are an expert AI Tutor. Your primary goal is to help students learn using their provided college materials.

        KNOWLEDGE BASE CONTEXT:
        ${contextString}

        STRICT INSTRUCTIONS:
        1. For casual greetings (e.g., "Hi", "Hello"), reply warmly. DO NOT generate a quiz.
        2. For subject matter questions, prioritize the KNOWLEDGE BASE CONTEXT provided above.
        3. DO NOT mention filenames (like "Python_programming.docx") in your text response. 
           Answer naturally as if you already know the material. The system will automatically show the source links in the UI.
        4. If the topic is an important exam topic (Importance 8+), mention that "This is a key concept for your exams."
        5. ONLY for educational/subject questions: Generate exactly ONE MCQ in a JSON block at the very end.

        FORMAT FOR EDUCATIONAL QUESTIONS:
        \`\`\`json
        {
          "searchQuery": "concise topic for youtube",
          "question": "An insightful MCQ based on this topic",
          "options": ["A", "B", "C", "D"],
          "correctAnswerIndex": 0
        }
        \`\`\`
        `;

        const completion = await groq.chat.completions.create({
            model: "openai/gpt-oss-120b",
            messages: [
                { role: "system", content: ragSystemPrompt },
                ...history,
                { role: "user", content: message }
            ],
            temperature: 0.3,
            max_tokens: 1500
        });

        const aiText = completion.choices[0].message.content;
        let explanation = aiText;
        let quizData = null;
        let topVideos = [];

        const jsonMatch = aiText.match(/```json([\s\S]*?)```/);
        if (jsonMatch) {
            explanation = aiText.replace(jsonMatch[0], "").trim();
            try {
                quizData = JSON.parse(jsonMatch[1]);
                if (quizData.searchQuery) {
                    const videoResults = await ytSearch(quizData.searchQuery);
                    topVideos = videoResults.videos.slice(0, 2).map(v => ({
                        title: v.title, url: v.url, thumbnail: v.image, duration: v.timestamp
                    }));
                }
            } catch (e) { console.error("JSON Error"); }
        }

        conversation.messages.push({ role: "user", parts: [{ text: message }] });
        conversation.messages.push({ 
            role: "model", 
            parts: [{ text: explanation }],
            videos: topVideos,
            sources: sourceObjects 
        });

        await conversation.save();

        let quiz = null;
        if (quizData && quizData.question) {
            quiz = await QuizAttempt.create({
                userId, conversationId: conversation._id,
                question: quizData.question, options: quizData.options,
                correctAnswerIndex: quizData.correctAnswerIndex
            });
        }

        res.json({
            reply: explanation,
            videos: topVideos,
            sources: sourceObjects, 
            quiz: quiz ? { id: quiz._id, question: quiz.question, options: quiz.options } : null
        });

    } catch (error) {
        console.error("Chat Error:", error);
        res.status(500).json({ message: "Error processing request." });
    }
};

// --- SUBMIT QUIZ ANSWER HANDLER ---
const submitAnswerHandler = async (req, res) => {
    try {
        const { quizId, selectedIndex } = req.body;
        const index = Number(selectedIndex); 

        const quiz = await QuizAttempt.findOne({ _id: quizId, userId: req.userId });

        if (!quiz || quiz.userAnswerIndex !== null) {
            return res.status(400).json({ message: "Invalid attempt." });
        }

        quiz.userAnswerIndex = index;
        quiz.isCorrect = (quiz.correctAnswerIndex === index);
        await quiz.save();

        res.json({
            isCorrect: quiz.isCorrect,
            correctAnswerIndex: quiz.correctAnswerIndex
        });
    } catch (error) {
        res.status(500).json({ message: "Failed to submit answer." });
    }
};

// --- GET CHAT HISTORY HANDLER ---
const getChatHistoryHandler = async (req, res) => {
    try {
        const conversation = await Conversation.findOne({ userId: req.userId });
        res.status(200).json(conversation ? conversation.messages : []);
    } catch (error) {
        res.status(500).json({ message: "Failed to fetch chat history." });
    }
};

// --- GET USER PROGRESS HANDLER ---
const getProgressHandler = async (req, res) => {
    try {
        const userId = new mongoose.Types.ObjectId(req.userId);
        const progress = await QuizAttempt.aggregate([
            { $match: { userId: userId, isCorrect: { $ne: null } } },
            { $group: { _id: "$isCorrect", count: { $sum: 1 } } }
        ]);

        let stats = { total_answered: 0, correct_answers: 0, incorrect_answers: 0, accuracy: 0 };
        progress.forEach(group => {
            if (group._id === true) stats.correct_answers = group.count;
            else stats.incorrect_answers = group.count;
        });

        stats.total_answered = stats.correct_answers + stats.incorrect_answers;
        if (stats.total_answered > 0) {
            stats.accuracy = Math.round((stats.correct_answers / stats.total_answered) * 100);
        }
        res.status(200).json(stats);
    } catch (error) {
        res.status(500).json({ message: "Failed to fetch progress." });
    }
};


// --- COMPREHENSIVE DASHBOARD STATS HANDLER ---
const getDashboardStatsHandler = async (req, res) => {
    const userId = new mongoose.Types.ObjectId(req.userId);

    try {
        // --- 1. Calculate Quiz Statistics (Correct, Incorrect, Accuracy) ---
        const quizStatsData = await QuizAttempt.aggregate([
            { $match: { userId, isCorrect: { $ne: null } } },
            { $group: { _id: "$isCorrect", count: { $sum: 1 } } }
        ]);

        let quizStats = { total_answered: 0, correct_answers: 0, incorrect_answers: 0, accuracy: 0 };
        quizStatsData.forEach(group => {
            if (group._id === true) quizStats.correct_answers = group.count;
            else quizStats.incorrect_answers = group.count;
        });
        quizStats.total_answered = quizStats.correct_answers + quizStats.incorrect_answers;
        if (quizStats.total_answered > 0) {
            quizStats.accuracy = Math.round((quizStats.correct_answers / quizStats.total_answered) * 100);
        }

        // --- 2. Calculate Total Time Spent (Engagement Duration) ---
        const [firstQuiz, lastQuiz] = await Promise.all([
            QuizAttempt.findOne({ userId }).sort({ askedAt: 1 }),
            QuizAttempt.findOne({ userId }).sort({ askedAt: -1 })
        ]);

        let engagementDuration = "Not enough data";
        if (firstQuiz && lastQuiz && firstQuiz._id.toString() !== lastQuiz._id.toString()) {
            const durationMillis = lastQuiz.askedAt.getTime() - firstQuiz.askedAt.getTime();
            engagementDuration = formatDuration(durationMillis);
        } else if (firstQuiz) {
            engagementDuration = "Started learning!";
        }
        
        // --- 3. Calculate Learning Improvement ---
        const allAnsweredQuizzes = await QuizAttempt.find({ userId, isCorrect: { $ne: null } }).sort({ askedAt: 1 });
        
        let learningImprovement = {
            percentage_points: 0,
            status: "Not enough data",
            message: "Answer at least 10 quiz questions to see your learning improvement trend."
        };

        const MIN_QUIZZES_FOR_IMPROVEMENT = 10;
        if (allAnsweredQuizzes.length >= MIN_QUIZZES_FOR_IMPROVEMENT) {
            const midpoint = Math.ceil(allAnsweredQuizzes.length / 2);
            const firstHalf = allAnsweredQuizzes.slice(0, midpoint);
            const secondHalf = allAnsweredQuizzes.slice(midpoint);

            const firstHalfCorrect = firstHalf.filter(q => q.isCorrect).length;
            const secondHalfCorrect = secondHalf.filter(q => q.isCorrect).length;

            const firstHalfAccuracy = (firstHalfCorrect / firstHalf.length) * 100;
            const secondHalfAccuracy = (secondHalfCorrect / secondHalf.length) * 100;
            
            const improvement = Math.round(secondHalfAccuracy - firstHalfAccuracy);
            learningImprovement.percentage_points = improvement;
            
            if (improvement > 5) {
                learningImprovement.status = "Improving";
                learningImprovement.message = `Great progress! Your accuracy has improved by ${improvement} percentage points. Keep it up!`;
            } else if (improvement < -5) {
                learningImprovement.status = "Needs Review";
                learningImprovement.message = `Your accuracy has decreased by ${Math.abs(improvement)} points. It might be helpful to review some recent topics.`;
            } else {
                learningImprovement.status = "Steady";
                learningImprovement.message = "You're performing consistently. Solid work!";
            }
        }
        
        res.status(200).json({
            quizStats,
            engagementDuration,
            learningImprovement
        });

    } catch (error) {
        console.error("Get dashboard stats error:", error);
        res.status(500).json({ message: "Failed to fetch dashboard statistics." });
    }
};

// --- GET ALL QUIZ ATTEMPTS HANDLER ---
const getMyQuizAttemptsHandler = async (req, res) => {
    const userId = req.userId;

    try {
        const attempts = await QuizAttempt.find({ userId, isCorrect: { $ne: null } })
            .sort({ askedAt: -1 }); 
        
        res.status(200).json(attempts);

    } catch (error) {
        console.error("Get my quiz attempts error:", error);
        res.status(500).json({ message: "Failed to fetch quiz history." });
    }
};

// =======================================================
// PROJECT HANDLERS
// =======================================================

const createProjectHandler = async (req, res) => {
    try {
        const { title } = req.body;
        const slug = title.toLowerCase().replace(/\s+/g, '-');

        const project = await Project.create({
            userId: req.userId,
            title,
            slug
        });

        res.status(201).json(project);
    } catch (error) {
        console.error("Create project error:", error);
        res.status(500).json({ message: "Failed to create project." });
    }
};

const getMyProjectsHandler = async (req, res) => {
    try {
        const projects = await Project.find({ userId: req.userId });
        res.json(projects);
    } catch (error) {
        console.error("Get projects error:", error);
        res.status(500).json({ message: "Failed to fetch projects." });
    }
};

const updateProjectHandler = async (req, res) => {
    try {
        const { id } = req.params;
        const { content, title } = req.body;
        
        let updateData = {};
        if (content) updateData.content = content;
        
        if (title) {
            updateData.title = title;
            updateData.slug = title.toLowerCase().replace(/\s+/g, '-');
        }

        const project = await Project.findOneAndUpdate(
            { _id: id, userId: req.userId },
            updateData,
            { new: true }
        );

        if (!project) return res.status(404).json({ message: "Project not found." });
        res.json(project);
    } catch (error) {
        console.error("Update project error:", error);
        res.status(500).json({ message: "Failed to update project." });
    }
};

const publishProjectHandler = async (req, res) => {
    try {
        const { id } = req.params;

        const project = await Project.findOneAndUpdate(
            { _id: id, userId: req.userId },
            { isPublished: true },
            { new: true }
        );

        if (!project) return res.status(404).json({ message: "Project not found." });

        res.json({
            message: "Project published",
            url: `${req.protocol}://${req.get('host')}/p/${project.slug}`
        });
    } catch (error) {
        console.error("Publish project error:", error);
        res.status(500).json({ message: "Failed to publish project." });
    }
};

const generateWebsiteHandler = async (req, res) => {
    try {
        const { prompt, existingHtml } = req.body;

     const systemMessage = `
You are a Senior Web Architect and UI/UX Designer. 
Your goal is to build a high-end, production-ready, single-file website based on the user's request.

TECHNICAL REQUIREMENTS:
1. Use ONLY HTML5, Tailwind CSS, FontAwesome 6+, and AOS (Animate On Scroll).
2. Include these EXACT CDN links in the <head>:
   - <script src="https://cdn.tailwindcss.com"></script>
   - <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
   - <link href="https://unpkg.com/aos@2.3.1/dist/aos.css" rel="stylesheet">
3. Include these EXACT scripts before </body>:
   - <script src="https://unpkg.com/aos@2.3.1/dist/aos.js"></script>
   - <script>AOS.init({ duration: 1000, once: true });</script>
4. Design Style: Use "Boutique" styling—meaning generous whitespace, modern fonts (Inter/Poppins), subtle gradients, and rounded corners (rounded-2xl).

NAVIGATION & STRUCTURE RULES:
5. ANCHOR LINKS:
   - Every navigation link MUST use a hash anchor.
   - Example: <a href="#features" target="_self">Features</a>.
6. SECTION IDs:
   - Each anchor MUST match a section ID exactly.
   - Example: <section id="features">.
7. All <a> tags MUST include target="_self".
8. FIXED / STICKY HEADER HANDLING:
   - If a fixed or sticky header is used, you MUST include the following CSS inside a <style> tag:
     html { scroll-behavior: smooth; }
     section { 
       min-height: 100vh; 
       padding-top: 50px; 
       scroll-margin-top: 80px; 
     }

OUTPUT RULES:
- Output ONLY the raw HTML code.
- NO markdown backticks. NO explanations. NO conversational text.
- Ensure the site is fully responsive (mobile-friendly).
`;



        let userMessage = existingHtml 
            ? `CURRENT HTML:\n${existingHtml}\n\nUSER REQUEST FOR CHANGES:\n${prompt}. Return FULL updated HTML.`
            : `CREATE A NEW WEBSITE BASED ON THIS DESCRIPTION: "${prompt}". Build a complete, multi-section landing page with high-quality Unsplash images.`;

        const completion = await groq.chat.completions.create({
            // UPDATED MODEL NAME BELOW
            model: "openai/gpt-oss-120b", 
            messages: [
                { role: "system", content: systemMessage },
                { role: "user", content: userMessage }
            ],
            temperature: 0.3, 
            max_tokens: 8192 
        });

        let htmlContent = completion.choices[0].message.content.trim();

        // Safety cleanup to remove any markdown tags if AI adds them
        htmlContent = htmlContent.replace(/^```html/gi, "").replace(/```$/g, "").trim();

        res.json({ html: htmlContent });
    } catch (error) {
        console.error("AI Generation Error:", error);
        
        // Fallback logic: If 70b is busy or fails, try the 8b model
        try {
            const fallback = await groq.chat.completions.create({
                model: "llama-3.1-8b-instant",
                messages: [{ role: "user", content: prompt }]
            });
            res.json({ html: fallback.choices[0].message.content });
        } catch (err) {
            res.status(500).json({ message: "AI Service is currently overloaded. Please try again in a moment." });
        }
    }
};


const deleteProjectHandler = async (req, res) => {
    try {
        const { id } = req.params;
        const project = await Project.findOneAndDelete({ _id: id, userId: req.userId });

        if (!project) {
            return res.status(404).json({ message: "Project not found or unauthorized." });
        }

        res.json({ message: "Project deleted successfully." });
    } catch (error) {
        console.error("Delete project error:", error);
        res.status(500).json({ message: "Failed to delete project." });
    }
};




// 1. Get Status of all levels (Locked/Unlocked/Percentage)
app.get('/api/courses/all-levels-status', protect, async (req, res) => {
    try {
        const userId = req.userId;
        
        // 1. Fetch ALL Course records, sorted by language and level
        const allCourses = await Course.find({}).sort({ language: 1, level: 1 });
        const userProgress = await UserProgress.find({ userId });

        // Group courses by language
        const coursesByLanguage = allCourses.reduce((acc, course) => {
            if (!acc[course.language]) {
                acc[course.language] = [];
            }
            acc[course.language].push(course);
            return acc;
        }, {});

        let finalOutput = {};

        // 2. Apply progress and unlock logic for each language group
        for (const language in coursesByLanguage) {
            let previousLevelCompleted = true; 
            finalOutput[language] = [];
            
            for (let course of coursesByLanguage[language]) {
                const progress = userProgress.find(p => p.courseId.toString() === course._id.toString());
                const totalLessons = course.modules.reduce((acc, mod) => acc + mod.lessons.length, 0);
                const completedCount = progress ? progress.completedLessons.length : 0;
                const percentage = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;

                let status = 'locked';
                if (previousLevelCompleted) {
                    status = percentage === 100 ? 'completed' : 'unlocked';
                }

                finalOutput[language].push({
                    courseId: course._id,
                    level: course.level,
                    title: course.title,
                    percentage: percentage,
                    status: status,
                });

                // Set condition for next level
                previousLevelCompleted = (percentage === 100);
            }
        }
        res.json(finalOutput);
    } catch (error) {
        console.error("Error fetching all courses status:", error);
        res.status(500).json({ message: "Error fetching all courses status" });
    }
});

app.get('/api/courses/content/:language/:level', protect, async (req, res) => {
    try {
        // *** FIX: Extract both parameters from req.params ***
        const { language, level } = req.params; 

        const course = await Course.findOne({ 
            language: language, // <-- Now uses the URL language
            level: parseInt(level) 
        });

        if (!course) {
             // Return more detail for better debugging
             return res.status(404).json({ message: `Course level not found for ${language} Level ${level}.` });
        }

        const progress = await UserProgress.findOne({ 
            userId: req.userId, 
            courseId: course._id 
        });

        res.json({
            course,
            completedLessons: progress ? progress.completedLessons : []
        });
    } catch (error) {
        console.error("Error fetching course content:", error);
        res.status(500).json({ message: "Server error during content fetch." });
    }
});

app.post('/api/courses/complete-lesson', protect, async (req, res) => {
    const { courseId, moduleId, lessonId } = req.body;
    try {
        const progress = await UserProgress.findOneAndUpdate(
            { userId: req.userId, courseId },
            { $addToSet: { completedLessons: { moduleId, lessonId } }, lastAccessed: Date.now() },
            { upsert: true, new: true }
        );
        res.json(progress);
    } catch (e) { res.status(500).json({ message: "Progress save error" }); }
});



// --- CLEAR CHAT HISTORY HANDLER ---
app.delete('/api/chat/history', protect, async (req, res) => {
    try {
        const userId = req.userId;
        const conversation = await Conversation.findOne({ userId });
        
        if (conversation) {
            conversation.messages = []; // Clear the array
            await conversation.save();
        }
        
        res.status(200).json({ message: "Chat history cleared successfully." });
    } catch (error) {
        console.error("Clear chat error:", error);
        res.status(500).json({ message: "Failed to clear chat history." });
    }
});



// Agent

app.post('/api/voice/config', protect, async (req, res) => {
    try {
        const { twilioSid, twilioToken, twilioNumber, customerMongoUri, nodes } = req.body;
        
        const config = await AgentConfig.findOneAndUpdate(
            { userId: req.userId },
            { 
                twilioSid, twilioToken, twilioNumber, customerMongoUri, nodes,
                updatedAt: Date.now() 
            },
            { upsert: true, new: true }
        );
        res.json({ message: "Workflow saved and deployed!", config });
    } catch (error) {
        res.status(500).json({ message: "Failed to save workflow" });
    }
});

// 2. GET Current Config
app.get('/api/voice/config', protect, async (req, res) => {
    try {
        const config = await AgentConfig.findOne({ userId: req.userId });
        res.json(config || { nodes: [] });
    } catch (error) {
        res.status(500).json({ message: "Failed to fetch configuration" });
    }
});

// 3. Trigger Outbound Call (Sends full config to Python)
app.post('/api/voice/trigger-call', protect, async (req, res) => {
    try {
        const { targetPhoneNumber } = req.body;

        if (!targetPhoneNumber) {
            return res.status(400).json({ message: "Phone number is required." });
        }

        // We only send the phone_number because the Python script 
        // handles the rest (Twilio, Mongo, Prompts) internally now.
        const response = await axios.post('http://localhost:8000/trigger_call', {
            phone_number: targetPhoneNumber
        });

        res.json({ message: "Call initiated successfully!", sid: response.data.sid });
    } catch (error) {
        console.error("Python Bridge Error:", error.message);
        res.status(500).json({ message: "The voice server is offline or returned an error." });
    }
});




// --- IEEE PAPER EVALUATION ENDPOINT ---
app.get('/api/admin/run-accuracy-test', protect, async (req, res) => {
    // 1. YOUR "GOLDEN DATASET" - Academic questions from your knowledge base
    const testCases = [
        { 
            question: "What are the primary data structures in Python?", 
            groundTruth: "Python's primary data structures include lists, tuples, sets, and dictionaries. Lists are ordered and mutable, while tuples are ordered and immutable."
        },
        { 
            question: "How does the RAG architecture improve LLM performance?", 
            groundTruth: "RAG improves performance by retrieving relevant documents from an external database to provide context, reducing hallucinations and providing up-to-date information."
        },
        {
            question: "Explain the time complexity of a Binary Search.",
            groundTruth: "The time complexity of a Binary Search algorithm is O(log n), because the search area is halved in every iteration."
        }
        // Add 10-15 more questions here for a stronger paper
    ];

    let comparativeResults = [];

    for (const test of testCases) {
        // --- STEP A: Baseline (No RAG - Just LLM) ---
        const baselineComp = await groq.chat.completions.create({
            model: "openai/gpt-oss-120b",
            messages: [{ role: "user", content: test.question }],
            temperature: 0.1
        });
        const baselineResponse = baselineComp.choices[0].message.content;
        const baselineScore = await calculateSemanticAccuracy(baselineResponse, test.groundTruth);

        // --- STEP B: Your Proposed System (With RAG) ---
        const contextDocs = await getKnowledgeContext(test.question);
        const contextString = contextDocs.map(d => d.content).join("\n");
        
        const ragComp = await groq.chat.completions.create({
            model: "openai/gpt-oss-120b",
            messages: [
                { role: "system", content: `You are a tutor. Use this context: ${contextString}` },
                { role: "user", content: test.question }
            ],
            temperature: 0.1
        });
        const ragResponse = ragComp.choices[0].message.content;
        const ragScore = await calculateSemanticAccuracy(ragResponse, test.groundTruth);

        comparativeResults.push({
            id: test.question.substring(0, 20),
            baseline: (baselineScore * 100).toFixed(2),
            proposed: (ragScore * 100).toFixed(2)
        });
    }

    res.json(comparativeResults);
});





// =======================================================
// 5. ROUTES
// =======================================================

app.get('/', (req, res) => {
    res.json({ message: 'Task Manager API is running!' });
});

// Authentication Routes
app.post('/api/auth/signup', signupHandler);
app.post('/api/auth/verify-otp', verifyOtpHandler);
app.post('/api/auth/signin', signinHandler); 

// Password Reset Flow
app.post('/api/auth/forgot-password', forgotPasswordHandler);
app.post('/api/auth/verify-reset-otp', verifyResetOtpHandler);
app.post('/api/auth/reset-password', resetPasswordHandler);

// Student Profile Routes (Protected)
app.get('/api/profile', protect, getProfileHandler);
app.put('/api/profile', protect, updateProfileHandler); 
app.get('/api/profile/progress', protect, getProgressHandler); 
app.get('/api/profile/dashboard-stats', protect, getDashboardStatsHandler);

// --- AI TUTOR CHAT ROUTES (PROTECTED) ---
app.post('/api/chat', protect, chatHandler);
app.get('/api/chat/history', protect, getChatHistoryHandler);
app.post('/api/chat/submit-answer', protect, submitAnswerHandler);

app.get('/api/quizzes/my-attempts', protect, getMyQuizAttemptsHandler);
app.get('/api/learning-path', protect, getLearningPathHandler);

// --- PROJECT ROUTES (PROTECTED) ---
app.post('/api/projects', protect, createProjectHandler);
app.get('/api/projects', protect, getMyProjectsHandler);
app.put('/api/projects/:id', protect, updateProjectHandler);
app.post('/api/projects/:id/publish', protect, publishProjectHandler);

// --- AI WEBSITE GENERATION ROUTE (NEW) ---
app.post('/api/ai/generate-website', protect, generateWebsiteHandler);
app.delete('/api/projects/:id', protect, deleteProjectHandler);

// --- PUBLIC PROJECT VIEWING ROUTE ---
app.get('/p/:slug', async (req, res) => {
    try {
        const project = await Project.findOne({
            slug: req.params.slug,
            isPublished: true
        });

        if (!project || !project.content || !project.content.html) {
            return res.status(404).send("<h1>Project Not Found or Not Published</h1>");
        }

        // Send the raw HTML code stored in the project content
        res.set('Content-Type', 'text/html');
        res.send(project.content.html);
        
    } catch (error) {
        res.status(500).send("An error occurred while loading the website.");
    }
});

// =======================================================
// 6. START SERVER
// =======================================================

connectDB(httpServer, port, uri);