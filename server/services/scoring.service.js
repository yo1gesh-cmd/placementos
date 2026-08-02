import { getEmbedding, cosineSimilarity, calibrateSimilarity  } from './embedding.service.js';
import { getBM25Score } from './bm25.service.js';
import Groq from 'groq-sdk';

const client = new Groq({ apiKey: process.env.GROQ_API_KEY });

// ── SECTION 1: Section-level embedding scores ──────────────────

export const computeSectionScores = async (parsedResume, jdEmbedding, experienceLevel = '') => {
  const skillsText = parsedResume.skills.join(', ');

  const experienceText = parsedResume.experienceEntries
    .map(e => `${e.title} at ${e.company}: ${e.description}`)
    .join(' ');

  const educationText = parsedResume.education
    .map(e => `${e.degree} in ${e.field}`)
    .join(', ');

  const [skillsEmb, expEmb, eduEmb] = await Promise.all([
    getEmbedding(skillsText || 'no skills listed'),
    getEmbedding(experienceText || 'no experience listed'),
    getEmbedding(educationText || 'no education listed'),
  ]);

  const rawScores = {
  skills: cosineSimilarity(skillsEmb, jdEmbedding),
  experience: cosineSimilarity(expEmb, jdEmbedding),
  education: cosineSimilarity(eduEmb, jdEmbedding),
  };

  const scores = {
  skills: calibrateSimilarity(rawScores.skills),
  experience: calibrateSimilarity(rawScores.experience),
  education: calibrateSimilarity(rawScores.education),
  };

 console.log('DEBUG section similarity — raw vs calibrated:', { rawScores, calibrated: scores });

  const isEntryLevel = /0-\d|entry|fresher|no experience|intern/i.test(experienceLevel);

  const weights = isEntryLevel
    ? { skills: 0.60, experience: 0.10, education: 0.30 }
    : { skills: 0.45, experience: 0.40, education: 0.15 };

  const composite =
    scores.skills * weights.skills +
    scores.experience * weights.experience +
    scores.education * weights.education;

  return { sectionScores: scores, composite };
};
// ── SECTION 2: LLM quality scoring ──────────────────────────────

export const llmScoreResume = async (resumeText, jdText, requiredSkills = []) => {
  const skillsList = requiredSkills.length
    ? `\nRequired skills for this role (extracted from JD): ${requiredSkills.join(', ')}\n`
    : '';

  const prompt = `
You are an expert technical recruiter. Score this resume against the job description.

Job Description:
${jdText}
${skillsList}
Resume:
${resumeText}

Rules for skillGaps: go through the required skills list above one by one. For each one NOT clearly present in the Resume, include it in skillGaps. If skillMatchScore is below 7, skillGaps must not be empty. Do not invent gaps unrelated to this JD's actual required skills.

Rules for strengths: list up to 3 things from the Resume that align with this JD, even if imperfect.

Respond with ONLY the JSON object below. No explanation, no reasoning, no preamble, no markdown code fences. Your entire response must start with { and end with }.

{
  "skillMatchScore": <0-10>,
  "experienceRelevanceScore": <0-10>,
  "achievementQualityScore": <0-10>,
  "seniorityFitScore": <0-10>,
  "skillGaps": ["specific missing skills/technologies/qualifications explicitly required by the JD"],
  "strengths": ["top resume strengths relevant to this specific role"],
  "oneLineVerdict": "<20 word summary>"
}
`;
  // ... rest unchanged


  const response = await client.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.1,
  });

  let raw = response.choices[0].message.content.trim();
raw = raw.replace(/```json|```/g, '').trim();
const jsonMatch = raw.match(/\{[\s\S]*\}/);
if (jsonMatch) raw = jsonMatch[0];

console.log('--- RAW LLM OUTPUT ---', raw); // temp

return JSON.parse(raw);
};
// ── SECTION 3: Keyword frequency overlap ─────────────────────────

export const keywordOverlapScore = (resumeText, jdText) => {
  const jdWords = jdText.toLowerCase().match(/\b[a-z][a-z+#.]{2,}\b/g) || [];
  const resumeWords = new Set(
    resumeText.toLowerCase().match(/\b[a-z][a-z+#.]{2,}\b/g) || []
  );

  const jdFreq = {};
  jdWords.forEach(w => jdFreq[w] = (jdFreq[w] || 0) + 1);

  let weightedMatches = 0;
  let totalWeight = 0;

  Object.entries(jdFreq).forEach(([word, freq]) => {
    totalWeight += freq;
    if (resumeWords.has(word)) weightedMatches += freq;
  });

  return totalWeight === 0 ? 0 : weightedMatches / totalWeight;
};
// ── SECTION: Matched skills (the "have" counterpart to skill gaps) ──

export const tagMatchedSkills = async (requiredSkills, userSkillGaps, parsedResume, jdEmbedding) => {
  // skills the LLM already flagged as gaps shouldn't also show as matched
  const gapSkillNames = new Set(userSkillGaps.map(g => g.skill.toLowerCase()));
  const candidateSkills = requiredSkills.filter(
    skill => !gapSkillNames.has(skill.toLowerCase())
  );

  return Promise.all(
    candidateSkills.map(async (skill) => {
      const skillEmbedding = await getEmbedding(skill);

      let bestMatchScore = 0;
      let bestMatchName = null;

      for (const userSkill of parsedResume.skills) {
        const userSkillEmb = await getEmbedding(userSkill);
        const sim = cosineSimilarity(skillEmbedding, userSkillEmb);
        if (sim > bestMatchScore) {
          bestMatchScore = sim;
          bestMatchName = userSkill;
        }
      }

      return {
        skill,
        matchedVia: bestMatchName,
        confidence: bestMatchScore >= 0.75 ? 'strong' : 'partial',
      };
    })
  );
};
// ── SECTION 4: Severity-tagged gap detection ──────────────────────

export const tagGapSeverity = (skillGaps, parsedResume, jdEmbedding) => {
  return Promise.all(
    skillGaps.map(async (skill) => {
      const skillEmbedding = await getEmbedding(skill);

      // find best matching skill in resume
      let bestMatchScore = 0;
      for (const userSkill of parsedResume.skills) {
        const userSkillEmb = await getEmbedding(userSkill);
        const sim = cosineSimilarity(skillEmbedding, userSkillEmb);
        if (sim > bestMatchScore) bestMatchScore = sim;
      }

      let severity = 'low';
      if (bestMatchScore < 0.5) severity = 'critical';
      else if (bestMatchScore < 0.75) severity = 'moderate';

      return { skill, severity };
    })
  );
};

// ── SECTION 5: Final combined score ──────────────────────────────

export const computeFinalScore = async (resumeText, jdText, parsedResume, parsedJD = {}, experienceLevel = '') => {
  const jdEmbedding = await getEmbedding(jdText);

  const [sectionResult, llmScores] = await Promise.all([
    computeSectionScores(parsedResume, jdEmbedding, experienceLevel),
    llmScoreResume(resumeText, jdText,parsedJD.requiredSkills || []),
  ]);

  const bm25Score = getBM25Score(parsedJD, parsedResume);
  const llmAvg = (
    llmScores.skillMatchScore +
    llmScores.experienceRelevanceScore +
    llmScores.achievementQualityScore +
    llmScores.seniorityFitScore
  ) / 40;

  const atsScore = bm25Score * 0.60 + sectionResult.composite * 0.40;
  const aiScore = llmAvg;

  const taggedGaps = await tagGapSeverity(llmScores.skillGaps, parsedResume, jdEmbedding);

  const requiredSkills = parsedJD.requiredSkills || [];
  const matchedSkills = await tagMatchedSkills(requiredSkills, taggedGaps, parsedResume, jdEmbedding);


  console.log('DEBUG breakdown:', {
  sectionComposite: sectionResult.composite,
  sectionScores: sectionResult.sectionScores,
  llmAvg,
  llmScores,
  bm25Score,
  atsScore: Math.round(atsScore*100), aiScore: Math.round(aiScore*100)
   });

  return {
    atsScore: Math.round(atsScore * 100),
    aiScore: Math.round(aiScore * 100),
    sectionScores: sectionResult.sectionScores,
    llmScores,
    bm25Score: Math.round(bm25Score * 100),
    skillGaps: taggedGaps,
    matchedSkills,
    strengths: llmScores.strengths,
    verdict: llmScores.oneLineVerdict,
    jdEmbedding,
  };
};