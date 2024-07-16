import type { ReactNode } from "react";
import type { UseFormReturn } from "react-hook-form";

import { useCallback } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { CoreSchemaType } from "schemas";
import { z } from "zod";

import {
	Form,
	FormControl,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "ui/form";
import { BoxSelect, CalendarClock, CheckSquare, ImagePlus, Link, Mail, Type, User } from "ui/icon";
import { Input } from "ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "ui/select";
import { toast } from "ui/use-toast";

import { useCommunity } from "~/app/components/providers/CommunityProvider";
import { didSucceed, useServerAction } from "~/lib/serverActions";
import { slugifyString } from "~/lib/string";
import * as actions from "./actions";

const schema = z.object({
	id: z.string(),
	name: z.string(),
	schemaName: z.nativeEnum(CoreSchemaType),
});

type FormValues = z.infer<typeof schema>;

const DEFAULT_VALUES = {
	id: "",
	name: "",
	schemaName: null,
};

const SCHEMA_TYPES: Record<CoreSchemaType, { description: string; icon: ReactNode }> = {
	[CoreSchemaType.Boolean]: {
		description: "A true or false value",
		icon: <CheckSquare className="w-4" />,
	},
	[CoreSchemaType.String]: {
		description: "Text of any length",
		icon: <Type className="w-4" />,
	},
	[CoreSchemaType.DateTime]: {
		description: "A moment in time",
		icon: <CalendarClock className="w-4" />,
	},
	[CoreSchemaType.Email]: { description: "An email address", icon: <Mail className="w-4" /> },
	[CoreSchemaType.FileUpload]: {
		description: "A file uploader",
		icon: <ImagePlus className="w-4" />,
	},
	[CoreSchemaType.URL]: { description: "A link to a website", icon: <Link className="w-4" /> },
	[CoreSchemaType.UserId]: { description: "A PubPub user ID", icon: <User className="w-4" /> },
	[CoreSchemaType.Vector3]: {
		description: "A set of 3 numbers",
		icon: <BoxSelect className="w-4" />,
	},
};

const SchemaSelectField = ({
	form,
	isDisabled,
}: {
	form: UseFormReturn<
		{
			name: string;
			schemaName: CoreSchemaType | null;
		},
		any,
		undefined
	>;
	isDisabled?: boolean;
}) => {
	const schemaTypes = Object.values(CoreSchemaType);

	return (
		<FormField
			control={form.control}
			name="schemaName"
			render={({ field }) => (
				<FormItem>
					<FormLabel>Select a format</FormLabel>
					<Select
						onValueChange={field.onChange}
						defaultValue={field.value ?? undefined}
						disabled={isDisabled}
					>
						<FormControl>
							<SelectTrigger>
								<SelectValue placeholder="Select one" />
							</SelectTrigger>
						</FormControl>
						<SelectContent>
							{schemaTypes.map((schemaName) => {
								const schemaData = SCHEMA_TYPES[schemaName];
								return (
									<SelectItem key={schemaName} value={schemaName}>
										<div className="flex items-center gap-2">
											{schemaData.icon}
											<div className="flex flex-col items-start font-medium">
												<div>{schemaName}</div>
												<div className="text-xs text-muted-foreground">
													{schemaData.description}
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
					<FormMessage />
				</FormItem>
			)}
		/>
	);
};

export const FieldForm = ({
	defaultValues,
	onSubmitSuccess,
	children,
}: {
	defaultValues?: { name: string; schemaName: CoreSchemaType | null };
	onSubmitSuccess: () => void;
	children: ReactNode;
}) => {
	const createField = useServerAction(actions.createField);
	const updateFieldName = useServerAction(actions.updateFieldName);
	const community = useCommunity();
	const isEditing = !!defaultValues;

	const handleCreate = useCallback(async (values: FormValues & { slug: string }) => {
		const result = await createField(values.name, values.slug, values.schemaName);
		if (didSucceed(result)) {
			toast({ title: `Created field ${values.name}` });
			onSubmitSuccess();
		}
	}, []);

	const handleUpdate = useCallback(async (values: FormValues) => {
		const result = await updateFieldName(values.id, values.name);
		if (didSucceed(result)) {
			toast({ title: `Updated field ${values.name}` });
			onSubmitSuccess();
		}
	}, []);

	const handleSubmit = async (values: FormValues) => {
		if (isEditing) {
			handleUpdate(values);
			return;
		}

		const slug = `${community?.slug}:${slugifyString(values.name)}`;
		handleCreate({ ...values, slug });
	};

	const form = useForm({
		defaultValues: defaultValues ?? DEFAULT_VALUES,
		resolver: zodResolver(schema),
	});

	return (
		<Form {...form}>
			<form onSubmit={form.handleSubmit(handleSubmit)}>
				<div className="mb-4 flex flex-col gap-6">
					{/* Schema field is disabled if one has previously been selected */}
					<SchemaSelectField isDisabled={!!defaultValues?.schemaName} form={form} />
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
				</div>
				{children}
			</form>
		</Form>
	);
};
