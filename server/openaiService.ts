import OpenAI from "openai";

// Using GPT-4o Mini for cost-effective BJJ move suggestions (~$0.0003 per request)
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

interface DecisionTreeSuggestions {
  successMoves: CounterMove[];
  failureMoves: CounterMove[];
}

export async function generateBJJCounterMoves(
  currentMove: string,
  position: string,
  context: string = ""
): Promise<DecisionTreeSuggestions> {
  try {
    const openai = getOpenAIClient();
    
    const prompt = `You are a Brazilian Jiu-Jitsu expert. Create a decision tree for the following scenario by suggesting moves for BOTH outcomes:

Position: ${position}
Current Move/Attack: ${currentMove}
${context ? `Additional Context: ${context}` : ""}

Provide TWO separate sets of moves:

1. SUCCESS MOVES (if the current move works): 2-3 follow-up techniques to capitalize on success
2. FAILURE MOVES (if the current move is defended/fails): 2-3 backup techniques or transitions

For each move, include:
- The name of the technique
- A brief description of how to execute it

Respond with JSON in this EXACT format: 
{
  "successMoves": [
    {"moveName": "technique name", "description": "how to execute if original move works"},
    ...
  ],
  "failureMoves": [
    {"moveName": "technique name", "description": "what to do if original move fails"},
    ...
  ]
}`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are a Brazilian Jiu-Jitsu expert coach creating decision trees for game planning. Always provide realistic, practical techniques for both success and failure scenarios."
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
    return {
      successMoves: result.successMoves || [],
      failureMoves: result.failureMoves || []
    };
  } catch (error: any) {
    console.error("OpenAI counter move generation error:", error);
    
    // If API key not set, return helpful message
    if (error?.message?.includes('apiKey')) {
      throw new Error("OpenAI API key not configured. Please add OPENAI_API_KEY to your environment secrets.");
    }
    
    throw new Error("Failed to generate counter moves: " + error.message);
  }
}
