import BM25 from 'wink-bm25-text-search';
import winkNLP from 'wink-nlp';
import model from 'wink-eng-lite-web-model';

const nlp = winkNLP(model);
const its = nlp.its;

const tokenize = (text) => {
  const doc = nlp.readDoc(text);
  return doc.tokens().out(its.normal);
};
// section weights mirror real ATS priority: Skills/Experience "Very High", Education "Medium"
const FIELD_WEIGHTS = { skills: 3, experience: 2, education: 1 };

const buildResumeFields = (parsedResume) => ({
  skills: (parsedResume.skills || []).join(' '),
  experience: (parsedResume.experienceEntries || [])
    .map(e => `${e.title || ''} ${e.company || ''} ${e.description || ''}`)
    .join(' '),
  education: (parsedResume.education || [])
    .map(e => `${e.degree || ''} ${e.field || ''}`)
    .join(' '),
});

export const getBM25Score = (parsedJD, parsedResume) => {
  const engine = BM25();

  engine.defineConfig({ fldWeights: FIELD_WEIGHTS });
  engine.definePrepTasks([tokenize]);

  engine.addDoc(buildResumeFields(parsedResume), 0);
  engine.addDoc({ skills: 'general software engineering experience with various technologies', experience: '', education: '' }, 1);
  engine.addDoc({ skills: 'entry level developer position requiring basic programming skills', experience: '', education: '' }, 2);

  engine.consolidate();

  const jdQuery = [
    ...(parsedJD.requiredSkills || []),
    ...(parsedJD.niceToHaveSkills || []),
    ...(parsedJD.domainKeywords || []),
  ].join(' ');

  const results = engine.search(jdQuery);
  console.log('BM25 raw results:', results);

  if (results.length === 0) return 0;

  const profileResult = results.find(r => r[0] === '0');
  if (!profileResult) return 0;

  const rawScore = profileResult[1];
  const K = 8;
  return rawScore / (rawScore + K);
};