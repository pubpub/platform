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

export const FormElement = ({ element }: { element: Form["elements"][number] }) => {
	const { schemaName, label, slug } = element;
	const community = useCommunity();
	if (!schemaName) {
		return null;
	}
	if (
		schemaName === CoreSchemaType.String ||
		schemaName === CoreSchemaType.Email ||
		schemaName === CoreSchemaType.URL
	) {
		// TODO: figure out what kind of text element the user wanted (textarea vs input)
		return <TextElement label={label ?? ""} name={slug} />;
	}
	if (schemaName === CoreSchemaType.Boolean) {
		return <input type="checkbox"></input>;
	}
	if (schemaName === CoreSchemaType.UserId) {
		return (
			<UserSelectClient
				community={community}
				fieldLabel={label ?? ""}
				fieldName="todo"
				users={[]}
				queryParamName="todo"
			/>
		);
	}
	return <div>todo</div>;
};
