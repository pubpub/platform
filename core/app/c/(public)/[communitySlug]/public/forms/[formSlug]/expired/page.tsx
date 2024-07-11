import React from "react";

import { Button } from "ui/button";
import { Mail } from "ui/icon";

export default async function Page() {
	return (
		<div className="mx-auto mt-32 flex max-w-md flex-col items-center justify-center text-center">
			<h2 className="mb-2 text-lg font-semibold">Link Expired</h2>
			<p className="mb-6 text-sm">
				The link for this form has expired. Request a new one via email below to pick up
				right where you left off.
			</p>
			<Button
				variant="secondary"
				className="bg-blue-500 text-slate-50 shadow-sm hover:bg-blue-500/90 dark:bg-blue-900 dark:text-slate-50 dark:hover:bg-blue-900/90"
			>
				<Mail size={16} className="mr-1" strokeWidth={1} /> Request New Link
			</Button>
		</div>
	);
}
