"use client";

import type { PubFieldSchemaId, PubFieldsId } from "db/public";
import { CoreSchemaType } from "db/public";
import { FormControl, FormField, FormItem, FormLabel } from "ui/form";
import { Info } from "ui/icon";
import { usePubFieldContext } from "ui/pubFields";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "ui/select";
import { Tooltip, TooltipContent, TooltipTrigger } from "ui/tooltip";

import { defineCustomFormField } from "~/actions/_lib/custom-form-field/defineFormField";
import { action } from "./action";

type PubField = {
	id: PubFieldsId;
	name: string;
	slug: string;
	pubFieldSchemaId: PubFieldSchemaId | null;
};

export const OutputField = defineCustomFormField(
	action,
	"config",
	"outputField",
	function OutputField(
		{ form, fieldName },
		context: {
			/**
			 * The schema types that are allowed to be used as the output field.
			 */
			allowedSchemaTypes?: CoreSchemaType[];
		}
	) {
		const pubFields = Object.values(usePubFieldContext());

		const allowedPubFields = context.allowedSchemaTypes?.length
			? pubFields.filter((field) =>
					context.allowedSchemaTypes?.includes(field.schemaName as CoreSchemaType)
				)
			: pubFields;

		const itemName = "Output Field";

		const [title] = itemName.split("|");

		return (
			<FormField
				name={fieldName}
				render={({ field }) => {
					return (
						<FormItem className="flex flex-col gap-y-1">
							<FormLabel className="flex items-center gap-x-2 text-gray-700">
								<p>Field to write to</p>

								<Tooltip>
									<TooltipTrigger>
										<Info size="12" />
									</TooltipTrigger>
									<TooltipContent className="prose max-w-sm text-xs">
										The pub field to overwrite with the specified field of the
										response.{" "}
										<ul>
											<li>
												When configuring the action, you can select any pub
												field that is used in your community.{" "}
											</li>
											<li>
												When running the action manually, only the pub
												fields on the pub are available to select.
											</li>
										</ul>
									</TooltipContent>
								</Tooltip>
							</FormLabel>
							<FormControl>
								<Select onValueChange={field.onChange} {...field}>
									<SelectTrigger>
										<SelectValue placeholder="Select a field">
											{/* without the {" "} the field.value sometimes doesn't render, weird */}
											{field.value}{" "}
										</SelectValue>
									</SelectTrigger>
									<SelectContent>
										{allowedPubFields.map(({ name, slug }) => (
											<SelectItem value={slug} key={name}>
												{slug}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</FormControl>
						</FormItem>
					);
				}}
			/>
		);
	}
);

export default OutputField;
