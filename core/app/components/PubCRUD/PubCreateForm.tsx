"use client";

import { useCallback, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ajvResolver } from "@hookform/resolvers/ajv";
import Ajv from "ajv";
import { fullFormats } from "ajv-formats/dist/formats";
import { useForm } from "react-hook-form";

import type { CommunitiesId } from "db/public/Communities";
import type { PubFields } from "db/public/PubFields";
import type { PubFieldSchema } from "db/public/PubFieldSchema";
import type { PubTypes } from "db/public/PubTypes";
import type { Stages } from "db/public/Stages";
import { buildSchemaFromPubFields, SchemaBasedFormFields } from "@pubpub/sdk/react";
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

import { useServerAction } from "~/lib/serverActions";
import * as actions from "./actions";

export const PubCreateForm = ({
	communityId,
	availableStages,
	availablePubTypes,
	currentStage = null,
}: {
	communityId: CommunitiesId;
	availableStages: Pick<Stages, "id" | "name" | "order">[];

	availablePubTypes: (Pick<PubTypes, "id" | "name" | "description"> & {
		fields: (Pick<PubFields, "id" | "name" | "pubFieldSchemaId" | "slug"> & {
			schema: Pick<PubFieldSchema, "id" | "namespace" | "name" | "schema"> | null;
		})[];
	})[];
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

		const uncompiledSchema = buildSchemaFromPubFields(
			//  @ts-expect-error FIXME: Schema types are different
			selectedPubType as {
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

	const path = usePathname();
	const searchParams = useSearchParams();
	const router = useRouter();

	const urlSearchParams = new URLSearchParams(searchParams ?? undefined);
	urlSearchParams.delete("create-pub-form");
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

		const result = await runCreatePub({
			communityId,
			path: pathWithoutFormParam,
			stageId: selectedStage?.id,
			pubTypeId: selectedPubType?.id,
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
				description: result.report,
			});
			closeForm();
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
