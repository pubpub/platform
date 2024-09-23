export const identifyingPubString = ({
	method,
	identifyingString,
}: {
	method: "create" | "update" | "remove";
	identifyingString: string;
}) => `${method}-pub-form-${identifyingString}`;
