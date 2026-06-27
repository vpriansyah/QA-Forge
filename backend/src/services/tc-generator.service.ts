// ═══════════════════════════════════════════════════════════
// QA Forge — Test Case Generator Service
// Handles TC generation via AI and Excel export
// ═══════════════════════════════════════════════════════════

import { prisma } from '../config/database';
import { ai, AI_MODEL } from '../config/gemini';
import { logger } from '../config/logger';
import { minioClient } from '../config/minio';
import config from '../config';
import ExcelJS from 'exceljs';

interface ColumnDef {
  key: string;
  label: string;
  description?: string;
}

export class TcGeneratorService {
  /**
   * Generate test cases from input using AI
   */
  async generate(
    userId: string,
    title: string,
    columns: ColumnDef[],
    inputType: string,
    inputData: { prompt?: string; file_keys?: string[] }
  ) {
    // Create the generation record
    const generation = await prisma.tcGeneration.create({
      data: {
        user_id: userId,
        title,
        columns: columns as any,
        input_type: inputType,
        input_data: inputData as any,
        status: 'processing',
      },
    });

    try {
      const promptText = this.buildPrompt(columns, inputType, inputData);
      const contents: any[] = [{ text: promptText }];

      if (inputData.file_keys && inputData.file_keys.length > 0) {
        for (const key of inputData.file_keys) {
          try {
            const stream = await minioClient.getObject(config.MINIO_BUCKET_UPLOADS, key);
            const chunks: Buffer[] = [];
            for await (const chunk of stream) {
              chunks.push(chunk as Buffer);
            }
            const buffer = Buffer.concat(chunks);
            const ext = key.split('.').pop()?.toLowerCase();
            
            if (ext === 'har' || ext === 'json') {
               contents.push({ text: `\n\n--- Isi File ${key} ---\n${buffer.toString('utf8')}` });
               continue;
            }
            
            let mimeType = 'application/octet-stream';
            if (ext === 'png') mimeType = 'image/png';
            else if (ext === 'jpg' || ext === 'jpeg') mimeType = 'image/jpeg';
            else if (ext === 'webp') mimeType = 'image/webp';
            
            contents.push({
              inlineData: {
                data: buffer.toString('base64'),
                mimeType,
              }
            });
          } catch (err) {
            logger.warn({ error: err, key }, 'Failed to load file for AI prompt');
          }
        }
      }

      logger.info({ generationId: generation.id, inputType }, 'Generating test cases with streaming');

      const responseStream = await ai.models.generateContentStream({
        model: AI_MODEL,
        contents,
        config: {
          systemInstruction: this.getSystemPrompt(),
          temperature: 0.3,
          maxOutputTokens: 8192,
          responseMimeType: 'application/json',
        },
      });

      // We return the stream and the generation ID instead of waiting for completion.
      // The controller will consume the stream and update the DB once complete.
      return {
        generation,
        stream: responseStream
      };

      // Update with results
      // Code below is removed as it will be handled by the controller via streaming

    } catch (error) {
      logger.error({ error, generationId: generation.id }, 'TC generation failed');

      await prisma.tcGeneration.update({
        where: { id: generation.id },
        data: { status: 'failed' },
      });

      throw error;
    }
  }

  /**
   * Get generation history for a user
   */
  async getHistory(userId: string) {
    return prisma.tcGeneration.findMany({
      where: { user_id: userId },
      orderBy: { created_at: 'desc' },
      select: {
        id: true,
        title: true,
        input_type: true,
        status: true,
        columns: true,
        created_at: true,
      },
    });
  }

  /**
   * Get a specific generation by ID
   */
  async getById(generationId: string, userId: string) {
    return prisma.tcGeneration.findFirst({
      where: { id: generationId, user_id: userId },
    });
  }

  /**
   * Delete a specific generation by ID
   */
  async deleteHistory(generationId: string, userId: string) {
    // Check if exists and belongs to user
    const exists = await prisma.tcGeneration.findFirst({
      where: { id: generationId, user_id: userId },
    });
    
    if (!exists) {
      throw new Error('Generation not found');
    }

    return prisma.tcGeneration.delete({
      where: { id: generationId },
    });
  }

  /**
   * Export test cases to Excel
   */
  async exportExcel(generationId: string, userId: string): Promise<Buffer> {
    const generation = await this.getById(generationId, userId);
    if (!generation) throw new Error('Generation not found');
    if (!generation.result) throw new Error('No results to export');

    const columns = generation.columns as unknown as ColumnDef[];
    const rows = generation.result as Record<string, string>[];

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'QA Forge';
    workbook.created = new Date();

    const sheet = workbook.addWorksheet('Test Cases');

    // Header style
    sheet.columns = columns.map((col) => ({
      header: col.label,
      key: col.key,
      width: col.key === 'steps' || col.key === 'expected_result' ? 45 : 25,
    }));

    // Style headers
    const headerRow = sheet.getRow(1);
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4F46E5' }, // indigo-600
    };
    headerRow.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
    headerRow.height = 30;

    // Add data rows
    rows.forEach((row, index) => {
      const dataRow = sheet.addRow(row);
      dataRow.alignment = { vertical: 'top', wrapText: true };

      // Alternating row colors
      if (index % 2 === 0) {
        dataRow.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFF8FAFC' }, // slate-50
        };
      }
    });

    // Add border to all cells
    sheet.eachRow((row: any) => {
      row.eachCell((cell: any) => {
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          right: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        };
      });
    });

    // Auto-filter
    sheet.autoFilter = {
      from: { row: 1, column: 1 },
      to: { row: rows.length + 1, column: columns.length },
    };

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }

  /**
   * Build AI prompt based on columns and input
   */
  private buildPrompt(columns: ColumnDef[], inputType: string, inputData: { prompt?: string; file_keys?: string[] }): string {
    const columnDefs = columns.map((c) => `- "${c.key}" (${c.label}): ${c.description || c.label}`).join('\n');

    let contextSection = '';
    if (inputType === 'prompt') {
      contextSection = `## Feature Description:\n${inputData.prompt || 'No description provided.'}`;
    } else if (inputType === 'har') {
      contextSection = `## Input: HAR File uploaded. Analyze the endpoints and flows.\n`;
      if (inputData.prompt) {
        contextSection += `## Additional Instructions:\n${inputData.prompt}`;
      }
    } else if (inputType === 'screenshot') {
      contextSection = `## Input: UI Screenshot uploaded. Analyze the elements and flow.\n`;
      if (inputData.prompt) {
        contextSection += `## Additional Instructions:\n${inputData.prompt}`;
      }
    }

    return `Generate test cases based on the following information.

## Requested Columns:
${columnDefs}

${contextSection}

## Instructions:
1. Generate 8-15 comprehensive test cases.
2. Include happy paths, edge cases, and negative tests.
3. Return the result strictly as a JSON array.
4. Each item must contain all the requested column keys.
5. Fill each column with detailed and actionable content.

## CRITICAL LANGUAGE RULE:
1. Read the Context / Feature Description carefully.
2. If the context contains ANY instruction like "gunakan bahasa inggris", "in english", "english", or similar, YOU MUST WRITE ALL TEST CASE CONTENT IN ENGLISH.
3. If the context explicitly asks for Indonesian, or if there is NO language instruction at all, use BAHASA INDONESIA.

Return ONLY a JSON array, example format:
[
  { ${columns.map((c) => `"${c.key}": "..."`).join(', ')} },
  ...
]`;
  }

  /**
   * System prompt for TC generation
   */
  private getSystemPrompt(): string {
    return `You are an expert QA Engineer.
Your task is to generate test cases in a valid JSON array format.
Make sure the test cases cover: happy paths, edge cases, and negative testing.

[CRITICAL INSTRUCTION]
Pay very close attention to the user's language request.
If the user asks to "gunakan bahasa inggris" or "use english", YOU MUST OUTPUT EVERYTHING IN ENGLISH. 
If no specific language is requested, default to Bahasa Indonesia. DO NOT mix languages in the output.`;
  }
}
