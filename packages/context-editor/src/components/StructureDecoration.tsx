import type { WidgetViewComponentProps } from "@handlewithcare/react-prosemirror";
import type { Node } from "prosemirror-model";

import React, { forwardRef, useMemo } from "react";
import { useEditorEventCallback, useEditorState } from "@handlewithcare/react-prosemirror";
import { TextSelection, Transaction } from "prosemirror-state";

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
		const pos = getPos();
		const node = useMemo(() => state.doc.nodeAt(pos), [pos, state]);

		const onClick = useEditorEventCallback((view) => {
			let tr = state.tr;
			if (state.selection.$anchor.nodeAfter === node) {
				tr = tr.setSelection(TextSelection.atStart(tr.doc));
			} else {
				tr = tr.setSelection(TextSelection.create(tr.doc, pos));
			}
			view.dispatch(tr);
		});

		if (!node?.isBlock) {
			return null;
		}

		return (
			<div ref={ref} className="wrap-widget" {...props}>
				<button
					type="button"
					disabled={disabled}
					onClick={onClick}
					className={node.type.name}
				>
					{getBlockName(node)}
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
