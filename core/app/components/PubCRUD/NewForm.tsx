"use client";

import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { v4 as uuidv4 } from "uuid";

import type { CommunitiesId, PubFields, PubFieldSchema, PubsId, PubTypes, Stages } from "db/public";
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
	communityId,
	availableStages,
	availablePubTypes,
	currentStage = null,
	parentId,
}: {
	communityId: CommunitiesId;
	availableStages: Pick<Stages, "id" | "name" | "order">[];
	parentId?: PubsId;

	availablePubTypes: (Pick<PubTypes, "id" | "name" | "description"> & {
		fields: (Pick<PubFields, "id" | "name" | "pubFieldSchemaId" | "slug" | "schemaName"> & {
			schema: Pick<PubFieldSchema, "id" | "namespace" | "name" | "schema"> | null;
		})[];
	})[];
} & {
	currentStage?: Pick<Stages, "id" | "name" | "order"> | null;
}) {
	// render a pubType select
	// render a stage select
	// render the fields on the selected pubType first
	// itereate over selected pubType to create elemenets and pass them to FormElement.
	// return <div></div>;
	// create an in memory representaion of a form element
	const [selectedPubType, setSelectedPubType] = useState<
		(typeof availablePubTypes)[number] | null
	>(null);

	const [selectedStage, setSelectedStage] = useState<typeof currentStage>(currentStage);
	// const elements = createElementFromPubType(selectedPubType);
	const form = useForm({
		reValidateMode: "onChange",
	});

	const ElemenetForm = () => {
		if (!selectedPubType) {
			return null;
		}
		const elements = createElementFromPubType(selectedPubType);
		console.log("Ellies", elements);
		return elements.map((element) => (
			// <FormElement key={element.elementId} element={element} pubId={uuidv4() as PubsId} />
			<div key={element.elementId}>{JSON.stringify(element)}</div>
		));
	};

	return (
		<div>
			Hello New World
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
				{selectedPubType && <ElemenetForm />}
			</Form>
		</div>
	);
}

export { GenericDynamicPubForm };
