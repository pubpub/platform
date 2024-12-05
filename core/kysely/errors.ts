import { z } from "zod";

import { databaseTableNames } from "db/table-names";

const PostgresError = z.object({
	code: z.string(),
	detail: z.string(),
	table: z.enum(databaseTableNames),
	schema: z.string(),
	constraint: z.string().optional(),
});
export type PostgresError = z.infer<typeof PostgresError>;

export const isPostgresError = (error: unknown): error is PostgresError =>
	PostgresError.safeParse(error).success;

export const isUniqueConstraintError = (
	error: unknown
): error is PostgresError & { code: "23505" } => {
	return isPostgresError(error) && error.code === "23505";
};

export const isCheckContraintError = (error: unknown): error is PostgresError & { code: "23514" } =>
	isPostgresError(error) && error.code === "23514";
