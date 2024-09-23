"use client";

import { useCallback } from "react";
import { useQueryState } from "nuqs";

import { MODAL_SEARCH_PARAM, modalSearchParamParser } from "../server/modal";

export const useSearchParamModal = <P extends string | null>({
	modalSearchParameter,
}: {
	modalSearchParameter: P;
}) => {
	const [currentModalSearchParam, setModalSearchParam] = useQueryState(
		MODAL_SEARCH_PARAM,
		modalSearchParamParser
	);

	const toggleModal = useCallback(
		(open?: boolean) => {
			if (open === undefined) {
				setModalSearchParam(
					currentModalSearchParam === modalSearchParameter ? null : modalSearchParameter
				);
				return;
			}

			setModalSearchParam(open ? modalSearchParameter : null);
		},
		[modalSearchParameter, currentModalSearchParam]
	);

	return {
		currentModalSearchParam,
		isOpen: Boolean(modalSearchParameter) && currentModalSearchParam === modalSearchParameter,
		toggleModal: toggleModal as P extends null ? undefined : (open?: boolean) => void,
	};
};
