import type { ReactNode } from "react";
import type { UseFormReturn } from "react-hook-form";

import { useCallback, useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { SCHEMA_TYPES_WITH_ICONS } from "schemas";
import { z } from "zod";

import { CoreSchemaType } from "db/public";
import { Checkbox } from "ui/checkbox";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "ui/select";
import { toast } from "ui/use-toast";
import { cn } from "utils";

import type { MaybeHas } from "~/lib/types";
import { useCommunity } from "~/app/components/providers/CommunityProvider";
import { didSucceed, useServerAction } from "~/lib/serverActions";
import { slugifyString } from "~/lib/string";
import * as actions from "./actions";

const baseSchema = z.object({
	id: z.string(),
	name: z.string().min(1),
	slug: z
		.string()
		.min(1)
		.refine((s) => !s.includes(" "), { message: "Slug must not have spaces" }),
});

const schema = z.discriminatedUnion("isRelation", [
	z
		.object({
			isRelation: z.literal(true),
			schemaName: z.nativeEnum(CoreSchemaType).nullable(),
		})
		.merge(baseSchema),
	z
		.object({
			isRelation: z.literal(false),
			schemaName: z.nativeEnum(CoreSchemaType, {
				errorMap: () => {
					return { message: "Please select a schema type for this field" };
				},
			}),
		})
		.merge(baseSchema),
]);

type FormValues = z.infer<typeof schema>;

const DEFAULT_VALUES = {
	id: "",
	name: "",
	// can't be `null` and `isRelation: false` by default so should be undefined
	schemaName: undefined,
	slug: "",
	isRelation: false,
} as const;

type FormType = UseFormReturn<FormValues, any, undefined>;

const SchemaSelectField = ({ form, isDisabled }: { form: FormType; isDisabled?: boolean }) => {
	const schemaTypes = Object.values(CoreSchemaType).filter((v) => v !== CoreSchemaType.Null);

	return (
		<FormField
			control={form.control}
			name="schemaName"
			render={({ field }) => (
				<FormItem>
					<FormLabel disabled={isDisabled}>Select a format</FormLabel>
					<Select
						onValueChange={field.onChange}
						defaultValue={field.value ?? undefined}
						disabled={isDisabled}
					>
						<FormControl>
							<SelectTrigger>
								<SelectValue
									aria-label={field.value ?? undefined}
									placeholder="Select one"
								>
									{field.value}
								</SelectValue>
							</SelectTrigger>
						</FormControl>
						<SelectContent>
							{schemaTypes.map((schemaName) => {
								const { description, icon: Icon } =
									SCHEMA_TYPES_WITH_ICONS[schemaName];
								return (
									<SelectItem
										data-testid={`select-${schemaName}`}
										key={schemaName}
										value={schemaName}
									>
										<div className="flex items-center gap-2">
											<Icon className="w-4" />
											<div className="flex flex-col items-start font-medium">
												<div>{schemaName}</div>
												<div className="text-xs text-muted-foreground">
													{description}
												</div>
											</div>
										</div>
									</SelectItem>
								);
							})}
						</SelectContent>
					</Select>
					<FormDescription>
						Defines the foundational structure of the field's data
					</FormDescription>
					<FormMessage data-testid="schema-select-form-message" />
				</FormItem>
			)}
		/>
	);
};

/**
 * This field watches the `name` field and will try to autogenerate a slug from it.
 * The user can overwrite this value via the text input. The value here does not have
 * the community prepended—the community is automatically prepended in handleSubmit
 */
const SlugField = ({
	form,
	communitySlug,
	readOnly,
}: {
	form: FormType;
	communitySlug: string;
	readOnly?: boolean;
}) => {
	const { watch, setValue } = form;

	const watchName = watch("name");

	useEffect(() => {
		if (!readOnly) {
			const autoSlug = slugifyString(watchName);
			setValue("slug", autoSlug);
		}
	}, [watchName]);

	return (
		<FormField
			control={form.control}
			name="slug"
			render={({ field }) => {
				return (
					<FormItem>
						<FormLabel disabled={readOnly}>Slug</FormLabel>
						<FormControl>
							{/* If readonly, only render a disabled input */}
							{readOnly ? (
								<Input placeholder="Slug" disabled {...field} />
							) : (
								// Otherwise, add a readonly slug, then an Input which the user can change
								<div className="mr-2 flex items-baseline rounded-md border border-input text-sm">
									<span
										className={cn("whitespace-nowrap pl-2", {
											"opacity-50": readOnly,
										})}
									>
										{communitySlug}:
									</span>
									<Input
										placeholder="Slug"
										// A little margin on focus or else the focus ring will cover the `:` after the community name
										className="border-none pl-0 focus:ml-1"
										{...field}
									/>
								</div>
							)}
						</FormControl>
						<FormMessage />
					</FormItem>
				);
			}}
		/>
	);
};

const IsRelationCheckbox = ({ form, isDisabled }: { form: FormType; isDisabled: boolean }) => {
	return (
		<FormField
			control={form.control}
			name="isRelation"
			render={({ field }) => (
				<FormItem>
					<div className="flex items-center gap-2">
						<FormControl>
							<Checkbox
								disabled={isDisabled}
								checked={field.value}
								onCheckedChange={(change) => {
									if (typeof change === "boolean") {
										field.onChange(change);
									}
								}}
								className="rounded"
								data-testid="isRelation-checkbox"
							/>
						</FormControl>
						<FormLabel disabled={isDisabled}>
							This field represents a reference to another Pub
						</FormLabel>
					</div>
					<FormDescription>
						Selecting this option will allow you to add a list of related Pubs to any
						Pubs with this field
					</FormDescription>
					<FormMessage />
				</FormItem>
			)}
		/>
	);
};

export type DefaultFieldFormValues = MaybeHas<FormValues, "id">;

export const FieldForm = ({
	defaultValues,
	onSubmitSuccess,
	children,
}: {
	defaultValues?: DefaultFieldFormValues;
	onSubmitSuccess: () => void;
	children: ReactNode;
}) => {
	const createField = useServerAction(actions.createField);
	const updateFieldName = useServerAction(actions.updateFieldName);
	const community = useCommunity();
	const isEditing = !!defaultValues;

	const handleCreate = useCallback(
		async (values: FormValues & { schemaName: CoreSchemaType }) => {
			const result = await createField({
				name: values.name,
				slug: values.slug,
				schemaName: values.schemaName,
				communityId: community.id,
				isRelation: values.isRelation,
			});
			if (didSucceed(result)) {
				toast({ title: `Created field ${values.name}` });
				onSubmitSuccess();
			}
		},
		[]
	);

	const handleUpdate = useCallback(async (values: FormValues) => {
		const result = await updateFieldName(values.id, values.name);
		if (didSucceed(result)) {
			toast({ title: `Updated field ${values.name}` });
			onSubmitSuccess();
		}
	}, []);

	const handleSubmit = async (
		values: FormValues & { schemaName: CoreSchemaType | null | undefined }
	) => {
		if (isEditing) {
			handleUpdate(values);
			return;
		}

		const slug = `${community?.slug}:${slugifyString(values.slug)}`;
		const schemaName = values.schemaName ?? CoreSchemaType.Null;
		handleCreate({ ...values, slug, schemaName });
	};

	const form = useForm<FormValues>({
		defaultValues: defaultValues ?? DEFAULT_VALUES,
		resolver: zodResolver(schema),
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
								<FormLabel>Field Name</FormLabel>
								<FormControl>
									<Input placeholder="Name" {...field} />
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
					<SlugField form={form} communitySlug={community.slug} readOnly={isEditing} />
					<IsRelationCheckbox form={form} isDisabled={isEditing} />
					{/* Schema field is disabled if one has previously been selected */}
					<SchemaSelectField isDisabled={!!defaultValues?.schemaName} form={form} />
				</div>
				{children}
			</form>
		</Form>
	);
};
