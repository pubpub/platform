"use client";

// @ts-expect-error No types for stoplight
import { API } from "@stoplight/elements";

import "@stoplight/elements/styles.min.css";

type Props = {
	spec: Record<string, any>;
};

function DocumentationUI({ spec }: Props) {
	return <API apiDescriptionDocument={spec} />;
}

export default DocumentationUI;
