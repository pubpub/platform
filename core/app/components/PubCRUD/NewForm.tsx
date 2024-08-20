"use client";

import { useMemo, useState } from "react";
import values from "ajv/dist/vocabularies/jtd/values";
import { useForm } from "react-hook-form";

import type {
	Communities,
	MembersId,
	PubFields,
	PubFieldSchema,
	PubsId,
	PubTypes,
	Stages,
} from "db/public";
import { CoreSchemaType } from "db/public";
import { Button } from "ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "ui/dropdown-menu";
import { Form, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "ui/form";
import { ChevronDown } from "ui/icon";

import { FormElement } from "~/app/c/(public)/[communitySlug]/public/forms/[formSlug]/fill/FormElement";
import { UserIdSelect } from "~/app/c/(public)/[communitySlug]/public/forms/[formSlug]/fill/InnerForm";
import { createElementFromPubType } from "./helpers";

async function GenericDynamicPubForm({
	communitySlug,
	availableStages,
	availablePubTypes,
	currentStage = null,
	parentId,
	searchParams,
}: {
	communitySlug: Communities["slug"];
	availableStages: Pick<Stages, "id" | "name" | "order">[];
	parentId?: PubsId;

	availablePubTypes: (Pick<PubTypes, "id" | "name" | "description"> & {
		fields: (Pick<PubFields, "id" | "name" | "pubFieldSchemaId" | "slug" | "schemaName"> & {
			schema: Pick<PubFieldSchema, "id" | "namespace" | "name" | "schema"> | null;
		})[];
	})[];
	searchParams?: Record<string, unknown>;
} & {
	currentStage?: Pick<Stages, "id" | "name" | "order"> | null;
}) {
	const [selectedPubType, setSelectedPubType] = useState<
		(typeof availablePubTypes)[number] | null
	>(null);

	const [selectedStage, setSelectedStage] = useState<typeof currentStage>(currentStage);

	const form = useForm({
		reValidateMode: "onChange",
	});

	const PubFormElement = () => {
		if (!selectedPubType) {
			return null;
		}
		const elements = useMemo(
			() => createElementFromPubType(selectedPubType),
			[selectedPubType]
		);

		return elements.map((element) => {
			if (element.schemaName === CoreSchemaType.MemberId) {
				const userId = values[element.slug!] as MembersId | undefined;
				return (
					<UserIdSelect
						key={element.elementId}
						label={element.label ?? ""}
						name={element.slug ?? ""}
						id={element.elementId}
						searchParams={searchParams!}
						value={userId}
						communitySlug={communitySlug}
					/>
				);
			}
			return (
				<>
					<FormElement key={element.elementId} element={element} />
					{JSON.stringify(element)}
				</>
			);
		});
	};

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
				{selectedPubType && <PubFormElement />}
			</Form>
		</div>
	);
}

export { GenericDynamicPubForm };
