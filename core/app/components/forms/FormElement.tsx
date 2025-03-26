import { ElementType } from "db/public";
import { logger } from "logger";
import { expect } from "utils";

import type { PubFieldFormElementProps } from "./PubFieldFormElement";
import type { FormElements } from "./types";
import { getLoginData } from "~/lib/authentication/loginData";
import { findCommunityBySlug } from "~/lib/server/community";
import { RelatedPubsElement } from "./elements/RelatedPubsElement";
import { FormElementToggle } from "./FormElementToggle";
import { PubFieldFormElement } from "./PubFieldFormElement";

export type FormElementProps = Omit<PubFieldFormElementProps, "element"> & {
	element: FormElements;
	searchParams: Record<string, string | string[] | undefined>;
};

export const FormElement = async ({ pubId, element, values, searchParams }: FormElementProps) => {
	const [{ user }, community] = await Promise.all([getLoginData(), findCommunityBySlug()]);
	if (!user || !community) {
		return null;
	}
	if (!element.slug) {
		if (element.type === ElementType.structural) {
			return (
				<div
					className="prose"
					// TODO: sanitize content
					dangerouslySetInnerHTML={{ __html: expect(element.content) }}
				/>
			);
		}
		return null;
	}

	if (!element.schemaName) {
		return null;
	}

	const configLabel =
		"relationshipConfig" in element.config
			? element.config.relationshipConfig.label
			: element.config.label;

	const basicProps = {
		label: configLabel || element.label || element.slug,
		slug: element.slug,
	};

	let input = (
		<PubFieldFormElement pubId={pubId} element={element} values={values} {...basicProps} />
	);

	if (element.isRelation && "relationshipConfig" in element.config) {
		input = (
			<RelatedPubsElement
				{...basicProps}
				config={element.config}
				schemaName={element.schemaName}
				valueComponentProps={{
					pubId,
					element,
					values,
				}}
			/>
		);
	}

	if (input) {
		return element.required ? (
			input
		) : (
			<FormElementToggle {...element} {...basicProps}>
				{input}
			</FormElementToggle>
		);
	}

	logger.error({
		msg: `Encountered unknown component when rendering form element`,
		component: element.component,
		element,
		pubId,
	});
	return null;
};
