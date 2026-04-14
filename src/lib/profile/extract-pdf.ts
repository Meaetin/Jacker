// Use the library entry directly to avoid the package index debug branch.
import pdf from "pdf-parse/lib/pdf-parse.js";

export async function extractTextFromPdf(buffer: Buffer): Promise<string> {
  const data = await pdf(buffer);
  return data.text?.trim() ?? "";
}
