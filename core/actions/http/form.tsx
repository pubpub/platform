"use client";

import { useEffect } from "react";

import { FieldSet } from "ui/field";
import { FieldOutputMap } from "ui/outputMap";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "ui/select";
import { Textarea } from "ui/textarea";

import { ActionField } from "../_lib/ActionField";
import { useActionForm } from "../_lib/ActionForm";

export default function HttpActionForm() {
	const { form } = useActionForm();
	const [method, response] = form.watch(["method", "response"]);
	console.log(form);

	useEffect(() => {
		form.setValue("outputMap", []);
	}, [response]);

	return (
		<FieldSet>
			<ActionField name="url" label="Request URL" />
			<ActionField
				name="method"
				label="Request Method"
				render={({ field, fieldState }) => (
					<Select
						{...field}
						defaultValue={field.value}
						onValueChange={field.onChange}
						aria-invalid={fieldState.invalid}
					>
						<SelectTrigger>
							<SelectValue
								aria-label={field.value ?? undefined}
								placeholder="Select one"
							>
								{field.value}
							</SelectValue>
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="GET">GET</SelectItem>
							<SelectItem value="POST">POST</SelectItem>
							<SelectItem value="PUT">PUT</SelectItem>
							<SelectItem value="PATCH">PATCH</SelectItem>
							<SelectItem value="DELETE">DELETE</SelectItem>
						</SelectContent>
					</Select>
				)}
			/>
			{method !== "GET" && (
				<ActionField
					name="body"
					label="Request Body"
					render={({ field, fieldState }) => (
						<Textarea {...field} id={field.name} aria-invalid={fieldState.invalid} />
					)}
				/>
			)}
			<ActionField name="authToken" label="Auth Token" />
			<ActionField
				name="response"
				label="Response Type"
				render={({ field, fieldState }) => {
					return (
						<Select
							{...field}
							defaultValue={field.value}
							onValueChange={field.onChange}
							aria-invalid={fieldState.invalid}
						>
							<SelectTrigger>
								<SelectValue
									aria-label={field.value ?? undefined}
									placeholder="Select one"
								>
									{field.value}
								</SelectValue>
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="json">JSON</SelectItem>
								<SelectItem value="text">Text</SelectItem>
								<SelectItem value="binary">Binary</SelectItem>
							</SelectContent>
						</Select>
					);
				}}
			/>
			<ActionField
				name="outputMap"
				render={({ field }) => (
					<FieldOutputMap
						disabled={response !== "json"}
						form={form}
						fieldName={field.name}
					/>
				)}
			/>
		</FieldSet>
	);
}
