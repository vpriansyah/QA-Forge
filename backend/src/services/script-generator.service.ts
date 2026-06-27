// ═══════════════════════════════════════════════════════════
// QA Forge — Script Generator Service
// Handles automation script generation via AI
// ═══════════════════════════════════════════════════════════

import { prisma } from '../config/database';
import { ai, AI_MODEL } from '../config/gemini';
import { logger } from '../config/logger';
import { minioClient } from '../config/minio';
import config from '../config';

export class ScriptGeneratorService {
  /**
   * Generate automation script from input using AI (streaming)
   */
  async generate(
    userId: string,
    title: string,
    framework: string,
    language: string,
    inputType: string,
    inputData: { prompt?: string; file_keys?: string[]; tc_result?: any[] }
  ) {
    // Create the generation record first
    let generation: any = { id: `mock-${Date.now()}` };
    try {
      generation = await prisma.scriptGeneration.create({
        data: {
          user_id: userId,
          title,
          framework,
          language,
          input_type: inputType,
          input_data: inputData as any,
          status: 'pending',
        },
      });
    } catch (dbError) {
      logger.warn({ dbError }, 'Skipping DB insertion for script generation (degraded mode)');
    }

    // Build prompt & contents
    const systemPrompt = this.getSystemPrompt(framework, language);
    const userPrompt = this.buildPrompt(framework, language, inputType, inputData);

    // Build request contents including file uploads if needed
    const contents: any[] = [];

    // Add images/files from MinIO if provided
    if (inputData.file_keys && inputData.file_keys.length > 0) {
      for (const key of inputData.file_keys) {
        try {
          const stream = await minioClient.getObject(config.MINIO_BUCKET_UPLOADS, key);
          const chunks: Buffer[] = [];
          for await (const chunk of stream) {
            chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
          }
          const buffer = Buffer.concat(chunks);
          const ext = key.split('.').pop()?.toLowerCase();

          // HAR/JSON: inject as text
          if (ext === 'har' || ext === 'json') {
            contents.push({ text: `\n\n--- File Content: ${key} ---\n${buffer.toString('utf8')}` });
            continue;
          }

          const mimeType =
            ext === 'png' ? 'image/png' :
            ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg' :
            ext === 'webp' ? 'image/webp' :
            'application/octet-stream';

          contents.push({ inlineData: { mimeType, data: buffer.toString('base64') } });
        } catch (err) {
          logger.warn({ err, key }, 'Failed to fetch file from MinIO');
        }
      }
    }

    // Add text prompt
    contents.push({ text: userPrompt });

    // Fallback to mock if API key is not configured
    if (!config.GEMINI_API_KEY || config.GEMINI_API_KEY === 'your_gemini_api_key_here') {
      logger.warn('Using mock AI generation because Gemini API Key is missing');
      
      const mockStream = (async function* () {
        const mockCode = `// [MOCK SCRIPT] Gemini API Key is missing or invalid.\n// Please configure GEMINI_API_KEY in backend/.env\n\nimport { test, expect } from '@playwright/test';\n\ntest('${title || 'Mock Test'}', async ({ page }) => {\n  await page.goto('https://example.com');\n  await expect(page).toHaveTitle(/Example/);\n});`;
        
        const chunks = mockCode.match(/.{1,10}/g) || [mockCode];
        for (const chunk of chunks) {
          await new Promise(resolve => setTimeout(resolve, 50));
          yield { text: chunk };
        }
      })();

      return { generation, stream: mockStream };
    }

    // Start AI stream
    const stream = await ai.models.generateContentStream({
      model: AI_MODEL,
      config: { systemInstruction: systemPrompt },
      contents: [{ role: 'user', parts: contents }],
    });

    return { generation, stream };
  }

  /**
   * Get history list for a user
   */
  async getHistory(userId: string) {
    return prisma.scriptGeneration.findMany({
      where: { user_id: userId },
      orderBy: { created_at: 'desc' },
      select: {
        id: true,
        title: true,
        framework: true,
        language: true,
        input_type: true,
        status: true,
        created_at: true,
      },
    });
  }

  /**
   * Get single generation by ID (ownership check)
   */
  async getById(id: string, userId: string) {
    return prisma.scriptGeneration.findFirst({
      where: { id, user_id: userId },
    });
  }

  /**
   * Delete a generation record
   */
  async deleteHistory(id: string, userId: string) {
    const record = await prisma.scriptGeneration.findFirst({
      where: { id, user_id: userId },
    });
    if (!record) throw new Error('Generation not found');

    return prisma.scriptGeneration.delete({ where: { id } });
  }

  // ─── Private helpers ───────────────────────────────────

  private getSystemPrompt(framework: string, language: string): string {
    const langMap: Record<string, string> = {
      typescript: 'TypeScript',
      javascript: 'JavaScript',
      python: 'Python',
      xml: 'XML (JMeter .jmx)',
    };
    const fwMap: Record<string, string> = {
      playwright: 'Playwright',
      cypress: 'Cypress',
      postman: 'Postman Collection (JSON)',
      k6: 'k6 load testing',
      appium: 'Appium',
      locust: 'Locust (Python)',
      jmeter: 'Apache JMeter (.jmx XML)',
    };

    return `You are an expert automation test engineer specializing in ${fwMap[framework] || framework}.
Your task is to generate a complete, production-ready automation test script in ${langMap[language] || language}.
The script must be:
- Clean, readable, and well-commented
- Following best practices and conventions for ${fwMap[framework] || framework}
- Complete and runnable (not just fragments)
- Structured with proper test suite organization (describe/it blocks, etc.)

[CRITICAL OUTPUT RULE]
Return ONLY the raw source code. 
Do NOT wrap in markdown code blocks (\`\`\`).
Do NOT add any explanation before or after the code.
Just output the pure script/code.`;
  }

  private buildPrompt(
    framework: string,
    language: string,
    inputType: string,
    inputData: { prompt?: string; file_keys?: string[]; tc_result?: any[] }
  ): string {
    const fwLabel: Record<string, string> = {
      playwright: 'Playwright (TypeScript/JavaScript)',
      cypress: 'Cypress',
      postman: 'Postman Collection v2.1 (JSON format)',
      k6: 'k6 load testing script',
      appium: 'Appium',
      locust: 'Locust (Python)',
      jmeter: 'Apache JMeter (.jmx XML format)',
    };

    let contextSection = '';

    if (inputType === 'prompt' && inputData.prompt) {
      contextSection = `## Feature / Scenario Description:\n${inputData.prompt}`;
    } else if (inputType === 'screenshot') {
      contextSection = `## Input: UI Screenshot provided. Analyze the UI elements, user flows, and interactions visible in the screenshot.`;
      if (inputData.prompt) {
        contextSection += `\n\n## Additional Instructions:\n${inputData.prompt}`;
      }
    } else if (inputType === 'har') {
      contextSection = `## Input: HAR file provided. Analyze the HTTP requests, endpoints, payloads, and responses to generate API test scripts.`;
      if (inputData.prompt) {
        contextSection += `\n\n## Additional Instructions:\n${inputData.prompt}`;
      }
    } else if (inputType === 'tc_result' && inputData.tc_result) {
      const tcJson = JSON.stringify(inputData.tc_result, null, 2);
      contextSection = `## Input: Test Cases from TC Generator (convert these into automation scripts):\n\`\`\`json\n${tcJson}\n\`\`\``;
      if (inputData.prompt) {
        contextSection += `\n\n## Additional Instructions:\n${inputData.prompt}`;
      }
    }

    return `Generate a ${fwLabel[framework] || framework} automation test script in ${language}.

${contextSection}

## Requirements:
1. Cover all major test scenarios from the input (happy paths, edge cases, negative tests).
2. Use proper selectors and locators appropriate for ${framework}.
3. Include setup/teardown (beforeAll, afterAll, beforeEach, afterEach) where needed.
4. Add clear, descriptive test names.
5. Make the script complete and ready to run.

Generate the full script now:`;
  }
}
