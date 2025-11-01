import OpenAI from "openai";

// Using gpt-4o - OpenAI's latest and most capable model (November 2024)
// Lazy-load OpenAI client only when needed to avoid startup errors if API key is missing
let openaiClient: OpenAI | null = null;

function getOpenAIClient(): OpenAI {
  if (!openaiClient) {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error("OpenAI API key not configured. Please add OPENAI_API_KEY to your environment secrets.");
    }
    openaiClient = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return openaiClient;
}

interface CounterMove {
  moveName: string;
  description: string;
}

export async function generateBJJCounterMoves(
  currentMove: string,
  position: string,
  context: string = ""
): Promise<CounterMove[]> {
  try {
    const openai = getOpenAIClient();
    
    const prompt = `You are a Brazilian Jiu-Jitsu expert. Given the following scenario, suggest 3-5 realistic counter moves or responses.

Position: ${position}
Current Move/Attack: ${currentMove}
${context ? `Additional Context: ${context}` : ""}

Provide practical BJJ counter techniques that would be appropriate responses. For each counter move, include:
1. The name of the technique
2. A brief description of how to execute it

Respond with JSON in this format: 
{
  "counterMoves": [
    {"moveName": "technique name", "description": "how to execute"},
    ...
  ]
}`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are a Brazilian Jiu-Jitsu expert coach providing technical counter move suggestions. Always provide realistic, practical techniques."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
      max_completion_tokens: 2048,
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");
    return result.counterMoves || [];
  } catch (error: any) {
    console.error("OpenAI counter move generation error:", error);
    
    // If API key not set, return helpful message
    if (error?.message?.includes('apiKey')) {
      throw new Error("OpenAI API key not configured. Please add OPENAI_API_KEY to your environment secrets.");
    }
    
    throw new Error("Failed to generate counter moves: " + error.message);
  }
}
