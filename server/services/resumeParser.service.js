import Groq from 'groq-sdk';

const client = new Groq({ apiKey: process.env.GROQ_API_KEY });

// extracts structured fields from raw resume text
export const parseResume = async (resumeText) => {
  const prompt = `
Extract the following fields from this resume as JSON:
{
  "skills": ["list of all skills mentioned"],
  "jobTitles": ["list of all job titles held"],
  "employers": ["list of companies worked at"],
  "experienceEntries": [
    {
      "title": "",
      "company": "",
      "startYear": null,
      "endYear": null,
      "description": ""
    }
  ],
  "education": [{ "degree": "", "field": "", "year": null }],
  "certifications": []
}

Return ONLY valid JSON, no explanation, no markdown formatting.

Resume text:
${resumeText}
`;

  const response = await client.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.1,
  });

  const rawContent = response.choices[0].message.content;

  // clean up in case LLM wraps response in markdown code blocks
  const cleaned = rawContent.replace(/```json|```/g, '').trim();

  return JSON.parse(cleaned);
};

export const parseJD = async (jdText) => {
  const prompt = `
Extract structured fields from this job description as JSON.

CRITICAL RULE: Extract requiredSkills, niceToHaveSkills, and domainKeywords ONLY if the exact technology, tool, or skill name is literally present in the Job Description text below. Do NOT infer, assume, or add skills based on what is "typically expected" for the role type. Do NOT default to a common web stack (e.g. Node.js, MongoDB, Express, React) unless those exact words appear in the JD text. If the JD mentions .NET, C#, SQL Server, and Azure — extract exactly those and nothing more.

Example of WRONG behavior: JD says ".NET, C#, ASP.NET Core, SQL Server, Azure" and role is "Full Stack Engineer" → incorrectly adding "Node.js", "MongoDB", "Express.js" because those are common for full-stack roles. This is hallucination and must not happen.

Example of CORRECT behavior: JD says ".NET, C#, ASP.NET Core, SQL Server, Azure" → requiredSkills: [".NET", "C#", "ASP.NET Core", "SQL Server", "Azure"]. Nothing added beyond what's written.

{
  "requiredSkills": ["skills/technologies explicitly named as required in the JD text"],
  "niceToHaveSkills": ["skills/technologies explicitly named as preferred/bonus in the JD text"],
  "domainKeywords": ["domain or role-specific keywords explicitly present in the JD text"],
  "experienceLevel": "entry level / 0-2 years / 2-5 years / senior / etc",
  "roleType": "the type of role, e.g. Frontend Developer, Full Stack Developer"
}

Return ONLY valid JSON, no explanation, no markdown formatting.

Job description:
${jdText}
`;

  

  const response = await client.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.1,
  });

  const cleaned = response.choices[0].message.content.replace(/```json|```/g, '').trim();
  return JSON.parse(cleaned);
};

