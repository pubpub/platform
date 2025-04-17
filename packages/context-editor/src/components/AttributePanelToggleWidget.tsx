import type { Node } from "prosemirror-model";
import type { EditorView } from "prosemirror-view";

import React from "react";
import { useWidgetViewContext } from "@prosemirror-adapter/react";
import { TextSelection } from "prosemirror-state";

import { attributePanelKey } from "../plugins/attributePanel";
import { reactPropsKey } from "../plugins/reactProps";

export const AttributePanelToggleWidget = () => {
	const { view, getPos, spec } = useWidgetViewContext();
	if (!spec || !("node" in spec)) {
		return null;
	}
	const attributePanelPluginState = attributePanelKey.getState(view.state);
	if (!attributePanelPluginState) {
		return null;
	}
	const { panelPosition, setPanelPosition } = attributePanelPluginState;

	const onClick = () => {
		const pos = getPos();
		if (pos === undefined) {
			return;
		}
		view.dispatch(
			view.state.tr.setSelection(
				new TextSelection(
					view.state.doc.resolve(pos)
					// view.state.doc.resolve(getPos() + node.nodeSize)
				)
			)
		);
		setPanelPosition({
			...panelPosition,
			isOpen: !panelPosition.isOpen,
			node,
			pos,
		});
	};

	const node: Node = spec.node;

	const isBlock = node.isBlock;

	return isBlock ? (
		<BlockWidget onClick={onClick} view={view} node={node} />
	) : (
		<InlineWidget onClick={onClick} view={view} node={node} />
	);
};

type WidgetProps = React.HTMLAttributes<HTMLElement> & {
	node: Node;
	view: EditorView;
};

const BlockWidget = ({ node, view, ...props }: WidgetProps) => {
	const { pubTypes, pubId } = reactPropsKey.getState(view.state);
	let buttonText = "";
	if (node.type.name.includes("context")) {
		const currentPubId = node.attrs.pubId;
		const currentPubTypeId = node.attrs.pubTypeId;
		const currentPubType = pubTypes.find((pubType: any) => {
			return pubType.id === currentPubTypeId;
		});

		const currentFieldSlug = node.attrs.fieldSlug || "rd:content";
		const currentField = currentPubType.fields.find((field: any) => {
			return field.slug === currentFieldSlug;
		});

		/* TODO: Look up the field name, and figure out if it's local to this doc or not. */
		/* Need to find the pubType and use that name for atoms without fieldSlug */

		const currentTypeName = currentPubType.name;
		if (currentPubId === pubId) {
			buttonText = `~${currentField.name}`;
		} else {
			buttonText = `/${currentTypeName}`;
		}
	} else {
		buttonText = `${node.type.name}${node.type.name === "heading" ? ` ${node.attrs.level}` : ""}`;
	}

	return (
		<div className="wrap-widget" {...props}>
			<span></span>
			<button type="button">{buttonText}</button>
		</div>
	);
};

const InlineWidget = ({ node, ...props }: WidgetProps) => {
	return (
		<span className="inline-wrap-widget" {...props}>
			<span></span>
			<button type="button" />
		</span>
	);
};
