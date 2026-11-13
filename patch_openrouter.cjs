const fs = require('fs');

let code = fs.readFileSync('server.ts', 'utf8');

const fallbackFunc = `
async function callAIWithFallback(prompt: string, options: { isJson?: boolean, useGoogleSearch?: boolean } = {}) {
    try {
        const config: any = {};
        if (options.isJson) {
            config.responseMimeType = "application/json";
        }
        if (options.useGoogleSearch) {
            config.tools = [{ googleSearch: {} }];
        }
        
        const response = await getAi().models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: Object.keys(config).length > 0 ? config : undefined
        });
        return response.text;
    } catch (error: any) {
        console.warn("Gemini API failed, falling back to OpenRouter:", error.message);
        const openRouterKey = process.env.OPENROUTER_API_KEY;
        if (!openRouterKey) {
            throw new Error("Gemini API failed and OPENROUTER_API_KEY is not set. Error: " + error.message);
        }
        
        const fallbackModel = "openai/gpt-4o-mini"; // Use a fast reliable model
        
        let messages = [
            { role: "user", content: prompt }
        ];

        let body: any = {
            model: fallbackModel,
            messages: messages,
        };

        if (options.isJson) {
            body.response_format = { type: "json_object" };
            if (!prompt.toLowerCase().includes("json")) {
                messages[0].content += "\\nReturn JSON output only.";
            }
        }

        const orResponse = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": \`Bearer \${openRouterKey}\`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify(body)
        });

        if (!orResponse.ok) {
            const errBody = await orResponse.text();
            throw new Error(\`OpenRouter API failed: \${orResponse.status} \${errBody}\`);
        }

        const orData = await orResponse.json();
        return orData.choices?.[0]?.message?.content || "";
    }
}
`;

if (!code.includes('callAIWithFallback')) {
    code = code.replace(/function getAi\(\): GoogleGenAI \{[\s\S]*?return aiClient;\n\}/, match => match + '\n' + fallbackFunc);
}

// 1. Audio
const audioRegex = /const textResponse = await getAi\(\)\.models\.generateContent\(\{[\s\S]*?const scriptText = textResponse\.text;/;
code = code.replace(audioRegex, `const scriptText = await callAIWithFallback(scriptPrompt);`);

// 2. Report
const reportRegex = /const response = await getAi\(\)\.models\.generateContent\(\{[\s\S]*?const reportText = response\.text \|\| "Report generation failed\.";/;
code = code.replace(reportRegex, `const reportText = await callAIWithFallback(prompt, { useGoogleSearch: true }) || "Report generation failed.";`);

// 3. Extract Knowledge
const knowledgeRegex = /const response = await getAi\(\)\.models\.generateContent\(\{[\s\S]*?const rawData = response\.text;/;
code = code.replace(knowledgeRegex, `const rawData = await callAIWithFallback(prompt + "\\nCRITICAL: Return ONLY valid JSON, do not wrap in markdown.", { isJson: true });`);

fs.writeFileSync('server.ts', code);
console.log("Patched server.ts to use OpenRouter fallback.");
