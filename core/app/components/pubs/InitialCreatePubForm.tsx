"use client";

import type { Static } from "@sinclair/typebox";
import type { UseFormReturn } from "react-hook-form";

import { useCallback, useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { typeboxResolver } from "@hookform/resolvers/typebox";
import { Type } from "@sinclair/typebox";
import QueryString from "qs";
import { useForm } from "react-hook-form";

import type { PubsId, StagesId } from "db/public";
import type { DeepPartial } from "utils/types";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "ui/select";
import { FormSubmitButton } from "ui/submit-button";

import type { PubTypeWithForm } from "~/lib/authorization/capabilities";
import type { PubField } from "~/lib/types";
import { formSwitcherUrlParam } from "../FormSwitcher/FormSwitcher";
import { useCommunity } from "../providers/CommunityProvider";

const PubTypeSelector = ({ pubTypes }: { pubTypes: PubTypeWithForm }) => {
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
					<FormDescription>Choose a pub type for the pub</FormDescription>
					<FormMessage />
				</FormItem>
			)}
		/>
	);
};

const RelatedPubFieldSelector = ({
	pubFields,
	form,
}: {
	pubFields: Props["relatedPubFields"];
	form: UseFormReturn<Schema>;
}) => {
	if (pubFields.length === 0) {
		return null;
	}
	return (
		<>
			<FormField
				control={form.control}
				name="relatedPub.relatedFieldSlug"
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
		</>
	);
};

const schema = Type.Object({
	pubTypeId: Type.String(),
	relatedPub: Type.Optional(
		Type.Object({
			relatedPubId: Type.String(),
			relatedFieldSlug: Type.String(),
		})
	),
});

type Schema = Static<typeof schema>;

interface Props {
	pubTypes: PubTypeWithForm;
	relatedPubFields: Pick<PubField, "id" | "slug" | "name" | "schemaName">[];
	stageId?: StagesId;
	relatedPubId?: PubsId;
}

declare const x: {
	form: string | undefined;
	relatedPubId?: string | undefined;
	relatedFieldSlug?: string | undefined;
	stageId?: StagesId | undefined;
	pubTypeId: string;
};

declare let y: Record<string, string>;

/** The first step in creating a pub—choosing a pub type, and possibly a related pub */
export const InitialCreatePubForm = ({
	pubTypes,
	relatedPubFields,
	stageId,
	relatedPubId,
}: Props) => {
	const defaultValues = useMemo(() => {
		const defaultValues = {
			pubTypeId: undefined,
		} satisfies DeepPartial<Schema>;
		if (relatedPubId) {
			return {
				...defaultValues,
				relatedPub: {
					relatedPubId,
					relatedFieldSlug: undefined,
				},
			} satisfies DeepPartial<Schema>;
		}
		return defaultValues;
	}, [relatedPubId]);

	const form = useForm<Schema>({
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

	const onSubmit = async (values: Schema) => {
		const formSwitcherUrlParamValue = pubTypes.find(
			(pubType) => pubType.id === values.pubTypeId
		)?.slug;

		const pubParams = QueryString.stringify(
			{
				pubTypeId: values.pubTypeId,
				...(stageId ? { stageId } : {}),
				...("relatedPub" in values ? values.relatedPub : {}),
				...(formSwitcherUrlParamValue
					? { [formSwitcherUrlParam]: formSwitcherUrlParamValue }
					: {}),
			},
			{
				skipNulls: true,
			}
		);
		const createPubPath = `/c/${community.slug}/pubs/create?${pubParams.toString()}`;
		router.push(createPubPath);
	};

	return (
		<Form {...form}>
			<form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-y-4">
				<PubTypeSelector pubTypes={pubTypes} />
				<RelatedPubFieldSelector pubFields={relatedPubFields} form={form} />
				<div className="flex w-full items-center justify-end gap-x-4">
					<Button type="button" onClick={closeForm} variant="outline">
						Cancel
					</Button>
					<FormSubmitButton
						formState={form.formState}
						disabled={!form.formState.isValid}
						idleText="Create Pub"
						successText="Redirecting..."
						pendingText="Redirecting..."
						isSubmitting={form.formState.isSubmitSuccessful}
					/>
				</div>
			</form>
		</Form>
	);
};
