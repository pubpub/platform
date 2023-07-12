type Attributes = Record<string, any>;
type Children = any[];
type FunctionComponent = (props: Attributes, ...children: Children) => string;

export namespace jsx {
	export namespace JSX {
		export type Element = string;
		export type IntrinsicElements = Attributes;
	}
}

const renderAttributes = (attributes: Attributes) => {
	let renderedAttributes = "";
	for (const attribute in attributes) {
		if (attribute !== "children") {
			const attributeValue = attributes[attribute];
			if (attributeValue === true) {
				renderedAttributes += ` ${attribute}`;
			} else if (Boolean(attributeValue)) {
				renderedAttributes += ` ${attribute}="${attributes[attribute]}"`;
			}
		}
	}
	return renderedAttributes;
};

export const jsx = (
	tag: string | FunctionComponent,
	attributes: Attributes,
	...children: Children
) => {
	const renderedAttributes = renderAttributes(attributes);
	let open = `<${tag}${renderedAttributes.length > 0 ? renderedAttributes : ""}>`;
	if (typeof tag === "function") return tag(attributes ?? {}, ...children);
	for (let i = 0; i < children.length; i++) {
		const child = children[i];
		if (Boolean(child)) open += child;
	}
	return `${open}</${tag}>`;
};
