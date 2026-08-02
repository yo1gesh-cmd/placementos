export const getEmbedding = async (text) => {
  try {
    const response = await fetch(
      'https://router.huggingface.co/hf-inference/models/BAAI/bge-small-en-v1.5/pipeline/feature-extraction',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.HUGGINGFACE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ inputs: text }),
      }
    );

    const data = await response.json();

    if (data.error) {
      throw new Error(`HuggingFace API error: ${data.error}`);
    }

    return data;
  } catch (error) {
    console.log('Embedding fetch error details:', error.cause || error.message);
    throw error;
  }
};


// bge-small-en-v1.5 is anisotropic: unrelated text pairs still score ~0.5+ cosine
// similarity instead of near 0. These rescale that floor/ceiling to a real 0-1 range.
// TUNE THESE against your own logged raw scores (see step 2's debug log).
const ANISOTROPY_FLOOR = 0.50;
const ANISOTROPY_CEILING = 0.68;
export const calibrateSimilarity = (rawSim) => {
  const clamped = Math.min(Math.max(rawSim, ANISOTROPY_FLOOR), ANISOTROPY_CEILING);
  return (clamped - ANISOTROPY_FLOOR) / (ANISOTROPY_CEILING - ANISOTROPY_FLOOR);
};

export const cosineSimilarity = (vectorA, vectorB) => {
  let dotProduct = 0;
  let magnitudeA = 0;
  let magnitudeB = 0;

  for (let i = 0; i < vectorA.length; i++) {
    dotProduct += vectorA[i] * vectorB[i];
    magnitudeA += vectorA[i] * vectorA[i];
    magnitudeB += vectorB[i] * vectorB[i];
  }

  magnitudeA = Math.sqrt(magnitudeA);
  magnitudeB = Math.sqrt(magnitudeB);

  if (magnitudeA === 0 || magnitudeB === 0) return 0;

  return dotProduct / (magnitudeA * magnitudeB);
};