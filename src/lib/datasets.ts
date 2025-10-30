import step1Raw from "@/data/questions.step1.json";
import step2Raw from "@/data/questions.step2.json";
import dynamicRaw from "@/data/questions.dynamic.json";
import catalogRaw from "@/data/catalog.models.json";
import resultTemplatesRaw from "@/data/result.templates.json";
import {
  CatalogSchema,
  QuestionSetSchema,
  ResultTemplateSetSchema,
  type Catalog,
  type QuestionSet,
  type ResultTemplateSet,
  type DroneTypeKey
} from "./types";

export const step1QuestionSet: QuestionSet = QuestionSetSchema.parse(step1Raw);
export const step2QuestionSet: QuestionSet = QuestionSetSchema.parse(step2Raw);
export const dynamicQuestionSet: QuestionSet = QuestionSetSchema.parse(dynamicRaw);
export const catalog: Catalog = CatalogSchema.parse(catalogRaw);
export const resultTemplates: ResultTemplateSet =
  ResultTemplateSetSchema.parse(resultTemplatesRaw);

export function resolveTypeDetail(type: DroneTypeKey) {
  return catalog.types[type];
}

export function resolvePrimaryModel(type: DroneTypeKey) {
  const typeDetail = resolveTypeDetail(type);
  if (!typeDetail) return undefined;
  return catalog.models.find((model) => model.id === typeDetail.primaryModelId);
}

export function resolveAlternativeModels(type: DroneTypeKey) {
  const typeDetail = resolveTypeDetail(type);
  if (!typeDetail) return [];

  return catalog.models.filter((model) => typeDetail.alts.includes(model.id));
}

export function resolveResultTemplate(type: DroneTypeKey) {
  return resultTemplates.templates[type];
}
