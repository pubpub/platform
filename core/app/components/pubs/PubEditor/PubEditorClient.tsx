"use client";

import React, { useCallback, useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { typeboxResolver } from "@hookform/resolvers/typebox";
import { Static } from "@sinclair/typebox";
import { SubmitHandler, useForm } from "react-hook-form";
import { useDebouncedCallback } from "use-debounce";

import type {
	CommunitiesId,
	PubFields,
	PubFieldSchema,
	PubsId,
	PubTypes,
	PubTypesId,
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

import { didSucceed, useServerAction } from "~/lib/serverActions";
import { PubField } from "~/lib/types";
import * as actions from "./actions";
import {
	createPubEditorDefaultValuesFromPubFields,
	createPubEditorSchemaFromPubFields,
} from "./helpers";

type AvailablePubType = Pick<PubTypes, "id" | "name" | "description" | "communityId"> & {
	fields: (Pick<PubFields, "id" | "name" | "pubFieldSchemaId" | "slug" | "schemaName"> & {
		schema: Pick<PubFieldSchema, "id" | "namespace" | "name" | "schema"> | null;
	})[];
};

type Props = {
	availablePubTypes: AvailablePubType[];
	availableStages: Pick<Stages, "id" | "name" | "order">[];
	communityId: CommunitiesId;
	className?: string;
	formElements: React.ReactNode[];
	parentId?: PubsId;
	pubFields: Pick<PubField, "slug" | "schemaName">[];
	pubId?: PubsId;
	pubTypeId: PubTypes["id"];
	pubValues: PubValues;
	stageId?: StagesId;
};

export function PubEditorClient(props: Props) {
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

	const schema = useMemo(
		() => createPubEditorSchemaFromPubFields(props.pubFields),
		[props.pubFields]
	);

	const resolver = useMemo(() => typeboxResolver(schema), [schema]);

	const form = useForm({
		defaultValues: createPubEditorDefaultValuesFromPubFields(
			props.pubFields,
			props.pubValues,
			props.pubTypeId,
			props.stageId
		),
		reValidateMode: "onChange",
		resolver,
	});

	const handleSelectPubType = useDebouncedCallback(
		(value: (typeof props.availablePubTypes)[number]) => {
			const newParams = new URLSearchParams(searchParams);
			newParams.set("pubTypeId", value.id);
			router.replace(`${path}?${newParams.toString()}`, { scroll: false });
		}
	);

	const closeForm = useCallback(() => {
		router.replace(pathWithoutFormParam);
	}, [pathWithoutFormParam]);

	const onSubmit: SubmitHandler<Static<typeof schema>> = async (data) => {
		const { pubTypeId, stageId, ...pubValues } = data;

		if (props.pubId) {
			const result = await runUpdatePub({
				pubId: props.pubId,
				pubValues,
				stageId: stageId as StagesId,
			});

			if (didSucceed(result)) {
				toast({
					title: "Success",
					description: "Pub successfully updated",
				});
				closeForm();
			}
		} else {
			if (!pubTypeId) {
				form.setError("pubTypeId", {
					message: "Select a pub type",
				});
				return;
			}

			const result = await runCreatePub({
				communityId: props.communityId,
				parentId: props.parentId,
				pubTypeId: pubTypeId as PubTypesId,
				pubValues,
				stageId: stageId as StagesId,
			});
			if (didSucceed(result)) {
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
						name="pubTypeId"
						control={form.control}
						render={({ field }) => (
							<FormItem
								aria-label="Select Pub Type"
								className="flex flex-col items-start gap-2"
							>
								<FormLabel>Pub Type</FormLabel>
								<FormDescription>Assign a pub type to the pub</FormDescription>
								<DropdownMenu>
									<DropdownMenuTrigger asChild>
										<Button size="sm" variant="outline">
											{field.value
												? props.availablePubTypes.find(
														(type) => type.id === field.value
													)?.name
												: "Select Pub Type"}
											<ChevronDown size="16" />
										</Button>
									</DropdownMenuTrigger>
									<DropdownMenuContent>
										{props.availablePubTypes.map((pubType) => (
											<DropdownMenuItem
												key={pubType.id}
												onSelect={() => {
													field.onChange(pubType.id);
													handleSelectPubType(pubType);
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
					name="stageId"
					control={form.control}
					render={({ field }) => (
						<FormItem aria-label="Stage" className="flex flex-col items-start gap-2">
							<FormLabel>Stage</FormLabel>
							<FormDescription>Select the stage you want the pub in</FormDescription>
							<DropdownMenu>
								<DropdownMenuTrigger asChild>
									<Button size="sm" variant="outline">
										{field.value
											? props.availableStages.find(
													(stage) => stage.id === field.value
												)?.name
											: "Select Stage"}
										<ChevronDown size="16" />
									</Button>
								</DropdownMenuTrigger>
								<DropdownMenuContent>
									{props.availableStages.map((stage) => (
										<DropdownMenuItem
											key={stage.id}
											onClick={() => {
												field.onChange(stage.id);
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
				{props.formElements}
				<Button
					type="submit"
					className="flex items-center gap-x-2"
					disabled={form.formState.isSubmitting || !form.formState.isValid}
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
