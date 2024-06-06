"use client";

import { GetPubResponseBody } from "contracts";
import { FormDescription, FormField, FormItem, FormLabel, FormMessage } from "ui/form";
import { Input } from "ui/input";

import type { StagePub } from "~/app/c/[communitySlug]/stages/manage/components/panel/queries";

export const OutputMapFieldType =
	(pub: StagePub) =>
	({ field, ...props }) => {
		return (
			<>
				<hr />
				<h3>Output map</h3>
				<span className="text-sm text-gray-500">
					Choose what output props get mapped to which pub fields. E.g. if you put{" "}
					<code>name</code> in the "pubpub:title" field, the pubs "pubpub:content" value
					will be set to <code>res.json()["name"]</code>
				</span>
				{pub.values.map((value) => {
					return (
						<FormField
							key={value.id}
							name={`${field.name}.${value.field.slug}`}
							render={(pr) => {
								const { field } = pr;
								return (
									<FormItem>
										<FormLabel>{value.field.name}</FormLabel>
										<FormDescription>{value.field.slug}</FormDescription>
										<Input required={false} {...field}></Input>
										<FormMessage />
									</FormItem>
								);
							}}
						/>
					);
				}) ?? []}
			</>
		);
	};
