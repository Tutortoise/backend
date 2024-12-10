import { Groq } from "groq-sdk";

export async function retryOperation(
  operation: () => Promise<any>,
  retries = 30,
) {
  for (let i = 0; i < retries; i++) {
    try {
      return await operation();
    } catch (error) {
      if (i === retries - 1) throw error;
      await new Promise((resolve) => setTimeout(resolve, 1000));
      console.log(`Retry ${i + 1}/${retries}`);
    }
  }
}

export const generateSampleData = async (prompt: string) => {
  const groq = new Groq({
    apiKey: process.env["GROQ_KEY"],
  });

  const chatCompletion = await groq.chat.completions.create({
    messages: [
      {
        role: "user",
        content: prompt,
      },
    ],
    response_format: { type: "json_object" },
    model: "llama3-8b-8192",
  });

  // Parse the response
  const result = chatCompletion.choices[0].message.content;

  let json;
  try {
    json = JSON.parse(result!);
  } catch (error) {
    throw new Error("Failed to parse response as JSON");
  }

  console.log(json);
  return json;
};
