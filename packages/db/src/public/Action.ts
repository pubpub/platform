// @generated
// This file is automatically generated by Kanel. Do not modify manually.

import { z } from "zod";

/** Represents the enum public.Action */
export enum Action {
	log = "log",
	pdf = "pdf",
	email = "email",
	pushToV6 = "pushToV6",
	http = "http",
	move = "move",
	googleDriveImport = "googleDriveImport",
	datacite = "datacite",
}

/** Zod schema for Action */
export const actionSchema = z.nativeEnum(Action);
