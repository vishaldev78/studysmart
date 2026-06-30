import { extractText, getDocumentProxy } from 'unpdf'

/** Maximum number of PDF pages we will read (keeps parsing fast & cheap). */
export const MAX_PDF_PAGES = 5

/**
 * Extract plain text from a PDF file (Buffer), reading at most MAX_PDF_PAGES
 * pages. Uses `unpdf` which is built for serverless/bundled runtimes.
 */
export async function extractPdfText(buf: Buffer): Promise<{ text: string; pages: number; totalPages: number }> {
  const data = new Uint8Array(buf)
  const pdf = await getDocumentProxy(data)

  const totalPages = pdf.numPages ?? 0
  const pagesToRead = Math.min(totalPages, MAX_PDF_PAGES)

  // Collect text page-by-page so we can cap the page count.
  const chunks: string[] = []
  for (let i = 1; i <= pagesToRead; i++) {
    const page = await pdf.getPage(i)
    const content = await page.getTextContent()
    const strings = content.items
      .map((item) => ('str' in item ? (item as { str: string }).str : ''))
      .filter(Boolean)
    chunks.push(strings.join(' '))
  }

  let text = chunks.join('\n\n')
  text = text
    .replace(/\u0000/g, ' ')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()

  if (!text) {
    throw new Error('No readable text found in this PDF. It may be scanned images.')
  }

  return { text, pages: pagesToRead, totalPages }
}
