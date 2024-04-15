import Ajv from "ajv";

export const validatePubValues = ({
	fields,
	values,
}: {
	fields: { slug: string; schema: Record<string, unknown> }[];
	values: Record<string, unknown>;
}) => {
	const validator = new Ajv();

	return fields.reduce(
		(acc, field) => {
			if (acc.error) {
				return acc;
			}

			const value = values[field.slug];

			if (!value) {
				return { error: `Field ${field.slug} not found in pub values` };
			}

			try {
				const val = validator.validate(field.schema, value);
				return { ...acc, [field.slug]: val };
			} catch (e) {
				return { error: `Field ${field.slug} failed schema validation` };
			}
		},
		{} as { error: string } | Record<string, unknown>
	);
};
