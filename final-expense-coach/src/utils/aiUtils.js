const ANTHROPIC_API_KEY = process.env.REACT_APP_ANTHROPIC_API_KEY;
const FUNCTION_URL =
  "https://us-central1-llcoaching.cloudfunctions.net/anthropicProxy";

export const getPracticeFeedback = async (scenario, userResponse) => {
  try {
    const response = await fetch(FUNCTION_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-3-opus-20240229",
        max_tokens: 1000,
        messages: [
          {
            role: "user",
            content: `You are an expert sales coach for final expense insurance agents. 
          Please provide constructive feedback on this agent's response to the following scenario:

          Scenario: ${scenario}

          Agent's Response: ${userResponse}

          Provide feedback in the following format:
          1. Strengths
          2. Areas for Improvement
          3. Suggested Response
          4. Score (1-10)
          `,
          },
        ],
      }),
    });

    const data = await response.json();
    if (data.error) {
      throw new Error(data.error);
    }
    return data.content[0].text;
  } catch (error) {
    console.error("Error getting AI feedback:", error);
    throw error;
  }
};
