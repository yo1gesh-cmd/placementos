// services/voiceInterview.service.js
import Groq, { toFile } from 'groq-sdk';
import ApiError from '../utils/apiError.js';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const MIN_TRANSCRIPT_LENGTH = 2;

export const transcribeAudio = async (buffer, context = 'voice-interview-answer') => {
  const file = await toFile(buffer, 'answer.webm');

  const transcription = await groq.audio.transcriptions.create({
    file,
    model: 'whisper-large-v3',
    response_format: 'text',
  });

  const text = transcription.trim();
  console.log(`[${context}] transcript length:`, text.length);
  console.log(`[${context}] transcript preview:`, JSON.stringify(text.slice(0, 200)));

  if (text.length < MIN_TRANSCRIPT_LENGTH) {
    throw new ApiError(
      400,
      'Could not transcribe any speech from the recording. Please check your microphone and try again.'
    );
  }

  return text;
};




import { EdgeTTS } from 'edge-tts-universal';

const TTS_VOICE = process.env.EDGE_TTS_VOICE || 'en-GB-RyanNeural'; // e.g. en-US-AriaNeural, en-GB-RyanNeural, en-IN-PrabhatNeural

export const synthesizeSpeech = async (text) => {
  const tts = new EdgeTTS(text, TTS_VOICE, {
    rate: '+0%',
    volume: '+0%',
    pitch: '+0Hz',
  });

  const { audio } = await tts.synthesize(); // audio is a Blob (audio/mpeg)
  const arrayBuffer = await audio.arrayBuffer();
  return Buffer.from(arrayBuffer);
};

export const WEAK_SCORE_THRESHOLD = 5;
export const MAX_FOLLOW_UP_DEPTH = 3;

export const generateFollowUpQuestion = async ({ role, topic, question, answerTranscript, feedback }) => {
  const prompt = `You are conducting a mock interview for a ${role} candidate on the topic: ${topic}.

 You just asked: "${question}"
 The candidate answered: "${answerTranscript}"
 Your assessment: "${feedback}"

 The answer was weak or incomplete. Ask ONE follow-up question that digs deeper into THIS SAME question.

 Rules:
 - Base the follow-up strictly on what the candidate actually said above. Do not invent details, technologies, or claims they did not mention.
 - If their answer was too short or vague to probe a specific detail, ask them to walk through their overall approach or reasoning step by step instead of guessing at something they didn't say.
 - Do not ask a new, unrelated question or switch sub-topic.
 - Do not repeat the original question verbatim.
 - Keep it to one clear, answerable question.

  Return ONLY the follow-up question text, nothing else — no preamble, no "Follow-up:" prefix (that will be added separately).`;

  const completion = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [{ role: 'user', content: prompt }],
    max_tokens: 150,
    temperature: 0.6,
  });

  return completion.choices[0].message.content.trim();
  }; 
const TOPIC_INSTRUCTIONS = 
 {
  'DSA': `Ask a real Data Structures & Algorithms interview question — an actual coding problem (e.g. array/string manipulation, trees, graphs, DP, sliding window, two pointers, recursion, sorting/searching). State the problem clearly like a real interviewer would (with a one-line example if helpful). Do NOT ask about the candidate's projects, resume, or general experience. Do NOT ask a conceptual "what is X" question — ask an actual problem to solve.`,
  'System Design': `Ask a system design question appropriate for a ${'{role}'} — either a high-level design prompt (e.g. "design a URL shortener", "design a rate limiter") or a follow-up going deeper into scalability, database choice, caching, or trade-offs based on their last answer. Do NOT ask about DSA or personal projects unless directly relevant to the design discussion.`,
  'HR / Behavioral': `Ask a behavioral/HR interview question (teamwork, conflict, leadership, failure, motivation, situational "tell me about a time..."). Do NOT ask technical or coding questions.`,
  'CS Fundamentals': `Ask a core CS fundamentals question — OS, DBMS, Networks, OOP concepts. Do NOT ask about their personal projects or resume.`,
  'General': `Ask a general interview question appropriate for the role — can mix technical and behavioral naturally.`,
  'Quantitative Aptitude': `Ask a quantitative aptitude problem in the style of campus placement tests — percentages, profit & loss, time & work, time-speed-distance, simple/compound interest, ratios, averages, or probability/permutations. State the numbers and question clearly enough to be solved by ear, without needing to see multiple-choice options. Do NOT ask programming or CS theory questions here.`,

  'Verbal Ability': `Ask a short verbal ability question suited to a spoken format — correct a grammatically wrong sentence, explain the meaning/usage of a word in context, identify the odd word out, or a one-line analogy/synonym-antonym question. Keep it short since this is spoken, not a written test — avoid long reading-comprehension passages. Do NOT ask technical or aptitude-math questions here.`,

  'Data Interpretation': `Describe a small data scenario entirely in words (e.g. "a shop sold 120 units in January, 150 in February, and 90 in March") and ask the candidate to compute or interpret something from it (percentage change, average, ratio). Keep numbers simple enough to reason through verbally without a visual chart. Do NOT ask general quantitative aptitude questions unrelated to interpreting the given data.`,

  'Machine Learning': `Ask a fresher-level Machine Learning / AI fundamentals question — supervised vs unsupervised learning, overfitting/underfitting, bias-variance trade-off, common algorithms (linear/logistic regression, decision trees, k-NN, k-means, gradient descent), evaluation metrics (precision, recall, F1, confusion matrix), or basic neural network concepts. Keep it conceptual, not derivation-heavy math. Do NOT ask about resume or projects unless directly relevant.`,
};
const getTopicInstruction = (topic, role) => {
  const known = TOPIC_INSTRUCTIONS[topic];
  if (known) return known.replace('${role}', role);
  return `Ask an interview question specifically about "${topic}", appropriate for a ${role} candidate. Stay strictly on this topic — do not drift into unrelated areas, and do not ask about resume or projects unless directly relevant to "${topic}".`;
};


export const generateNextQuestion = async ({ role, topic, history, requiresCode = false, problemStyle = null }) => {
  const topicInstruction = getTopicInstruction(topic, role);
  const historyText = history.length
    ? history.map((h, i) => `Q${i + 1}: ${h.question}\nA${i + 1}: ${h.answerTranscript}`).join('\n\n')
    : 'This is the first question.';

  if (!requiresCode) {
    const prompt = `You are an interviewer for a ${role} position.

${topicInstruction}

Conversation so far:
${historyText}

Ask the next question now. Return ONLY the question text, nothing else.`;

    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 200,
      temperature: 0.8,
    });

    return { question: completion.choices[0].message.content.trim(), starterCode: '' };
  }

  const styleInstruction =
    problemStyle === 'codeforces'
      ? `Format this as a Codeforces-style competitive programming problem: a clear problem statement, then an "Input Format" section, an "Output Format" section, a "Constraints" section, and one "Example" section with sample input and sample output exactly as it would appear in a real CF problem. The candidate must write a COMPLETE PROGRAM that reads from standard input and writes to standard output — do not ask them to implement a single function or method.`
      : `Format this as a LeetCode-style problem: a clear problem statement, then 1-2 "Example" sections each with Input, Output, and a brief Explanation if helpful, then a "Constraints" section. The candidate implements a single function — do not ask for a full program with stdin/stdout.`;

  const prompt = `You are an interviewer for a ${role} position.

${topicInstruction}

${styleInstruction}

Conversation so far:
${historyText}

Respond with ONLY a JSON object, no markdown fences, no extra text:
{"question": "the full problem statement formatted as instructed above, using \\n for line breaks", "starterCode": "${problemStyle === 'codeforces' ? '' : 'a JavaScript function stub/signature matching the problem, body empty, using \\n for line breaks'}"}`;

  const completion = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [{ role: 'user', content: prompt }],
    max_tokens: 500,
    temperature: 0.7,
  });

  const parsed = safeParseJSON(completion.choices[0].message.content);
  if (!parsed || !parsed.question) {
    return { question: 'Could not generate a problem — please try again.', starterCode: '' };
  }
  return { question: parsed.question, starterCode: parsed.starterCode || '' };
};

 const safeParseJSON = (raw) => {
  try {
    return JSON.parse(raw.trim());
  } catch {
    const match = raw.match(/\{[\s\S]*\}/);
    if (match) {
      try {
        return JSON.parse(match[0]);
      } catch {
        return null;
      }
    }
    return null;
  }
};

const parseScoreResponse = (raw) => {
  const parsed = safeParseJSON(raw);
  if (!parsed || typeof parsed.score !== 'number') {
    return { feedback: 'Could not generate detailed feedback for this answer — please try again.', score: 5 };
  }
  return {
    feedback: parsed.feedback || '',
    score: Math.max(0, Math.min(10, Math.round(parsed.score))),
  };
};

export const scoreAnswer = async ({ question, answerTranscript, code, language }) => {
  const hasCode = code && code.trim().length > 0;

  const prompt = hasCode
    ? `You are grading a candidate's answer to a technical interview question.
        Question: "${question}"

Candidate's spoken explanation: "${answerTranscript}"

Candidate's code (${language || 'unspecified language'}):
\`\`\`${language || ''}
${code}
\`\`\`

Evaluate BOTH the correctness/quality of the code AND the clarity of their spoken reasoning together as one answer. Consider whether the code solves the problem, is reasonably efficient, has bugs or missed edge cases, and whether their explanation made sense alongside the code.

Respond with ONLY a JSON object, no markdown fences, no extra text:
{"feedback": "2-3 sentence feedback covering both code and explanation", "score": <integer 0-10>}`
    : `You are grading a candidate's answer to an interview question.

Question: "${question}"
Candidate's answer: "${answerTranscript}"

Respond with ONLY a JSON object, no markdown fences, no extra text:
{"feedback": "2-3 sentence constructive feedback", "score": <integer 0-10>}`;



  const completion = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [{ role: 'user', content: prompt }],
    max_tokens: 300,
    temperature: 0.4,
  });

  return parseScoreResponse(completion.choices[0].message.content);
};
export const generateOverallFeedback = async ({ role, topic, turns }) => {
  const summary = turns
    .map((t, i) => `Q${i + 1}: ${t.question}\nA${i + 1}: ${t.answerTranscript}\nScore: ${t.score}/10`)
    .join('\n\n');

  const prompt = `You just finished evaluating a mock ${topic} interview for a ${role} role.
${summary}

Give a short overall feedback paragraph (3-4 sentences) covering strengths and areas to improve, and an overall score out of 10.
Return strict JSON only, no markdown: {"overallFeedback": "...", "overallScore": number}`;

  const completion = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [{ role: 'user', content: prompt }],
    max_tokens: 300,
  });

  return JSON.parse(completion.choices[0].message.content.trim());
};