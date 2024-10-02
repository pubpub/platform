"use client";

import { useCallback, useTransition } from "react";
import { useQueryState } from "nuqs";

import {
	PATH_AWARE_DIALOG_SEARCH_PARAM,
	pathAwareDialogSearchParamParser,
} from "../server/pathAwareDialogParams";

export const usePathAwareDialogSearchParam = <P extends string | null>({
	id,
}: {
	/**
	 * id used to identify the dialogue
	 */
	id: P;
}) => {
	const [isPending, startTransition] = useTransition();

	const [currentPathAwareDialogSearchParam, setPathAwareDialogSearchParam] = useQueryState(
		PATH_AWARE_DIALOG_SEARCH_PARAM,
		pathAwareDialogSearchParamParser.withOptions({
			startTransition,
		})
	);

	const toggleDialog = useCallback(
		(open?: boolean) => {
			console.log(open);
			// toggle
			if (open === undefined) {
				console.log("here");
				setPathAwareDialogSearchParam(currentPathAwareDialogSearchParam === id ? null : id);
				return;
			}

			// close
			if (!open) {
				setPathAwareDialogSearchParam(null);
				return;
			}

			// open
			setPathAwareDialogSearchParam(id);
		},
		[id, currentPathAwareDialogSearchParam]
	);

	return {
		currentPathAwareDialogSearchParam,
		isOpen: Boolean(id) && currentPathAwareDialogSearchParam === id,
		isPending,
		toggleDialog: toggleDialog as P extends null ? undefined : (open?: boolean) => void,
	};
};
