"use client";

import React from "react";
import { notFound } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useFieldArray, useForm } from "react-hook-form";
import { z } from "zod";

import type { PubFieldsId } from "db/public";
import { Button } from "ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "ui/form";
import { Loader2, X } from "ui/icon";
import { Input } from "ui/input";

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
	pubFields: z.array(z.object({ fieldId: z.string(), name: z.string(), slug: z.string() })),
});

export const TypeEditor = ({ onTypeCreation }: Props) => {
	const form = useForm<z.infer<typeof schema>>({
		resolver: zodResolver(schema),
	});

	const {
		fields: pubFields,
		append,
		remove,
	} = useFieldArray({
		control: form.control,
		name: "pubFields",
	});

	const onFieldSelect = (fieldId: PubFieldsId, name: string, slug: string) => {
		append({ fieldId, name, slug });
	};

	const community = useCommunity();
	if (!community) {
		return notFound();
	}
	const runCreatePubType = useServerAction(createPubType);
	const onSubmit = async ({ name, description, pubFields }: z.infer<typeof schema>) => {
		runCreatePubType(
			name,
			community.id,
			description,
			pubFields.map((f) => f.fieldId as PubFieldsId)
		);
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
					<ul>
						{pubFields.map((pubField, index) => (
							<li key={index}>
								<Button
									variant="ghost"
									size="sm"
									className="inline-flex h-6 px-1"
									onClick={() => remove(index)}
									aria-label="Remove field"
								>
									<span className="sr-only">Remove field</span>
									<X size={14} />
								</Button>
								<FormLabel className="font-normal">
									{pubField.name} ({pubField.slug})
								</FormLabel>
							</li>
						))}
					</ul>
					<FormField
						control={form.control}
						name="pubFields"
						render={() => (
							<FormItem className="my-4">
								<FormLabel className="mb-1 block">
									Choose fields to add to this type
								</FormLabel>
								<FormControl>
									<FieldSelect
										excludedFields={pubFields.map(
											(f) => f.fieldId as PubFieldsId
										)}
										onFieldSelect={onFieldSelect}
										modal={true}
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
