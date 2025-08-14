import type { FormsId } from "db/public";

type FormWithSlugAndDefault = {
	id: FormsId;
	name: string;
	slug: string;
	isDefault: boolean;
};

export function resolveFormAccess(config: {
	availableForms: FormWithSlugAndDefault[];
	requestedFormSlug: string | undefined;
	communitySlug: string;
}):
	| {
			hasAccessToAnyForm: false;
			hasAccessToCurrentForm?: never;
			defaultForm?: never;
			canonicalForm?: never;
	  }
	| {
			hasAccessToAnyForm: true;
			hasAccessToCurrentForm: boolean;
			defaultForm: FormWithSlugAndDefault | undefined;
			canonicalForm: FormWithSlugAndDefault;
	  } {
	const hasAccessToAnyForm = config.availableForms.length > 0;

	if (!hasAccessToAnyForm) {
		return {
			hasAccessToAnyForm: false,
			hasAccessToCurrentForm: undefined,
			defaultForm: undefined,
			canonicalForm: undefined,
		};
	}

	const currentAvailableForm = config.availableForms.find(
		(form) =>
			form.slug === config.requestedFormSlug || (form.isDefault && !config.requestedFormSlug)
	);

	const defaultForm = config.availableForms.find((form) => form.isDefault);

	if (!currentAvailableForm) {
		const firstAvailableForm = defaultForm || config.availableForms[0];
		return {
			hasAccessToAnyForm: true,
			hasAccessToCurrentForm: false,
			defaultForm,
			canonicalForm: firstAvailableForm,
		};
	}

	return {
		hasAccessToAnyForm: true,
		hasAccessToCurrentForm: true,
		defaultForm,
		canonicalForm: currentAvailableForm,
	};
}
