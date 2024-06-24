"use client";

import { useState } from "react";

import { Button } from "ui/button";
import { Card, CardContent } from "ui/card";
import { Pencil } from "ui/icon";
import { Label } from "ui/label";

import type { PubTypeWithFieldIds } from "~/lib/types";
import { useServerAction } from "~/lib/serverActions";
import { addPubField } from "./actions";
import { FieldSelect } from "./FieldSelect";
import { useFields } from "./FieldsProvider";
import { RemoveFieldButton } from "./RemoveFieldButton";
import { RemoveTypeButton } from "./RemoveTypeButton";

type Props = {
	type: PubTypeWithFieldIds;
	superadmin: boolean;
};

const TypeBlock: React.FC<Props> = function ({ type, superadmin }) {
	const [expanded, setExpanded] = useState(false);
	const [editing, setEditing] = useState(false);
	const runAddPubField = useServerAction(addPubField);
	const fields = useFields();
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
						variant={expanded ? "secondary" : "ghost"}
						aria-label="Expand"
						onClick={() => {
							setExpanded(!expanded);
						}}
					>
						<img src="/icons/chevron-vertical.svg" alt="" />
					</Button>
					{superadmin && (
						<Button
							className="ml-1"
							size="icon"
							variant={editing ? "secondary" : "ghost"}
							aria-label="Edit"
							onClick={() => {
								setEditing(!editing);
							}}
						>
							<Pencil size="12" />
						</Button>
					)}
				</div>
				<div className="text-sm">{type.description}</div>
				{(expanded || editing) && (
					<div className="ml-4 mt-4">
						<h3 className="mb-2 font-semibold">Fields</h3>
						<ul>
							{Object.values(type.fields).map((fieldId) => {
								const field = fields[fieldId];
								return (
									<li key={field.id}>
										{editing && (
											<div className="mr-1 inline-flex">
												<RemoveFieldButton
													pubFieldId={field.id}
													pubTypeId={type.id}
												/>
											</div>
										)}
										{field.name}
									</li>
								);
							})}
						</ul>
					</div>
				)}
				{editing && (
					<div className="m-4">
						<Label className="my-1 block">
							Add additional fields to <span className="italic">{type.name}</span>
						</Label>
						<FieldSelect
							excludedFields={type.fields}
							onFieldSelect={(fieldId) => runAddPubField(type.id, fieldId)}
						/>
					</div>
				)}
			</CardContent>
		</Card>
	);
};
export default TypeBlock;
