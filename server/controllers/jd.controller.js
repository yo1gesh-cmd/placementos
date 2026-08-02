import JD from '../models/jd.model.js';
import Skill from '../models/skill.model.js';
import Project from '../models/project.model.js';
import fs from 'fs';


import { computeFinalScore } from '../services/scoring.service.js';
import { getEmbedding } from '../services/embedding.service.js';
import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/apiError.js';
import ApiResponse from '../utils/apiResponse.js';
import { parseResume, parseJD } from '../services/resumeParser.service.js';
import { extractPdfText } from '../services/pdfExtract.service.js';

// builds resume-like text from user's database profile
const buildProfileText = async (userId) => {
  
  const skills = await Skill.find({ user: userId, isVisible: true });
  const projects = await Project.find({ user: userId, isVisible: true })
    .populate('techStack', 'name');

  const skillsText = skills
    .map(s => `${s.name} (${s.proficiency}, ${s.status})`)
    .join(', ');

  const projectsText = projects
    .map(p => `${p.name}: ${p.description}. Tech: ${p.techStack.map(t => t.name).join(', ')}. Impact: ${p.impactMetric}`)
    .join(' ');

  return `Skills: ${skillsText}\n\nProjects: ${projectsText}`;
};

// @desc    Analyze a JD — scores both uploaded resume and generated profile
// @route   POST /api/jd/analyze
export const analyzeJD = asyncHandler(async (req, res) => {
  let { companyName, roleTitle, jdText, uploadedResumeText } = req.body;

  if (req.files?.jdPdf?.[0]) {
    fs.writeFileSync('debug_uploaded_jd.pdf', req.files.jdPdf[0].buffer);
    console.log('Saved debug_uploaded_jd.pdf, size:', req.files.jdPdf[0].buffer.length);
    jdText = await extractPdfText(req.files.jdPdf[0].buffer, 'job description');
  }

  if (req.files?.resumePdf?.[0]) {
    uploadedResumeText = await extractPdfText(req.files.resumePdf[0].buffer, 'resume');
  }

  if (!jdText) throw new ApiError(400, 'JD text is required');

  console.log('jdText length:', jdText?.length);
  console.log('jdText preview:', jdText?.slice(0, 200));

  const parsedJD = await parseJD(jdText);
  console.log('FULL parsedJD:', JSON.stringify(parsedJD, null, 2));

  const profileText = await buildProfileText(req.user._id);
  const parsedProfile = await parseResume(profileText);

  const profileScoreResult = await computeFinalScore(profileText, jdText, parsedProfile, parsedJD, parsedJD.experienceLevel);

  let uploadedScoreResult = null;

  if (uploadedResumeText) {
    console.log('uploadedResumeText length:', uploadedResumeText?.length);
    console.log('uploadedResumeText preview:', uploadedResumeText?.slice(0, 150));
    const parsedUploaded = await parseResume(uploadedResumeText);
    uploadedScoreResult = await computeFinalScore(uploadedResumeText, jdText, parsedUploaded, parsedJD, parsedJD.experienceLevel);
  }

  // if a resume was uploaded, that becomes the primary displayed result
  const primaryResult = uploadedScoreResult || profileScoreResult;

  const jd = await JD.create({
  user: req.user._id,
  companyName,
  roleTitle,
  jdText,
  parsedJD,
  jdEmbedding: profileScoreResult.jdEmbedding,

  profileScore: {
    atsScore: profileScoreResult.atsScore,
    aiScore: profileScoreResult.aiScore,
    sectionScores: profileScoreResult.sectionScores,
    skillGaps: profileScoreResult.skillGaps,
    matchedSkills: profileScoreResult.matchedSkills,
    strengths: profileScoreResult.strengths,
    verdict: profileScoreResult.verdict,
  },

  uploadedScore: uploadedResumeText ? {
    text: uploadedResumeText,
    atsScore: uploadedScoreResult.atsScore,
    aiScore: uploadedScoreResult.aiScore,
    sectionScores: uploadedScoreResult.sectionScores,
    skillGaps: uploadedScoreResult.skillGaps,
    matchedSkills: uploadedScoreResult.matchedSkills,
    strengths: uploadedScoreResult.strengths,
    verdict: uploadedScoreResult.verdict,
  } : null,
});

  res.status(201).json(new ApiResponse(201, {
    jd,
    profileAnalysis: profileScoreResult,
    uploadedAnalysis: uploadedScoreResult,
  }, 'JD analyzed successfully'));
});

// @desc    Get all JD analyses for the user
// @route   GET /api/jd
export const getJDHistory = asyncHandler(async (req, res) => {
  const jds = await JD.find({ user: req.user._id })
    .select('companyName roleTitle profileScore.atsScore profileScore.aiScore uploadedScore.atsScore uploadedScore.aiScore createdAt')

  res.json(new ApiResponse(200, jds, 'JD history fetched successfully'));
});

// @desc    Get one JD analysis by ID
// @route   GET /api/jd/:id
export const getJDById = asyncHandler(async (req, res) => {
  const jd = await JD.findOne({ _id: req.params.id, user: req.user._id });
  if (!jd) throw new ApiError(404, 'JD analysis not found');

  res.json(new ApiResponse(200, jd, 'JD analysis fetched successfully'));
});

// @desc    Get most frequently missing skills across all JDs
// @route   GET /api/jd/recommended-skills
export const getRecommendedSkills = asyncHandler(async (req, res) => {
  const jds = await JD.find({ user: req.user._id }).select('profileScore.skillGaps');

  const skillFrequency = {};

  jds.forEach(jd => {
    (jd.profileScore?.skillGaps || []).forEach(gap => {
      if (!skillFrequency[gap.skill]) {
        skillFrequency[gap.skill] = { count: 0, severity: gap.severity };
      }
      skillFrequency[gap.skill].count += 1;
    });
  });

  const recommended = Object.entries(skillFrequency)
    .map(([skill, data]) => ({ skill, appearsIn: data.count, severity: data.severity }))
    .sort((a, b) => b.appearsIn - a.appearsIn)
    .slice(0, 10);

  res.json(new ApiResponse(200, recommended, 'Recommended skills fetched successfully'));
});