import type { Static } from "@sinclair/typebox";
import type { ReactNode } from "react";
import type { FieldValues, UseFormReturn } from "react-hook-form";

import { useCallback, useMemo } from "react";
import { typeboxResolver } from "@hookform/resolvers/typebox";
import { Type } from "@sinclair/typebox";
import { useForm } from "react-hook-form";
import { IdString } from "schemas/utils";

import type { PubFieldsId, PubTypesId } from "db/public";
import type { PubFieldContext } from "ui/pubFields";
import {
	Form,
	FormControl,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "ui/form";
import { Input } from "ui/input";
import { MultiSelect } from "ui/multi-select";
import { usePubFieldContext } from "ui/pubFields";
import { toast } from "ui/use-toast";

import { useCommunity } from "~/app/components/providers/CommunityProvider";
import { didSucceed, useServerAction } from "~/lib/serverActions";
import { updatePubType } from "./[pubTypeId]/edit/actions";
import { createPubType } from "./actions";

const baseSchema = Type.Object({
	name: Type.String({
		minLength: 2,
	}),
	description: Type.Optional(Type.String()),

	fields: Type.Array(IdString<PubFieldsId>(), {
		minItems: 1,
	}),
});

type FormValues = Static<typeof baseSchema>;
// type FormValues = Static<typeof createSchema>;

const DEFAULT_VALUES = {
	name: "",
	description: "",
};

type FormType = UseFormReturn<FormValues, any, FieldValues>;

export const NewTypeForm = ({
	onSubmitSuccess,
	children,
	...props
}: {
	onSubmitSuccess: (pubTypeId: PubTypesId) => void;
	children: ReactNode;
} & (
	| {
			mode: "create";
			pubTypeId?: never;
	  }
	| {
			mode: "edit";
			pubTypeId: PubTypesId;
			name: string;
			description?: string | null;
	  }
)) => {
	const runCreatePubType = useServerAction(createPubType);
	const runUpdatePubType = useServerAction(updatePubType);
	const pubFields = usePubFieldContext();
	const community = useCommunity();

	const handleSubmit = useCallback(async (values: FormValues) => {
		if (props.mode === "edit") {
			const result = await runUpdatePubType({
				pubTypeId: props.pubTypeId,
				name: values.name,
				description: values.description,
				fields: [],
			});
			if (result && didSucceed(result)) {
				toast({ title: `Type ${values.name} updated` });
				onSubmitSuccess(props.pubTypeId);
				return;
			}

			form.setError("root", { message: result.error });
			return;
		}

		const result = await runCreatePubType(
			values.name,
			community.id,
			values.description,
			values.fields
		);
		if (result && didSucceed(result)) {
			toast({ title: `Type ${values.name} created` });
			onSubmitSuccess(result.data.id);
			return;
		}

		form.setError("root", { message: result.error });
	}, []);

	const resolver = useMemo(() => {
		if (props.mode === "create") {
			return typeboxResolver(Type.Required(baseSchema));
		}

		return typeboxResolver(Type.Omit(baseSchema, ["fields"]));
	}, []);

	const form = useForm<FormValues>({
		defaultValues:
			props.mode === "create"
				? DEFAULT_VALUES
				: {
						name: props.name,
						description: props.description ?? "",
					},
		resolver,
	});

	return (
		<Form {...form}>
			<form onSubmit={form.handleSubmit(handleSubmit)}>
				<div className="mb-4 flex flex-col gap-6">
					<FormField
						control={form.control}
						name="name"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Type Name</FormLabel>
								<FormControl>
									<Input placeholder="Name" {...field} />
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
					<FormField
						control={form.control}
						name="description"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Description</FormLabel>
								<FormDescription>
									Optional. A brief description of the type.
								</FormDescription>
								<FormControl>
									<Input placeholder="Description" {...field} />
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
					{props.mode === "create" && <FieldSelector pubFields={pubFields} form={form} />}
					{form.formState.errors.root && (
						<div className="text-sm text-red-500">
							{form.formState.errors.root.message}
						</div>
					)}
				</div>
				{children}
			</form>
		</Form>
	);
};

export const FieldSelector = ({
	pubFields,
	form,
}: {
	pubFields: PubFieldContext;
	form: FormType;
}) => {
	return (
		<FormField
			control={form.control}
			name="fields"
			render={({ field }) => (
				<FormItem>
					<FormLabel>Fields</FormLabel>
					<FormDescription>
						Select the fields that will be included in the type (minimum of 1).
					</FormDescription>
					<MultiSelect
						onValueChange={field.onChange}
						defaultValue={field.value}
						options={Object.values(pubFields).map((field) => ({
							label: field.name,
							value: field.id,
						}))}
					/>
					<FormMessage />
				</FormItem>
			)}
		/>
	);
};
