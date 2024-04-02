"use client";

import { useState } from "react";

import { Button } from "ui/button";
import { Card, CardContent } from "ui/card";

import { TypesData } from "./page";

type Props = { type: NonNullable<TypesData>[number] };

const TypeBlock: React.FC<Props> = function ({ type }) {
	const [expanded, setExpanded] = useState(false);
	return (
		<Card>
			<CardContent className="px-6 py-2">
				<div className="flex items-center justify-between">
					<div className="font-bold">{type.name}</div>
					<Button
						size="icon"
						variant="ghost"
						aria-label="Expand"
						onClick={() => {
							setExpanded(!expanded);
						}}
					>
						<img src="/icons/chevron-vertical.svg" />
					</Button>
				</div>
				<div className="text-sm">{type.description}</div>
				{expanded && (
					<div className="ml-4 mt-4">
						<ul>
							{type.fields.map((field) => {
								return <li key={field.id}>{field.name}</li>;
							})}
						</ul>
					</div>
				)}
			</CardContent>
		</Card>
	);
};
export default TypeBlock;
