// @generated
// This file is automatically generated by Kanel. Do not modify manually.

import { z } from "zod";

/** Represents the enum public.CrudType */
export enum CrudType {
	create = "create",
	update = "update",
	"delete" = "delete",
}

/** Zod schema for CrudType */
export const crudTypeSchema = z.nativeEnum(CrudType);