"use client";

import React, { useCallback, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { typeboxResolver } from "@hookform/resolvers/typebox";
import { Type } from "@sinclair/typebox";
import { useForm } from "react-hook-form";
import { getJsonSchemaByCoreSchemaType } from "schemas";
import { useDebouncedCallback } from "use-debounce";

import type { GetPubResponseBody } from "contracts";
import type {
	CommunitiesId,
	PubFields,
	PubFieldSchema,
	PubsId,
	PubTypes,
	PubValues,
	Stages,
	StagesId,
} from "db/public";
import { ElementType } from "db/public";
import { Button } from "ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "ui/dropdown-menu";
import { Form, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "ui/form";
import { ChevronDown, Loader2, Pencil, Plus } from "ui/icon";
import { toast } from "ui/use-toast";
import { cn } from "utils";

import { useServerAction } from "~/lib/serverActions";
import * as actions from "./actions";
import { buildDefaultValues, createElementFromPubType } from "./helpers";

async function NewForm({
	communityStages,
	availablePubTypes,
	currentStage,
	parentId,
	pubValues,
	pubTypeId,
	formElements,
	className,
	pubId,
}: {
	communityStages: Pick<Stages, "id" | "name" | "order">[];
	parentId?: PubsId;
	availablePubTypes: (Pick<PubTypes, "id" | "name" | "description" | "communityId"> & {
		fields: (Pick<PubFields, "id" | "name" | "pubFieldSchemaId" | "slug" | "schemaName"> & {
			schema: Pick<PubFieldSchema, "id" | "namespace" | "name" | "schema"> | null;
		})[];
	})[];
	pubValues: PubValues;
	pubTypeId: PubTypes["id"];
	formElements: React.ReactNode[];
	pubId?: PubsId;
	className?: string;
} & {
	currentStage?: Pick<Stages, "id" | "name" | "order"> | null;
}) {
	const pt = availablePubTypes.find((type) => type.id === pubTypeId);

	const [selectedPubType, setSelectedPubType] = useState<
		(typeof availablePubTypes)[number] | null
	>(pt ?? null);
	const [selectedStage, setSelectedStage] = useState<typeof currentStage>(currentStage ?? null);

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

	const handleSelect = useDebouncedCallback((value: (typeof availablePubTypes)[number]) => {
		const newParams = new URLSearchParams(searchParams);
		newParams.set("pubTypeId", value.id);
		router.replace(`${path}?${newParams.toString()}`, { scroll: false });
	}, 800);

	const closeForm = useCallback(() => {
		router.replace(pathWithoutFormParam);
	}, [pathWithoutFormParam]);

	const elements = selectedPubType ? createElementFromPubType(selectedPubType) : [];

	const form = useForm({
		defaultValues: buildDefaultValues(elements, pubValues),
		reValidateMode: "onChange",
	});
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
		if (hasValues && pubId) {
			const result = await runUpdatePub({
				pubId,
				communityId: selectedPubType.communityId as CommunitiesId,
				path: pathWithoutFormParam,
				stageId: stage as StagesId,
				fields: Object.entries(values).reduce((acc, [key, value]) => {
					const id = selectedPubType?.fields.find((f) => f.slug === key)?.id;
					if (id) {
						acc[id] = { slug: key, value };
					}
					return acc;
				}, {}),
			});

			if (result && "success" in result) {
				toast({
					title: "Success",
					description: "yay updatedd",
				});
				closeForm();
			}
		} else {
			const result = await runCreatePub({
				communityId: selectedPubType.communityId,
				pubTypeId: selectedPubType.id,
				stageId: selectedStage?.id,
				parentId,
				fields: Object.entries(values).reduce((acc, [key, value]) => {
					const id = selectedPubType?.fields.find((f) => f.slug === key)?.id;
					if (id) {
						acc[id] = { slug: key, value };
					}
					return acc;
				}, {}),
				path: pathWithoutFormParam,
			});
			if (result && "success" in result) {
				toast({
					title: "Success",
					description: "Yayyy new pub",
				});
				closeForm();
			}
		}
	};

	return (
		<Form {...form}>
			<form
				onSubmit={form.handleSubmit(onSubmit)}
				className={cn("relative flex flex-col gap-6", className)}
			>
				{!pubId && (
					<FormField
						name="pubType"
						control={form.control}
						rules={{
							required: true,
						}}
						render={({ field }) => (
							<FormItem
								aria-label="Email"
								className="flex flex-col items-start gap-2"
							>
								<FormLabel>Pub Type</FormLabel>
								<FormDescription>Select the type of pub</FormDescription>
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
												onSelect={() => {
													setSelectedPubType(pubType);
													field.onChange(pubType.id);
													handleSelect(pubType);
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
				)}
				<FormField
					name="stage"
					control={form.control}
					rules={{
						required: true,
					}}
					render={({ field }) => (
						<FormItem aria-label="Stage" className="flex flex-col items-start gap-2">
							<FormLabel>Stage</FormLabel>
							<FormDescription>Select the stage you want the pub in</FormDescription>
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
				{selectedPubType && formElements}
				<Button
					type="submit"
					className="flex items-center gap-x-2"
					disabled={
						form.formState.isSubmitting ||
						!selectedStage ||
						!selectedPubType ||
						!form.formState.isValid
					}
				>
					{form.formState.isSubmitting ? (
						<Loader2 className="h-4 w-4 animate-spin" />
					) : hasValues ? (
						<>
							<Pencil size="12" />
							Update Pub
						</>
					) : (
						<>
							<Plus size="12" />
							Create Pub
						</>
					)}
				</Button>
			</form>
		</Form>
	);
}

export { NewForm };
