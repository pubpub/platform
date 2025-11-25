import { slugifyString } from "./string"

export const defaultFormName = (pubTypeName: string) => `${pubTypeName} (Default)`
export const defaultFormSlug = (pubTypeName: string) => `${slugifyString(pubTypeName)}-default`
