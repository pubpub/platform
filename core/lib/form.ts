import { slugifyString } from "./string"

export const defaultFormName = (pubTypeName: string) => `${pubTypeName} Editor (Default)`
export const defaultFormSlug = (pubTypeName: string) =>
	`${slugifyString(pubTypeName)}-default-editor`
