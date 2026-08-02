import mongoose from 'mongoose';

const turnSchema = new mongoose.Schema({
  question: { type: String, required: true },
  topic: { type: String },
  isFollowUp: { type: Boolean, default: false },
  skipped: {
    type: Boolean,
    default: false,
  },
  requiresCode: {
    type: Boolean,
    default: false,
  },
  code: {
    type: String,
    default: '',
  },
  language: {
    type: String,
    default: '',
  },
  starterCode: {
    type: String,
    default: '',
  },
  followUpDepth: { type: Number, default: 0 }, // 0 = original question, 1-3 = follow-up chain depth
  answerTranscript: { type: String, default: '' },
  audioDurationSec: { type: Number },
  feedback: { type: String },
  score: { type: Number },
  timestamp: { type: Date, default: Date.now },
});

const voiceInterviewSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  role: { type: String, required: [true, 'Role is required'] },
  topics: {
    type: [String],
    required: true,
    validate: {
      validator: (v) => Array.isArray(v) && v.length > 0,
      message: 'At least one topic is required',
    },
  },
  codingTopics: {
    type: [String],
    default: [],
  },
  problemStyle: {
    type: String,
    enum: ['leetcode', 'codeforces', null],
    default: null,
  },
  numQuestions: { type: Number, default: 6 },
  topicPointer: {
    type: Number,
    default: 1,
  },
  status: { type: String, enum: ['in_progress', 'completed'], default: 'in_progress' },
  turns: [turnSchema],
  overallFeedback: { type: String },
  overallScore: { type: Number, default: 0 },
  completedAt: { type: Date },
}, { timestamps: true });

const VoiceInterview = mongoose.model('VoiceInterview', voiceInterviewSchema);
export default VoiceInterview;