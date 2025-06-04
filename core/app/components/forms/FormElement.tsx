import { logger } from "logger";
import { expect } from "utils";

import type { PubFieldFormElementProps } from "./PubFieldFormElement";
import type { FormElements, InputElement } from "./types";
import { RelatedPubsElement } from "./elements/RelatedPubsElement";
import { FormElementToggle } from "./FormElementToggle";
import { PubFieldFormElement } from "./PubFieldFormElement";
import { isButtonElement, isStructuralElement } from "./types";

export type FormElementProps = Omit<PubFieldFormElementProps, "element"> & {
	element: FormElements;
};

const MaybeWithToggle = ({
	element,
	children,
}: {
	element: InputElement;
	children: React.ReactNode;
}) => {
	if (element.required) {
		return children;
	}
	return <FormElementToggle {...element}>{children}</FormElementToggle>;
};

export const FormElement = ({ pubId, element, values }: FormElementProps) => {
	if (isStructuralElement(element)) {
		return (
			<div
				className="prose"
				// TODO: sanitize content
				dangerouslySetInnerHTML={{ __html: expect(element.content) }}
			/>
		);
	}

	if (isButtonElement(element)) {
		return null;
	}

	if (element.isRelation && "relationshipConfig" in element.config) {
		return (
			<MaybeWithToggle element={element}>
				<RelatedPubsElement
					{...element}
					valueComponentProps={{
						pubId,
						element,
						values,
					}}
					normalFieldElement={
						<PubFieldFormElement pubId={pubId} values={values} {...element} />
					}
				/>
			</MaybeWithToggle>
		);
	}

	return (
		<MaybeWithToggle element={element}>
			<PubFieldFormElement pubId={pubId} element={element} values={values} />
		</MaybeWithToggle>
	);
};
