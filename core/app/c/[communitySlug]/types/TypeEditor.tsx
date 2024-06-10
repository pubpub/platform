"use client";

import React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "ui/button";
import { Form, FormField, FormItem, FormLabel } from "ui/form";
import { Trash } from "ui/icon";
import { Input } from "ui/input";

import type { PubTypeWithFields } from "~/lib/types";
import { AddField } from "./AddField";

type Props = {
	type: PubTypeWithFields;
};

const schema = z.object({
	name: z.string(),
	fields: z.array(z.string()), // array of field ids
});

export const TypeEditor = ({ type }: Props) => {
	const form = useForm<z.infer<typeof schema>>({
		resolver: zodResolver(schema),
	});

	const [openFieldSelect, setFieldSelectOpen] = React.useState(false);
	const [newField, setNewField] = React.useState("");

	const removeField = () => {};

	return (
		<div className="ml-4 mt-4">
			<Form {...form}>
				<form>
					<FormField
						control={form.control}
						name="name"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Type Name</FormLabel>
								<Input type="text" defaultValue={type.name}></Input>
							</FormItem>
						)}
					></FormField>
					{type.fields.map((pubField) => (
						<FormField
							key={pubField.id}
							control={form.control}
							name="fields"
							render={({ field }) => (
								<FormItem>
									<Button
										variant="secondary"
										size="sm"
										className="flex gap-2"
										onClick={() => {}}
									>
										<Trash size={14} />
										Remove
									</Button>
									<FormLabel>
										{pubField.name} ({pubField.slug})
									</FormLabel>
								</FormItem>
							)}
						></FormField>
					))}
					<AddField pubTypeId={type.id} />
				</form>
			</Form>
		</div>
	);
};
