import JD from '../models/jd.model.js';
import Skill from '../models/skill.model.js';
import Project from '../models/project.model.js';
import User from '../models/user.model.js';
import { buildResume } from '../services/resume.service.js';
import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/apiError.js';
import ApiResponse from '../utils/apiResponse.js';
import { computeFinalScore } from '../services/scoring.service.js';

// helper: flatten generated content into resumeText + parsedResume shape for scoring
const prepareForScoring = (user, content) => {
  const resumeText = `
    ${content.summary}
    Skills: ${content.skills.join(', ')}
    ${content.experience.map(e => `${e.title} at ${e.company}: ${e.description}`).join(' ')}
    ${content.projects.map(p => `${p.name}: ${Array.isArray(p.description) ? p.description.join(' ') : p.description} Tech: ${p.techStack}`).join(' ')}
  `;

  const parsedResume = {
    skills: content.skills,
    experienceEntries: content.experience.length > 0
      ? content.experience
      : content.projects.map(p => ({
          title: p.name,
          company: 'Project',
          description: Array.isArray(p.description) ? p.description.join(' ') : p.description,
        })),
    education: user.education,
  };

  return { resumeText, parsedResume };
};

// @desc    Generate tailored resume (content + PDF) for a given JD analysis
// @route   POST /api/resume/generate/:jdId
export const generateResume = asyncHandler(async (req, res) => {
  const jd = await JD.findOne({ _id: req.params.jdId, user: req.user._id });
  if (!jd) throw new ApiError(404, 'JD analysis not found');

  const user = await User.findById(req.user._id);
  const skills = await Skill.find({ user: req.user._id, isVisible: true });
  const projects = await Project.find({ user: req.user._id, isVisible: true })
    .populate('techStack', 'name');

  const { pdfBuffer, resumeContent } = await buildResume(user, skills, projects, jd);

  const { resumeText, parsedResume } = prepareForScoring(user, resumeContent);
  const scoreResult = await computeFinalScore(resumeText, jd.jdText, parsedResume, jd.parsedJD, jd.parsedJD?.experienceLevel);

  jd.generatedResume = {
    content: resumeContent,
    generatedAt: new Date(),
    atsScore: scoreResult.atsScore,
    aiScore: scoreResult.aiScore,
    sectionScores: scoreResult.sectionScores,
    skillGaps: scoreResult.skillGaps,
  };
  await jd.save();

  res.set({
    'Content-Type': 'application/pdf',
    'Content-Disposition': `attachment; filename=resume-${jd.companyName}.pdf`,
    'X-Ats-Score': scoreResult.atsScore,
    'X-Ai-Score': scoreResult.aiScore,
  });
});