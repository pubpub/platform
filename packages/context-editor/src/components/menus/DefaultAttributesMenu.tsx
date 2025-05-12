import type { Attrs, Mark } from "prosemirror-model";

import React from "react";
import { useEditorState } from "@handlewithcare/react-prosemirror";

import { Input } from "ui/input";
import { Label } from "ui/label";

import { useEditorContext } from "../Context";
import { MediaUpload } from "./MediaUpload";

const labelClass = "font-normal text-xs";
const inputClass = "h-8 text-xs rounded-sm border-neutral-300";

export const NodeAttributes = ({
	nodeAttrs,
	updateAttr,
}: {
	nodeAttrs: Attrs;
	updateAttr: (attrKey: string, value: string) => void;
}) => {
	const { position } = useEditorContext();
	const state = useEditorState();

	if (position === null) {
		return null;
	}

	const node = state.doc.nodeAt(position);

	if (Object.keys(nodeAttrs).length === 0) {
		return null;
	}

	if (node?.type.name === "image") {
		return <MediaUpload attrs={nodeAttrs} key={position} />;
	}

	// Default
	return (
		<>
			{Object.keys(nodeAttrs).map((attrKey) => {
				if (attrKey === "data") {
					return null;
				}
				const key = `${attrKey}-${position}`;
				return (
					<div key={key}>
						<Label className={labelClass} htmlFor={key}>
							{attrKey}
						</Label>
						<Input
							className={inputClass}
							type="text"
							defaultValue={nodeAttrs[attrKey] || ""}
							onChange={(evt) => {
								updateAttr(attrKey, evt.target.value);
							}}
							id={key}
						/>
					</div>
				);
			})}
		</>
	);
};

export const MarkAttribute = ({
	mark,
	updateMarkAttr,
}: {
	mark: Mark;
	updateMarkAttr: (key: string, value: string | null) => void;
}) => {
	return (
		<div>
			<div className="mt-4 text-sm font-bold">{mark.type.name}</div>
			{Object.keys(mark.attrs).map((attrKey) => {
				if (attrKey === "data") {
					return null;
				}
				const key = `${mark.type.name}-${attrKey}`;
				return (
					<div key={key}>
						<Label className={labelClass} htmlFor={key}>
							{attrKey}
						</Label>
						<Input
							className={inputClass}
							type="text"
							defaultValue={mark.attrs[attrKey] || ""}
							onChange={(evt) => {
								updateMarkAttr(attrKey, evt.target.value);
							}}
							id={key}
						/>
					</div>
				);
			})}
		</div>
	);
};

export const DataAttributes = ({
	nodeAttrs,
	updateData,
}: {
	nodeAttrs: Attrs;
	updateData: (key: string, value: string) => void;
}) => {
	if (!nodeAttrs.data) {
		return null;
	}

	return (
		<>
			<div className="mt-8 text-sm">Data</div>
			{Object.keys(nodeAttrs.data).map((attrKey) => {
				const key = `data-${attrKey}`;
				return (
					<div key={key}>
						<Label className={labelClass} htmlFor={key}>
							{attrKey}
						</Label>
						<Input
							className={inputClass}
							type="text"
							value={nodeAttrs.data[attrKey] || ""}
							onChange={(evt) => {
								updateData(attrKey, evt.target.value);
							}}
							id={key}
						/>
					</div>
				);
			})}
		</>
	);
};
