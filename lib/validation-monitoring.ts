import { z } from "zod";

export const clientLogSchema = z.object({
  level: z.enum(["error", "warn"]),
  message: z.string().min(1).max(5000),
  source: z.enum(["window-error", "unhandled-rejection"]),
  href: z.string().url().optional(),
  stack: z.string().max(20000).optional(),
  userAgent: z.string().max(1000).optional()
});
