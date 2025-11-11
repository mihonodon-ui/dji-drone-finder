import { z } from "zod";

export const droneTypeKeys = [
  "hobby",
  "creative",
  "inspection",
  "survey",
  "agri",
  "logi",
  "disaster",
  "auto",
  "dev"
] as const;

export type DroneTypeKey = (typeof droneTypeKeys)[number];

export const ScoreRecordSchema = z.record(z.number());

export const QuestionOptionConstraintsSchema = z
  .object({
    maxPrice: z.number().int().optional(),
    minPrice: z.number().int().optional(),
    requiredSensors: z.array(z.string()).optional(),
    preferredWeight: z.enum(["under100", "over100"]).optional()
  })
  .partial()
  .optional();

export const QuestionOptionEffectsSchema = z
  .object({
    setMode: z.enum(["light", "pro"]).optional(),
    addDetailSegments: z.array(z.string()).optional(),
    removeDetailSegments: z.array(z.string()).optional(),
    setDetailSegments: z.array(z.string()).optional(),
    clearPreferredWeight: z.boolean().optional(),
    addPreferredModels: z.array(z.string()).optional(),
    setPreferredModels: z.array(z.string()).optional(),
    clearPreferredModels: z.boolean().optional(),
    forceComplete: z.boolean().optional(),
    appendResultSummary: z.string().optional(),
    setResultSummary: z.string().optional(),
    clearResultSummary: z.boolean().optional()
  })
  .partial()
  .optional();

export const QuestionOptionSchema = z.object({
  key: z.string().min(1),
  label: z.string().min(1),
  scores: ScoreRecordSchema,
  constraints: QuestionOptionConstraintsSchema,
  effects: QuestionOptionEffectsSchema
});

export const QuestionSchema = z.object({
  id: z.string().min(1),
  text: z.string().min(1),
  weight: z.number().int().min(1).default(1),
  category: z.string().optional(),
  difficulty: z.enum(["basic", "advanced", "expert"]).optional(),
  targetSegments: z
    .array(
      z.enum([
        "common",
        "light",
        "pro",
        "detail_creative",
        "detail_agri",
        "detail_micro",
        "detail_hobby",
        "detail_hobby_travel",
        "detail_hobby_travel_light",
        "detail_hobby_travel_dual",
        "detail_hobby_travel_safety",
        "detail_hobby_vlog",
        "detail_hobby_vlog_skin",
        "detail_hobby_vlog_light",
        "detail_hobby_vlog_follow",
        "detail_hobby_micro",
        "detail_hobby_fpv"
      ])
    )
    .optional(),
  strategyTags: z.array(z.string()).optional(),
  options: z.array(QuestionOptionSchema).min(2)
});

export const QuestionSetSchema = z.object({
  version: z.string(),
  locale: z.string().optional(),
  title: z.string(),
  questions: z.array(QuestionSchema).min(1)
});

export type QuestionOption = z.infer<typeof QuestionOptionSchema>;
export type Question = z.infer<typeof QuestionSchema>;
export type QuestionSet = z.infer<typeof QuestionSetSchema>;
export type QuestionOptionConstraints = z.infer<
  NonNullable<typeof QuestionOptionConstraintsSchema>
>;
export type QuestionOptionEffects = z.infer<
  NonNullable<typeof QuestionOptionEffectsSchema>
>;

export const CatalogTypeSchema = z.object({
  label: z.string(),
  primaryModelId: z.string(),
  alts: z.array(z.string()).default([]),
  summary: z.string().optional()
});

export const CatalogModelSchema = z.object({
  id: z.string(),
  name: z.string(),
  typeTags: z.array(z.string()).default([]),
  kind: z.enum(["aircraft", "payload"]).default("aircraft"),
  tier: z.enum(["premium", "standard", "entry", "fpv", "micro"]).optional(),
  priceJPY: z.object({
    min: z.number().int(),
    max: z.number().int()
  }),
  bullets: z.array(z.string()).default([]),
  strengths: z.array(z.string()).default([]),
  sensorHighlights: z.array(z.string()).default([]),
  bestFor: z.array(z.string()).default([]),
  weightCategory: z.enum(["under100", "under250", "over250"]).optional(),
  priceCategory: z.enum(["entry", "mid", "premium"]).optional(),
  specs: z.record(z.string()).optional(),
  notes: z.string().optional(),
  status: z.string().optional(),
  images: z.array(z.string()).default([]),
  links: z
    .object({
      learn: z.string().optional(),
      consult: z.string().optional(),
      demo: z.string().optional()
    })
    .default({})
});

export const CatalogSchema = z.object({
  version: z.string(),
  currency: z.string(),
  types: z.record(CatalogTypeSchema),
  models: z.array(CatalogModelSchema)
});

export type Catalog = z.infer<typeof CatalogSchema>;
export type CatalogModel = z.infer<typeof CatalogModelSchema>;
export type CatalogType = z.infer<typeof CatalogTypeSchema>;

export const ResultTemplateSchema = z.object({
  title: z.string(),
  mainMessage: z.string(),
  priceNote: z.string().optional(),
  tips: z.array(z.string()).default([]),
  cta: z
    .object({
      label: z.string(),
      href: z.string()
    })
    .optional(),
  secondaryCta: z
    .object({
      label: z.string(),
      href: z.string()
    })
    .optional()
});

export const ResultTemplateSetSchema = z.object({
  version: z.string(),
  locale: z.string().optional(),
  templates: z.record(ResultTemplateSchema)
});

export type ResultTemplateSet = z.infer<typeof ResultTemplateSetSchema>;
export type ResultTemplate = z.infer<typeof ResultTemplateSchema>;

export type AnswerMap = Record<string, string>;

export const defaultTypePriority: DroneTypeKey[] = [
  "hobby",
  "creative",
  "inspection",
  "survey",
  "agri",
  "logi",
  "disaster",
  "auto",
  "dev"
];
