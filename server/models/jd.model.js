import mongoose from 'mongoose';

const jdSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  companyName: {
    type: String,
    required: [true, 'Company name is required'],
  },
  roleTitle: {
    type: String,
    required: [true, 'Role title is required'],
  },
  jdText: {
    type: String,
    required: [true, 'JD text is required'],
  },

  // extracted by LLM
  parsedJD: {
    requiredSkills: [String],
    niceToHaveSkills: [String],
    domainKeywords: [String],
    experienceLevel: String,
    roleType: String,
  },

  // vectors stored for Atlas Vector Search
  jdEmbedding: {
    type: [Number],
    default: [],
  },

  // scoring breakdown
  scores: {
    skillMatchScore: { type: Number, default: 0 },
    semanticScore: { type: Number, default: 0 },
    keywordScore: { type: Number, default: 0 },
    llmScore: { type: Number, default: 0 },
    atsScore: { type: Number, default: 0 },
    aiScore: { type: Number, default: 0 },
  },

  // section level scores
  sectionScores: {
    skills: { type: Number, default: 0 },
    experience: { type: Number, default: 0 },
    education: { type: Number, default: 0 },
  },

  // gap analysis
  skillGaps: [
    {
      skill: String,
      severity: {
        type: String,
        enum: ['critical', 'moderate', 'low'],
      },
    },
  ],
  matchedSkills: [
  {
    skill: String,
    matchedVia: String,
    confidence: { type: String, enum: ['strong', 'partial'] },
  },
 ],

  // LLM feedback
  llmFeedback: {
    strengths: [String],
    verdict: String,
  },

  // uploaded resume scoring
  uploadedResume: {
    text: String,
    atsScore: { type: Number, default: 0 },
    aiScore: { type: Number, default: 0 },
    scores: {
      skillMatchScore: { type: Number, default: 0 },
      semanticScore: { type: Number, default: 0 },
      keywordScore: { type: Number, default: 0 },
      llmScore: { type: Number, default: 0 },
    },
  },

  // generated resume
  generatedResume: {
    content: { type: mongoose.Schema.Types.Mixed },
    generatedAt: Date,
    atsScore: { type: Number, default: 0 },
    aiScore: { type: Number, default: 0 },
    sectionScores: {
      skills: { type: Number, default: 0 },
      experience: { type: Number, default: 0 },
      education: { type: Number, default: 0 },
    },
    

  },
  // score based on user's stored DB profile (skills + projects)
  profileScore: {
  atsScore: { type: Number, default: 0 },
  aiScore: { type: Number, default: 0 },
  sectionScores: {
    skills: { type: Number, default: 0 },
    experience: { type: Number, default: 0 },
    education: { type: Number, default: 0 },
  },
  skillGaps: [
    {
      skill: String,
      severity: { type: String, enum: ['critical', 'moderate', 'low'] },
    },
  ],
  matchedSkills: [
    {
      skill: String,
      matchedVia: String,
      confidence: { type: String, enum: ['strong', 'partial'] },
    },
  ],
  strengths: [String],
  verdict: String,
 },

// score based on an uploaded resume file/text, null if none provided
uploadedScore: {
  type: {
    text: String,
    finalScore: Number,
    sectionScores: {
      skills: Number,
      experience: Number,
      education: Number,
    },
    skillGaps: [
      {
        skill: String,
        severity: { type: String, enum: ['critical', 'moderate', 'low'] },
      },
    ],
    matchedSkills: [
      {
        skill: String,
        matchedVia: String,
        confidence: { type: String, enum: ['strong', 'partial'] },
      },
    ],
    strengths: [String],
    verdict: String,
  },
  default: null,
},

}, { timestamps: true });

const JD = mongoose.model('JD', jdSchema);

export default JD;