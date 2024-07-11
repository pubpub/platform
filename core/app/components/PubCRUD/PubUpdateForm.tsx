"use client";

import { useCallback, useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ajvResolver } from "@hookform/resolvers/ajv";
import Ajv from "ajv";
import { fullFormats } from "ajv-formats/dist/formats";
import { useForm } from "react-hook-form";

import type { GetPubResponseBody } from "contracts";
import type { CommunitiesId } from "db/public/Communities";
import type { PubsId } from "db/public/Pubs";
import type { Stages, StagesId } from "db/public/Stages";
import { buildSchemaFromPubFields, SchemaBasedFormFields } from "@pubpub/sdk/react";
import { Button } from "ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "ui/dropdown-menu";
import { Form, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "ui/form";
import { ChevronDown, Loader2, Pencil } from "ui/icon";
import { toast } from "ui/use-toast";

import type { getPubType } from "~/lib/server/pubtype";
import { useServerAction } from "~/lib/serverActions";
import * as actions from "./actions";

export const PubUpdateForm = ({
	pub,
	pubType,
	availableStages,
	currentStage = null,
}: {
	pub: GetPubResponseBody;
	pubType: NonNullable<Awaited<ReturnType<ReturnType<typeof getPubType>["executeTakeFirst"]>>>;
	availableStages: Pick<Stages, "id" | "name" | "order">[];
	currentStage?: Pick<Stages, "id" | "name" | "order"> | null;
}) => {
	const { compiledSchema, uncompiledSchema } = useMemo(() => {
		const uncompiledSchema = buildSchemaFromPubFields(
			//  @ts-expect-error FIXME: Schema types are different
			pubType,
			[]
		);
		const compiledSchema = new Ajv({
			formats: fullFormats,
		}).addSchema(uncompiledSchema, "schema");
		return { compiledSchema, uncompiledSchema };
	}, [pubType]);

	const form = useForm({
		mode: "onChange",
		reValidateMode: "onChange",
		resolver: uncompiledSchema
			? ajvResolver(uncompiledSchema, {
					formats: fullFormats,
				})
			: undefined,
	});

	const runUpdatePub = useServerAction(actions.updatePub);

	const path = usePathname();
	const searchParams = useSearchParams();
	const router = useRouter();

	const urlSearchParams = new URLSearchParams(searchParams ?? undefined);
	urlSearchParams.delete("update-pub-form");
	const pathWithoutFormParam = `${path}?${urlSearchParams.toString()}`;

	const closeForm = useCallback(() => {
		router.replace(pathWithoutFormParam);
	}, [pathWithoutFormParam]);

	const onSubmit = async ({ stage, ...values }: { pubType: string; stage: string }) => {
		const result = await runUpdatePub({
			pubId: pub.id as PubsId,
			communityId: pubType.communityId as CommunitiesId,
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
	};

	const memoizedForm = useMemo(() => {
		if (!compiledSchema) {
			return null;
		}
		return (
			<SchemaBasedFormFields
				compiledSchema={compiledSchema}
				key={pubType.id}
				existingValues={pub.values}
				control={form.control}
				upload={() => {}}
			/>
		);
	}, [compiledSchema]);

	return (
		<Form {...form}>
			<form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-y-4">
				<FormField
					name="stage"
					control={form.control}
					rules={{
						required: false,
					}}
					render={({ field }) => (
						<FormItem aria-label="Stage" className="flex flex-col items-start gap-2">
							<FormLabel>Move Pub to a different Stage</FormLabel>
							<FormDescription>
								Select the stage you want to move your pub to
							</FormDescription>
							<DropdownMenu>
								<DropdownMenuTrigger asChild>
									<Button size="sm" variant="outline">
										{availableStages.find((s) => s.id === field.value)?.name ||
											currentStage?.name ||
											"Select Stage"}
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
				{memoizedForm}
				<Button
					type="submit"
					disabled={form.formState.isSubmitting || !form.formState.isValid}
					className="flex items-center gap-x-2"
				>
					{form.formState.isSubmitting ? (
						<Loader2 className="h-4 w-4 animate-spin" />
					) : (
						<>
							<Pencil size="12" />
							Update Pub
						</>
					)}
				</Button>
			</form>
		</Form>
	);
};
