import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const getOpenAIClient = () => {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return null;
  }

  return new OpenAI({ apiKey });
};

export async function POST(request: NextRequest) {
  try {
    const openai = getOpenAIClient();

    if (!openai) {
      return NextResponse.json(
        {
          error: 'OPENAI_API_KEY is not configured',
          message: 'Prompt generation is unavailable until OPENAI_API_KEY is set.',
        },
        { status: 503 }
      );
    }

    const body = await request.json();
    const type = body.type || 'music'; // Default to music for backward compatibility
    
    const musicPrompt = `Generate a creative and engaging song description for music generation. 
The description should include:
1. Musical genre/style (e.g., pop, rock, jazz, electronic, etc.)
2. Mood or emotion (e.g., uplifting, melancholic, energetic, etc.)  
3. Theme or topic (e.g., love, adventure, nostalgia, etc.)
4. Optional specific elements like instruments, tempo, or atmosphere

IMPORTANT: The total combined length of "Title": Description format MUST be under 200 characters.
Keep the title short (under 30 characters) and description concise (under 160 characters).

Make it concise but descriptive, suitable for AI music generation.
Examples:
- "Summer Love": "Upbeat pop song about romance with guitar and synths"
- "Lost Friend": "Melancholic indie rock ballad with piano intro"  
- "Dance Night": "Energetic electronic track with heavy bass"

Please provide a random, creative song description that would work well for music generation.

Return the response in JSON format with the following structure:
{
  "title": "A short catchy title (under 30 chars)",
  "description": "Concise song description (under 160 chars)"
}`;

    const videoPrompt = `Generate a creative and engaging video prompt for image-to-video AI generation.
The prompt should describe motion and dynamic elements that work well for 5-10 second videos:
1. Camera movements (zoom in/out, pan, tilt, rotate)
2. Object animations (gentle sway, floating, moving)
3. Environmental effects (wind, water, light changes)
4. Scene transitions (fade, blur, focus shifts)

IMPORTANT: Keep the description under 200 characters total.
Focus on simple, achievable motions that look natural and engaging.

Examples:
- "Camera slowly zooms in while soft wind makes leaves gently sway"
- "Object floats upward with dreamy bokeh lights in background"
- "Gentle camera pan left as golden sunlight gradually brightens scene"

Please provide a random, creative video motion description suitable for image-to-video generation.

Return only the description text, no JSON format needed.`;

    const imagePrompt = `Generate a creative and detailed image generation prompt for AI image creation.
The prompt should be descriptive and include:
1. Main subject or scene (person, object, landscape, etc.)
2. Visual style (photographic, artistic, cartoon, anime, etc.)
3. Setting/environment
4. Lighting and atmosphere
5. Colors and mood
6. Artistic elements and composition

IMPORTANT: Keep the description under 250 characters total.
Focus on visual creativity and artistic elements, avoid technical specifications.

Examples:
- "A majestic mountain landscape at sunset with golden light reflecting on a crystal clear lake, photorealistic style"
- "Portrait of a friendly cat wearing a wizard hat in a magical library, fantasy art style, warm lighting"
- "Futuristic cityscape with neon lights and flying cars, cyberpunk style, rain effects, vibrant purple and blue colors"

Please provide a random, creative image description suitable for AI image generation.

Return only the description text, no JSON format needed.`;

    const prompt = type === 'video' ? videoPrompt : type === 'image' ? imagePrompt : musicPrompt;

    const systemMessage = type === 'video' 
      ? "You are a video production expert who creates compelling motion descriptions for AI video generation. Generate creative, diverse video concepts that focus on natural movements and camera work. Respond with plain text description only."
      : type === 'image'
      ? "You are an AI art expert who creates compelling image descriptions for AI image generation. Generate creative, diverse visual concepts that span different subjects, styles, and moods. Respond with plain text description only."
      : "You are a music industry expert who creates compelling song descriptions for AI music generation. Generate creative, diverse song concepts that span different genres and moods. Always respond with valid JSON.";

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: systemMessage
        },
        {
          role: "user",
          content: prompt
        }
      ],
      max_tokens: 300,
      temperature: 0.9,
      ...(type === 'music' && { response_format: { type: "json_object" } })
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No content generated');
    }

    if (type === 'video' || type === 'image') {
      // For video and image, return the plain text description directly
      return NextResponse.json({
        data: {
          description: content.trim()
        }
      });
    } else {
      // For music, parse JSON format
      let cleanContent = content.trim();
      if (cleanContent.startsWith('```json')) {
        cleanContent = cleanContent.replace(/^```json\n?/, '').replace(/\n?```$/, '');
      } else if (cleanContent.startsWith('```')) {
        cleanContent = cleanContent.replace(/^```\n?/, '').replace(/\n?```$/, '');
      }

      const parsedContent = JSON.parse(cleanContent);
      
      return NextResponse.json({
        data: {
          title: parsedContent.title || 'Generated Song',
          description: parsedContent.description || ''
        }
      });
    }

  } catch (error: any) {
    console.error('Error generating prompt:', error);
    return NextResponse.json(
      { 
        error: 'Failed to generate prompt',
        message: error.message 
      },
      { status: 500 }
    );
  }
}
