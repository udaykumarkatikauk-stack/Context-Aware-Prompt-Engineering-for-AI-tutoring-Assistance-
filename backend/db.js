const mongoose = require('mongoose');

/**
 * Connects to MongoDB and starts the Unified HTTP server (Express + Socket.io).
 * @param {object} server The http.Server instance.
 * @param {number} port The port the server should listen on.
 * @param {string} uri The MongoDB connection URI.
 */
const connectDB = (server, port, uri) => {
    mongoose.connect(uri)
        .then(() => {
            console.log('✅ MongoDB successfully connected!');
            
            // CRITICAL: Use server.listen, NOT app.listen
            // This allows both Express routes and Socket.io to work on the same port.
            server.listen(port, () => {
                console.log(`🚀 Unified Server (API & Chat) running on port: ${port}`);
            });
        })
        .catch(err => {
            console.error('❌ MongoDB connection error:', err);
            process.exit(1); 
        });
};

module.exports = connectDB;