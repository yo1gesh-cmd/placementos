import Groq from 'groq-sdk';
import puppeteer from 'puppeteer';

const client = new Groq({ apiKey: process.env.GROQ_API_KEY });

// ── SECTION 1: AI content generation ─────────────────────────────

export const generateResumeContent = async (user, skills, projects, jdAnalysis) => {
  const prompt = `
You are an expert resume writer. Generate tailored resume content for this candidate based on the job description analysis.

Candidate Profile:
Name: ${user.name}
College: ${user.college}
CGPA: ${user.cgpa}
Education: ${user.education.map(e => `${e.degree} in ${e.field} from ${e.institution} (${e.startYear}-${e.endYear})`).join(', ')}
Experience: ${user.experience.map(e => `${e.title} at ${e.company} (${e.startYear}-${e.endYear}): ${e.description}`).join('\n')}

Skills: ${skills.map(s => `${s.name} (${s.proficiency})`).join(', ')}

Projects:
${projects.map(p => `
- ${p.name}: ${p.description}
  Tech Stack: ${p.techStack.map(t => t.name).join(', ')}
  Impact: ${p.impactMetric}
  GitHub: ${p.githubUrl}
`).join('\n')}

Job Requirements:
Required Skills: ${jdAnalysis.parsedJD.requiredSkills.join(', ')}
Role: ${jdAnalysis.parsedJD.roleType}
Domain Keywords to naturally include: ${jdAnalysis.parsedJD.domainKeywords.join(', ')}
Role Type: ${jdAnalysis.parsedJD.roleType}
Experience Level Expected: ${jdAnalysis.parsedJD.experienceLevel}
Strengths to emphasize: ${jdAnalysis.llmFeedback.strengths.join(', ')}

When writing content:
- NEVER use generic filler phrases: "leverage my expertise," "craft scalable solutions," "excel in designing," "drive meaningful results," "passionate about," "committed to delivering impactful," "strong foundation in," or similar corporate-template language. Every sentence must contain a specific, concrete fact (a technology, a number, a scope) — if a sentence could be copy-pasted onto any other candidate's resume unchanged, rewrite it.
- The summary must open with the candidate's actual strongest concrete qualification (a specific project outcome, tech depth, or metric), not an adjective or self-description ("As a backend-focused developer..."). Start with what they built or the scale of impact.
- Project "description" must be an ARRAY of 2-3 separate bullet strings, never one run-on paragraph or comma-joined sentence. Each bullet starts with a strong past-tense verb (Built, Architected, Reduced, Implemented, Optimized, Designed) and contains at least one number or concrete technical detail.
- Every bullet must answer "so what" — state the technical action AND its measurable outcome, not just the action alone. "Built a REST API using Express" is weak; "Built a REST API in Express handling JD-analysis requests for 100+ users" is strong. If no real metric exists, use scope instead (number of endpoints, models, modules, users) rather than inventing false numbers.
- NEVER mention what the candidate lacks, is "eager to learn," "hopes to expand into," or similar aspirational language about missing skills — a resume only states strengths, never gaps
- Use domain keywords naturally in project descriptions and summary
- Mirror the role type in the summary opening line
- Frame all bullet points around what the JD requires, using only skills/experience the candidate actually has
- Put required skills first in the skills list — but only include skills the candidate's actual profile supports
- Every project description should mention at least one required skill, framed as demonstrated capability, not aspiration
- If a project used a related but different technology than the JD asks for, reframe it toward the JD's exact terminology rather than pointing out the mismatch
- If experience is empty, do not mention lack of experience anywhere — let projects carry the full weight of demonstrating capability

Generate the following as JSON:
{
  "summary": "3-4 sentence professional summary tailored to the role, opening with a concrete qualification not an adjective",
  "skills": ["list of skills to highlight, most relevant first"],
  "projects": [
    {
      "name": "project name",
      "description": ["bullet 1 with a concrete detail or number", "bullet 2 with a concrete detail or number", "bullet 3 with a concrete detail or number"],
      "techStack": "comma separated tech",
      "impact": "rewritten impact metric",
      "github": "github url"
    }
  ],
  "experience": [
    {
      "title": "job title",
      "company": "company name",
      "duration": "startYear - endYear",
      "description": ["bullet 1 with a concrete detail or number", "bullet 2 with a concrete detail or number"]
    }
  ]
}

Return ONLY valid JSON, no explanation, no markdown.
`;

  const response = await client.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.3,
  });

  const cleaned = response.choices[0].message.content.replace(/```json|```/g, '').trim();
  return JSON.parse(cleaned);
};

// ── Shared helpers ─────────────────────────────────────────────────

const toBulletArray = (desc) => {
  if (Array.isArray(desc)) return desc;
  if (typeof desc === 'string') return [desc];
  return [];
};

const renderBullets = (desc) => {
  const bullets = toBulletArray(desc);
  if (bullets.length === 0) return '';
  return `<ul class="bullet-list">${bullets.map(b => `<li>${b}</li>`).join('')}</ul>`;
};

const SHARED_STYLES = `
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Georgia', 'Times New Roman', serif; color: #1a1a1a; background: #fff; padding: 48px 56px; font-size: 13px; line-height: 1.55; }

  .header { text-align: center; margin-bottom: 4px; }
  .header h1 { font-family: 'Arial', sans-serif; font-size: 26px; font-weight: 700; letter-spacing: 0.5px; color: #111; }
  .header .role { font-family: 'Arial', sans-serif; font-size: 12px; color: #555; margin-top: 3px; letter-spacing: 0.3px; }

  .contact { display: flex; justify-content: center; gap: 4px; margin: 10px 0 18px; font-family: 'Arial', sans-serif; font-size: 11px; color: #333; }
  .contact span:not(:last-child)::after { content: "•"; margin-left: 10px; color: #999; }
  .contact span { margin-right: 2px; }
  .contact a { color: #1a1a1a; text-decoration: none; }

  .section { margin-top: 18px; }
  .section-title { font-family: 'Arial', sans-serif; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px; color: #111; border-bottom: 1.5px solid #111; padding-bottom: 4px; margin-bottom: 10px; }

  .about { font-size: 12.5px; color: #2a2a2a; line-height: 1.6; }

  .entry { margin-bottom: 13px; }
  .entry-header { font-family: 'Arial', sans-serif; font-size: 11px; color: #666; margin-bottom: 2px; display: flex; justify-content: space-between; }
  .entry-title { font-weight: 700; font-size: 13px; margin-bottom: 3px; color: #111; }

  .bullet-list { margin: 4px 0 6px 18px; }
  .bullet-list li { font-size: 12px; color: #2a2a2a; line-height: 1.55; margin-bottom: 2px; }

  .entry-desc { font-size: 11.5px; color: #444; line-height: 1.5; }

  .skills-grid { display: flex; flex-wrap: wrap; gap: 6px; list-style: none; }
  .skills-grid li { font-family: 'Arial', sans-serif; font-size: 11px; padding: 3px 10px; background: #f2f2f2; border-radius: 3px; color: #222; }

  .project-links { font-size: 11px; color: #666; margin-top: 2px; }
`;

const renderHeader = (user) => `
<div class="header">
  <h1>${user.name}</h1>
  <div class="role">${user.college} — ${user.education[0]?.field || 'Engineering'}</div>
</div>
<div class="contact">
  ${user.phone ? `<span>${user.phone}</span>` : ''}
  <span>${user.email}</span>
  ${user.linkedin ? `<span>${user.linkedin}</span>` : ''}
  ${user.github ? `<span>${user.github}</span>` : ''}
</div>
`;

const renderEducation = (user) => `
<div class="section">
  <div class="section-title">Education</div>
  ${user.education.map(e => `
    <div class="entry">
      <div class="entry-header"><span>${e.institution}</span><span>${e.startYear} - ${e.endYear}</span></div>
      <div class="entry-title">${e.degree} in ${e.field}</div>
      <div class="entry-desc">CGPA: ${e.cgpa}</div>
    </div>
  `).join('')}
</div>`;

const renderExperience = (content) => content.experience?.length > 0 ? `
<div class="section">
  <div class="section-title">Work Experience</div>
  ${content.experience.map(e => `
    <div class="entry">
      <div class="entry-header"><span>${e.title} · ${e.company}</span><span>${e.duration}</span></div>
      ${renderBullets(e.description)}
    </div>
  `).join('')}
</div>` : '';

const renderProjects = (content) => `
<div class="section">
  <div class="section-title">Projects</div>
  ${content.projects.map(p => `
    <div class="entry">
      <div class="entry-title">${p.name}</div>
      ${renderBullets(p.description)}
      <div class="entry-desc"><strong>Tech:</strong> ${p.techStack} &nbsp;|&nbsp; <strong>Impact:</strong> ${p.impact}</div>
      ${p.github ? `<div class="project-links">${p.github}</div>` : ''}
    </div>
  `).join('')}
</div>`;

const renderSkills = (content) => `
<div class="section">
  <div class="section-title">Skills</div>
  <ul class="skills-grid">
    ${content.skills.map(s => `<li>${s}</li>`).join('')}
  </ul>
</div>`;

const renderSummary = (content) => `
<div class="section">
  <div class="section-title">About Me</div>
  <div class="about">${content.summary}</div>
</div>`;

// ── SECTION 2: Default template (black & white minimalist) ────────

const buildDefaultTemplate = (user, content) => {
  return `
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>${SHARED_STYLES}</style>
</head>
<body>
${renderHeader(user)}
${renderSummary(content)}
${renderEducation(user)}
${renderExperience(content)}
${renderProjects(content)}
${renderSkills(content)}
</body>
</html>
`;
};

// ── SECTION 3: Custom template from uploaded resume ───────────────

const buildCustomTemplate = async (uploadedResumeText, user, content) => {
  const prompt = `
Analyze this resume and tell me the section order and layout style.

Resume:
${uploadedResumeText}

Return ONLY JSON:
{
  "sectionOrder": ["list of sections in order they appear, e.g. summary, education, experience, projects, skills"],
  "columns": 1,
  "style": "minimalist / modern / traditional"
}
`;

  const response = await client.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.1,
  });

  const cleaned = response.choices[0].message.content.replace(/```json|```/g, '').trim();
  const layout = JSON.parse(cleaned);

  const sectionMap = {
    summary: renderSummary(content),
    education: renderEducation(user),
    experience: renderExperience(content),
    projects: renderProjects(content),
    skills: renderSkills(content),
  };

  const sectionsHTML = layout.sectionOrder
    .map(s => sectionMap[s] || '')
    .join('');

  return `
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>${SHARED_STYLES}</style>
</head>
<body>
${renderHeader(user)}
${sectionsHTML}
</body>
</html>
`;
};

// ── SECTION 4: PDF generation ─────────────────────────────────────

export const generateResumePDF = async (htmlContent) => {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();
  await page.setContent(htmlContent, { waitUntil: 'networkidle0' });

  const pdf = await page.pdf({
    format: 'A4',
    printBackground: true,
    margin: { top: '0px', right: '0px', bottom: '0px', left: '0px' },
  });

  await browser.close();
  return pdf;
};

// ── SECTION 5: Main export — orchestrates everything ──────────────

export const buildResume = async (user, skills, projects, jdAnalysis, uploadedResumeText = null) => {
  const content = await generateResumeContent(user, skills, projects, jdAnalysis);

  const html = uploadedResumeText
    ? await buildCustomTemplate(uploadedResumeText, user, content)
    : buildDefaultTemplate(user, content);

  const pdfBuffer = await generateResumePDF(html);

  return { pdfBuffer, resumeContent: content };
};