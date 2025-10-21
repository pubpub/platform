import { useCallback } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";

import { Form, FormField } from "ui/form";
import { Input } from "ui/input";

import type { ActionFormProps } from "../_lib/types";
import { action } from "./action";

type T = z.infer<typeof action.config.schema>;

export default function LogActionForm(props: ActionFormProps) {
	const form = useForm<T>({
		resolver: zodResolver(action.config.schema),
	});
	const onSubmit = useCallback(
		(data: T) => {
			props.onSubmit(data, form);
		},
		[props, form]
	);
	return (
		<Form {...form}>
			<form onSubmit={form.handleSubmit(onSubmit)}>
				<FormField
					name="message"
					render={({ field }) => {
						return <Input {...field} placeholder="Log message" />;
					}}
				/>
			</form>
		</Form>
	);
}
