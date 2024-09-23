"use client";

import { useQueryState } from "nuqs";

import { MODAL_SEARCH_PARAM, modalSearchParamParser } from "../server/modal";

export const useSearchParamModal = ({ identifyingString }: { identifyingString: string }) => {
	const [modalSearchParam, setModalSearchParam] = useQueryState(
		MODAL_SEARCH_PARAM,
		modalSearchParamParser
	);

	return {
		modalSearchParam,
		isOpen: modalSearchParam === identifyingString,
		toggleModal: (open?: boolean) => {
			if (open === undefined) {
				setModalSearchParam(
					modalSearchParam === identifyingString ? null : identifyingString
				);
				return;
			}

			setModalSearchParam(open ? identifyingString : null);
		},
	};
};
