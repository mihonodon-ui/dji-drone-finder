import { z } from "zod";

export const droneTypeKeys = [
  "hobby",
  "creative",
  "inspection",
  "survey",
  "agri",
  "logi",
  "auto",
  "dev"
] as const;

export type DroneTypeKey = (typeof droneTypeKeys)[number];

export const ScoreRecordSchema = z.record(z.number());

export const QuestionOptionConstraintsSchema = z
  .object({
    maxPrice: z.number().int().optional(),
    minPrice: z.number().int().optional(),
    requiredSensors: z.array(z.string()).optional()
  })
  .partial()
  .optional();

export const QuestionOptionEffectsSchema = z
  .object({
    setMode: z.enum(["light", "pro"]).optional()
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
  targetSegments: z.array(z.enum(["common", "light", "pro"])).optional(),
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
  priceJPY: z.object({
    min: z.number().int(),
    max: z.number().int()
  }),
  bullets: z.array(z.string()).default([]),
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
  "auto",
  "dev"
];
