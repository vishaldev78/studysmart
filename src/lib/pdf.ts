import { extractText } from 'unpdf'

/**
 * Extract plain text from a PDF file (Buffer).
 * Uses `unpdf` which is built for serverless/bundled runtimes (no worker issues).
 */
export async function extractPdfText(buf: Buffer): Promise<string> {
  const { text } = await extractText(new Uint8Array(buf), { mergePages: true })
  const cleaned = (text || '')
    .replace(/\u0000/g, ' ')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
  if (!cleaned) {
    throw new Error('No readable text found in this PDF. It may be scanned images.')
  }
  return cleaned
}
