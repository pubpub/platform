"use client";

import { useForm } from "react-hook-form";

import type { CommunitiesId } from "db/public";
import {
	Form,
	FormControl,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "ui/form";
import { Input } from "ui/input";

import { FormSubmitButton } from "~/app/components/SubmitButton";
import { useServerAction } from "~/lib/serverActions";
import { importFromLegacy } from "./actions";

export function MigrationForm({ community }: { community: { slug: string; id: CommunitiesId } }) {
	const form = useForm({
		defaultValues: {
			legacyCommunity: "",
		},
	});

	const runImportFromLegacy = useServerAction(importFromLegacy);

	const onSubmit = form.handleSubmit(async (data) => {
		await runImportFromLegacy({
			slug: data.legacyCommunity,
		});
	});

	return (
		<Form {...form}>
			<form onSubmit={onSubmit}>
				<FormField
					control={form.control}
					name="legacyCommunity"
					render={({ field }) => (
						<FormItem className="space-y-2">
							<FormLabel>Legacy Community Slug</FormLabel>
							<FormControl>
								<Input placeholder="e.g. jtrialerror" {...field} />
							</FormControl>
							<FormDescription>
								Enter the slug of the legacy community you want to import from
							</FormDescription>
							<FormMessage />
							<FormSubmitButton
								formState={form.formState}
								idleText="Import from Legacy"
							/>
						</FormItem>
					)}
				/>
			</form>
		</Form>
	);
}
