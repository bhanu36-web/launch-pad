import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { context } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const prompt = `You are an AI assistant helping farmers document their agricultural activities. Based on the following farm activity context, generate:
1. A concise summary (2-3 sentences) describing the activity
2. Extracted structured data

Context:
- Activity Type: ${context.activityType}
- Crop: ${context.crop || 'Not specified'}
- Notes: ${context.notes || 'None'}
- Additional Notes: ${context.textNotes || 'None'}
- Inputs Used: ${context.inputsUsed || 'None'}
- Photos attached: ${context.photoCount || 0}
- Audio notes: ${context.audioCount || 0}

Respond with a JSON object containing:
- summary: string (the activity summary)
- extractedData: object with fields like crop, activityType, inputsUsed, estimatedImpact`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: 'You are an agricultural AI assistant. Respond only with valid JSON.' },
          { role: 'user', content: prompt }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      throw new Error('AI gateway error');
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';
    
    // Try to parse JSON from response
    let result = { summary: '', extractedData: {} };
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        result = JSON.parse(jsonMatch[0]);
      }
    } catch {
      result.summary = `${context.activityType} activity recorded for ${context.crop || 'crops'}. ${context.notes || ''}`;
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error processing farm activity:', error);
    return new Response(
      JSON.stringify({ 
        summary: 'Activity recorded successfully.',
        extractedData: {},
        error: error.message 
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
