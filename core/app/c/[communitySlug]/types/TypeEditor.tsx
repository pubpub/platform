"use client";

import React from "react";
import { notFound } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "ui/form";
import { Loader2, X } from "ui/icon";
import { Input } from "ui/input";

import type { PubFieldsId } from "~/kysely/types/public/PubFields";
import type { PubField } from "~/lib/types";
import { useCommunity } from "~/app/components/providers/CommunityProvider";
import { useServerAction } from "~/lib/serverActions";
import { createPubType } from "./actions";
import { FieldSelect } from "./FieldSelect";

type Props = {
	onTypeCreation: () => void;
};

const schema = z.object({
	name: z.string(),
	description: z.string().optional(),
	fields: z.array(z.string()), // array of field ids
});

export const TypeEditor = ({ onTypeCreation }: Props) => {
	const form = useForm<z.infer<typeof schema>>({
		resolver: zodResolver(schema),
	});

	const [selectedFields, setSelectedFields] = React.useState<Record<PubFieldsId, PubField>>({});

	const onFieldSelect = (fieldId: PubFieldsId, name: string, slug: string) => {
		form.setValue("fields", [...Object.keys(selectedFields), fieldId]);
		setSelectedFields({ ...selectedFields, [fieldId]: { id: fieldId, name, slug } });
	};

	const removeField = (fieldId: string) => () => {
		const { [fieldId as PubFieldsId]: removed, ...remaining } = selectedFields;
		form.setValue("fields", Object.keys(remaining));
		setSelectedFields(remaining);
	};

	const community = useCommunity();
	if (!community) {
		return notFound();
	}
	const runCreatePubType = useServerAction(createPubType);
	const onSubmit = async ({ name, description, fields }: z.infer<typeof schema>) => {
		runCreatePubType(name, community.id, description, fields as PubFieldsId[]);
		onTypeCreation();
	};

	return (
		<div className="ml-4 mt-4">
			<Form {...form}>
				<form onSubmit={form.handleSubmit(onSubmit)}>
					<FormField
						control={form.control}
						name="name"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Type Name</FormLabel>
								<FormControl>
									<Input {...field} type="text"></Input>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					></FormField>
					<FormField
						name="description"
						control={form.control}
						render={({ field }) => (
							<FormItem aria-label="Description">
								<FormLabel>Description</FormLabel>
								<FormControl>
									<Input {...field} type="text" />
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
					<div className="text-md mb-1 mt-4 font-semibold">Fields</div>
					{Object.values(selectedFields).map((pubField) => (
						<FormField
							key={pubField.id}
							control={form.control}
							name="fields"
							render={({ field }) => (
								<FormItem>
									<FormControl>
										<Button
											variant="ghost"
											size="sm"
											className="inline-flex h-6 px-1"
											onClick={removeField(pubField.id)}
											aria-label="Remove field"
										>
											<X size={14} />
										</Button>
									</FormControl>
									<FormLabel className="font-normal">
										{pubField.name} ({pubField.slug})
									</FormLabel>
									<FormMessage />
								</FormItem>
							)}
						></FormField>
					))}
					<FormField
						control={form.control}
						name="fields"
						render={() => (
							<FormItem className="my-4">
								<FormLabel className="mb-1 block">
									Choose fields to add to this type
								</FormLabel>
								<FormControl>
									<FieldSelect
										excludedFields={
											Object.keys(selectedFields) as PubFieldsId[]
										}
										onFieldSelect={onFieldSelect}
									/>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
					<Button disabled={!form.formState.isDirty || form.formState.isSubmitting}>
						Create type
						{form.formState.isSubmitting && (
							<Loader2 className="ml-4 h-4 w-4 animate-spin" />
						)}
					</Button>
				</form>
			</Form>
		</div>
	);
};
