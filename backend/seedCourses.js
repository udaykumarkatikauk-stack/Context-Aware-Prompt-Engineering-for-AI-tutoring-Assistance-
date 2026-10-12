// seedCourses.js

require('dotenv').config();
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const Course = require('./models/Course'); // Ensure this model is correctly imported

const MONGO_URI = process.env.MONGODB_URI;

const seed = async () => {
    // We connect/disconnect for safety, but typically connect at the start of the app
    try {
        await mongoose.connect(MONGO_URI);
        console.log("Connected to MongoDB for seeding...");

        const directoryPath = path.join(__dirname, 'Coursers');
        const files = fs.readdirSync(directoryPath);

        let skippedCount = 0;
        let seededCount = 0;

        for (const file of files) {
            if (file.endsWith('.json')) {
                const filePath = path.join(directoryPath, file);
                const fileData = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

                // Extract language and level from filename (e.g., htmlcssjs_level1.json)
                const parts = file.replace('.json', '').split('_level');
                const language = parts[0];
                const level = parseInt(parts[1]);
                const filter = { language, level };

                // 1. CHECK FOR EXISTENCE
                const existingCourse = await Course.findOne(filter);
                
                if (existingCourse) {
                    // 2. LOG SKIP MESSAGE
                    console.log(`⚠️ Skipped: ${file} (Course already exists in DB).`);
                    skippedCount++;
                } else {
                    // 3. CREATE NEW DOCUMENT
                    const newCourse = new Course({
                        ...filter,
                        title: fileData.title || `${language} Level ${level}`,
                        modules: fileData.modules 
                    });
                    await newCourse.save();
                    console.log(`✅ Seeded: ${file} (NEW Course added).`);
                    seededCount++;
                }
            }
        }

        console.log("=======================================");
        console.log(`🚀 Seeding complete! New: ${seededCount}, Skipped: ${skippedCount}`);
        console.log("=======================================");
        process.exit(0); // Use 0 for success exit
    } catch (err) {
        console.error("❌ Seeding error:", err.message);
        process.exit(1); // Use 1 for failure exit
    }
};

seed();