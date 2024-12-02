export const pubEditMethods = ["create", "update", "remove"] as const;
export type PubEditorMethod = (typeof pubEditMethods)[number];
