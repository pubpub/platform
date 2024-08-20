"use client";

import { useMemo, useState } from "react";
import { Pub } from "@prisma/client";
import { useForm } from "react-hook-form";

import type {
	Communities,
	PubFields,
	PubFieldSchema,
	PubsId,
	PubTypes,
	PubValues,
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
import { createElementFromPubType } from "./helpers";

async function GenericDynamicPubForm({
	communitySlug,
	availableStages,
	availablePubTypes,
	currentStage = null,
	parentId,
	searchParams,
	__hack__memberIdField,
	values,
	pubType,
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
	__hack__memberIdField?: React.ReactNode;
	values?: { [key: PubFields["slug"]]: PubValues["value"] | null };
	pubType: Pub["pubTypeId"];
} & {
	currentStage?: Pick<Stages, "id" | "name" | "order"> | null;
}) {
	const pt = availablePubTypes.find((type) => type.id === pubType);
	const [selectedPubType, setSelectedPubType] = useState<
		(typeof availablePubTypes)[number] | null
	>(pt ?? null);
	const [selectedStage, setSelectedStage] = useState<typeof currentStage>(currentStage);
	const defaultData = { pubType: null, stage: null, ...values };

	const form = useForm({
		reValidateMode: "onChange",
		defaultValues: defaultData,
	});

	const PubFormElement = () => {
		// no notion of field values here
		if (!selectedPubType) {
			return null;
		}
		const elements = useMemo(
			() => createElementFromPubType(selectedPubType),
			[selectedPubType]
		);
		return elements.map((element) => {
			return (
				<>
					<FormElement key={element.elementId} element={element} />
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
				{__hack__memberIdField &&
				selectedPubType?.fields.find(
					(field) => field.schemaName === CoreSchemaType.MemberId
				)
					? __hack__memberIdField
					: null}
			</Form>
		</div>
	);
}

export { GenericDynamicPubForm };
