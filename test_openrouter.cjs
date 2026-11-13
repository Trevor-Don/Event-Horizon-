async function run() {
    const key = process.env.OPENROUTER_API_KEY;
    console.log("Key length:", key ? key.length : 0);
    const body = {
        model: "openai/gpt-4o-mini",
        messages: [{ role: "user", content: "Say hello!" }]
    };
    try {
        const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${key}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify(body)
        });
        const data = await res.json();
        console.log("Status:", res.status);
        console.log("Response:", data.choices?.[0]?.message?.content);
    } catch (e) {
        console.error(e);
    }
}
run();
