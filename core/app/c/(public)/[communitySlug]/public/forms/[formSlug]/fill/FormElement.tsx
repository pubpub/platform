"use client";

import { useFormContext } from "react-hook-form";

import type { InputProps } from "ui/input";
import { CoreSchemaType } from "db/public";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "ui/form";
import { Input } from "ui/input";

import type { Form } from "~/lib/server/form";
import { useCommunity } from "~/app/components/providers/CommunityProvider";
import { UserSelectClient } from "~/app/components/UserSelect/UserSelectClient";

const TextElement = ({ label, name, ...rest }: { label: string; name: string } & InputProps) => {
	const { control } = useFormContext();

	return (
		<FormField
			control={control}
			name={name}
			render={({ field }) => {
				const { value, ...fieldRest } = field;
				return (
					<FormItem>
						<FormLabel>{label}</FormLabel>
						<FormControl>
							<Input value={value ?? ""} {...fieldRest} {...rest} />
						</FormControl>
						<FormMessage />
					</FormItem>
				);
			}}
		/>
	);
};

const BooleanElement = ({ label, name, ...rest }: { label: string; name: string } & InputProps) => {
	const { control } = useFormContext();

	return (
		<FormField
			control={control}
			name={name}
			render={({ field }) => {
				return (
					<FormItem className="relative">
						<div className="flex items-center gap-2">
							<FormControl>
								<input type="checkbox" className="rounded" {...field} {...rest} />
							</FormControl>
							<FormLabel>{label}</FormLabel>
						</div>
						<FormMessage />
					</FormItem>
				);
			}}
		/>
	);
};

const UserIdSelect = ({ label, name, id }: { label: string; name: string; id: string }) => {
	const community = useCommunity();
	const queryParamName = `user-${id}`;
	return (
		<UserSelectClient
			community={community}
			fieldLabel={label}
			fieldName={name}
			users={[]} // TODO
			queryParamName={queryParamName}
		/>
	);
};

export const FormElement = ({ element }: { element: Form["elements"][number] }) => {
	const { schemaName, label: labelProp, slug } = element;
	const label = labelProp ?? "";

	if (!schemaName) {
		return null;
	}
	if (
		schemaName === CoreSchemaType.String ||
		schemaName === CoreSchemaType.Email ||
		schemaName === CoreSchemaType.URL
	) {
		// TODO: figure out what kind of text element the user wanted (textarea vs input)
		return <TextElement label={label} name={slug} />;
	}
	if (schemaName === CoreSchemaType.Boolean) {
		return <BooleanElement label={label} name={slug} />;
	}
	if (schemaName === CoreSchemaType.UserId) {
		return <UserIdSelect label={label} name={slug} id={element.elementId} />;
	}
	return <div>todo</div>;
};
