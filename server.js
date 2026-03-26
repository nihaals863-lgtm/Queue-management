const dotenv = require("dotenv");
const connectDB = require("./config/db");
const express = require("express");
const cors = require("cors");
const tokenRoutes = require("./routes/tokenRoutes");
const statsRoutes = require("./routes/statsRoutes");
const authRoutes = require("./routes/authRoutes");

const helmet = require("helmet");
const rateLimit = require("express-rate-limit");

const http = require("http");
const { Server } = require("socket.io");

const departmentRoutes = require("./routes/departmentRoutes");
const userRoutes = require("./routes/userRoutes");
const reportRoutes = require("./routes/reportRoutes");

// Load Environment Variables
dotenv.config();

// Connect to Database
connectDB();

const app = express();
const server = http.createServer(app);

// Socket.io Setup
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true
  }
});

// Make io accessible in req object
app.use((req, res, next) => {
  req.io = io;
  next();
});

// Security Middleware
app.use(helmet());

// Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Increased for dev/real-time testing
  message: "Too many requests from this IP, please try again later"
});
app.use("/api/", limiter);

// CORS Config
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:5173",
  credentials: true
}));

app.use(express.json());

// Routes
app.use("/api/tokens", tokenRoutes);
app.use("/api/stats", statsRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/departments", departmentRoutes);
app.use("/api/users", userRoutes);
app.use("/api/reports", reportRoutes);

// Socket Connection Handling
io.on("connection", (socket) => {
  console.log("A user connected:", socket.id);
  
  socket.on("join-department", (department) => {
    socket.join(department);
    console.log(`User joined room: ${department}`);
  });

  socket.on("disconnect", () => {
    console.log("User disconnected");
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
    console.error(`[CRITICAL ERROR] ${err.stack}`);
    res.status(err.status || 500).json({
        success: false,
        message: err.message || "Internal Server Error",
        stack: process.env.NODE_ENV === 'production' ? null : err.stack
    });
});

// Test Route
app.get("/", (req, res) => {
    res.send("Backend running with Real-time Sync 🚀");
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});