import type { WidgetViewComponentProps } from "@handlewithcare/react-prosemirror";
import type { Node } from "prosemirror-model";

import React, { forwardRef, useMemo } from "react";
import { useEditorEventCallback, useEditorState } from "@handlewithcare/react-prosemirror";
import { TextSelection } from "prosemirror-state";

import { reactPropsKey } from "../plugins/reactProps";

const getBlockName = (node: Node) => {
	const state = useEditorState();
	const { pubTypes, pubId } = reactPropsKey.getState(state);

	const buttonName = `${node.type.name}${node.type.name === "heading" ? ` ${node.attrs.level}` : ""}`;
	if (!node.type.name.includes("context")) {
		return buttonName;
	}

	// Handle context nodes
	const currentPubId = node.attrs.pubId;
	const currentPubTypeId = node.attrs.pubTypeId;
	const currentPubType = pubTypes.find((pubType: any) => {
		return pubType.id === currentPubTypeId;
	});

	const currentFieldSlug = node.attrs.fieldSlug || "rd:content";
	const currentField = currentPubType.fields.find((field: any) => {
		return field.slug === currentFieldSlug;
	});
	const currentTypeName = currentPubType.name;
	let label;
	if (currentPubId === pubId) {
		label = `~${currentField.name}`;
	} else {
		label = `/${currentTypeName}`;
	}
	/* TODO: Look up the field name, and figure out if it's local to this doc or not. */
	/* Need to find the pubType and use that name for atoms without fieldSlug */
	return label;
};

export const BlockDecoration = forwardRef<HTMLDivElement, WidgetViewComponentProps>(
	function BlockDecoration({ widget, getPos, ...props }, ref) {
		const state = useEditorState();
		const { disabled } = reactPropsKey.getState(state);
		const blockPos = getPos();
		const blockNode = useMemo(() => state.doc.nodeAt(blockPos), [blockPos, state]);

		const handleClick = useEditorEventCallback((view) => {
			const tr = state.tr.setSelection(TextSelection.create(state.doc, blockPos));
			view.dispatch(tr);
		});

		if (!blockNode?.isBlock) {
			return null;
		}

		return (
			<div ref={ref} className="wrap-widget" {...props}>
				<button
					type="button"
					disabled={disabled}
					onClick={handleClick}
					className={blockNode.type.name}
				>
					{getBlockName(blockNode)}
				</button>
			</div>
		);
	}
);

export const InlineDecoration = forwardRef<HTMLSpanElement, WidgetViewComponentProps>(
	function InlineDecoration({ widget, getPos, ...props }, ref) {
		return (
			<span ref={ref} className="inline-wrap-widget" {...props}>
				<span></span>
			</span>
		);
	}
);
