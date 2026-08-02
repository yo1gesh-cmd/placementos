import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../api/axios';
import CodeMirror from '@uiw/react-codemirror';
import { javascript } from '@codemirror/lang-javascript';
import { python } from '@codemirror/lang-python';
import { java } from '@codemirror/lang-java';
import { cpp } from '@codemirror/lang-cpp';
import { StreamLanguage } from '@codemirror/language';
import { go } from '@codemirror/legacy-modes/mode/go';

const inputStyle = { borderColor: 'rgba(255,255,255,0.1)' };
const focusHandlers = {
  onFocus: (e) => (e.target.style.borderColor = '#F59E0B'),
  onBlur: (e) => (e.target.style.borderColor = 'rgba(255,255,255,0.1)'),
};
const inputClass =
  'bg-transparent border rounded-2xl px-4 py-3 font-body text-sm focus:outline-none w-full transition-colors duration-300';

const easeCurve = [0.32, 0.72, 0, 1];

const TOPIC_GROUPS = {
  'General': ['General', 'DSA', 'System Design', 'HR / Behavioral'],
  'Web Dev': ['JavaScript', 'React', 'Frontend', 'Backend'],
  'Core CS': ['Operating Systems', 'DBMS', 'Computer Networks', 'OOP'],
  'Aptitude': ['Quantitative Aptitude', 'Logical Reasoning', 'Verbal Ability', 'Data Interpretation'],
  'Emerging Tech': ['Machine Learning'],
};
const KNOWN_CODING_TOPICS = ['DSA', 'JavaScript', 'React', 'Frontend', 'Backend'];

const LANGUAGES = [
  { id: 'javascript', label: 'JavaScript', ext: javascript({ jsx: true }) },
  { id: 'typescript', label: 'TypeScript', ext: javascript({ jsx: true, typescript: true }) },
  { id: 'python', label: 'Python', ext: python() },
  { id: 'java', label: 'Java', ext: java() },
  { id: 'cpp', label: 'C++', ext: cpp() },
  { id: 'go', label: 'Go', ext: StreamLanguage.define(go) },
];

const getLangExtension = (id) => (LANGUAGES.find((l) => l.id === id) || LANGUAGES[0]).ext;

const VoiceInterview = () => {
  const [stage, setStage] = useState('setup'); // setup | interview | completed
  const [role, setRole] = useState('');
  const [topics, setTopics] = useState([]);
  const [numQuestions, setNumQuestions] = useState(6);
  const [isFollowUp, setIsFollowUp] = useState(false);
  const [ttsEnabled, setTtsEnabled] = useState(true);
  const [customTopicInput, setCustomTopicInput] = useState('');
  const [codingTopics, setCodingTopics] = useState([]);
  const [customTopicIsCoding, setCustomTopicIsCoding] = useState(false);
  const [requiresCode, setRequiresCode] = useState(false);
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState('javascript');
  const [lastCode, setLastCode] = useState('');
  const [lastLanguage, setLastLanguage] = useState('');
  const [sessionId, setSessionId] = useState(null);
  const [question, setQuestion] = useState('');
  const [turnIndex, setTurnIndex] = useState(1);
  const [totalTurns, setTotalTurns] = useState(6);

  const [isRecording, setIsRecording] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [lastTranscript, setLastTranscript] = useState('');
  const [lastFeedback, setLastFeedback] = useState(null);
  const [overall, setOverall] = useState(null);
  const [error, setError] = useState('');

  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const streamRef = useRef(null);
  const audioRef = useRef(null);
  const audioUrlRef = useRef(null);

  const toggleTopic = (t) => {
    setTopics((prev) => {
      const next = prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t];
      if (numQuestions < next.length) setNumQuestions(next.length);
      return next;
    });
    if (KNOWN_CODING_TOPICS.includes(t)) {
      setCodingTopics((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]));
    }
  };

  const addCustomTopic = () => {
    const cleaned = customTopicInput.trim().replace(/[\r\n]+/g, ' ').slice(0, 40);
    if (!cleaned) return;
    if (topics.some((t) => t.toLowerCase() === cleaned.toLowerCase())) {
      setCustomTopicInput('');
      setCustomTopicIsCoding(false);
      return;
    }
    setTopics((prev) => {
      const next = [...prev, cleaned];
      if (numQuestions < next.length) setNumQuestions(next.length);
      return next;
    });
    if (customTopicIsCoding) {
      setCodingTopics((prev) => [...prev, cleaned]);
    }
    setCustomTopicInput('');
    setCustomTopicIsCoding(false);
  };

  const removeCustomTopic = (t) => {
    setTopics((prev) => prev.filter((x) => x !== t));
    setCodingTopics((prev) => prev.filter((x) => x !== t));
  };

  useEffect(() => {
    return () => {
      audioRef.current?.pause();
      if (audioUrlRef.current) URL.revokeObjectURL(audioUrlRef.current);
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  const speak = async (text) => {
    if (!ttsEnabled) return;
    try {
      audioRef.current?.pause();
      if (audioUrlRef.current) {
        URL.revokeObjectURL(audioUrlRef.current);
        audioUrlRef.current = null;
      }

      const res = await api.post(
        '/voice-interview/speak',
        { text },
        { responseType: 'blob' }
      );

      const url = URL.createObjectURL(res.data);
      audioUrlRef.current = url;
      const audio = new Audio(url);
      audioRef.current = audio;
      audio.onplay = () => setIsSpeaking(true);
      audio.onended = () => setIsSpeaking(false);
      audio.onerror = () => setIsSpeaking(false);
      await audio.play();
    } catch (err) {
      setIsSpeaking(false);
    }
  };

  const handleStart = async (e) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    try {
      const res = await api.post('/voice-interview/start', { role, topics, numQuestions, codingTopics });
      const { sessionId, question, totalTurns: total, requiresCode: rc } = res.data.data;
      setSessionId(sessionId);
      setQuestion(question);
      setTurnIndex(1);
      setTotalTurns(total || numQuestions);
      setLastTranscript('');
      setLastFeedback(null);
      setLastCode('');
      setLastLanguage('');
      setIsFollowUp(false);
      setRequiresCode(!!rc);
      setCode('');
      setLanguage('javascript');
      setStage('interview');
      speak(question);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not start session');
    } finally {
      setIsSubmitting(false);
    }
  };

  const startRecording = async () => {
    setError('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];
      recorder.ondataavailable = (e) => e.data.size > 0 && chunksRef.current.push(e.data);
      recorder.start();
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
    } catch (err) {
      setError('Microphone access denied. Please allow mic access to continue.');
    }
  };

  const stopRecordingAndSubmit = () => {
    const recorder = mediaRecorderRef.current;
    if (!recorder) return;

    recorder.onstop = async () => {
      setIsRecording(false);
      streamRef.current?.getTracks().forEach((t) => t.stop());

      const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
      const formData = new FormData();
      formData.append('audio', blob, 'answer.webm');
      if (requiresCode) {
        formData.append('code', code);
        formData.append('language', language);
      }

      setIsSubmitting(true);
      setError('');
      try {
        const res = await api.post(`/voice-interview/${sessionId}/answer`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        const data = res.data.data;
        setLastTranscript(data.transcript);
        setLastFeedback({ feedback: data.feedback, score: data.score });
        setLastCode(requiresCode ? code : '');
        setLastLanguage(requiresCode ? language : '');

        if (data.done) {
          setOverall({ feedback: data.overallFeedback, score: data.overallScore });
          setStage('completed');
        } else {
          setQuestion(data.nextQuestion);
          setIsFollowUp(data.isFollowUp);
          setRequiresCode(!!data.requiresCode);
          setCode('');
          setLanguage('javascript');
          if (!data.isFollowUp) setTurnIndex((i) => i + 1);
          speak(data.nextQuestion);
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Could not process your answer');
      } finally {
        setIsSubmitting(false);
      }
    };

    recorder.stop();
  };

  const handleSkip = async () => {
    setIsSubmitting(true);
    setError('');
    setLastTranscript('');
    setLastFeedback(null);
    setLastCode('');
    setLastLanguage('');
    try {
      const res = await api.post(`/voice-interview/${sessionId}/skip`);
      const data = res.data.data;

      if (data.done) {
        setOverall({ feedback: data.overallFeedback, score: data.overallScore });
        setStage('completed');
      } else {
        setQuestion(data.nextQuestion);
        setIsFollowUp(data.isFollowUp);
        setRequiresCode(!!data.requiresCode);
        setCode('');
        setLanguage('javascript');
        if (!data.isFollowUp) setTurnIndex((i) => i + 1);
        speak(data.nextQuestion);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Could not skip question');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetSession = () => {
    setStage('setup');
    setRole('');
    setTopics([]);
    setCodingTopics([]);
    setNumQuestions(6);
    setIsFollowUp(false);
    setRequiresCode(false);
    setCode('');
    setLanguage('javascript');
    setSessionId(null);
    setQuestion('');
    setLastTranscript('');
    setLastFeedback(null);
    setLastCode('');
    setLastLanguage('');
    setOverall(null);
    setError('');
  };

  return (
    <div className="min-h-[100dvh] relative overflow-hidden" style={{ backgroundColor: '#050505', color: '#F9FAFB' }}>
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(circle at 15% 10%, rgba(245,158,11,0.06), transparent 40%), radial-gradient(circle at 85% 90%, rgba(52,211,153,0.05), transparent 40%)',
        }}
      />

      <div className="max-w-3xl mx-auto px-6 py-16 relative">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: easeCurve }}
          className="mb-10"
        >
          <span
            className="inline-block rounded-full px-3 py-1 text-[10px] uppercase tracking-[0.2em] font-medium mb-4"
            style={{ backgroundColor: 'rgba(245,158,11,0.1)', color: '#F59E0B' }}
          >
            Voice Interview
          </span>
          <h1 className="font-display font-bold text-4xl tracking-tight">
            {stage === 'setup' && 'Practice out loud'}
            {stage === 'interview' && `Question ${turnIndex} of ${totalTurns}`}
            {stage === 'completed' && 'Session complete'}
          </h1>
        </motion.div>

        {stage === 'setup' && (
          <div
            className="p-1.5 rounded-[2rem] mb-10"
            style={{ backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
          >
            <div
              className="rounded-[calc(2rem-0.375rem)] p-8"
              style={{ backgroundColor: '#0A0A0A', boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.04)' }}
            >
              <form onSubmit={handleStart} className="flex flex-col gap-4">
                <input
                  placeholder="Target role (e.g. SDE Intern, Backend Developer)"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className={inputClass}
                  style={inputStyle}
                  {...focusHandlers}
                  required
                />

                <div className="flex flex-col gap-4">
                  <label className="font-body text-xs" style={{ color: '#71717A' }}>
                    Topic focus (select any number)
                  </label>

                  {Object.entries(TOPIC_GROUPS).map(([group, list]) => (
                    <div key={group} className="flex flex-col gap-1.5">
                      <span className="font-body text-[10px] uppercase tracking-wider" style={{ color: '#52525B' }}>
                        {group}
                      </span>
                      <div className="flex flex-wrap gap-2">
                        {list.map((t) => (
                          <button
                            type="button"
                            key={t}
                            onClick={() => toggleTopic(t)}
                            className="font-body text-xs px-3 py-2 rounded-full transition-colors duration-300"
                            style={{
                              backgroundColor: topics.includes(t) ? '#F59E0B' : 'rgba(255,255,255,0.05)',
                              color: topics.includes(t) ? '#0A0A0A' : '#71717A',
                            }}
                          >
                            {t}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}

                  {/* Custom topic — appears ONCE, after all predefined groups */}
                  <div className="flex flex-col gap-1.5">
                    <span className="font-body text-[10px] uppercase tracking-wider" style={{ color: '#52525B' }}>
                      Custom
                    </span>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={customTopicInput}
                        onChange={(e) => setCustomTopicInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            addCustomTopic();
                          }
                        }}
                        placeholder="Type a topic not listed above (e.g. Kubernetes)"
                        maxLength={40}
                        className={inputClass}
                        style={inputStyle}
                        {...focusHandlers}
                      />
                      <button
                        type="button"
                        onClick={addCustomTopic}
                        className="font-body text-xs px-4 py-2 rounded-full shrink-0 transition-colors duration-300"
                        style={{ backgroundColor: 'rgba(255,255,255,0.05)', color: '#F59E0B' }}
                      >
                        + Add
                      </button>
                    </div>

                    <label className="font-body text-xs flex items-center gap-2" style={{ color: '#71717A' }}>
                      <input
                        type="checkbox"
                        checked={customTopicIsCoding}
                        onChange={(e) => setCustomTopicIsCoding(e.target.checked)}
                      />
                      This is a coding topic (adds a code editor)
                    </label>

                    {topics.filter((t) => !Object.values(TOPIC_GROUPS).flat().includes(t)).length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-1">
                        {topics
                          .filter((t) => !Object.values(TOPIC_GROUPS).flat().includes(t))
                          .map((t) => (
                            <span
                              key={t}
                              className="font-body text-xs px-3 py-2 rounded-full flex items-center gap-2"
                              style={{ backgroundColor: '#F59E0B', color: '#0A0A0A' }}
                            >
                              {t}
                              <button type="button" onClick={() => removeCustomTopic(t)} className="font-bold">×</button>
                            </span>
                          ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="font-body text-xs" style={{ color: '#71717A' }}>
                    Number of questions (min {Math.max(topics.length, 1)})
                  </label>
                  <input
                    type="number"
                    min={Math.max(topics.length, 1)}
                    value={numQuestions}
                    onChange={(e) => setNumQuestions(Math.max(Number(e.target.value), topics.length || 1))}
                    className={inputClass}
                    style={inputStyle}
                    {...focusHandlers}
                  />
                </div>

                <button
                  type="button"
                  onClick={() => setTtsEnabled((v) => !v)}
                  className="font-body text-xs self-start px-3 py-2 rounded-full transition-colors duration-300"
                  style={{ backgroundColor: 'rgba(255,255,255,0.05)', color: ttsEnabled ? '#34D399' : '#71717A' }}
                >
                  {ttsEnabled ? '🔊 Interviewer voice on' : '🔇 Interviewer voice off'}
                </button>

                {error && (
                  <p className="text-sm font-body" style={{ color: '#E11D48' }}>
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting || topics.length === 0}
                  className="group self-start font-body font-medium text-sm rounded-full px-6 py-3 flex items-center gap-2 transition-transform duration-300 active:scale-[0.98] disabled:opacity-50"
                  style={{ backgroundColor: '#F59E0B', color: '#0A0A0A' }}
                >
                  {isSubmitting ? 'Starting...' : 'Start interview'}
                  <span
                    className="w-6 h-6 rounded-full flex items-center justify-center transition-transform duration-300 group-hover:translate-x-0.5"
                    style={{ backgroundColor: 'rgba(10,10,10,0.15)' }}
                  >
                    →
                  </span>
                </button>
              </form>
            </div>
          </div>
        )}

        {stage === 'interview' && (
          <AnimatePresence mode="wait">
            <motion.div
              key={turnIndex}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.5, ease: easeCurve }}
            >
              <div className="flex gap-1.5 mb-8">
                {Array.from({ length: totalTurns }).map((_, i) => (
                  <div
                    key={i}
                    className="h-1 flex-1 rounded-full transition-colors duration-500"
                    style={{ backgroundColor: i < turnIndex ? '#F59E0B' : 'rgba(255,255,255,0.08)' }}
                  />
                ))}
              </div>

              <div
                className="p-1.5 rounded-[2rem] mb-6"
                style={{ backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
              >
                <div
                  className="rounded-[calc(2rem-0.375rem)] p-8 flex flex-col gap-4"
                  style={{ backgroundColor: '#0A0A0A', boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.04)' }}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{
                        backgroundColor: isSpeaking ? '#34D399' : 'rgba(255,255,255,0.2)',
                        boxShadow: isSpeaking ? '0 0 8px #34D399' : 'none',
                      }}
                    />
                    <span className="font-body text-xs" style={{ color: '#71717A' }}>
                      {isSpeaking ? 'Speaking...' : 'Interviewer'}
                    </span>
                  </div>
                  {isFollowUp && (
                    <span
                      className="font-body text-[10px] uppercase tracking-wider px-2 py-1 rounded-full self-start"
                      style={{ backgroundColor: 'rgba(245,158,11,0.1)', color: '#F59E0B' }}
                    >
                      ↳ Follow-up
                    </span>
                  )}
                  <p className="font-display text-2xl leading-snug">{question.replace(/^Follow-up:\s*/, '')}</p>

                  {requiresCode && (
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center justify-between">
                        <span className="font-body text-xs uppercase tracking-wider" style={{ color: '#71717A' }}>
                          Your code
                        </span>
                        <select
                          value={language}
                          onChange={(e) => setLanguage(e.target.value)}
                          className="font-body text-xs rounded-full px-3 py-1.5 bg-transparent border"
                          style={{ borderColor: 'rgba(255,255,255,0.1)', color: '#F9FAFB' }}
                        >
                          {LANGUAGES.map((l) => (
                            <option key={l.id} value={l.id} style={{ backgroundColor: '#0A0A0A' }}>
                              {l.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.1)' }}>
                        <CodeMirror
                          value={code}
                          height="220px"
                          theme="dark"
                          extensions={[getLangExtension(language)]}
                          onChange={(val) => setCode(val)}
                        />
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => speak(question)}
                      disabled={!ttsEnabled}
                      className="font-body text-xs self-start px-3 py-1.5 rounded-full transition-colors duration-300 disabled:opacity-40"
                      style={{ backgroundColor: 'rgba(255,255,255,0.05)', color: '#71717A' }}
                    >
                      ↻ Replay question
                    </button>
                    <button
                      type="button"
                      onClick={() => setTtsEnabled((v) => !v)}
                      className="font-body text-xs self-start px-3 py-1.5 rounded-full transition-colors duration-300"
                      style={{ backgroundColor: 'rgba(255,255,255,0.05)', color: ttsEnabled ? '#34D399' : '#71717A' }}
                    >
                      {ttsEnabled ? '🔊' : '🔇'}
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex flex-col items-center gap-4 py-6">
                <button
                  type="button"
                  onClick={isRecording ? stopRecordingAndSubmit : startRecording}
                  disabled={isSubmitting || (requiresCode && !code.trim() && !isRecording)}
                  className="w-20 h-20 rounded-full flex items-center justify-center transition-transform duration-300 active:scale-95 disabled:opacity-50"
                  style={{
                    backgroundColor: isRecording ? '#E11D48' : '#F59E0B',
                    boxShadow: isRecording ? '0 0 0 8px rgba(225,29,72,0.15)' : '0 0 0 8px rgba(245,158,11,0.1)',
                  }}
                >
                  <span
                    style={{
                      width: isRecording ? '18px' : '24px',
                      height: isRecording ? '18px' : '24px',
                      borderRadius: isRecording ? '4px' : '9999px',
                      backgroundColor: '#0A0A0A',
                      transition: 'all 0.3s ease',
                    }}
                  />
                </button>
                <p className="font-body text-sm" style={{ color: '#71717A' }}>
                  {isSubmitting
                    ? 'Processing your answer...'
                    : isRecording
                    ? 'Recording — tap to stop and submit'
                    : 'Tap to record your answer'}
                </p>
                {requiresCode && !code.trim() && (
                  <p className="font-body text-xs" style={{ color: '#F59E0B' }}>
                    Write your code first, then record your explanation.
                  </p>
                )}
                <button
                  type="button"
                  onClick={handleSkip}
                  disabled={isSubmitting || isRecording}
                  className="font-body text-xs px-3 py-1.5 rounded-full transition-colors duration-300 disabled:opacity-40"
                  style={{ backgroundColor: 'rgba(255,255,255,0.05)', color: '#71717A' }}
                >
                  Skip this question →
                </button>
              </div>

              {error && (
                <p className="text-sm font-body text-center mb-4" style={{ color: '#E11D48' }}>
                  {error}
                </p>
              )}

              {lastTranscript && (
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, ease: easeCurve }}
                  className="rounded-2xl p-5 flex flex-col gap-3"
                  style={{ backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
                >
                  <div>
                    <span className="font-body text-xs uppercase tracking-wider" style={{ color: '#71717A' }}>
                      Your answer
                    </span>
                    <p className="font-mono text-xs mt-1" style={{ color: '#F9FAFB' }}>
                      {lastTranscript}
                    </p>
                  </div>
                  {lastCode && (
                    <div>
                      <span className="font-body text-xs uppercase tracking-wider" style={{ color: '#71717A' }}>
                        Your code ({lastLanguage})
                      </span>
                      <pre
                        className="font-mono text-xs mt-1 p-3 rounded-xl overflow-x-auto"
                        style={{ backgroundColor: 'rgba(255,255,255,0.03)', color: '#F9FAFB' }}
                      >
                        {lastCode}
                      </pre>
                    </div>
                  )}
                  {lastFeedback && (
                    <div className="flex items-start justify-between gap-4 pt-3" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                      <p className="font-body text-sm flex-1" style={{ color: '#71717A' }}>
                        {lastFeedback.feedback}
                      </p>
                      <span
                        className="font-display font-bold text-lg shrink-0"
                        style={{ color: lastFeedback.score >= 7 ? '#34D399' : lastFeedback.score >= 4 ? '#F59E0B' : '#E11D48' }}
                      >
                        {lastFeedback.score}/10
                      </span>
                    </div>
                  )}
                </motion.div>
              )}
            </motion.div>
          </AnimatePresence>
        )}

        {stage === 'completed' && overall && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: easeCurve }}
            className="flex flex-col gap-6"
          >
            <div
              className="p-1.5 rounded-[2rem]"
              style={{ backgroundColor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
            >
              <div
                className="rounded-[calc(2rem-0.375rem)] p-8 flex flex-col items-center text-center gap-4"
                style={{ backgroundColor: '#0A0A0A', boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.04)' }}
              >
                <span
                  className="font-display font-bold text-6xl"
                  style={{ color: overall.score >= 7 ? '#34D399' : overall.score >= 4 ? '#F59E0B' : '#E11D48' }}
                >
                  {overall.score}
                  <span className="text-2xl" style={{ color: '#71717A' }}>/10</span>
                </span>
                <p className="font-body text-sm max-w-md" style={{ color: '#F9FAFB' }}>
                  {overall.feedback}
                </p>
              </div>
            </div>

            <button
              onClick={resetSession}
              className="group self-start font-body font-medium text-sm rounded-full px-6 py-3 flex items-center gap-2 transition-transform duration-300 active:scale-[0.98]"
              style={{ backgroundColor: '#F59E0B', color: '#0A0A0A' }}
            >
              Start another session
              <span
                className="w-6 h-6 rounded-full flex items-center justify-center transition-transform duration-300 group-hover:translate-x-0.5"
                style={{ backgroundColor: 'rgba(10,10,10,0.15)' }}
              >
                →
              </span>
            </button>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default VoiceInterview;