// LLM Router - Google AI primary, OpenAI fallback

interface LLMRequest {
  prompt: string;
  maxTokens?: number;
  temperature?: number;
}

interface LLMResponse {
  text: string;
  model: string;
  error?: string;
}

// Google AI (Gemini) client
async function callGoogleAI(request: LLMRequest): Promise<LLMResponse> {
  const apiKey = Deno.env.get('GOOGLE_AI_API_KEY');
  
  if (!apiKey) {
    throw new Error('GOOGLE_AI_API_KEY not configured');
  }

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: request.prompt }],
          },
        ],
        generationConfig: {
          maxOutputTokens: request.maxTokens || 500,
          temperature: request.temperature || 0.7,
        },
      }),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Google AI error: ${error}`);
  }

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

  return {
    text,
    model: 'gemini-2.0-flash',
  };
}

// OpenAI client (fallback)
async function callOpenAI(request: LLMRequest): Promise<LLMResponse> {
  const apiKey = Deno.env.get('OPENAI_API_KEY');
  
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY not configured');
  }

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'user', content: request.prompt },
      ],
      max_tokens: request.maxTokens || 500,
      temperature: request.temperature || 0.7,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenAI error: ${error}`);
  }

  const data = await response.json();
  const text = data.choices?.[0]?.message?.content || '';

  return {
    text,
    model: 'gpt-4o-mini',
  };
}

// Main router - tries Google first, falls back to OpenAI
export async function callLLM(request: LLMRequest): Promise<LLMResponse> {
  // Try Google AI first
  try {
    return await callGoogleAI(request);
  } catch (googleError) {
    console.error('Google AI failed, trying OpenAI:', googleError);
    
    // Fall back to OpenAI
    try {
      return await callOpenAI(request);
    } catch (openaiError) {
      console.error('OpenAI also failed:', openaiError);
      
      return {
        text: '',
        model: 'fallback',
        error: 'Both LLM providers failed',
      };
    }
  }
}






