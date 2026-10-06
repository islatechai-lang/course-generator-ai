import { GoogleGenAI } from "@google/genai";
import type { GeneratedCourse } from "@shared/schema";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

const GROUNDING_MODELS = [
  "gemini-3.5-flash-lite",
  "gemini-3.5-flash",
  "gemini-2.5-flash-lite",
  "gemini-2.5-flash",
];

const FALLBACK_MODELS = [
  "gemini-3.5-flash-lite",
  "gemini-3.5-flash",
  "gemini-2.5-flash-lite",
  "gemini-2.5-flash",
];

interface GenerateOptions {
  prompt: string;
  useGrounding?: boolean;
}

// Helper function to repair JSON with unescaped quotes in content
function repairJSON(jsonStr: string): string {
  // Strategy: Find quoted strings and escape any unescaped quotes inside them
  let result = '';
  let inString = false;
  let escapedNext = false;

  for (let i = 0; i < jsonStr.length; i++) {
    const char = jsonStr[i];

    if (escapedNext) {
      result += char;
      escapedNext = false;
      continue;
    }

    if (char === '\\') {
      result += char;
      escapedNext = true;
      continue;
    }

    if (char === '"') {
      result += char;
      inString = !inString;
      continue;
    }

    // Replace actual newlines within strings with \n
    if (inString && char === '\n') {
      result += '\\n';
      continue;
    }

    result += char;
  }

  return result;
}

/**
 * Robustly extracts and cleans JSON from a string that might contain markdown backticks,
 * conversational preambles, or other extra text.
 */
function extractJSON(text: string): string {
  let cleaned = text.trim();

  // 1. Handle Markdown Code Blocks
  // Matches ```json { ... } ``` or ``` { ... } ```
  const markdownMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  if (markdownMatch && markdownMatch[1]) {
    cleaned = markdownMatch[1].trim();
  }

  // 2. Locate first '{' and last '}'
  // This handles conversational text before or after the JSON block
  const firstBrace = cleaned.indexOf('{');
  const lastBrace = cleaned.lastIndexOf('}');

  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    cleaned = cleaned.substring(firstBrace, lastBrace + 1);
  }

  return cleaned.trim();
}

async function generateWithFallback(options: GenerateOptions) {
  const { prompt, useGrounding = false } = options;
  let lastError: any = null;
  let usedModel = "";
  let groundingUsed = false;

  const modelSequence = useGrounding
    ? [...GROUNDING_MODELS, ...FALLBACK_MODELS]
    : [...FALLBACK_MODELS, ...GROUNDING_MODELS];

  for (const model of modelSequence) {
    const isGroundingModel = GROUNDING_MODELS.includes(model);
    const shouldUseGrounding = useGrounding && isGroundingModel;

    try {
      console.log(`🤖 Trying model: ${model}${shouldUseGrounding ? ' (with Google Search grounding)' : ''}`);
      usedModel = model;

      const config: any = {};
      if (shouldUseGrounding) {
        config.tools = [{ googleSearch: {} }];
      }

      const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config: Object.keys(config).length > 0 ? config : undefined,
      });

      // Check for empty text response and treat it as a failure to trigger next model/retry
      if (!response.text) {
        throw new Error("Empty response from Gemini");
      }

      groundingUsed = shouldUseGrounding;
      console.log(`✔️  Using model: ${model}${groundingUsed ? ' with grounding' : ''}`);
      return { response, model, groundingUsed };
    } catch (error: any) {
      lastError = error;
      const status = error.status || error.code;
      const message = error.message || String(error);

      if (status === 503 || message.includes("overloaded")) {
        console.log(`⚠️  Model ${model} is overloaded, trying next...`);
      } else if (status === 429) {
        console.log(`⚠️  Rate limited on ${model}, trying next...`);
      } else if (status === 400 || status === 401) {
        console.log(`⚠️  Error with ${model}: ${message}, trying next...`);
      } else {
        console.log(`⚠️  ${model} failed: ${message}, trying next...`);
      }

      continue;
    }
  }

  console.error(`❌ All models failed. Last error:`, lastError);
  throw lastError || new Error("All models failed to generate content");
}

export interface GenerateCourseOptions {
  tone?: string;
  audience?: string;
  outline?: string;
  referenceText?: string;
}

export async function generateCourse(topic: string, options?: GenerateCourseOptions): Promise<GeneratedCourse> {
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().toLocaleString('en-US', { month: 'long' });

  let customInstructions = "";
  if (options) {
    if (options.tone) customInstructions += `\n  TONE: ${options.tone}`;
    if (options.audience) customInstructions += `\n  TARGET AUDIENCE: ${options.audience}`;
    if (options.outline) customInstructions += `\n  MANDATORY OUTLINE:\n  ${options.outline}`;
    if (options.referenceText) customInstructions += `\n  REFERENCE MATERIAL (use this as the primary source of truth):\n  ${options.referenceText}`;
  }

  const prompt = `You are a world-class course creator, instructional designer, and digital product master.
  Create an engaging, highly actionable online masterclass on: "${topic}".
  
  Current Date: ${currentMonth} ${currentYear}
  ${customInstructions}
  
  PEDAGOGY & QUALITY STANDARDS:
  - Do NOT write generic surface-level essays or dry textbook paragraphs.
  - Make each lesson feel like a $200 masterclass: practical, step-by-step, packed with concrete frameworks, and immediately actionable.
  - 3-4 structured, comprehensive modules.
  - 2-3 high-impact lessons per module.
  
  EACH LESSON MUST INCLUDE:
  1. "content": High-value, comprehensive core breakdown formatted in rich HTML (using <h3> for section headers, <p> for clear explanations, <strong> for key terminology, and <ol>/<ul> for implementation steps). Include real examples and actionable advice.
  2. "key_takeaway": An inspiring, memorable rule of thumb or quote summarizing the lesson with an author or mentor title.
  3. "grid": A 2-column comparative framework or key principles (e.g., comparing "Common Mistake vs. Pro Strategy" or "Core Execution Pillars") with 2-4 items.
  4. "action_checklist": An array of 3-4 concrete homework tasks / action items the student must execute immediately.
  
  MODULE REQUIREMENTS:
  - At the end of EACH module, include a 2-3 question review quiz with multiple-choice options, correctAnswer index, and explanation.

  LAUNCH PACK REQUIREMENTS:
  - Provide a ready-to-sell Whop launch pack:
    - "headline": Magnetic sales title for the course
    - "sales_pitch": 3 punchy value bullets explaining what the buyer will master
    - "target_audience": Exactly who this is for vs who it is not for
    - "recommended_price": Suggested pricing (e.g. "$29 - $49") with brief rationale
    - "community_announcement": Ready-to-copy Discord / Whop community announcement post with emojis
    - "email_announcement": Ready-to-copy email / DM blast

  CRITICAL: You MUST respond ONLY with a single valid JSON object. No explanation or preamble.
  JSON SCHEMA:
  {
    "course_title": "string",
    "description": "string (2-3 sentences explaining the tangible transformation)",
    "launch_pack": {
      "headline": "string",
      "sales_pitch": "string",
      "target_audience": "string",
      "recommended_price": "string",
      "community_announcement": "string",
      "email_announcement": "string"
    },
    "modules": [
      {
        "module_title": "string",
        "lessons": [
          {
            "lesson_title": "string",
            "content": "string (multiline HTML with <h3>, <p>, <strong>, <ul>, <ol>)",
            "key_takeaway": {
              "quote": "string",
              "author": "string"
            },
            "grid": {
              "title": "string",
              "items": [
                { "title": "string", "content": "string" },
                { "title": "string", "content": "string" }
              ]
            },
            "action_checklist": [
              "string",
              "string",
              "string"
            ]
          }
        ],
        "quiz": {
          "title": "Module Review Quiz",
          "questions": [
            {
              "question": "string",
              "options": ["option 1", "option 2", "option 3", "option 4"],
              "correctAnswer": 0,
              "explanation": "string"
            }
          ]
        }
      }
    ]
  }`;

  try {
    console.log(`\n📚 Generating course for topic: "${topic}"(with web search for latest ${currentYear} info)`);

    const { response, model, groundingUsed } = await generateWithFallback({
      prompt,
      useGrounding: true,
    });

    console.log(`📖 Generated with: ${model}${groundingUsed ? ' (grounding enabled)' : ''} \n`);

    const groundingMetadata = (response.candidates?.[0] as any)?.groundingMetadata;
    if (groundingMetadata) {
      const webSearchQueries = groundingMetadata.webSearchQueries || [];
      const groundingChunks = groundingMetadata.groundingChunks || [];

      console.log(`🔎 Grounding successful!`);
      console.log(`   Web search queries: ${webSearchQueries.length} `);
      console.log(`   Sources found: ${groundingChunks.length} `);

      if (webSearchQueries.length > 0) {
        console.log(`\n🔍 Search queries executed: `);
        webSearchQueries.forEach((query: string, index: number) => {
          console.log(`  ${index + 1}. ${query} `);
        });
      }

      if (groundingChunks.length > 0) {
        console.log(`\n📖 Top sources used: `);
        groundingChunks.slice(0, 5).forEach((chunk: any, index: number) => {
          const title = chunk.web?.title || 'Unknown source';
          console.log(`  ${index + 1}. ${title} `);
        });
        if (groundingChunks.length > 5) {
          console.log(`  ... and ${groundingChunks.length - 5} more sources`);
        }
      }
    } else {
      console.log(`⚠️  No grounding metadata returned - content based on model knowledge only`);
    }

    const text = response.text;
    if (!text) {
      throw new Error("Empty response from Gemini");
    }

    console.log(`\n📝 Raw response(length: ${text?.length || 0}): ${text?.substring(0, 300)}...`);

    const jsonText = extractJSON(text);

    let parsed: any;
    try {
      parsed = JSON.parse(jsonText);
    } catch (parseError: any) {
      console.log(`⚠️  Initial JSON parse failed, attempting repair...`);
      try {
        const repairedJSON = repairJSON(jsonText);
        parsed = JSON.parse(repairedJSON);
        console.log(`✅ JSON successfully repaired and parsed`);
      } catch (repairError: any) {
        console.error(`❌ JSON parse error: ${repairError.message}`);
        throw repairError;
      }
    }

    if (!parsed.course_title || !Array.isArray(parsed.modules)) {
      throw new Error("Invalid course structure");
    }

    // ENSURE CONSISTENCY & ENRICH LESSONS WITH RICH BLOCKS
    parsed.modules.forEach((module: any, idx: number) => {
      if (!module.module_title) module.module_title = `Module ${idx + 1}`;
      if (!module.lessons) module.lessons = module.lesson ? [module.lesson] : [];
      if (!Array.isArray(module.lessons)) module.lessons = [module.lessons];

      module.lessons.forEach((lesson: any, lIdx: number) => {
        if (!lesson.lesson_title) lesson.lesson_title = `Lesson ${lIdx + 1}`;

        // Assemble rich block structure for instant polish
        const blocks: any[] = [];

        // 1. Core text block
        const coreHtml = lesson.content || `<p>Welcome to ${lesson.lesson_title}. In this lesson, you will master key principles and execution steps.</p>`;
        blocks.push({
          id: `block-text-${idx}-${lIdx}-0`,
          type: "text",
          content: { text: coreHtml },
          orderIndex: 0,
        });

        // 2. Key takeaway quote block
        if (lesson.key_takeaway && (lesson.key_takeaway.quote || typeof lesson.key_takeaway === "string")) {
          const quoteText = typeof lesson.key_takeaway === "string" ? lesson.key_takeaway : lesson.key_takeaway.quote;
          const authorText = lesson.key_takeaway?.author || "Mastery Rule";
          blocks.push({
            id: `block-quote-${idx}-${lIdx}-1`,
            type: "quote",
            content: {
              text: quoteText,
              author: authorText,
            },
            orderIndex: blocks.length,
          });
        }

        // 3. 2-Column Framework / Comparison Grid block
        if (lesson.grid && Array.isArray(lesson.grid.items) && lesson.grid.items.length > 0) {
          blocks.push({
            id: `block-grid-${idx}-${lIdx}-2`,
            type: "grid",
            content: {
              title: lesson.grid.title || "Core Execution Principles",
              items: lesson.grid.items,
            },
            orderIndex: blocks.length,
          });
        }

        // 4. Action Checklist & Homework block
        if (Array.isArray(lesson.action_checklist) && lesson.action_checklist.length > 0) {
          const checklistItems = lesson.action_checklist.map((item: string) => `<li>☑️ <strong>${item}</strong></li>`).join("");
          const checklistHtml = `<div class="p-4 rounded-2xl bg-primary/5 border border-primary/10 mt-6"><h4 class="font-bold text-foreground text-base mb-2">🎯 Action Checklist & Implementation</h4><p class="text-xs text-muted-foreground mb-3">Execute these steps to implement what you learned:</p><ul class="space-y-1.5 text-sm">${checklistItems}</ul></div>`;
          blocks.push({
            id: `block-checklist-${idx}-${lIdx}-3`,
            type: "text",
            content: { text: checklistHtml },
            orderIndex: blocks.length,
          });
        }

        // Save blocks array and serialized content
        lesson.blocks = blocks;
        lesson.content = JSON.stringify(blocks);
      });
    });

    // Handle missing quizzes and generate them if needed
    console.log(`🔍 Checking for missing quizzes in ${parsed.modules.length} modules...`);
    for (let i = 0; i < parsed.modules.length; i++) {
      const module = parsed.modules[i] as any;
      if (!module.quiz || !module.quiz.questions || module.quiz.questions.length === 0) {
        console.log(`⚠️  Module ${i + 1} ("${module.module_title}") is missing a quiz. Generating now...`);
        try {
          const lessonsContext = module.lessons.map((l: any) => `${l.lesson_title}: ${l.content}`).join("\n\n");
          const generatedQuiz = await generateQuiz(module.module_title, lessonsContext);
          module.quiz = generatedQuiz;
          console.log(`✅ Quiz backfilled for module ${i + 1}`);
        } catch (quizError) {
          console.error(`❌ Failed to backfill quiz for module ${i + 1}:`, quizError);
        }
      }
    }

    console.log(`✅ Masterclass course generated successfully: "${parsed.course_title}"`);
    console.log(`   Modules: ${parsed.modules.length}`);
    console.log(`   Total lessons: ${parsed.modules.reduce((sum: number, m: any) => sum + m.lessons.length, 0)}\n`);

    return parsed as GeneratedCourse;
  } catch (error: any) {
    console.error(`❌ Failed to generate course for "${topic}":`, error);
    console.error(`Stack trace:`, error.stack);
    throw new Error("Failed to generate course content. Please try again.");
  }
}

export async function generateQuiz(
  moduleTitle: string,
  lessonsContext: string
): Promise<{ title: string; questions: any[] }> {
  const prompt = `You are an expert educator. Create a 3-5 question multiple-choice quiz for a course module.
  
  Module Title: "${moduleTitle}"
  Content Summary: ${lessonsContext}
  
  REQUIREMENTS:
  - 3-5 questions.
  - 4 options per question.
  - Clear, educational explanations for each correct answer.
  - Focus on testing actual comprehension, not just memorization.
  
  **CRITICAL: Your entire response MUST be valid JSON only. Start with { and end with }.**
  
  {
    "title": "Module Review Quiz",
    "questions": [
      {
        "question": "string",
        "options": ["string", "string", "string", "string"],
        "correctAnswer": number,
        "explanation": "string"
      }
    ]
  }`;

  try {
    console.log(`\n🧠 Generating quiz for module: "${moduleTitle}"`);

    const { response, model } = await generateWithFallback({
      prompt,
      useGrounding: false
    });

    const text = response.text;
    if (!text) throw new Error("Empty response for quiz");

    const jsonText = extractJSON(text);

    return JSON.parse(jsonText.trim());
  } catch (error) {
    console.error("Failed to generate quiz:", error);
    throw error;
  }
}

export async function regenerateModule(
  moduleTopic: string,
  courseContext: string
): Promise<{
  module_title: string;
  lessons: { lesson_title: string; content: string }[];
  quiz?: {
    title: string;
    questions: {
      question: string;
      options: string[];
      correctAnswer: number;
      explanation: string;
    }[];
  };
}> {
  const currentYear = new Date().getFullYear();

  const prompt = `You are an expert course designer with access to the internet. Regenerate a module for a course.

Course context: ${courseContext}
Module topic: ${moduleTopic}

IMPORTANT: Search the web for the latest ${currentYear} information about "${moduleTopic}" to ensure content is current and accurate.

Research and include:
- Current ${currentYear} best practices and methodologies
- Latest tools, frameworks, and industry standards
- Recent developments and emerging trends
- Up-to-date examples and case studies

Create a comprehensive module with:
1. A clear module title reflecting current standards
2. 3-5 lessons with substantial content
3. Each lesson should have 5-8 paragraphs of educational content
4. Include practical examples and actionable advice relevant to ${currentYear}
5. Reference specific current tools or platforms by name
6. Include a "quiz" with 3-5 questions.

**CRITICAL: Your entire response MUST be valid JSON only. Start with { and end with }. No text, no explanation, no markdown. Every character must be JSON.**

{
  "module_title": "Module Title",
  "lessons": [
    {
      "lesson_title": "Lesson Title",
      "content": "Full lesson content..."
    }
  ],
  "quiz": {
    "title": "Module Review Quiz",
    "questions": [
      {
        "question": "string",
        "options": ["option 1", "option 2", "option 3", "option 4"],
        "correctAnswer": 0,
        "explanation": "string"
      }
    ]
  }
} `;

  try {
    console.log(`\n📚 Regenerating module: "${moduleTopic}" (with web search)`);

    const { response, model, groundingUsed } = await generateWithFallback({
      prompt,
      useGrounding: true,
    });

    console.log(`📖 Generated with: ${model}${groundingUsed ? ' (grounding enabled)' : ''}\n`);

    const groundingMetadata = (response.candidates?.[0] as any)?.groundingMetadata;
    if (groundingMetadata) {
      const webSearchQueries = groundingMetadata.webSearchQueries || [];
      const groundingChunks = groundingMetadata.groundingChunks || [];
      console.log(`🔎 Grounding: ${webSearchQueries.length} searches, ${groundingChunks.length} sources`);
    }

    const text = response.text;
    if (!text) {
      throw new Error("Empty response from Gemini");
    }

    const jsonText = extractJSON(text);

    const result = JSON.parse(jsonText.trim());
    console.log(`✅ Module regenerated: "${result.module_title}" (${result.lessons.length} lessons)\n`);
    return result;
  } catch (error) {
    console.error(`❌ Failed to regenerate module for "${moduleTopic}":`, error);
    throw error;
  }
}

export async function regenerateLesson(
  lessonTopic: string,
  moduleContext: string
): Promise<{ lesson_title: string; content: string }> {
  const currentYear = new Date().getFullYear();

  const prompt = `You are an expert course designer with access to the internet. Regenerate a lesson.

Module context: ${moduleContext}
Lesson topic: ${lessonTopic}

IMPORTANT: Search the web for the latest ${currentYear} information about "${lessonTopic}" to ensure content is current and accurate.

Research and include:
- Current ${currentYear} best practices and real-world applications
- Latest tools, techniques, and industry standards
- Recent developments and case studies
- Up-to-date statistics and research findings

Create a comprehensive lesson with:
1. A clear lesson title reflecting current standards
2. 6-8 paragraphs of educational content
3. Include specific, current examples, tips, and practical advice
4. Reference specific tools, platforms, or resources by name where appropriate
5. Ensure content is high-value and provides a significant learning transformation

**CRITICAL: Your entire response MUST be valid JSON only. Start with { and end with }. No text, no explanation, no markdown. Every character must be JSON.**

{
  "lesson_title": "Lesson Title",
  "content": "Full lesson content with multiple paragraphs..."
}`;

  try {
    console.log(`\n📝 Regenerating lesson: "${lessonTopic}" (with web search)`);

    const { response, model, groundingUsed } = await generateWithFallback({
      prompt,
      useGrounding: true,
    });

    console.log(`📖 Generated with: ${model}${groundingUsed ? ' (grounding enabled)' : ''}\n`);

    const groundingMetadata = (response.candidates?.[0] as any)?.groundingMetadata;
    if (groundingMetadata) {
      const webSearchQueries = groundingMetadata.webSearchQueries || [];
      const groundingChunks = groundingMetadata.groundingChunks || [];
      console.log(`🔎 Grounding: ${webSearchQueries.length} searches, ${groundingChunks.length} sources`);
    }

    const text = response.text;
    if (!text) {
      throw new Error("Empty response from Gemini");
    }

    const jsonText = extractJSON(text);

    const result = JSON.parse(jsonText.trim());
    console.log(`✅ Lesson regenerated: "${result.lesson_title}"\n`);
    return result;
  } catch (error) {
    console.error(`❌ Failed to regenerate lesson for "${lessonTopic}":`, error);
    throw error;
  }
}

export async function generateImagePrompt(courseTitle: string): Promise<string> {
  try {
    const prompt = `You are an expert course thumbnail designer for platforms like Udemy and Skillshare. Create a professional thumbnail prompt.

Course title: "${courseTitle}"

Create a prompt following this EXACT structure:
1. LAYOUT: Instructor/person on the RIGHT side, headline text on the LEFT side
2. PERSON: Confident, professional instructor portrait (describe their appearance, attire matching the course topic, friendly expression)
3. LIGHTING: Soft studio lighting on the person, professional look
4. BACKGROUND: Modern gradient or clean backdrop that fits the course topic
5. TEXT: Bold, large headline (2-4 words) on the left with modern styling (3D, glow, or shadow)
6. ACCENT: ONE small relevant icon or visual element near the text

Keep composition CLEAN and BALANCED. The person and text should be clearly separated.

Format: "[background] with [person description] on the right side, [lighting], bold [text style] headline on left reading '[phrase]', [accent element], professional course thumbnail style, ultra clean composition"

Examples:
- For "Python Programming": "Deep blue to purple gradient background, confident young developer in smart casual attire on the right side smiling, soft studio lighting, bold white 3D text with blue glow on left reading 'MASTER PYTHON', small floating code brackets accent, professional course thumbnail style, ultra clean composition"
- For "Digital Marketing": "Vibrant coral to orange gradient, professional marketing expert in business attire on the right side with confident pose, warm studio lighting, bold black text with white outline on left reading 'GROW YOUR BRAND', subtle social media icons floating, professional course thumbnail style, ultra clean composition"
- For "Fitness Training": "Dynamic dark gradient with red accents, athletic fitness coach in workout gear on the right side looking motivated, dramatic lighting, bold white 3D text on left reading 'GET FIT NOW', single dumbbell icon accent, professional course thumbnail style, ultra clean composition"
- For "Photography Basics": "Sleek dark grey gradient with bokeh lights, creative photographer holding camera on the right side, cinematic lighting, elegant gold and white text on left reading 'CAPTURE MAGIC', camera lens flare accent, professional course thumbnail style, ultra clean composition"

Respond with ONLY the prompt, nothing else.`;

    const { response, model: usedModel } = await generateWithFallback({
      prompt,
    });

    console.log(`📖 Generated with: ${usedModel}`);

    const text = response.text?.trim();
    if (!text) {
      return `a course thumbnail with text "${courseTitle}"`;
    }

    return text;
  } catch (error) {
    console.error("Failed to generate image prompt:", error);
    return `a course thumbnail with text "${courseTitle}"`;
  }
}

const DEAPI_BASE_URL = "https://api.deapi.ai";

async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function generateCourseImageWithDeAPI(prompt: string): Promise<string | null> {
  const apiKey = process.env.DEAPI_API_KEY;

  if (!apiKey) {
    console.error("DEAPI_API_KEY is not set");
    return null;
  }

  try {
    console.log("DeAPI: Starting image generation with prompt:", prompt);

    const generateResponse = await fetch(`${DEAPI_BASE_URL}/api/v1/client/txt2img`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
        "Accept": "application/json"
      },
      body: JSON.stringify({
        prompt: prompt,
        negative_prompt: "blur, darkness, noise, low quality, distorted text, cluttered, messy, too many elements, pixelated, illegible text, watermark, amateur, ugly, deformed, bad anatomy, extra limbs, disfigured face, cropped, multiple people, cartoon, anime, illustration, painting, sketch, low resolution",
        model: "ZImageTurbo_INT8",
        loras: [],
        width: 768,
        height: 432,
        guidance: 7.5,
        steps: 20,
        seed: Math.floor(Math.random() * 1000000)
      })
    });

    if (!generateResponse.ok) {
      const errorText = await generateResponse.text().catch(() => "Unknown error");
      console.error("DeAPI generate error:", generateResponse.status, errorText);
      return null;
    }

    const generateData = await generateResponse.json();
    const requestId = generateData?.data?.request_id || generateData?.task_id || generateData?.request_id;

    if (!requestId) {
      console.error("DeAPI: No request_id in response:", generateData);
      return null;
    }

    const maxAttempts = 50;
    const pollInterval = 5000;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      await sleep(pollInterval);

      const statusResponse = await fetch(`${DEAPI_BASE_URL}/api/v1/client/request-status/${requestId}`, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Accept": "application/json"
        }
      });

      if (statusResponse.status === 429) {
        console.log(`DeAPI: Rate limited (429), attempt ${attempt + 1}. Backing off for 10s...`);
        await sleep(10000);
        continue;
      }

      if (!statusResponse.ok) {
        const errorText = await statusResponse.text().catch(() => "Unknown error");
        console.error(`DeAPI: Status check failed with status ${statusResponse.status}, attempt ${attempt + 1}:`, errorText);
        // On server error, wait longer
        await sleep(2000);
        continue;
      }

      const statusData = await statusResponse.json();
      const status = statusData?.data?.status || statusData?.status || statusData?.data?.request_status;
      console.log("DeAPI: Status:", status);

      if (status === "done" || status === "COMPLETED") {
        const imageUrl = statusData?.data?.result_url ||
          statusData?.result_url ||
          statusData?.result?.output_url;

        if (imageUrl) {
          console.log("DeAPI: Image generated successfully:", imageUrl);

          // Download the image and convert to base64 data URL to avoid expiration
          try {
            const imageResponse = await fetch(imageUrl);
            if (imageResponse.ok) {
              const arrayBuffer = await imageResponse.arrayBuffer();
              const base64 = Buffer.from(arrayBuffer).toString('base64');
              const contentType = imageResponse.headers.get('content-type') || 'image/png';
              const dataUrl = `data:${contentType};base64,${base64}`;
              console.log("DeAPI: Image converted to permanent data URL");
              return dataUrl;
            } else {
              console.error("DeAPI: Failed to download image, returning original URL");
              return imageUrl;
            }
          } catch (downloadError) {
            console.error("DeAPI: Error downloading image:", downloadError);
            return imageUrl;
          }
        } else {
          console.log("DeAPI: Completed but no image URL found:", JSON.stringify(statusData));
          return null;
        }
      } else if (status === "FAILED" || status === "failed" || status === "error") {
        console.error("DeAPI: Generation failed:", statusData?.error || statusData);
        return null;
      } else {
        console.log("DeAPI: Still processing, attempt", attempt + 1, "status:", status);
      }
    }

    console.error("DeAPI: Timeout waiting for image generation");
    return null;
  } catch (error) {
    console.error("DeAPI request failed:", error);
    return null;
  }
}

export async function generateCourseImage(courseTitle: string): Promise<string | null> {
  try {
    const prompt = await generateImagePrompt(courseTitle);
    console.log("Generating image with prompt:", prompt);

    const imageUrl = await generateCourseImageWithDeAPI(prompt);
    return imageUrl;
  } catch (error) {
    console.error("Failed to generate course image:", error);
    return null;
  }
}

export interface ImagePlan {
  imagePrompt: string;
  imageAlt: string;
  placement: number;
}

export interface LessonMediaPlan {
  lessonIndex: number;
  images: ImagePlan[];
  shouldGenerateVideo?: boolean;
}

export interface ModuleMediaPlan {
  moduleIndex: number;
  lessons: LessonMediaPlan[];
}

// Generate a fallback image prompt for a lesson
export function generateFallbackImagePrompt(courseTitle: string, moduleTitle: string, lessonTitle: string, lessonContent: string): string {
  const contentPreview = lessonContent.substring(0, 150).replace(/[#*_\n]/g, ' ').trim();
  return `Professional educational illustration for "${lessonTitle}" in a course about "${courseTitle}". Visual concept: ${contentPreview}. Style: clean, modern, minimalist illustration with soft colors. The image can include relevant keywords or labels if they help explain the concept. Focus on icons, objects, people, or abstract shapes to represent the concept.`;
}

// Generate a fallback media plan - conservative approach, only add images where truly needed
function generateFallbackMediaPlan(
  courseTitle: string,
  modules: { module_title: string; lessons: { lesson_title: string; content: string }[] }[]
): CourseMediaPlan {
  console.log("Generating conservative fallback media plan for", modules.length, "modules");

  // Calculate total lessons to determine how many images to add (roughly 1 per module)
  const totalLessons = modules.reduce((sum, m) => sum + m.lessons.length, 0);
  const targetImages = Math.min(modules.length, Math.ceil(totalLessons / 5)); // ~1 image per 5 lessons

  let imagesAdded = 0;

  const modulePlans = modules.map((module, moduleIndex) => ({
    moduleIndex,
    lessons: module.lessons.map((lesson, lessonIndex) => {
      const images: ImagePlan[] = [];

      // Only add image to first lesson of each module, and only if we haven't exceeded target
      if (lessonIndex === 0 && imagesAdded < targetImages) {
        // Calculate paragraph count to place image after the last paragraph
        const paragraphCount = lesson.content.split(/\n\s*\n/).filter(p => p.trim()).length;
        images.push({
          imagePrompt: generateFallbackImagePrompt(courseTitle, module.module_title, lesson.lesson_title, lesson.content),
          imageAlt: `Illustration for ${lesson.lesson_title}`,
          placement: Math.max(1, paragraphCount), // Place after content, minimum after first paragraph
        });
        imagesAdded++;
      }

      return { lessonIndex, images, shouldGenerateVideo: false };
    }),
  }));

  return {
    modules: modulePlans,
    videoLesson: { moduleIndex: 0, lessonIndex: 0 }
  };
}

export interface CourseMediaPlan {
  modules: ModuleMediaPlan[];
  videoLesson?: {
    moduleIndex: number;
    lessonIndex: number;
  };
}

export async function generateCourseMediaPlan(
  courseTitle: string,
  modules: { module_title: string; lessons: { lesson_title: string; content: string }[] }[]
): Promise<CourseMediaPlan> {
  // Count paragraphs for each lesson to help AI decide placement
  const modulesWithParagraphCounts = modules.map((m, mi) => ({
    ...m,
    lessons: m.lessons.map((l, li) => ({
      ...l,
      paragraphCount: l.content.split(/\n\s*\n/).filter(p => p.trim()).length
    }))
  }));

  // Calculate target: roughly 1-2 images per module maximum
  const totalLessons = modules.reduce((sum, m) => sum + m.lessons.length, 0);
  const targetImageCount = Math.max(2, Math.min(modules.length, Math.ceil(totalLessons / 6)));

  const prompt = `You are an expert course designer. Analyze this course and decide which lessons TRULY NEED an image to enhance understanding.

Course: "${courseTitle}"

Modules and Lessons:
${modulesWithParagraphCounts.map((m, mi) => `
Module ${mi + 1}: ${m.module_title}
${m.lessons.map((l, li) => `  Lesson ${li + 1}: ${l.lesson_title} (${l.paragraphCount} paragraphs)
    Content preview: ${l.content.substring(0, 300)}...`).join('\n')}`).join('\n')}

CRITICAL RULES - BE VERY CONSERVATIVE WITH IMAGES:
1. MAXIMUM ONE IMAGE per lesson - NEVER add multiple images to a single lesson
2. Most lessons should have NO images (empty images array)
3. Only add an image if the lesson covers something HIGHLY VISUAL like:
   - Complex diagrams, workflows, or processes that are hard to explain with text
   - Physical objects, tools, or equipment that students need to recognize
   - Step-by-step visual procedures
4. Do NOT add images for:
   - Theoretical concepts that can be explained with text
   - Definitions and terminology
   - Lists, tips, or best practices
   - Introduction or conclusion lessons
5. Target: Add images to only ${targetImageCount} lessons TOTAL across the entire course
6. Image prompts should focus on visual concepts but can include relevant text, titles, or labels to enhance educational value.

PLACEMENT RULES:
- placement: 1 = image appears AFTER paragraph 1
- placement: 2 = image appears AFTER paragraph 2
- placement: N = image appears AFTER paragraph N (use the paragraph count to place at the END of the lesson content)
- NEVER use placement: 0 (that puts images BEFORE all content, which looks bad)
- Always set placement to the paragraph count of the lesson to place images AFTER all the text content

VIDEO SELECTION RULES:
1. Select EXACTLY ONE lesson across the entire course to have a video.
2. Choose a lesson that is educational and would benefit from a visual teacher/whiteboard explanation (e.g., explaining a core concept).
3. Set \`shouldGenerateVideo: true\` for that specific lesson.

Respond ONLY with valid JSON:
{
  "modules": [
    {
      "moduleIndex": 0,
      "lessons": [
        {
          "lessonIndex": 0,
          "images": [],
          "shouldGenerateVideo": false
        },
        {
          "lessonIndex": 1,
          "images": [
            {
              "imagePrompt": "Clean minimalist illustration showing [specific visual concept], soft colors, modern style, no text",
              "imageAlt": "Description",
              "placement": 3
            }
          ]
        },
        {
          "lessonIndex": 2,
          "images": []
        }
      ]
    }
  ]
}`;

  try {
    const { response, model: usedModel } = await generateWithFallback({
      prompt,
    });

    console.log(`📖 Media plan generated with: ${usedModel}`);

    const text = response.text;
    if (!text) {
      console.error("Empty response from Gemini for media plan, using fallback");
      return generateFallbackMediaPlan(courseTitle, modules);
    }

    const jsonText = extractJSON(text);

    interface OldLessonFormat {
      lessonIndex: number;
      shouldAddImage?: boolean;
      imagePrompt?: string;
      imageAlt?: string;
      placement?: number;
      images?: ImagePlan[];
    }

    interface ParsedModulePlan {
      moduleIndex: number;
      lessons: OldLessonFormat[];
    }

    const parsed = JSON.parse(jsonText);
    const mediaPlan = parsed.modules || [];
    let videoLesson: { moduleIndex: number; lessonIndex: number } | undefined;

    // Convert to new format and validate
    const validatedModulePlan: ModuleMediaPlan[] = modules.map((module, moduleIndex) => {
      const existingModulePlan = mediaPlan.find((p: any) => p.moduleIndex === moduleIndex);

      if (!existingModulePlan) {
        // Module missing from plan, create fallback
        const fallback = generateFallbackMediaPlan(courseTitle, [module]);
        return { moduleIndex, lessons: fallback.modules[0]?.lessons || [] };
      }

      // Convert lessons to new format
      const convertedLessons: LessonMediaPlan[] = module.lessons.map((lesson, lessonIndex) => {
        const lessonPlan = existingModulePlan.lessons.find((l: any) => l.lessonIndex === lessonIndex);

        if (!lessonPlan) {
          return { lessonIndex, images: [], shouldGenerateVideo: false };
        }

        if (lessonPlan.shouldGenerateVideo && !videoLesson) {
          videoLesson = { moduleIndex, lessonIndex };
        }

        // Handle both old format (shouldAddImage/imagePrompt) and new format (images array)
        let images: ImagePlan[] = [];
        if (lessonPlan.images && Array.isArray(lessonPlan.images)) {
          images = lessonPlan.images;
        } else if (lessonPlan.shouldAddImage && lessonPlan.imagePrompt) {
          // Calculate paragraph count to determine proper placement
          const paragraphCount = lesson.content.split(/\n\s*\n/).filter(p => p.trim()).length;
          images = [{
            imagePrompt: lessonPlan.imagePrompt,
            imageAlt: lessonPlan.imageAlt || `Illustration for ${lesson.lesson_title}`,
            placement: lessonPlan.placement || Math.max(1, paragraphCount), // Default to after content
          }];
        }

        return {
          lessonIndex,
          images,
          shouldGenerateVideo: !!lessonPlan.shouldGenerateVideo
        };
      });

      return { moduleIndex, lessons: convertedLessons };
    });

    // Ensure at least one video is selected if possible
    if (!videoLesson && validatedModulePlan.length > 0 && validatedModulePlan[0].lessons.length > 0) {
      validatedModulePlan[0].lessons[0].shouldGenerateVideo = true;
      videoLesson = { moduleIndex: 0, lessonIndex: 0 };
    }

    // Only add a single fallback image if the ENTIRE course has zero images
    const totalImages = validatedModulePlan.reduce((sum, m) =>
      sum + m.lessons.reduce((lSum, l) => lSum + l.images.length, 0), 0);

    if (totalImages === 0 && modules.length > 0 && modules[0].lessons.length > 0) {
      // Add just one image to the first lesson of the first module
      const firstLesson = modules[0].lessons[0];
      const paragraphCount = firstLesson.content.split(/\n\s*\n/).filter(p => p.trim()).length;
      validatedModulePlan[0].lessons[0].images = [{
        imagePrompt: generateFallbackImagePrompt(courseTitle, modules[0].module_title, firstLesson.lesson_title, firstLesson.content),
        imageAlt: `Illustration for ${firstLesson.lesson_title}`,
        placement: Math.max(1, paragraphCount), // Place after content
      }];
      console.log("Added single fallback image as course had no images");
    }

    console.log(`Validated media plan: ${totalImages} images across ${modules.length} modules, 1 video selected`);
    return { modules: validatedModulePlan, videoLesson };
  } catch (error) {
    console.error("Failed to generate media plan, using fallback:", error);
    return generateFallbackMediaPlan(courseTitle, modules);
  }
}

export async function generateLessonImage(prompt: string): Promise<string | null> {
  try {
    console.log("Generating lesson image with prompt:", prompt);
    const imageUrl = await generateCourseImageWithDeAPI(prompt);
    return imageUrl;
  } catch (error) {
    console.error("Failed to generate lesson image:", error);
    return null;
  }
}

export async function generateDeepVideoImage(
  courseTitle: string,
  moduleTitle: string,
  lessons: { title: string; content: string }[]
): Promise<string | null> {
  try {
    console.log("Designing high-quality whiteboard layout with Gemini Pro...");

    const designPrompt = `You are an expert graphic designer and educational content creator. Design a premium, high-end educational presentation slide for a module introduction video.
    
    Course: "${courseTitle}"
    Module: "${moduleTitle}"
    Learning Objectives:
    ${lessons.map((l, i) => `${i + 1}. ${l.title}`).join('\n')}
    
    DESIGN REQUIREMENTS:
    - STYLE: Professional, ultra-modern, glassmorphic aesthetic.
    - BACKGROUND: Deep charcoal or navy blue with subtle glowing mesh gradients (dark purples and blues).
    - TYPOGRAPHY: Large, bold, clean sans-serif font for the title "${moduleTitle}" at the top.
    - CONTENT: A central "Glass" card containing a clear list of the ${lessons.length} lessons. Each lesson should have a small, sleek icon (like a glowing checkmark or geometric shape).
    - VISUALS: Floating 3D geometric shapes (spheres, cubes) with a frosted glass texture and soft internal glow.
    - LAYOUT: Symmetrical, balanced, and uncluttered. Use gold or cyan as highlight colors for accents.
    - TEXT: Everything must be ultra-sharp and legible.
    
    Respond ONLY with a vivid, detailed image generation prompt for a text-to-image model.
    The prompt MUST describe: A wide-angle, hyper-realistic master shot of a digital presentation screen. "High-end cinematic corporate presentation slide, glassmorphic UI elements, sharp professional typography, 8k resolution, Unreal Engine 5 render style, soft ambient lighting, premium educational aesthetic, no people, purely digital graphics."`;

    const designResponse = await ai.models.generateContent({
      model: "gemini-3.5-flash-lite", // Prompt design
      contents: designPrompt,
    });

    const detailedPrompt = designResponse.text || `A professional teacher standing next to a whiteboard covered in detailed handwritten notes and diagrams about ${moduleTitle}. Professional lighting, 4k.`;
    console.log("Calculated Detailed Prompt:", detailedPrompt);

    console.log("Generating base image for video using gemini-3-pro-image-preview...");
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-image-preview",
      contents: detailedPrompt,
    });

    const imageUrl = (response as any).image?.url || (response as any).images?.[0]?.url;

    if (!imageUrl) {
      console.warn("gemini-3-pro-image-preview did not return an image URL, falling back to DeAPI with the detailed prompt");
      return await generateCourseImageWithDeAPI(detailedPrompt);
    }

    return imageUrl;
  } catch (error) {
    console.error("Failed to generate deep video image:", error);
    return null;
  }
}

export async function generateVeoVideoSegment(imageData: string, segmentIndex: number): Promise<string | null> {
  try {
    console.log(`Generating Veo 3.1 video segment ${segmentIndex + 1}/3...`);

    // Veo 3.1 requires the generateVideos method and returns an operation
    // We poll the operation until it's finished
    const segmentPrompts = [
      "Cinematic slow-motion pan across the presentation slide. The central glass card gently shimmers with a soft light trail passing over it. The module title glows subtly. Professional, premium motion graphics style. Smooth 24fps.",
      "The lesson list items animate with a soft glowing cascade effect, as if they are being highlighted or activated sequentially. Background geometric shapes slowly drift and rotate. Elegant, professional educational video feel.",
      "A soft zoom into a central highlighted concept or graphic. Particles of light dance around the elements. The entire slide has a premium, 'Apple Keynote' style cinematic finish. Elegant and high-end."
    ];

    let operation = await (ai.models as any).generateVideos({
      model: "veo-3.1-fast-generate-preview",
      prompt: segmentPrompts[segmentIndex] || "The teacher continues explaining, using subtle hand gestures and pointing at the whiteboard. The animation should be smooth and professional.",
      image: {
        imageBytes: imageData.replace(/^data:image\/[a-z]+;base64,/, ""),
        mimeType: "image/png"
      }
    });

    console.log(`Operation started: ${operation.name || 'pending'}`);

    // Poll for completion (max 2 minutes)
    const maxRetries = 24; // 24 * 5s = 120s
    let retries = 0;

    while (!operation.done && retries < maxRetries) {
      retries++;
      await new Promise(resolve => setTimeout(resolve, 5000));

      try {
        operation = await (ai as any).operations.getVideosOperation({ operation });
        console.log(`Polling segment ${segmentIndex + 1}/3... [${retries}/${maxRetries}] Status: ${operation.done ? 'Done' : 'Processing'}`);
      } catch (pollError) {
        console.warn(`Polling attempt ${retries} failed, retrying...`, pollError);
      }
    }

    if (operation.done && operation.response) {
      const videoUrl = operation.response.generatedVideos?.[0]?.video?.uri || operation.response.generatedVideos?.[0]?.video?.url;
      console.log(`Successfully generated segment ${segmentIndex + 1}/3: ${videoUrl}`);
      return videoUrl || null;
    } else {
      console.error(`Video generation timed out or failed for segment ${segmentIndex}. Done: ${operation.done}`);
      return null;
    }
  } catch (error) {
    console.error(`Failed to generate Veo segment ${segmentIndex}:`, error);
    return null;
  }
}


export interface DocumentAnalysis {
  title: string;
  audience: string;
  tone: string;
  outline?: string;
}

export async function analyzeDocumentMetadata(text: string): Promise<DocumentAnalysis> {
  const prompt = `You are an expert curriculum strategist and copywriter. Analyze the following document content and suggest the best settings for an online course based on this material.
  
  DOCUMENT CONTENT:
  ${text.substring(0, 8000)}
  
  TASK:
  1. Title: Create a high-converting, professional course title.
  2. Audience: Describe the ideal student for this material (e.g., "Junior software engineers looking to master async patterns").
  3. Tone: Suggest a specific voice from these exact options: "Professional", "Conversational", "Academic", "Enthusiastic", or "Storytelling".
  4. Outline: Briefly list 4-6 core topics/chapters the document covers.
  
  **CRITICAL: You MUST respond ONLY with a single valid JSON object.**
  {
    "title": "string",
    "audience": "string",
    "tone": "string",
    "outline": "string"
  }`;

  try {
    console.log("Analyzing document metadata with Gemini...");
    const { response, model } = await generateWithFallback({
      prompt,
      useGrounding: false,
    });

    console.log(`📖 Analyzed with: ${model}`);
    const jsonText = extractJSON(response.text || "");
    const result = JSON.parse(jsonText);

    console.log("✅ Analysis complete:", result.title);
    return result as DocumentAnalysis;
  } catch (error) {
    console.error("Document analysis failed, returning fallbacks:", error);
    return {
      title: "New Course based on Document",
      audience: "Interested Learners",
      tone: "Professional and Informative",
      outline: "Overview of provided materials."
    };
  }
}

export async function generateBlockContent(
  blockType: string,
  userPrompt: string,
  context: { courseTitle: string; moduleTitle: string; lessonTitle: string }
): Promise<string> {
  const prompt = `You are an expert educational content writer for the course "${context.courseTitle}".
  
  CONTEXT:
  - Module: ${context.moduleTitle}
  - Lesson: ${context.lessonTitle}
  - Block Type: ${blockType}
  
  TASK:
  Generate high-quality, engaging educational content for this specific ${blockType} block.
  User Instructions: "${userPrompt}"
  
  STRICT RULES:
  - Respond ONLY with the generated text content.
  - Do not include any meta-talk, introductions, or JSON unless specifically asked.
  - Keep the tone professional, educational, and clear.
  - If it's a "quote" block, provide the quote and author if applicable.
  - If it's a "text" block, provide clear instructional paragraphs.
  - If the user prompt is empty, generate generic but relevant educational content based on the lesson title.
  
  Generated Content:`;

  try {
    const { response, model } = await generateWithFallback({
      prompt,
      useGrounding: false,
    });
    console.log(`✨ Block content generated with: ${model}`);
    return response.text || "Failed to generate content. Please try again.";
  } catch (error) {
    console.error("Block content generation failed:", error);
    return "An error occurred while generating content. Please try again.";
  }
}

export interface LaunchPackResult {
  headline?: string;
  salesPitch?: string;
  targetAudience?: string;
  recommendedPrice?: string;
  communityAnnouncement: string;
  emailAnnouncement?: string;
  communityUrl?: string;
}

export async function generateLaunchPack(
  courseTitle: string,
  modulesSummary: string,
  audience?: string,
  communityUrl?: string
): Promise<LaunchPackResult> {
  const linkText = communityUrl ? `Community Link: ${communityUrl}` : "";
  const prompt = `You are a high-ticket digital product strategist and copywriter for top Whop communities.
Create a high-converting Whop Community Launch Announcement for:
Course Title: "${courseTitle}"
Target Audience: "${audience || "Community members & high-intent learners"}"
${linkText ? `Community Link to include: ${communityUrl}` : ""}

Curriculum Overview:
${modulesSummary}

REQUIREMENTS:
- "communityAnnouncement": An engaging, exciting Discord / Whop community announcement post with emojis, key takeaways, and call-to-action link. ${communityUrl ? `Include the link: ${communityUrl}` : `Include placeholder [Course Link]`}.
- "recommendedPrice": Specific recommended pricing (e.g., "$29 - $49 one-time" or "Free VIP Benefit") with 1-sentence rationale.

Respond ONLY with a single valid JSON object matching this schema:
{
  "communityAnnouncement": "string",
  "recommendedPrice": "string"
}`;

  try {
    const { response, model } = await generateWithFallback({
      prompt,
      useGrounding: false,
    });

    const jsonText = extractJSON(response.text || "");
    const parsed = JSON.parse(jsonText);
    const linkSuffix = communityUrl ? `\n\n👉 Access the masterclass here: ${communityUrl}` : "";
    return {
      communityAnnouncement: parsed.communityAnnouncement || `🚀 **NEW MASTERCLASS LIVE: ${courseTitle}**\n\nWe just released an in-depth, hands-on masterclass with frameworks, action checklists, and 24/7 AI tutor access! Check it out in the courses tab now!${linkSuffix}`,
      recommendedPrice: parsed.recommendedPrice || "$29 - $49 (Proven sweet spot for high volume on Whop)",
      communityUrl,
    };
  } catch (error) {
    console.error("Launch pack generation failed, returning fallback:", error);
    const linkSuffix = communityUrl ? `\n\n👉 Access the masterclass here: ${communityUrl}` : "";
    return {
      communityAnnouncement: `🔥 **Just Dropped: ${courseTitle}**\n\nLevel up your skills with our newly released masterclass! Packed with actionable blueprints and 24/7 AI guidance. Dive in today!${linkSuffix}`,
      recommendedPrice: "$29 - $49 (Recommended for standalone purchase)",
      communityUrl,
    };
  }
}

export async function generateEmailAnnouncement(params: {
  courseTitle: string;
  modulesSummary: string;
  communityUrl?: string;
}): Promise<string> {
  const { courseTitle, modulesSummary, communityUrl } = params;
  const prompt = `You are an expert copywriter for creators selling courses on Whop.
Write a high-converting, friendly Email / Direct Message announcement for:
Course Title: "${courseTitle}"
${communityUrl ? `Course / Community Link: ${communityUrl}` : ""}

Curriculum Overview:
${modulesSummary}

REQUIREMENTS:
- Catchy Subject Line.
- Engaging hook explaining what students will achieve.
- 3 bullet points highlighting practical skills.
- Clear Call to Action with ${communityUrl ? communityUrl : "[Course Link]"}.
- Professional, energetic tone.

Format cleanly as plain text with line breaks.`;

  try {
    const { response } = await generateWithFallback({
      prompt,
      useGrounding: false,
    });
    return response.text?.trim() || `Subject: Brand new masterclass: ${courseTitle}\n\nHi there,\n\nOur newest course is now officially live. Dive in and start learning today!${communityUrl ? `\n\nLink: ${communityUrl}` : ''}`;
  } catch (error) {
    console.error("Email announcement generation failed:", error);
    return `Subject: Brand new masterclass: ${courseTitle}\n\nHi there,\n\nOur newest course is now officially live. Dive in and start learning today!${communityUrl ? `\n\nLink: ${communityUrl}` : ''}`;
  }
}


export async function askCourseTutor(params: {
  courseTitle: string;
  lessonTitle: string;
  lessonContent: string;
  query: string;
  chatHistory?: Array<{ role: "user" | "assistant"; text: string }>;
}): Promise<string> {
  const { courseTitle, lessonTitle, lessonContent, query, chatHistory = [] } = params;

  // Clean HTML tags for lean, fast context
  const cleanLessonText = lessonContent
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .substring(0, 3500);

  let conversationFormatted = "";
  if (chatHistory.length > 0) {
    conversationFormatted = chatHistory
      .slice(-4)
      .map((m) => `${m.role === "user" ? "Student" : "AI Mentor"}: ${m.text}`)
      .join("\n");
  }

  const prompt = `You are the personal 24/7 AI Tutor and expert mentor for students taking the online course "${courseTitle}".
The student is currently learning the lesson: "${lessonTitle}".

CURRENT LESSON CONTENT:
${cleanLessonText}

${conversationFormatted ? `RECENT CONVERSATION:\n${conversationFormatted}\n` : ""}
STUDENT QUESTION: "${query}"

INSTRUCTIONS:
- Answer directly, warmly, and clearly as an experienced, encouraging mentor.
- Ground your answer in the current lesson principles.
- Use concrete examples, bullet points, or step-by-step breakdowns when helpful.
- If the student asks for practice, an exercise, or a quiz, test their understanding with a quick challenge.
- Keep answers conversational, supportive, and formatted in clean markdown (2-3 concise paragraphs or bullet points).
- Do not repeat boilerplate; jump straight into the helpful response.

Response:`;

  try {
    const { response, model } = await generateWithFallback({
      prompt,
      useGrounding: false,
    });
    return response.text?.trim() || "I'm here to help! Could you please tell me more about what you'd like to explore in this lesson?";
  } catch (error) {
    console.error("AI Course Tutor error:", error);
    throw new Error("Tutor unavailable at the moment. Please try again.");
  }
}

