"use client";

import { useState } from "react";

import { Button } from "ui/button";
import { Card, CardContent } from "ui/card";
import { Pencil } from "ui/icon";

import type { PubTypeWithFields } from "~/lib/types";
import { AddField } from "./AddField";
import { RemoveFieldButton } from "./RemoveFieldButton";
import { RemoveTypeButton } from "./RemoveTypeButton";

type Props = {
	type: PubTypeWithFields;
	superadmin: boolean;
};

const TypeBlock: React.FC<Props> = function ({ type, superadmin }) {
	const [expanded, setExpanded] = useState(false);
	const [editing, setEditing] = useState(false);
	return (
		<Card>
			<CardContent className="px-6 py-2">
				<div className="flex items-center justify-between">
					<div className="flex-grow font-bold">
						{type.name}
						{editing && (
							<div className="ml-1 inline-flex font-normal">
								<RemoveTypeButton pubTypeId={type.id} />
							</div>
						)}
					</div>
					<Button
						size="icon"
						variant="ghost"
						aria-label="Expand"
						onClick={() => {
							setExpanded(!expanded);
						}}
					>
						<img src="/icons/chevron-vertical.svg" alt="" />
					</Button>
					{superadmin && (
						<>
							<Button
								size="icon"
								variant={editing ? "secondary" : "ghost"}
								aria-label="Edit"
								onClick={() => {
									setEditing(!editing);
								}}
							>
								<Pencil size="12" />
							</Button>
						</>
					)}
				</div>
				<div className="text-sm">{type.description}</div>
				{(expanded || editing) && (
					<div className="ml-4 mt-4">
						<ul>
							{type.fields.map((field) => {
								return (
									<li key={field.id}>
										{field.name}
										{editing && (
											<div className="ml-1 inline-flex">
												<RemoveFieldButton
													pubFieldId={field.id}
													pubTypeId={type.id}
												/>
											</div>
										)}
									</li>
								);
							})}
						</ul>
					</div>
				)}
				{editing && (
					<AddField
						excludedFields={type.fields.map((field) => field.id)}
						pubTypeId={type.id}
					/>
				)}
			</CardContent>
		</Card>
	);
};
export default TypeBlock;
