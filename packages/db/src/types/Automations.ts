import type { AutomationEvent } from "../public";

export type AutomationConfig = Partial<Record<AutomationEvent, Record<string, unknown>>>;
