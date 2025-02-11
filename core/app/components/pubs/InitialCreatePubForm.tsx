"use client";

import type { FieldValues } from "react-hook-form";

import { useCallback, useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { typeboxResolver } from "@hookform/resolvers/typebox";
import { Type } from "@sinclair/typebox";
import { useForm, useFormContext } from "react-hook-form";
import { getJsonSchemaByCoreSchemaType } from "schemas";

import type { PubsId, PubTypes, StagesId } from "db/public";
import { Button } from "ui/button";
import {
	Form,
	FormControl,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "ui/form";
import { Loader2 } from "ui/icon";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "ui/select";

import type { PubFieldElement } from "../forms/types";
import type { PubField } from "~/lib/types";
import { ConfigureRelatedValue } from "../forms/elements/RelatedPubsElement";
import { useCommunity } from "../providers/CommunityProvider";
import { makeFormElementDefFromPubFields } from "./PubEditor/helpers";

const PubTypeSelector = ({ pubTypes }: { pubTypes: Pick<PubTypes, "id" | "name">[] }) => {
	return (
		<FormField
			name="pubTypeId"
			render={({ field }) => (
				<FormItem className="flex flex-col gap-y-1">
					<div className="flex items-center justify-between">
						<FormLabel className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
							Pub type
						</FormLabel>
					</div>
					<Select
						{...field}
						onValueChange={(value) => {
							field.onChange(value);
						}}
						defaultValue={field.value}
					>
						<FormControl>
							<SelectTrigger>
								<SelectValue placeholder="Select a pub type" />
							</SelectTrigger>
						</FormControl>
						<SelectContent>
							{pubTypes.map((pubType) => (
								<SelectItem key={pubType.id} value={pubType.id}>
									{pubType.name}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
					<FormDescription>Choose a pub type to the pub</FormDescription>
					<FormMessage />
				</FormItem>
			)}
		/>
	);
};

const RelatedPubFieldSelector = ({ pubFields }: { pubFields: Props["relatedPubFields"] }) => {
	const { watch } = useFormContext<typeof schemaWithRelatedPub>();
	const relatedPubSlug = watch("relatedPub.slug");
	const selectedPubField = relatedPubSlug
		? pubFields.find((pf) => pf.slug === relatedPubSlug)
		: undefined;

	return (
		<>
			<FormField
				name="relatedPub.slug"
				render={({ field }) => (
					<FormItem className="flex flex-col gap-y-1">
						<div className="flex items-center justify-between">
							<FormLabel className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
								Relationship
							</FormLabel>
						</div>
						<Select
							{...field}
							onValueChange={(value) => {
								field.onChange(value);
							}}
							defaultValue={field.value}
						>
							<FormControl>
								<SelectTrigger>
									<SelectValue placeholder="Select a relationship type" />
								</SelectTrigger>
							</FormControl>
							<SelectContent>
								{pubFields.map((pubField) => (
									<SelectItem key={pubField.slug} value={pubField.slug}>
										{pubField.name}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
						<FormDescription>Choose the relationship type</FormDescription>
						<FormMessage />
					</FormItem>
				)}
			/>
			<RelatedPubValueSelector pubField={selectedPubField} />
		</>
	);
};

const RelatedPubValueSelector = ({
	pubField,
}: {
	pubField: Props["relatedPubFields"][number] | undefined;
}) => {
	if (!pubField) {
		return null;
	}
	const element = makeFormElementDefFromPubFields([pubField])[0] as PubFieldElement;
	return (
		<ConfigureRelatedValue
			element={element}
			pubId={"todo" as PubsId}
			slug="relatedPub.value"
			values={[]}
		/>
	);
};

const baseSchema = Type.Object({
	pubTypeId: Type.String(),
});
const schemaWithRelatedPub = Type.Object({
	pubTypeId: Type.String(),
	relatedPub: Type.Object({
		relatedPubId: Type.String(),
		slug: Type.String(),
		// TODO: getJsonSchemaByCoreSchemaType() ?
		value: Type.Any(),
	}),
});

export interface PubEditorSpecifiers {
	relatedPubId?: PubsId;
	stageId?: StagesId;
}

interface Props {
	pubTypes: Pick<PubTypes, "id" | "name">[];
	relatedPubFields: Pick<PubField, "id" | "slug" | "name" | "schemaName">[];
	editorSpecifiers: PubEditorSpecifiers;
}
/** The first step in creating a pub—choosing a pub type, and possibly a related pub */
export const InitialCreatePubForm = ({ pubTypes, relatedPubFields, editorSpecifiers }: Props) => {
	const hasRelatedPub = !!editorSpecifiers.relatedPubId;
	const { schema, defaultValues } = useMemo(() => {
		const defaultValues = { pubTypeId: undefined };
		if (editorSpecifiers.relatedPubId) {
			return {
				schema: schemaWithRelatedPub,
				defaultValues: {
					...defaultValues,
					relatedPub: {
						relatedPubId: editorSpecifiers.relatedPubId,
					},
				},
			};
		}
		return { schema: baseSchema, defaultValues };
	}, [editorSpecifiers.relatedPubId]);

	const form = useForm<typeof schema>({
		mode: "onChange",
		reValidateMode: "onChange",
		defaultValues,
		resolver: typeboxResolver(schema),
	});

	const path = usePathname();
	const searchParams = useSearchParams();
	const router = useRouter();
	const community = useCommunity();

	const pathWithoutFormParam = useMemo(() => {
		const urlSearchParams = new URLSearchParams(searchParams ?? undefined);
		urlSearchParams.delete("create-pub-form");
		return `${path}?${urlSearchParams.toString()}`;
	}, [path, searchParams]);

	const closeForm = useCallback(() => {
		router.replace(pathWithoutFormParam);
	}, [pathWithoutFormParam]);

	const onSubmit = async (values: FieldValues) => {
		const pubParams = new URLSearchParams({
			pubTypeId: values.pubTypeId,
			...editorSpecifiers,
			...(values.relatedPub || {}),
		});
		const createPubPath = `/c/${community.slug}/pubs/create?${pubParams.toString()}`;
		router.push(createPubPath);
	};

	return (
		<Form {...form}>
			<form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-y-4">
				<PubTypeSelector pubTypes={pubTypes} />
				{hasRelatedPub ? <RelatedPubFieldSelector pubFields={relatedPubFields} /> : null}

				<div className="flex w-full items-center justify-end gap-x-4">
					<Button type="button" onClick={closeForm} variant="outline">
						Cancel
					</Button>
					<Button
						type="submit"
						// disabled={form.formState.isSubmitting || !form.formState.isValid}
						className="flex items-center gap-x-2"
					>
						{form.formState.isSubmitting ? (
							<Loader2 className="h-4 w-4 animate-spin" />
						) : (
							"Create Pub"
						)}
					</Button>
				</div>
			</form>
		</Form>
	);
};
