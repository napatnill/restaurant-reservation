const mongoose = require("mongoose");

const connectDB = async () => {
    try {
        mongoose.set("strictQuery", true);
        const conn = await mongoose.connect(process.env.MONGO_URI);

        console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.log(`Mongoose Connection Error: ${error.message}`);
        process.exit(1); // Exit process to avoid running without a database
    }
}

module.exports = connectDB;