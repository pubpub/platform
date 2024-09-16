import { z } from "zod";

const PostgresError = z.object({
	code: z.string(),
	detail: z.string(),
	table: z.string(),
	schema: z.string(),
	constraint: z.string().optional(),
});
type PostgresError = z.infer<typeof PostgresError>;

export const isPostgresError = (error: unknown): error is PostgresError =>
	PostgresError.safeParse(error).success;

export const isUniqueConstraintError = (
	error: unknown
): error is PostgresError & { code: "23505" } => isPostgresError(error) && error.code === "23505";

export const isCheckContraintError = (error: unknown): error is PostgresError & { code: "23514" } =>
	isPostgresError(error) && error.code === "23514";
