import { z } from "zod";

import { databaseTableNames } from "db/table-names";

const PostgresError = z.object({
	code: z.string(),
	detail: z.string().optional(),
	table: z.enum(databaseTableNames).optional(),
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

export const isForeignKeyConstraintError = (
	error: unknown
): error is PostgresError & { code: "23503" } => isPostgresError(error) && error.code === "23503";

const postgresForeignKeyConstraintErrorRegex =
	/Key \(([^)]+)\)=\(([^)]+)\) is not present in table "([^"]+)"/;

export const parseForeignKeyConstraintError = (error: PostgresError & { code: "23503" }) => {
	const { table, constraint, detail } = error;

	const key = detail?.match(postgresForeignKeyConstraintErrorRegex);

	if (!key) {
		return null;
	}

	return {
		...error,
		foreignKey: {
			key: key[1],
			value: key[2],
			table: key[3],
		},
	};
};
