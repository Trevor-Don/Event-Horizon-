const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const oldPrompt = `        const prompt = \\\`
            Act as a news summarizer.
            Your task is to concisely summarize the available information for this event using existing web content. Do NOT generate new analytical narratives or long-winded speculation. Keep it brief and cost-efficient.
            
            HEADLINE: \\\${event.headline}
            SUMMARY: \\\${event.summary}
            CONTEXT: \\\${event.reasoning}
            SOURCES: \\\${JSON.stringify(event.sources)}
            
            INSTRUCTIONS FOR INTELLECTUAL PROPERTY AND CITATION:
            - You MUST cite your sources.
            - Whenever you use direct wording or specific facts from the sources, the text segment MUST be linked to the specific article.
            - Use inline markdown links for citations in the format: [Source Name](URL) right next to the fact or direct quote.
            - Use the provided SOURCES, and use the google_search tool to quickly find and summarize the most accurate up-to-date facts about the event.
            
            FORMATTING RULES:
            - Use Markdown.
            - Keep it under 3 short paragraphs to save processing time and tokens.
            - Tone: Objective and concise.
        \\\`;`;

const newPrompt = `        const prompt = \\\`
            Act as an expert investigative journalist and intelligence analyst.
            Your task is to provide a comprehensive, deep-dive analysis of this news event. Do not just summarize; explore the context, key players, historical precedents, and potential future implications. Provide rich details and a nuanced perspective.
            
            HEADLINE: \\\${event.headline}
            SUMMARY: \\\${event.summary}
            CONTEXT: \\\${event.reasoning}
            SOURCES: \\\${JSON.stringify(event.sources)}
            
            INSTRUCTIONS FOR INTELLECTUAL PROPERTY AND CITATION:
            - You MUST cite your sources.
            - Whenever you use direct wording or specific facts from the sources, the text segment MUST be linked to the specific article.
            - Use inline markdown links for citations in the format: [Source Name](URL) right next to the fact or direct quote.
            - Use the provided SOURCES, and use the google_search tool to quickly find and summarize the most accurate up-to-date facts about the event.
            
            FORMATTING RULES:
            - Use Markdown with clear headings and bullet points where appropriate.
            - Provide a detailed, in-depth report (at least 4-6 comprehensive paragraphs) covering:
              1. The Core Event: What exactly happened in detail?
              2. Key Context & Background: What led to this? Why is this happening now?
              3. Implications & Impact: What are the broader consequences (economic, political, social)?
            - Tone: Analytical, objective, deeply informative, and professional.
        \\\`;`;

code = code.replace(oldPrompt, newPrompt);
fs.writeFileSync('server.ts', code);
console.log("Patched report prompt");
