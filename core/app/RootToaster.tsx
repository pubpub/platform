"use client";

import { useEffect } from "react";
import { CircleCheck } from "lucide-react";
import { parseAsBoolean, useQueryStates } from "nuqs";

import type { Toast } from "ui/use-toast";
import { Toaster } from "ui/toaster";
import { toast } from "ui/use-toast";

import { entries, fromEntries, keys } from "~/lib/mapping";

const PERSISTED_TOAST = {
	verified: {
		title: "Verified",
		description: (
			<span className="flex items-center gap-1">
				<CircleCheck size="16" /> Your email is now verified
			</span>
		),
		variant: "success",
	},
} as const satisfies { [key: string]: Toast };

const usePersistedToasts = () => {
	const toastQueries = fromEntries(
		keys(PERSISTED_TOAST).map((key) => [key, parseAsBoolean.withDefault(false)])
	);

	const [params, setParams] = useQueryStates(toastQueries, {
		history: "replace",
		scroll: false,
	});
	const activeToasts = entries(params)
		.filter(([param, active]) => active)
		.map(([param]) => param);

	useEffect(() => {
		for (const activeToastKey of activeToasts) {
			const toastData = PERSISTED_TOAST[activeToastKey];
			toast(toastData);
			setParams({
				[activeToastKey]: null,
			});
		}
	}, [activeToasts]);
};

export const RootToaster = () => {
	usePersistedToasts();

	return <Toaster />;
};
