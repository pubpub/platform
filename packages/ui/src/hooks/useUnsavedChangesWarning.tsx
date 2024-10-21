"use client";

import * as React from "react";

export const useUnsavedChangesWarning = (enabled = true) => {
	React.useEffect(() => {
		const handleBeforeUnload = (event: BeforeUnloadEvent) => {
			if (enabled) {
				// The preventDefault call is necessary to trigger the browser's
				// confirmation dialog.
				event.preventDefault();
			}
		};
		window.addEventListener("beforeunload", handleBeforeUnload);
		return () => {
			window.removeEventListener("beforeunload", handleBeforeUnload);
		};
	}, [enabled]);
};
