"use client";

import { useMemo, useState } from "react";
import { ajvResolver } from "@hookform/resolvers/ajv";
import Ajv from "ajv";
import { fullFormats } from "ajv-formats/dist/formats";
import { useForm } from "react-hook-form";

import type { CommunitiesId, PubFields, PubFieldSchema, PubsId, PubTypes, Stages } from "db/public";
import { buildSchemaFromPubFields, SchemaBasedFormFields } from "@pubpub/sdk/react";
import { CoreSchemaType } from "db/public";
import { Button } from "ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "ui/dropdown-menu";
import { Form, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "ui/form";
import { ChevronDown, Loader2, Plus } from "ui/icon";
import { toast } from "ui/use-toast";

import { useSearchParamModal } from "~/lib/client/useSearchParamModal";
import { useServerAction } from "~/lib/serverActions";
import * as actions from "./actions";
import { createPubCRUDSearchParam } from "./pubCRUDSearchParam";

export const PubCreateForm = ({
	communityId,
	availableStages,
	availablePubTypes,
	currentStage = null,
	parentId,
	__hack__memberIdField,
}: {
	communityId: CommunitiesId;
	availableStages: Pick<Stages, "id" | "name" | "order">[];
	parentId?: PubsId;

	availablePubTypes: (Pick<PubTypes, "id" | "name" | "description"> & {
		fields: (Pick<PubFields, "id" | "name" | "pubFieldSchemaId" | "slug" | "schemaName"> & {
			schema: Pick<PubFieldSchema, "id" | "namespace" | "name" | "schema"> | null;
		})[];
	})[];
	__hack__memberIdField?: React.ReactNode;
} & {
	currentStage?: Pick<Stages, "id" | "name" | "order"> | null;
}) => {
	const [selectedPubType, setSelectedPubType] = useState<
		(typeof availablePubTypes)[number] | null
	>(null);

	const [selectedStage, setSelectedStage] = useState<typeof currentStage>(currentStage);

	const { compiledSchema, uncompiledSchema } = useMemo(() => {
		if (!selectedPubType) {
			return { compiledSchema: null, uncompiledSchema: null };
		}

		const selectedPubTypeWithoutMemberIdField = {
			...selectedPubType,
			fields: selectedPubType.fields.filter(
				(field) => field.schemaName !== CoreSchemaType.MemberId
			),
		};

		const uncompiledSchema = buildSchemaFromPubFields(
			//  @ts-expect-error FIXME: Schema types are different
			selectedPubTypeWithoutMemberIdField as {
				__fakeType: "remove me when we figure out how to get rid of the above error";
			},
			[]
		);
		const compiledSchema = new Ajv({
			formats: fullFormats,
		}).addSchema(uncompiledSchema, "schema");
		return { compiledSchema, uncompiledSchema };
	}, [selectedPubType]);

	const form = useForm({
		mode: "onChange",
		reValidateMode: "onChange",
		resolver: uncompiledSchema
			? ajvResolver(uncompiledSchema, {
					formats: fullFormats,
				})
			: undefined,
	});

	const runCreatePub = useServerAction(actions.createPub);

	const { toggleModal } = useSearchParamModal({
		modalSearchParameter: createPubCRUDSearchParam({
			method: "create",
			identifyingString: currentStage?.id ?? communityId,
		}),
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

		const result = await runCreatePub({
			communityId,
			stageId: selectedStage?.id,
			pubTypeId: selectedPubType?.id,
			fields: Object.entries(values).reduce((acc, [key, value]) => {
				// -- hack
				if (key === "hack") {
					const pubTypeMemberField = selectedPubType?.fields.find(
						(field) => field.schemaName === CoreSchemaType.MemberId
					);
					if (!pubTypeMemberField) {
						throw new Error("Member field not found");
					}

					acc[pubTypeMemberField?.id] = { slug: pubTypeMemberField?.slug, value };
					return acc;
				}

				// -- hack

				const id = selectedPubType?.fields.find((f) => f.slug === key)?.id;
				if (id) {
					acc[id] = { slug: key, value };
				}
				return acc;
			}, {}),
			parentId,
		});

		if (result && "success" in result) {
			toast({
				title: "Success",
				description: result.report,
			});
			toggleModal(false);
		}
	};

	const memoizedForm = useMemo(() => {
		if (!selectedPubType || !compiledSchema) {
			return null;
		}
		return (
			<SchemaBasedFormFields
				compiledSchema={compiledSchema}
				key={selectedPubType.id}
				control={form.control}
				upload={() => {}}
			/>
		);
	}, [selectedPubType, compiledSchema]);

	return (
		<Form {...form}>
			<form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-y-4">
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
				{memoizedForm}
				{__hack__memberIdField &&
				selectedPubType?.fields.find(
					(field) => field.schemaName === CoreSchemaType.MemberId
				)
					? __hack__memberIdField
					: null}
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
};
