// controllers/voiceInterview.controller.js
import VoiceInterview from '../models/voiceInterview.model.js';
import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/apiError.js';
import ApiResponse from '../utils/apiResponse.js';
import {
  transcribeAudio,
  generateNextQuestion,
  generateFollowUpQuestion,
  scoreAnswer,
  synthesizeSpeech,
  generateOverallFeedback,
  WEAK_SCORE_THRESHOLD,
  MAX_FOLLOW_UP_DEPTH,
} from '../services/voiceInterview.service.js';

// @desc    Convert text to speech
// @route   POST /api/voice-interview/speak
export const speakText = asyncHandler(async (req, res) => {
  const { text } = req.body;
  if (!text) throw new ApiError(400, 'Text is required');

  const audioBuffer = await synthesizeSpeech(text);

  res.set({
    'Content-Type': 'audio/mpeg',
    'Content-Length': audioBuffer.length,
  });
  res.send(audioBuffer);
});

// @desc    Start a new voice interview session
// @route   POST /api/voice-interview/start
export const startSession = asyncHandler(async (req, res) => {
  const { role, topics, numQuestions, codingTopics = [], problemStyle = null } = req.body;

  if (!role) throw new ApiError(400, 'Role is required');
  if (!Array.isArray(topics) || topics.length === 0) throw new ApiError(400, 'Select at least one topic');

  const total = Number(numQuestions) || topics.length;
  if (total < topics.length) {
    throw new ApiError(400, `Number of questions must be at least ${topics.length} (one per selected topic)`);
  }

  const firstTopic = topics[0];
  const firstRequiresCode = codingTopics.includes(firstTopic);
  const { question, starterCode } = await generateNextQuestion({
    role,
    topic: firstTopic,
    history: [],
    requiresCode: firstRequiresCode,
    problemStyle,
  });

  const session = await VoiceInterview.create({
    user: req.user._id,
    role,
    topics,
    codingTopics,
    problemStyle,
    numQuestions: total,
    topicPointer: 1,
    turns: [{ question, topic: firstTopic, requiresCode: firstRequiresCode, starterCode }],
  });

  res.status(201).json(
    new ApiResponse(201, {
      sessionId: session._id,
      question,
      starterCode,
      topic: firstTopic,
      requiresCode: firstRequiresCode,
      totalTurns: total,
    }, 'Interview session started')
  );
});

// @desc    Submit a recorded answer, get transcript + next question
// @route   POST /api/voice-interview/:sessionId/answer
export const submitAnswer = asyncHandler(async (req, res) => {
  const { sessionId } = req.params;
  if (!req.file) throw new ApiError(400, 'Audio file is required');

  const session = await VoiceInterview.findOne({ _id: sessionId, user: req.user._id });
  if (!session) throw new ApiError(404, 'Interview session not found');
  if (session.status === 'completed') throw new ApiError(400, 'Interview session already completed');

  const currentTurn = session.turns[session.turns.length - 1];

  const { code, language } = req.body;
  if (currentTurn.requiresCode && (!code || !code.trim())) {
    throw new ApiError(400, 'Code is required for this question');
  }
  if (currentTurn.requiresCode) {
    currentTurn.code = code;
    currentTurn.language = language || '';
  }

  const transcript = await transcribeAudio(req.file.buffer, `session-${sessionId}`);
  currentTurn.answerTranscript = transcript;

  const { feedback, score } = await scoreAnswer({
    question: currentTurn.question,
    answerTranscript: transcript,
    code: currentTurn.requiresCode ? code : undefined,
    language: currentTurn.requiresCode ? language : undefined,
  });
  currentTurn.feedback = feedback;
  currentTurn.score = score;

  const isWeak = score < WEAK_SCORE_THRESHOLD;
  const canFollowUp = isWeak && currentTurn.followUpDepth < MAX_FOLLOW_UP_DEPTH;

  if (canFollowUp) {
    const rawFollowUp = await generateFollowUpQuestion({
      role: session.role,
      topic: currentTurn.topic,
      question: currentTurn.question,
      answerTranscript: transcript,
      feedback,
    });
    const followUpQuestion = `Follow-up: ${rawFollowUp}`;

    session.turns.push({
      question: followUpQuestion,
      topic: currentTurn.topic,
      isFollowUp: true,
      followUpDepth: currentTurn.followUpDepth + 1,
      requiresCode: currentTurn.requiresCode,
    });
    await session.save();

    return res.json(
      new ApiResponse(200, {
        done: false,
        transcript,
        feedback,
        score,
        nextQuestion: followUpQuestion,
        nextTopic: currentTurn.topic,
        isFollowUp: true,
        requiresCode: currentTurn.requiresCode,
        sessionId,
      }, 'Follow-up question generated')
    );
  }

  const mainQuestionsAsked = session.turns.filter((t) => t.followUpDepth === 0).length;

  if (mainQuestionsAsked >= session.numQuestions) {
    const { overallFeedback, overallScore } = await generateOverallFeedback({
      role: session.role,
      topic: session.topics.join(', '),
      turns: session.turns,
    });

    session.status = 'completed';
    session.completedAt = new Date();
    session.overallFeedback = overallFeedback;
    session.overallScore = overallScore;
    await session.save();

    return res.json(
      new ApiResponse(200, { done: true, transcript, feedback, score, overallFeedback, overallScore, sessionId }, 'Interview completed')
    );
  }

  const nextTopic = session.topics[session.topicPointer % session.topics.length];
  session.topicPointer += 1;
  const nextRequiresCode = session.codingTopics.includes(nextTopic);

  const history = session.turns.map((t) => ({ question: t.question, answerTranscript: t.answerTranscript }));
  const { question: nextQuestion, starterCode: nextStarterCode } = await generateNextQuestion({
    role: session.role,
    topic: nextTopic,
    history,
    requiresCode: nextRequiresCode,
    problemStyle: session.problemStyle,
  });
  session.turns.push({
    question: nextQuestion,
    topic: nextTopic,
    followUpDepth: 0,
    requiresCode: nextRequiresCode,
    starterCode: nextStarterCode,
  });
  await session.save();

  res.json(
    new ApiResponse(200, {
      done: false,
      transcript,
      feedback,
      score,
      nextQuestion,
      nextTopic,
      isFollowUp: false,
      requiresCode: nextRequiresCode,
      starterCode: nextStarterCode,
      sessionId,
    }, 'Answer recorded')
  );
});

// @desc    Skip the current question without answering
// @route   POST /api/voice-interview/:sessionId/skip
export const skipQuestion = asyncHandler(async (req, res) => {
  const { sessionId } = req.params;

  const session = await VoiceInterview.findOne({ _id: sessionId, user: req.user._id });
  if (!session) throw new ApiError(404, 'Interview session not found');
  if (session.status === 'completed') throw new ApiError(400, 'Interview session already completed');

  const currentTurn = session.turns[session.turns.length - 1];
  currentTurn.skipped = true;
  currentTurn.answerTranscript = '(skipped)';
  currentTurn.feedback = 'Skipped by candidate';
  currentTurn.score = 0;

  const mainQuestionsAsked = session.turns.filter((t) => t.followUpDepth === 0).length;

  if (mainQuestionsAsked >= session.numQuestions) {
    const { overallFeedback, overallScore } = await generateOverallFeedback({
      role: session.role,
      topic: session.topics.join(', '),
      turns: session.turns,
    });

    session.status = 'completed';
    session.completedAt = new Date();
    session.overallFeedback = overallFeedback;
    session.overallScore = overallScore;
    await session.save();

    return res.json(
      new ApiResponse(200, { done: true, overallFeedback, overallScore, sessionId }, 'Interview completed')
    );
  }

  const nextTopic = session.topics[session.topicPointer % session.topics.length];
  session.topicPointer += 1;
  const nextRequiresCode = session.codingTopics.includes(nextTopic);

  const history = session.turns.map((t) => ({ question: t.question, answerTranscript: t.answerTranscript }));
  const { question: nextQuestion, starterCode: nextStarterCode } = await generateNextQuestion({
    role: session.role,
    topic: nextTopic,
    history,
    requiresCode: nextRequiresCode,
    problemStyle: session.problemStyle,
  });
  session.turns.push({
    question: nextQuestion,
    topic: nextTopic,
    followUpDepth: 0,
    requiresCode: nextRequiresCode,
    starterCode: nextStarterCode,
  });
  await session.save();

  res.json(
    new ApiResponse(200, {
      done: false,
      nextQuestion,
      nextTopic,
      isFollowUp: false,
      requiresCode: nextRequiresCode,
      starterCode: nextStarterCode,
      sessionId,
    }, 'Question skipped')
  );
});

// @desc    Get a single interview session
// @route   GET /api/voice-interview/:sessionId
export const getSession = asyncHandler(async (req, res) => {
  const session = await VoiceInterview.findOne({ _id: req.params.sessionId, user: req.user._id });
  if (!session) throw new ApiError(404, 'Interview session not found');

  res.json(new ApiResponse(200, session, 'Session fetched successfully'));
});

// @desc    Get all interview sessions for the logged in user
// @route   GET /api/voice-interview
export const getAllSessions = asyncHandler(async (req, res) => {
  const sessions = await VoiceInterview.find({ user: req.user._id })
    .select('role topics numQuestions status overallScore createdAt completedAt')
    .sort({ createdAt: -1 });

  res.json(new ApiResponse(200, sessions, 'Sessions fetched successfully'));
});