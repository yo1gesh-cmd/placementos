import 'dotenv/config';
import express from "express"
import cors from "cors"
import helmet from "helmet"
import cookieParser from "cookie-parser"
import dotenv from "dotenv"
import connectDB from "./config/db.js"
import errorHandler from "./middleware/error.middleware.js"
import authRouter from './routes/auth.routes.js'
import prepRouter from './routes/prep.routes.js'
import jdRouter from './routes/jd.routes.js';
import resumeRoutes from './routes/resume.routes.js';
import { generalLimiter } from './middleware/rateLimit.middleware.js';
import voiceInterviewRoutes from './routes/voiceInterview.routes.js';




dotenv.config();
connectDB();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(helmet());
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true,
  exposedHeaders: ['X-Final-Score'],
}));
app.use(express.json());
app.use(cookieParser());
app.use(generalLimiter);

app.use('/api/auth', authRouter);
app.use('/api/prep',prepRouter)
app.use('/api/jd', jdRouter);
app.use('/api/resume', resumeRoutes);
app.use('/api/voice-interview', voiceInterviewRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'server is running' });
});

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`server running on port ${PORT}`);
});