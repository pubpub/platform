"use client";
import { useState } from "react";
import { Card, CardContent } from "@/packages/ui/src/Card";
import { Button } from "@/packages/ui/src/Button";
import { TypesData } from "./page";

type Props = { type: NonNullable<TypesData>[number] };

const TypeBlock: React.FC<Props> = function ({ type }) {
	const [expanded, setExpanded] = useState(false);
	return (
		<Card>
			<CardContent>
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
						{expanded ? ">" : "<"}
					</Button>
				</div>
				<div className="text-sm">{type.description}</div>
				{expanded && (
					<div className="mt-4 ml-4">
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
