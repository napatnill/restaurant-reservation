const express = require("express");
const dotenv = require("dotenv");
const cookieParser = require("cookie-parser");
const connectDB = require("./config/db");
const cors = require("cors");

// load environment variables
dotenv.config({ path: "./config/config.env" });

// connect to database
connectDB();

// initialize express app
const app = express();

// body parser
app.use(express.json());

// cors
app.use(cors());

// cookie parser
app.use(cookieParser());

// routes
const restaurants = require("./routes/restaurants");
const auth = require("./routes/auth");
const reservations = require("./routes/reservations");

// mount routers
app.use("/api/v1/restaurants", restaurants);
app.use("/api/v1/auth", auth);
app.use("/api/v1/reservations", reservations);

// server setup
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, console.log("Server running in", process.env.NODE_ENV, "mode on port", PORT));

// handle unhandled promise rejections
process.on("unhandledRejection", (err, promise) => {
    console.log(`Error: ${err.message}`);
    server.close(() => process.exit(1));
})