"use client";

import type { Static, TObject } from "@sinclair/typebox";
import type { FieldPath, SubmitHandler, UseFormReturn } from "react-hook-form";

import React, { useCallback, useEffect, useMemo, useState } from "react";
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
	PubTypesId,
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

import type { PubValues } from "~/lib/server";
import type { PubField } from "~/lib/types";
import { Notice } from "~/app/(user)/login/Notice";
import { didSucceed, useServerAction } from "~/lib/serverActions";
import { useFormElementToggleContext } from "../../forms/FormElementToggleContext";
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
	pubId: PubsId;
	pubTypeId: PubTypes["id"];
	pubValues: PubValues;
	stageId?: StagesId;
	/** Is updating or creating? */
	isUpdating: boolean;
};

const hasNoValidPubFields = (pubFields: Props["pubFields"], schema: TObject<any>) => {
	return (
		pubFields.every((field) => field.schemaName == null) &&
		Object.keys(schema.properties).every(
			(field) => field === "pubTypeId" || field === "stageId"
		)
	);
};

type InferFormValues<T> = T extends UseFormReturn<infer V> ? V : never;

export function PubEditorClient(props: Props) {
	const hasValues = Object.keys(props.pubValues).length > 0;
	const paramString = hasValues ? "update" : "create";
	const runCreatePub = useServerAction(actions.createPub);
	const runUpdatePub = useServerAction(actions.updatePub);
	const availableStages = [
		{ id: undefined, name: "No stage" },
		...props.availableStages.map((s) => {
			return { id: s.id, name: s.name };
		}),
	];

	const path = usePathname();
	const router = useRouter();
	const searchParams = useSearchParams();

	const formElementToggle = useFormElementToggleContext();

	const urlSearchParams = new URLSearchParams(searchParams ?? undefined);
	urlSearchParams.delete(`${paramString}-pub-form`);
	const pathWithoutFormParam = `${path}?${urlSearchParams.toString()}`;

	// Have the client cache the first pubId it gets so that the pubId isn't changing
	// on re-render (only relevant on Create)
	const [pubId, _] = useState(props.pubId);

	const pubFieldsSchema = useMemo(
		() =>
			createPubEditorSchemaFromPubFields(
				props.pubFields.filter((field) => formElementToggle.isEnabled(field.slug))
			),
		[props.pubFields, formElementToggle]
	);

	const noValidPubFields = useMemo(
		() => hasNoValidPubFields(props.pubFields, pubFieldsSchema),
		[pubFieldsSchema, props.pubFields]
	);

	const resolver = useMemo(() => typeboxResolver(pubFieldsSchema), [pubFieldsSchema]);

	const form = useForm({
		defaultValues: createPubEditorDefaultValuesFromPubFields(
			props.pubFields,
			props.pubValues,
			props.pubTypeId,
			props.stageId
		),
		resolver,
		reValidateMode: "onBlur",
	});

	// Re-validate the form when fields are toggled on/off.
	useEffect(() => {
		form.trigger(
			Object.keys(form.formState.touchedFields) as unknown as FieldPath<
				InferFormValues<typeof form>
			>
		);
	}, [form, formElementToggle]);

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

	const onSubmit: SubmitHandler<Static<typeof pubFieldsSchema>> = async (data) => {
		const { pubTypeId, stageId, ...pubValues } = data;
		const enabledPubValues = Object.fromEntries(
			Object.entries(pubValues).filter(([slug]) => formElementToggle.isEnabled(slug))
		) as PubValues;

		if (props.isUpdating) {
			const result = await runUpdatePub({
				pubId,
				pubValues: enabledPubValues,
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
				pubId,
				communityId: props.communityId,
				parentId: props.parentId,
				pubTypeId: pubTypeId as PubTypesId,
				pubValues: enabledPubValues,
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
				{!props.isUpdating && (
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
									<Button
										size="sm"
										variant="outline"
										data-testid="stage-selector"
									>
										{field.value
											? availableStages.find(
													(stage) => stage.id === field.value
												)?.name
											: "No stage"}
										<ChevronDown size="16" />
									</Button>
								</DropdownMenuTrigger>
								<DropdownMenuContent>
									{availableStages.map((stage) => (
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
				{noValidPubFields && (
					<Notice
						title={`Trying to ${paramString} a deprecated PubType`}
						description="You can no longer edit or create Pubs of this PubType."
						variant="destructive"
					/>
				)}
				<Button
					type="submit"
					className="flex items-center gap-x-2"
					disabled={
						form.formState.isSubmitting || !form.formState.isValid || noValidPubFields
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
