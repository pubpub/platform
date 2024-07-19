"use client";

import type { Dispatch } from "react";

import { useState } from "react";

import type { PubFieldsId, StructuralFormElement } from "db/public";
import { ElementType } from "db/public";
import { Button } from "ui/button";
import { ChevronLeft, PlusCircle, Search, Type } from "ui/icon";
import { Input } from "ui/input";
import { usePubFieldContext } from "ui/pubFields";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "ui/tabs";

import type { InputElement, PanelEvent, PanelState } from "./types";
import { useFormBuilder } from "./FormBuilderContext";

type ElementPanelProps = {
	state: PanelState;
	dispatch: Dispatch<PanelEvent>;
};
export const ElementPanel = ({ state, dispatch }: ElementPanelProps) => {
	const fields = usePubFieldContext();

	const { addElement, setEditingElement, elementsCount } = useFormBuilder();
	const [newElement, setNewElement] = useState<
		| undefined
		| { type: "structure"; element: StructuralFormElement }
		| { type: "field"; fieldId: PubFieldsId }
	>();

	const addToForm = () => {
		if (!newElement) {
			return;
		}
		if (newElement.type === "field") {
			addElement({
				...newElement,
				required: true,
				type: ElementType.pubfield,
			});
			dispatch("finishAdd");
		}
		if (newElement.type === "structure") {
			addElement({
				...newElement,
				type: ElementType.structural,
			});
		}
	};

	const addStructure = (structure) => {};

	const [fieldsFilter, setFieldsFilter] = useState("");

	switch (state) {
		case "initial":
			return (
				<div className="flex flex-col gap-4">
					<p>This form has {elementsCount} elements.</p>
					<Button
						className="flex w-full items-center justify-center gap-2 bg-blue-500 hover:bg-blue-600"
						size="lg"
						onClick={() => dispatch("startAdd")}
					>
						<PlusCircle /> Add New
					</Button>
				</div>
			);
			break;
		case "selecting":
			return (
				<Tabs defaultValue="field">
					<TabsList>
						<TabsTrigger value="field">Field</TabsTrigger>
						<TabsTrigger value="structure">Structure</TabsTrigger>
					</TabsList>
					<TabsContent value="field">
						<Input
							type="search"
							placeholder="Type a field name to search..."
							aria-label="Type a field name to search"
							onChange={(event) => setFieldsFilter(event.target.value)}
							className="mb-2"
						></Input>
						<div className="flex max-h-[70vh] flex-col gap-2 overflow-y-auto">
							{Object.values(fields).map(
								(field) =>
									`${field.name} ${field.slug} ${field.schemaName}`.includes(
										fieldsFilter
									) && (
										<Button
											variant="outline"
											key={field.id}
											className="group flex flex-1 flex-shrink-0 justify-start gap-4 bg-white"
											onClick={() => {
												setNewElement({ type: "field", fieldId: field.id });
												dispatch("select");
											}}
										>
											<Type size={20} className="my-auto text-emerald-500" />
											<div className="flex flex-col items-start">
												<div className="text-muted-foreground">
													{field.slug}
												</div>
												<div className="text-left font-semibold">
													{field.name}
												</div>
											</div>
										</Button>
									)
							)}
						</div>

						<Button
							variant="outline"
							className="w-full border-slate-950"
							onClick={() => dispatch("cancel")}
						>
							Cancel
						</Button>
					</TabsContent>
					<TabsContent value="structure">
						<Button onClick={() => dispatch("cancel")}>Cancel</Button>
					</TabsContent>
				</Tabs>
			);
			break;
		case "configuring":
			return (
				<>
					<Button onClick={() => dispatch("back")} aria-label="Back">
						<ChevronLeft />
					</Button>
					<div className="flex w-full flex-grow gap-3">
						<Button
							className="border-slate-950"
							variant="outline"
							onClick={() => dispatch("cancel")}
						>
							Cancel
						</Button>
						<Button className="bg-blue-500 hover:bg-blue-600" onClick={addToForm}>
							Add
						</Button>
					</div>
				</>
			);
			break;
	}
};
