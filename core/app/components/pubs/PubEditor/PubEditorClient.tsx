"use client";

import React, { useCallback, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { typeboxResolver } from "@hookform/resolvers/typebox";
import { useForm } from "react-hook-form";
import { useDebouncedCallback } from "use-debounce";

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
import { PubField } from "~/lib/types";
import * as actions from "./actions";
import {
	createEditorFormDefaultValuesFromPubFields,
	createEditorFormSchemaFromPubFields,
	createFieldsForSever,
} from "./helpers";

type PubType = {
	availablePubTypes: (Pick<PubTypes, "id" | "name" | "description" | "communityId"> & {
		fields: (Pick<PubFields, "id" | "name" | "pubFieldSchemaId" | "slug" | "schemaName"> & {
			schema: Pick<PubFieldSchema, "id" | "namespace" | "name" | "schema"> | null;
		})[];
	})[];
};

type Props = {
	communityStages: Pick<Stages, "id" | "name" | "order">[];
	parentId?: PubsId;
	availablePubTypes: PubType["availablePubTypes"];
	pubFields: Pick<PubField, "slug" | "schemaName">[];
	pubValues: PubValues;
	pubTypeId: PubTypes["id"];
	formElements: React.ReactNode[];
	pubId?: PubsId;
	className?: string;
} & {
	currentStage?: Pick<Stages, "id" | "name" | "order"> | null;
};

export function PubEditorClient(props: Props) {
	const pubType = props.availablePubTypes.find((type) => type.id === props.pubTypeId);

	const [selectedPubType, setSelectedPubType] = useState<
		(typeof props.availablePubTypes)[number] | null
	>(pubType ?? null);
	const [selectedStage, setSelectedStage] = useState<typeof props.currentStage>(
		props.currentStage ?? null
	);

	const hasValues = Object.keys(props.pubValues).length > 0;
	const paramString = hasValues ? "update" : "create";
	const runCreatePub = useServerAction(actions.createPub);
	const runUpdatePub = useServerAction(actions.updatePub);

	const path = usePathname();
	const router = useRouter();
	const searchParams = useSearchParams();

	const urlSearchParams = new URLSearchParams(searchParams ?? undefined);
	urlSearchParams.delete(`${paramString}-pub-form`);
	const pathWithoutFormParam = `${path}?${urlSearchParams.toString()}`;

	const handleSelect = useDebouncedCallback((value: (typeof props.availablePubTypes)[number]) => {
		const newParams = new URLSearchParams(searchParams);
		newParams.set("pubTypeId", value.id);
		router.replace(`${path}?${newParams.toString()}`, { scroll: false });
	});

	const closeForm = useCallback(() => {
		router.replace(pathWithoutFormParam);
	}, [pathWithoutFormParam]);

	const resolver = useMemo(
		() => typeboxResolver(createEditorFormSchemaFromPubFields(props.pubFields)),
		[props.formElements]
	);
	const form = useForm({
		defaultValues: createEditorFormDefaultValuesFromPubFields(props.pubFields, props.pubValues),
		reValidateMode: "onChange",
		resolver,
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
		if (hasValues && props.pubId) {
			const result = await runUpdatePub({
				pubId: props.pubId,
				communityId: selectedPubType.communityId as CommunitiesId,
				path: pathWithoutFormParam,
				stageId: stage as StagesId,
				fields: createFieldsForSever(values, selectedPubType),
			});

			if (result && "success" in result) {
				toast({
					title: "Success",
					description: "Pub successfully updated",
				});
				closeForm();
			}
		} else {
			const result = await runCreatePub({
				communityId: selectedPubType.communityId,
				pubTypeId: selectedPubType.id,
				stageId: selectedStage?.id,
				parentId: props.parentId,
				fields: createFieldsForSever(values, selectedPubType),
				path: pathWithoutFormParam,
			});
			if (result && "success" in result) {
				toast({
					title: "Success",
					description: "New pub created",
				});
				closeForm();
			}
		}
	};

	return (
		<Form {...form}>
			<form
				onSubmit={form.handleSubmit(onSubmit)}
				className={cn("relative flex flex-col gap-6", props.className)}
				onBlur={(e) => e.preventDefault()}
			>
				{!props.pubId && (
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
											{selectedPubType?.name || "Select Pub Type"}
											<ChevronDown size="16" />
										</Button>
									</DropdownMenuTrigger>
									<DropdownMenuContent>
										{props.availablePubTypes.map((pubType) => (
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
									{props.communityStages.map((stage) => (
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
				{selectedPubType && props.formElements}
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
