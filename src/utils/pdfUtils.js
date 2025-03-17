import * as pdfjsLib from "pdfjs-dist";
import pdfjsWorker from "pdfjs-dist/build/pdf.worker.min.js";

// Set the worker URL
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

/**
 * Extracts text from a PDF file
 * @param {File} file - The PDF file to extract text from
 * @returns {Promise<string>} - The extracted text
 */
export const extractTextFromPdf = async (file) => {
  try {
    const fileReader = new FileReader();

    return new Promise((resolve, reject) => {
      fileReader.onload = async () => {
        try {
          const typedArray = new Uint8Array(fileReader.result);
          const pdf = await pdfjsLib.getDocument(typedArray).promise;

          const textPromises = [];
          for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            const pageText = textContent.items
              .map((item) => item.str)
              .join(" ");
            textPromises.push(pageText);
          }

          const texts = await Promise.all(textPromises);
          resolve(texts.join(" ").trim());
        } catch (error) {
          console.error("Error extracting text from PDF:", error);
          reject(error);
        }
      };

      fileReader.onerror = (error) => {
        console.error("Error reading file:", error);
        reject(error);
      };

      fileReader.readAsArrayBuffer(file);
    });
  } catch (error) {
    console.error("Error in PDF extraction process:", error);
    throw error;
  }
};
