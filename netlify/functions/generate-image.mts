import { GoogleGenAI } from '@google/genai';
import type { Config } from '@netlify/functions';

export default async (req: Request) => {
  if (req.method !== 'POST') return new Response('Method not allowed',{status:405});
  try {
    const {prompt} = await req.json();
    if (typeof prompt !== 'string' || !prompt.trim() || prompt.length > 4000) return Response.json({error:'Describe your image using 1–4,000 characters.'},{status:400});
    const ai = new GoogleGenAI({apiKey:Netlify.env.get('NETLIFY_AI_GATEWAY_KEY'),httpOptions:{baseUrl:Netlify.env.get('NETLIFY_AI_GATEWAY_URL')?.replace(/\/$/,'')}});
    const result = await ai.models.generateContent({model:'gemini-3.1-flash-image',contents:prompt});
    const part = result.candidates?.[0]?.content?.parts?.find(p => p.inlineData?.mimeType?.startsWith('image/'));
    if (!part?.inlineData?.data) return Response.json({error:'No image was returned. Try a different description.'},{status:502});
    const body = JSON.stringify({image:`data:${part.inlineData.mimeType};base64,${part.inlineData.data}`});
    return new Response(new ReadableStream({start(controller){controller.enqueue(new TextEncoder().encode(body));controller.close();}}),{headers:{'Content-Type':'application/json','Cache-Control':'no-store'}});
  } catch {
    return Response.json({error:'Image creation could not finish. Please try again with a different description.'},{status:502});
  }
};
export const config: Config = {path:'/api/generate-image',rateLimit:{windowLimit:5,windowSize:60,aggregateBy:['ip','domain']}};
