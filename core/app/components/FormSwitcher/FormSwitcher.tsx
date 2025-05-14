"use client";

import { useQueryState } from "nuqs";

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
	const defaultForm = forms.find((form) => form.isDefault);

	const [currentFormSlug, setCurrentFormSlug] = useQueryState(formSwitcherUrlParam, {
		shallow: false,
		defaultValue: defaultForm?.slug ?? forms[0].slug,
	});

	const currentForm = forms.find((form) => form.slug === currentFormSlug);

	if (!forms.length || forms.length === 1 || !currentForm) {
		return null;
	}

	return (
		<div className="flex items-center gap-2">
			<Select
				onValueChange={(slug: string) => {
					setCurrentFormSlug(slug);
				}}
				defaultValue={currentFormSlug || defaultFormSlug}
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
