"use client";

import { useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { Button } from "ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "ui/select";

import type { SimpleForm } from "~/lib/server/form";

export const formSwitcherUrlParam = "form";

export const FormSwitcher = ({
	forms,
	defaultFormSlug,
}: {
	forms: SimpleForm[];
	defaultFormSlug?: string;
}) => {
	const router = useRouter();
	const pathname = usePathname();
	const params = useSearchParams();

	const [selectedFormSlug, setSelectedFormSlug] = useState(defaultFormSlug ?? forms[0].slug);
	if (!forms.length) {
		return null;
	}

	const switchForms = () => {
		if (!selectedFormSlug) {
			return;
		}
		const newParams = new URLSearchParams(params);
		newParams.set(formSwitcherUrlParam, selectedFormSlug);
		router.push(`${pathname}?${newParams.toString()}`);
	};

	return (
		<div className="flex items-center gap-2">
			<Select
				onValueChange={(slug: string) => {
					setSelectedFormSlug(slug);
				}}
				defaultValue={selectedFormSlug}
			>
				<SelectTrigger className="">
					<SelectValue />
				</SelectTrigger>
				<SelectContent>
					{forms.map((form) => (
						<SelectItem key={form.id} value={form.slug}>
							{form.name}
						</SelectItem>
					))}
				</SelectContent>
			</Select>
			<Button onClick={switchForms}>Switch forms</Button>
		</div>
	);
};
