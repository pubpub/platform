"use client";

import React, { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import type { GetPubResponseBody } from "contracts";
import type {
	Communities,
	PubFields,
	PubFieldSchema,
	PubsId,
	PubTypes,
	PubValues,
	Stages,
} from "db/public";
import { Button } from "ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "ui/dropdown-menu";
import { Form, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "ui/form";
import { ChevronDown } from "ui/icon";

const PubFormSchema = z.object({
	pubType: z.string(),
	stage: z.object({
		id: z.string(),
		name: z.string(),
		order: z.string(),
	}),
	values: z.object({}),
});

async function GenericDynamicPubForm({
	availableStages,
	availablePubTypes,
	currentStage = null,
	parentId,
	values,
	pubTypeId: pubType,
	formElements,
}: {
	communitySlug: Communities["slug"];
	availableStages: Pick<Stages, "id" | "name" | "order">[];
	parentId?: PubsId;
	availablePubTypes: (Pick<PubTypes, "id" | "name" | "description"> & {
		fields: (Pick<PubFields, "id" | "name" | "pubFieldSchemaId" | "slug" | "schemaName"> & {
			schema: Pick<PubFieldSchema, "id" | "namespace" | "name" | "schema"> | null;
		})[];
	})[];
	searchParams: Record<string, unknown>;
	values?: GetPubResponseBody["values"];
	pubTypeId: PubTypes["id"];
	formElements: Record<string, React.ReactNode>;
} & {
	currentStage?: Pick<Stages, "id" | "name" | "order"> | null;
}) {
	const pt = availablePubTypes.find((type) => type.id === pubType);
	const [selectedPubType, setSelectedPubType] = useState<
		(typeof availablePubTypes)[number] | null
	>(pt ?? null);
	const [selectedStage, setSelectedStage] = useState<typeof currentStage>(currentStage);

	
	const form = useForm<z.infer<typeof PubFormSchema>>({
		reValidateMode: "onChange",
		defaultValues: {
			pubType: pubType ?? "",
			stage: currentStage ?? {},
			values: values ?? {},
		},
	});

	return (
		<div>
			<Form {...form}>
				<FormField
					name="pubType"
					control={form.control}
					rules={{
						required: true,
					}}
					render={({ field }) => (
						<FormItem aria-label="Email" className="flex flex-col items-start gap-2">
							<FormLabel>Pub Type</FormLabel>
							<FormDescription>
								Select the type of pub you want to create
							</FormDescription>
							<DropdownMenu>
								<DropdownMenuTrigger asChild>
									<Button size="sm" variant="outline">
										{selectedPubType?.name || "Select PubType"}
										<ChevronDown size="16" />
									</Button>
								</DropdownMenuTrigger>
								<DropdownMenuContent>
									{availablePubTypes.map((pubType) => (
										<DropdownMenuItem
											key={pubType.id}
											onClick={() => {
												field.onChange(pubType.id);
												setSelectedPubType(pubType);
											}}
										>
											{pubType.name}
										</DropdownMenuItem>
									))}
								</DropdownMenuContent>
							</DropdownMenu>

							<FormMessage />
						</FormItem>
					)}
				/>
				{!currentStage && (
					<FormField
						name="stage"
						control={form.control}
						rules={{
							required: true,
						}}
						render={({ field }) => (
							<FormItem
								aria-label="Stage"
								className="flex flex-col items-start gap-2"
							>
								<FormLabel>Stage</FormLabel>
								<FormDescription>
									Select the stage you want to create a pub in
								</FormDescription>
								<DropdownMenu>
									<DropdownMenuTrigger asChild>
										<Button size="sm" variant="outline">
											{selectedStage?.name || "Select Stage"}
											<ChevronDown size="16" />
										</Button>
									</DropdownMenuTrigger>
									<DropdownMenuContent>
										{availableStages.map((stage) => (
											<DropdownMenuItem
												key={stage.id}
												onClick={() => {
													field.onChange(stage.id);
													setSelectedStage(stage);
												}}
											>
												{stage.name}
											</DropdownMenuItem>
										))}
									</DropdownMenuContent>
								</DropdownMenu>

								<FormMessage />
							</FormItem>
						)}
					/>
				)}
				{selectedPubType && formElements[selectedPubType.id]}
			</Form>
		</div>
	);
}

export { GenericDynamicPubForm };
