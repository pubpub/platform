export const pubCRUDMethods = ["create", "update", "remove"] as const;
export type PubCRUDMethod = (typeof pubCRUDMethods)[number];
