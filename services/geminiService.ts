import { EntriesMap, AIAnalysisResult } from "../types";

// Initialize the Gemini API client
// Note: process.env.API_KEY is provided by the environment
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const analyzeMonthEntries = async (
  monthName: string,
  year: number,
  entries: EntriesMap
): Promise<AIAnalysisResult | null> => {
  
  // Filter entries for the specific month
  const relevantEntries = Object.entries(entries).filter(([dateStr, entry]) => {
    if (!entry) return false;
    // Check if there's any meaningful data (logs, content, weight, or images)
    const hasLogs = entry.logs && entry.logs.length > 0;
    const hasContent = entry.content && entry.content.trim().length > 0;
    const hasWeight = entry.weight && entry.weight.trim().length > 0;
    const hasImages = entry.images && entry.images.length > 0;
    const hasImage = !!entry.image; // Legacy check
    
    return hasLogs || hasContent || hasWeight || hasImages || hasImage;
  });

  if (relevantEntries.length === 0) {
    throw new Error("No entries found for this month to analyze.");
  }

  // Construct the prompt parts
  const parts: any[] = [];
  
  parts.push({
    text: `You are a helpful personal productivity and wellness assistant.
    I will provide you with my calendar journal entries for ${monthName} ${year}.
    Some entries have multiple text logs, some have weight logs, and some have attached images.
    
    Please analyze them and provide:
    1. A brief summary of my month (3-4 sentences).
    2. An assessment of my general mood, focus, and physical trends (if weight or visual body checks are present).
    3. Three actionable tips for next month based on what I tracked.
    
    Here are the entries:`
  });

  // Iterate through entries and add them to the prompt
  for (const [date, entry] of relevantEntries) {
    let entryText = `\nDate: ${date}\n`;
    
    if (entry.logs && entry.logs.length > 0) {
      entryText += `Journal Entries:\n`;
      entry.logs.forEach(log => {
        entryText += `- ${log.text}\n`;
      });
    } else if (entry.content) {
      // Fallback for legacy
      entryText += `Journal: ${entry.content}\n`;
    }

    if (entry.weight) entryText += `Weight: ${entry.weight}\n`;
    
    parts.push({ text: entryText });

    // Process images (both legacy single image and new array)
    const imagesToProcess: string[] = [];
    if (entry.images && entry.images.length > 0) {
      imagesToProcess.push(...entry.images);
    } else if (entry.image) {
      imagesToProcess.push(entry.image);
    }

    for (const imgData of imagesToProcess) {
      if (imgData && imgData.includes(',')) {
        try {
          // imgData is a data URL like "data:image/jpeg;base64,..."
          const split = imgData.split(',');
          const base64Data = split[1];
          const mimePart = split[0];
          // Extract mime type roughly from "data:image/jpeg;base64"
          const mimeType = mimePart.substring(mimePart.indexOf(':') + 1, mimePart.indexOf(';'));
          
          if (base64Data && mimeType) {
            parts.push({
              inlineData: {
                mimeType: mimeType,
                data: base64Data
              }
            });
          }
        } catch (e) {
          console.warn(`Failed to process image for date ${date}`, e);
        }
      }
    }
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash', // Flash supports multimodal well
      contents: { parts: parts },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: { type: Type.STRING },
            mood: { type: Type.STRING },
            tips: { 
              type: Type.ARRAY,
              items: { type: Type.STRING }
            }
          },
          required: ["summary", "mood", "tips"]
        }
      }
    });

    const text = response.text;
    if (!text) return null;
    return JSON.parse(text) as AIAnalysisResult;
  } catch (error) {
    console.error("Error analyzing entries with Gemini:", error);
    throw error;
  }
};
