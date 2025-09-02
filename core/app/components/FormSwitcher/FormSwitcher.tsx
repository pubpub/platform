"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { parseAsString, useQueryState } from "nuqs";

import {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectLabel,
	SelectTrigger,
} from "ui/select";
import { cn } from "utils";

import type { SimpleForm } from "~/lib/server/form";

export const formSwitcherUrlParam = "form";

export const FormSwitcher = ({
	forms,
	defaultFormSlug,
	htmlId,
	className,
	children,
}: {
	forms: SimpleForm[];
	defaultFormSlug?: string;
	htmlId?: string;
	className?: string;
	children?: React.ReactNode;
}) => {
	const [selectedFormSlug, setSelectedFormSlug] = useQueryState(
		formSwitcherUrlParam,
		parseAsString.withDefault(defaultFormSlug ?? "").withOptions({
			shallow: false,
		})
	);

	if (!forms.length) {
		return null;
	}

	const currentForm = forms.find((form) => form.slug === selectedFormSlug);

	return (
		<div className="flex items-center gap-2">
			<Select
				onValueChange={(slug: string) => {
					setSelectedFormSlug(slug);
				}}
				defaultValue={selectedFormSlug || defaultFormSlug}
			>
				<SelectTrigger
					id={htmlId}
					className={cn(
						"flex h-6 items-center gap-1 border-none bg-transparent",
						className
					)}
				>
					{children}
					{currentForm?.name}
				</SelectTrigger>
				<SelectContent>
					<SelectGroup>
						<SelectLabel className="text-xs font-normal text-muted-foreground">
							Content will change upon selection. You may lose unsaved changes.
						</SelectLabel>
						{forms.map((form) => (
							<SelectItem key={form.id} value={form.slug}>
								{form.name}
							</SelectItem>
						))}
					</SelectGroup>
				</SelectContent>
			</Select>
		</div>
	);
};
