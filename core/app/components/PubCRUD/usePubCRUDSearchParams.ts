"use client";

import { useQueryState } from "nuqs";

import { pubCRUDSearchParamsParser } from "./pubCRUDSearchParamsServer";

export const usePubCRUDSearchParams = ({
	method,
	identifyingString,
}: {
	method: "create" | "update" | "remove";
	identifyingString: string;
}) => {
	const [crudSearchParam, setCrudSearchParam] = useQueryState(
		`${method}-pub-form`,
		pubCRUDSearchParamsParser
	);

	return {
		crudSearchParam,
		isOpen: crudSearchParam === identifyingString,
		openCrudForm: () => {
			setCrudSearchParam(identifyingString);
		},
		closeCrudForm: () => {
			setCrudSearchParam(null);
		},
	};
};
