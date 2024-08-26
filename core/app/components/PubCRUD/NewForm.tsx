"use client";

import React, { useCallback, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { useRouter } from "next/router";
import { useForm } from "react-hook-form";
import { z } from "zod";

import type { GetPubResponseBody } from "contracts";
import type { Communities, PubFields, PubFieldSchema, PubsId, PubTypes, Stages } from "db/public";
import { CommunitiesId, CoreSchemaType, StagesId } from "db/public";
import { Button } from "ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "ui/dropdown-menu";
import { Form, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "ui/form";
import { ChevronDown } from "ui/icon";
import { toast } from "ui/use-toast";

import { useServerAction } from "~/lib/serverActions";
import * as actions from "./actions";

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
	communityStages,
	availablePubTypes,
	currentStage = null,
	parentId,
	pubValues,
	pubTypeId,
	formElements,
	pubId,
}: {
	communityStages: Pick<Stages, "id" | "name" | "order">[];
	parentId: PubsId;
	availablePubTypes: (Pick<PubTypes, "id" | "name" | "description" | "communityId"> & {
		fields: (Pick<PubFields, "id" | "name" | "pubFieldSchemaId" | "slug" | "schemaName"> & {
			schema: Pick<PubFieldSchema, "id" | "namespace" | "name" | "schema"> | null;
		})[];
	})[];
	pubValues: GetPubResponseBody["values"];
	pubTypeId: PubTypes["id"];
	formElements: Record<string, React.ReactNode>;
	pubId: PubsId;
} & {
	currentStage?: Pick<Stages, "id" | "name" | "order"> | null;
}) {
	const pt = availablePubTypes.find((type) => type.id === pubTypeId);
	const [selectedPubType, setSelectedPubType] = useState<
		(typeof availablePubTypes)[number] | null
	>(pt ?? null);
	const [selectedStage, setSelectedStage] = useState<typeof currentStage>(currentStage);

	const form = useForm<z.infer<typeof PubFormSchema>>({
		reValidateMode: "onChange",
	});

	// if the pub is being cretted the values passed in should be empty
	// we could use mode to determine if we are creating or updating as well but thats a few lvls up
	const hasValues = Object.keys(pubValues).length > 0;
	const paramString = hasValues ? "update" : "create";
	const runCreatePub = useServerAction(actions.createPub);
	const runUpdatePub = useServerAction(actions.updatePub);

	const path = usePathname();
	const searchParams = useSearchParams();
	const router = useRouter();

	const urlSearchParams = new URLSearchParams(searchParams ?? undefined);
	urlSearchParams.delete(`${paramString}-pub-form`);
	const pathWithoutFormParam = `${path}?${urlSearchParams.toString()}`;

	const closeForm = useCallback(() => {
		router.replace(pathWithoutFormParam);
	}, [pathWithoutFormParam]);

	const onSubmit = async ({ pubType, stage, ...values }: { pubType: string; stage: string }) => {
		if (!selectedStage) {
			form.setError("stage", {
				message: "Select a stage",
			});
			return;
		}

		if (!selectedPubType) {
			form.setError("pubType", {
				message: "Select a pub type",
			});
			return;
		}

		if (hasValues) {
			const result = await runUpdatePub({
				pubId: pubId,
				communityId: selectedPubType.communityId as CommunitiesId,
				path: pathWithoutFormParam,
				stageId: stage as StagesId,
				fields: Object.entries(values).reduce((acc, [key, value]) => {
					const id = pubType?.fields.find((f) => f.slug === key)?.id;
					if (id) {
						acc[id] = { slug: key, value };
					}
					return acc;
				}, {}),
			});

			if (result && "success" in result) {
				toast({
					title: "Success",
					description: result.report,
				});
				closeForm();
			}
		} else {
			const result = await runCreatePub({
				communityId: selectedPubType.communityId,
				pubTypeId: pubTypeId,
				stageId: selectedStage?.id,
				parentId,
				fields: Object.entries(values).reduce((acc, [key, value]) => {
					const id = selectedPubType?.fields.find((f) => f.slug === key)?.id;
					if (id) {
						acc[id] = { slug: key, value };
					}
					return acc;
				}),
				path: pathWithoutFormParam,
			});

			if (result && "success" in result) {
				toast({
					title: "Success",
					description: result.report,
				});
				closeForm();
			}
		}
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
										{communityStages.map((stage) => (
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
