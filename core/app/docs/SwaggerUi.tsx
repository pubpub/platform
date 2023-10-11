"use client";
import SwaggerUI from "swagger-ui-react";
import "swagger-ui-react/swagger-ui.css";
import { API } from "@stoplight/elements";
import "@stoplight/elements/styles.min.css";

type Props = {
	spec: Record<string, any>;
};

function ReactSwagger({ spec }: Props) {
	return (
		<>
			<API apiDescriptionDocument={spec} />
		</>
	);
}

export default ReactSwagger;
