const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const newPrompt = `        const prompt = \\\`
            Act as an expert investigative journalist and intelligence analyst.
            Your task is to provide a comprehensive, in-depth analysis of this news event. You must explore the context, key players, historical precedents, and potential future implications. Provide rich details and a nuanced perspective based on the information provided and your extensive knowledge base.
            
            HEADLINE: \\\${event.headline}
            SUMMARY: \\\${event.summary}
            CONTEXT: \\\${event.reasoning}
            SOURCES: \\\${JSON.stringify(event.sources)}
            
            INSTRUCTIONS:
            - You MUST write the report based on the provided HEADLINE and SUMMARY, supplementing it with your own historical and contextual knowledge about the topics and entities involved.
            - DO NOT mention that you cannot browse the internet, cannot access real-time sources, or are an AI. Act as the journalist.
            - Provide a detailed, in-depth report (at least 4-6 comprehensive paragraphs) covering:
              1. The Core Event: What exactly happened based on the summary?
              2. Key Context & Background: What led to this? Why is this happening now? (Use your knowledge base).
              3. Implications & Impact: What are the broader consequences (economic, political, social)?
            - Tone: Analytical, objective, deeply informative, and professional.
        \\\`;`;

code = code.replace(/const prompt = `\s*Act as an expert investigative journalist[\s\S]*?Tone: Analytical, objective, deeply informative, and professional\.\s*`;/, newPrompt);

fs.writeFileSync('server.ts', code);
console.log("Patched report prompt again");
