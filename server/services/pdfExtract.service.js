import pdfParse from 'pdf-parse/lib/pdf-parse.js';
import ApiError from '../utils/apiError.js';

const MIN_TEXT_LENGTH = 50;

export const extractPdfText = async (buffer, context = 'document') => {
  const data = await pdfParse(buffer);
  const text = data.text.trim();
  console.log(`[${context}] extracted length:`, text.length);
  console.log(`[${context}] extracted preview:`, JSON.stringify(text.slice(0, 200)));


  if (text.length < MIN_TEXT_LENGTH) {
    throw new ApiError(
      400,
      `Could not extract text from the ${context} PDF. It may be a scanned image or "Print to PDF" export with no text layer. Please paste the text instead.`
    );
  }

  return text;
};