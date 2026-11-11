/**
 * Strict Schema Validation & Sanitization Layer for GOKS Chart.
 * Pydantic-equivalent Zod Layer providing strict validation, coercion,
 * boundary checks, and sanitization for all incoming JSON.
 */

import { z } from "zod";

const SYMBOL_PATTERN = /^(?:\^[A-Z0-9.]{1,15}|[A-Z0-9&-]{1,20}(?:\.(?:NS|BO))?)$/;

export const StrictSymbolSchema = z
  .string()
  .trim()
  .transform((val) => val.toUpperCase())
  .refine((val) => SYMBOL_PATTERN.test(val), {
    message: "Invalid ticker/symbol format. Must be a valid NSE, BSE, or index code.",
  });

export const StrictLotSchema = z
  .object({
    id: z.string().min(1),
    symbol: StrictSymbolSchema,
    qty: z.number().positive("Quantity must be strictly positive"),
    cost: z.number().positive("Cost basis must be strictly positive"),
    date: z.string().min(8).max(10),
  })
  .strict();

export type ValidatedLot = z.infer<typeof StrictLotSchema>;

export const StrictDividendSchema = z
  .object({
    id: z.string().min(1),
    symbol: StrictSymbolSchema,
    amount: z.number().positive("Dividend amount must be positive"),
    date: z.string().min(8).max(10),
  })
  .strict();

export const StrictPaperFillSchema = z
  .object({
    id: z.string().min(1),
    symbol: StrictSymbolSchema,
    side: z.enum(["BUY", "SELL"]),
    qty: z.number().positive("Quantity must be strictly positive"),
    price: z.number().positive("Price must be strictly positive"),
    ts: z.number().int().positive(),
  })
  .strict();

export const StrictAlertRuleSchema = z
  .object({
    id: z.string().min(1),
    symbol: StrictSymbolSchema,
    field: z.enum(["price", "changePct", "rsi", "master"]),
    op: z.enum([">=", "<="]),
    value: z.number().refine((n) => Number.isFinite(n), "Value must be a finite number"),
  })
  .strict();

export const StrictWatchSchema = z
  .object({
    id: z.string().min(1),
    name: z.string().min(1).max(100),
    symbols: z.array(z.string().trim().transform((s) => s.toUpperCase())),
  })
  .strict();

export const StrictSettingsSchema = z
  .object({
    rf: z.number().finite().default(0.065),
    brokeragePct: z.number().finite().default(0.03),
    slippagePct: z.number().finite().default(0.05),
    sellChargePct: z.number().finite().default(0.10),
    breadthMin: z.number().finite().default(0.55),
    above200Min: z.number().finite().default(0.50),
    maxWeight: z.number().finite().default(0.20),
  })
  .strict();

export type ValidatedSettings = z.infer<typeof StrictSettingsSchema>;

export const StrictChartMetaSchema = z
  .object({
    symbol: z.string().trim().transform((s) => s.toUpperCase()),
    currency: z.string().optional(),
    regularMarketPrice: z.number().optional().nullable(),
    regularMarketChangePercent: z.number().optional().nullable(),
    fiftyTwoWeekHigh: z.number().optional().nullable(),
    fiftyTwoWeekLow: z.number().optional().nullable(),
    validRanges: z.array(z.string()).optional(),
  })
  .passthrough();

export const StrictChartIndicatorsSchema = z
  .object({
    quote: z.array(
      z
        .object({
          open: z.array(z.number().nullable().optional()).default([]),
          high: z.array(z.number().nullable().optional()).default([]),
          low: z.array(z.number().nullable().optional()).default([]),
          close: z.array(z.number().nullable().optional()).default([]),
          volume: z.array(z.number().nullable().optional()).default([]),
        })
        .passthrough()
    ),
  })
  .passthrough();

export const StrictChartResultSchema = z
  .object({
    meta: StrictChartMetaSchema.optional(),
    timestamp: z.array(z.number().int()).default([]),
    indicators: StrictChartIndicatorsSchema.optional(),
  })
  .passthrough();

export const StrictChartBodySchema = z
  .object({
    chart: z.object({
      result: z.array(StrictChartResultSchema).optional().nullable(),
      error: z
        .object({
          code: z.string().optional().nullable(),
          description: z.string().optional().nullable(),
        })
        .optional()
        .nullable(),
    }),
  })
  .passthrough();

/**
 * Validates and strictly sanitizes an incoming desktop backup.
 * Enforces strict types and rejects malformed fields.
 */
export function sanitizeBackupPayload(text: string): { success: true; patch: Record<string, any> } | { success: false; error: string } {
  let parsed: any;
  try {
    parsed = JSON.parse(text);
  } catch {
    return { success: false, error: "That file is not valid JSON." };
  }

  if (!parsed || parsed.app !== "goks-chart" || !parsed.desk || typeof parsed.desk !== "object") {
    return { success: false, error: "That is not a Goks Chart backup file." };
  }

  const desk = parsed.desk;
  const patch: Record<string, any> = {};

  const arrayFields = ["lots", "dividends", "alerts", "watches", "paper", "screens"] as const;
  for (const field of arrayFields) {
    if (desk[field] === undefined) continue;
    if (!Array.isArray(desk[field])) {
      return { success: false, error: `Backup field "${field}" has the wrong shape.` };
    }
    // Deep validate lots if present
    if (field === "lots") {
      const sanitizedLots = [];
      for (const item of desk.lots) {
        const lotRes = StrictLotSchema.safeParse(item);
        if (!lotRes.success) {
          return { success: false, error: `Backup field "lots" has the wrong shape.` };
        }
        sanitizedLots.push(lotRes.data);
      }
      patch.lots = sanitizedLots;
    } else {
      patch[field] = desk[field];
    }
  }

  const cashFields = ["portfolioCash", "paperCash"] as const;
  for (const field of cashFields) {
    if (desk[field] === undefined) continue;
    if (typeof desk[field] !== "number" || !Number.isFinite(desk[field])) {
      return { success: false, error: `Backup field "${field}" has the wrong shape.` };
    }
    patch[field] = desk[field];
  }

  if (desk.symbol !== undefined) {
    if (typeof desk.symbol !== "string") {
      return { success: false, error: 'Backup field "symbol" has the wrong shape.' };
    }
    patch.symbol = desk.symbol.trim().toUpperCase();
  }

  if (desk.assumptions !== undefined) {
    if (!desk.assumptions || typeof desk.assumptions !== "object" || Array.isArray(desk.assumptions)) {
      return { success: false, error: 'Backup field "assumptions" has the wrong shape.' };
    }
    patch.assumptions = desk.assumptions;
  }

  if (desk.settings !== undefined) {
    const incoming = desk.settings;
    if (!incoming || typeof incoming !== "object" || Array.isArray(incoming)) {
      return { success: false, error: 'Backup field "settings" has the wrong shape.' };
    }
    for (const key of Object.keys(incoming)) {
      const val = incoming[key];
      if (val !== undefined && (typeof val !== "number" || !Number.isFinite(val))) {
        return { success: false, error: 'Backup field "settings" has the wrong shape.' };
      }
    }
    patch.settings = incoming;
  }

  if (!Object.keys(patch).length) {
    return { success: false, error: "That backup holds nothing this desk can restore." };
  }

  return { success: true, patch };
}

/**
 * Validates an incoming portfolio lot.
 */
export function validateAndSanitizeLot(raw: unknown): { success: true; data: ValidatedLot } | { success: false; error: string } {
  const result = StrictLotSchema.safeParse(raw);
  if (!result.success) {
    const issue = result.error.issues[0];
    return { success: false, error: `${issue.path.join(".")}: ${issue.message}` };
  }
  return { success: true, data: result.data };
}

/**
 * Validates incoming market chart JSON.
 */
export function validateAndSanitizeChart(raw: unknown): boolean {
  return StrictChartBodySchema.safeParse(raw).success;
}
