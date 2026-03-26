const mongoose = require("mongoose");

const connectDB = async () => {
    try {
        if (!process.env.MONGO_URI || process.env.MONGO_URI === "tera_connection_string") {
            console.log("⚠️  [WARNING] Please update MONGO_URI in the .env file with your MongoDB Atlas connection string.");
            console.log("👉 Server will start, but database operations will fail until connected.");
            return;
        }

        await mongoose.connect(process.env.MONGO_URI);
        console.log("MongoDB Connected 🔥");
    } catch (error) {
        console.error("❌ [ERROR] MongoDB Connection Failed:", error.message);
        process.exit(1);
    }
};

module.exports = connectDB;