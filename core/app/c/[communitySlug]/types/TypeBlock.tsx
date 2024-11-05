"use client";

import { useState } from "react";

import type { CoreSchemaType, PubFieldsId } from "db/public";
import { Button } from "ui/button";
import { Card, CardContent } from "ui/card";
import { Check, ChevronDown, ChevronUp, Pencil } from "ui/icon";
import { Label } from "ui/label";
import { usePubFieldContext } from "ui/pubFields";
import { RadioGroup, RadioGroupItem } from "ui/radio-group";

import type { PubTypeWithFieldIds } from "~/lib/types";
import { useServerAction } from "~/lib/serverActions";
import { addPubField, updateTitleField } from "./actions";
import { FieldSelect } from "./FieldSelect";
import { RemoveFieldButton } from "./RemoveFieldButton";
import { RemoveTypeButton } from "./RemoveTypeButton";
import { pubFieldCanBeTitle } from "./utils";

type Props = {
	type: PubTypeWithFieldIds;
	allowEditing: boolean;
};

const IsTitleCell = ({
	pubField,
	isEditing,
	isTitle,
}: {
	pubField: { id: PubFieldsId; schemaName: CoreSchemaType | null };
	isEditing: boolean;
	isTitle: boolean;
}) => {
	if (isEditing) {
		if (pubFieldCanBeTitle(pubField)) {
			return <RadioGroupItem value={pubField.id} />;
		}
		return null;
	}
	if (isTitle) {
		return <Check size="16" />;
	}
	return null;
};

const TypeBlock: React.FC<Props> = function ({ type, allowEditing }) {
	const [expanded, setExpanded] = useState(false);
	const [editing, setEditing] = useState(false);
	const runAddPubField = useServerAction(addPubField);
	const runUpdateTitleField = useServerAction(updateTitleField);
	const fields = usePubFieldContext();
	const titleField = type.fields.filter((f) => f.isTitle)[0]?.id ?? "";
	const handleTitleFieldChange = async (newTitleField: string) => {
		await runUpdateTitleField(type.id, newTitleField as PubFieldsId);
	};
	return (
		<Card>
			<CardContent className="px-6 py-2">
				<div className="flex items-center justify-between">
					<h2 className="flex-grow font-bold">
						{type.name}
						{editing && (
							<div className="ml-1 inline-flex font-normal">
								<RemoveTypeButton pubTypeId={type.id} />
							</div>
						)}
					</h2>
					<Button
						size="icon"
						variant={"ghost"}
						aria-label="Expand"
						onClick={() => {
							setExpanded(!expanded);
						}}
					>
						{expanded ? <ChevronUp /> : <ChevronDown />}
					</Button>
					{allowEditing && (
						<Button
							className="ml-1"
							size="icon"
							variant={editing ? "secondary" : "ghost"}
							aria-label="Edit"
							onClick={() => {
								setEditing(!editing);
							}}
							data-testid={`edit-pubtype-${type.name}`}
						>
							<span className="sr-only">Edit Pub Type</span>
							<Pencil size="12" />
						</Button>
					)}
				</div>
				<div className="text-sm">{type.description}</div>
				{(expanded || editing) && (
					<div className="ml-2 mt-4">
						<RadioGroup
							defaultValue={titleField}
							onValueChange={handleTitleFieldChange}
							className="flex"
						>
							<table className="border-separate border-spacing-x-2 text-left">
								<thead>
									<tr>
										<th>Fields</th>
										<th>
											<span>Name</span>
											{editing ? (
												<p className="text-xs font-normal text-slate-500">
													The selected field will be used as the pub's
													name
												</p>
											) : null}
										</th>
									</tr>
								</thead>
								<tbody>
									{type.fields.map(({ id, isTitle }) => {
										const field = fields[id];
										return (
											<tr key={field.id}>
												<td>
													{editing && (
														<div className="mr-1 inline-flex">
															<RemoveFieldButton
																pubFieldId={field.id}
																pubTypeId={type.id}
															/>
														</div>
													)}
													{field.name} (
													<span className="bg-gray-100 font-mono">
														{field.slug}
													</span>
													)
												</td>
												<td>
													<IsTitleCell
														pubField={field}
														isTitle={isTitle}
														isEditing={editing}
													/>
												</td>
											</tr>
										);
									})}
								</tbody>
							</table>
						</RadioGroup>
					</div>
				)}
				{editing && (
					<div className="m-4">
						<Label className="my-1 block">
							Add additional fields to <span className="italic">{type.name}</span>
						</Label>
						<FieldSelect
							excludedFields={type.fields.map((f) => f.id)}
							onFieldSelect={(fieldId) => runAddPubField(type.id, fieldId)}
						/>
					</div>
				)}
			</CardContent>
		</Card>
	);
};
export default TypeBlock;
