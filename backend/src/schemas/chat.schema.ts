import { z } from 'zod';

export const ChatRequestSchema = z.object({
  message: z.string().min(1, 'Message cannot be empty').max(10000, 'Message too long'),
  pnr: z.string().min(1, 'PNR is required').max(20),
  conversationId: z.number().optional(),
});

export type ChatRequest = z.infer<typeof ChatRequestSchema>;

export const ChatResponseSchema = z.object({
  success: z.boolean(),
  data: z.object({
    conversationId: z.number(),
    message: z.string(),
    case: z.object({
      pnr: z.string(),
      status: z.string().optional(),
    }).optional(),
    action: z.object({
      type: z.string(),
      status: z.string(),
    }).optional(),
    sources: z.array(z.string()).optional(),
  }).optional(),
});

export type ChatResponse = z.infer<typeof ChatResponseSchema>;
