import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.NEXT_PUBLIC_OPENAI_KEY });

export async function optimizeWorkflow(userPrompt: string) {
  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: "Kamu adalah asisten penelitian AI yang membantu mengoptimalkan alur kerja penelitian." },
      { role: "user", content: userPrompt }
    ]
  });

  return response.choices[0].message.content;
}
