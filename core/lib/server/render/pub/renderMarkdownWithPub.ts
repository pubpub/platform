import assert from "assert";

import type { Node as NodeMdast, Parent as ParentMdast } from "mdast";
import type { Directive } from "micromark-extension-directive";
import type { Plugin, Processor } from "unified";
import type { Node } from "unist";

import rehypeFormat from "rehype-format";
import rehypeRemark from "rehype-remark";
import rehypeStringify from "rehype-stringify";
import remarkDirective from "remark-directive";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import { unified } from "unified";
import { visit } from "unist-util-visit";

import { expect } from "utils";

import { RenderWithPubToken } from "./renderWithPubTokens";
import * as utils from "./renderWithPubUtils";

const isDirective = (node: Node): node is NodeMdast & Directive => {
	return (
		node.type === "containerDirective" ||
		node.type === "leafDirective" ||
		node.type === "textDirective"
	);
};

const isParent = (node: Node): node is ParentMdast => {
	return "children" in node;
};

const visitValueDirective = (node: NodeMdast & Directive, context: utils.RenderWithPubContext) => {
	const attrs = expect(node.attributes, "Invalid syntax in value directive");
	const field = expect(attrs.field, "Missing field attribute in value directive");

	let value: unknown;

	if (attrs?.rel === "parent") {
		const parentPub = expect(context.parentPub, "Missing parent pub");
		value = parentPub.values[field];
	} else {
		value = context.pub.values[field];
	}

	assert(value !== undefined, `Missing value for ${field}`);

	// If it's a member field, potentially use other values
	// ex: :value{field="unjournal:evaluator" firstName lastName} should yield i.e. Jane Admin
	const member = context.users.find((u) => u.id === value);
	if (member && attrs) {
		const allowedFields = ["firstName", "lastName"];
		const userAttrs = Object.keys(attrs).filter(
			(attr) => attr !== "field" && allowedFields.includes(attr)
		);
		if (userAttrs.length) {
			value = userAttrs.map((userAttribute) => member.user[userAttribute]).join(" ");
		}
	}

	node.data = {
		...node.data,
		hName: "span",
		hChildren: [
			{
				type: "text",
				value: String(value),
			},
		],
	};
};

const visitAssigneeNameDirective = (
	node: NodeMdast & Directive,
	context: utils.RenderWithPubContext
) => {
	node.data = {
		...node.data,
		hName: "span",
		hChildren: [
			{
				type: "text",
				value: utils.renderAssigneeFullName(context, node.attributes?.rel),
			},
		],
	};
};

const visitAssigneeFirstNameDirective = (
	node: NodeMdast & Directive,
	context: utils.RenderWithPubContext
) => {
	node.data = {
		...node.data,
		hName: "span",
		hChildren: [
			{
				type: "text",
				value: utils.renderAssigneeFirstName(context, node.attributes?.rel),
			},
		],
	};
};

const visitAssigneeLastNameDirective = (
	node: NodeMdast & Directive,
	context: utils.RenderWithPubContext
) => {
	node.data = {
		...node.data,
		hName: "span",
		hChildren: [
			{
				type: "text",
				value: utils.renderAssigneeLastName(context, node.attributes?.rel),
			},
		],
	};
};

const visitRecipientNameDirective = (
	node: NodeMdast & Directive,
	context: utils.RenderWithPubContext
) => {
	node.data = {
		...node.data,
		hName: "span",
		hChildren: [
			{
				type: "text",
				value: utils.renderRecipientFullName(context),
			},
		],
	};
};

const visitRecipientFirstNameDirective = (
	node: NodeMdast & Directive,
	context: utils.RenderWithPubContext
) => {
	node.data = {
		...node.data,
		hName: "span",
		hChildren: [
			{
				type: "text",
				value: utils.renderRecipientFirstName(context),
			},
		],
	};
};

const visitRecipientLastNameDirective = (
	node: NodeMdast & Directive,
	context: utils.RenderWithPubContext
) => {
	node.data = {
		...node.data,
		hName: "span",
		hChildren: [
			{
				type: "text",
				value: utils.renderRecipientLastName(context),
			},
		],
	};
};

const visitLinkDirective = (node: NodeMdast & Directive, context: utils.RenderWithPubContext) => {
	// `node.attributes` should always be defined for directive nodes
	const attrs = expect(node.attributes, "Invalid syntax in link directive");
	// All directives are considered parent nodes
	assert(isParent(node));
	let href: string;
	// :link{email=assignee}
	// :link{email=all@pubpub.org}
	if ("email" in attrs) {
		// The `email` attribute must have a value. For example, :link{email=""}
		// is invalid.
		let address = expect(attrs.email, 'Unexpected missing value in ":link{email=?}" directive');
		// If the user defines the recipient as `"assignee"`, the pub must have an
		// assignee for the email to be sent.
		href = utils.renderLink(context, { address });
		// If the email has no label, default to the email address, e.g.
		// :link{email=all@pubpub.org} -> :link[all@pubpub.org]{email=all@pubpub.org}
		if (node.children.length === 0) {
			node.children.push({ type: "text", value: address });
		}
	}
	// :link{form=review}
	else if ("form" in attrs) {
		href = utils.renderLink(context, {
			form: expect(attrs.form, 'Unexpected missing value in ":link{form=?}" directive'),
		});
	}
	// :link{to=https://example.com}
	else if ("to" in attrs) {
		href = utils.renderLink(context, {
			url: expect(attrs.to, 'Unexpected missing value in ":link{to=?}" directive'),
		});
	}
	// :link{field=pubpub:url}
	else if ("field" in attrs) {
		href = utils.renderLink(context, {
			field: expect(attrs.field, "Unexpected missing value in ':link{field=?}' directive"),
			rel: attrs.rel,
		});
	} else {
		throw new Error("Invalid link directive");
	}

	// Default the text content to the href if the node has no children
	if (node.children.length === 0) {
		node.children.push({
			type: "text",
			value: href,
		});
	}
	node.data = {
		...node.data,
		hName: "a",
		hProperties: { href },
	};
};

type DirectiveVisitor = (node: NodeMdast & Directive, context: utils.RenderWithPubContext) => void;

const directiveVisitors: Record<RenderWithPubToken, DirectiveVisitor> = {
	[RenderWithPubToken.Value]: visitValueDirective,
	[RenderWithPubToken.AssigneeName]: visitAssigneeNameDirective,
	[RenderWithPubToken.AssigneeFirstName]: visitAssigneeFirstNameDirective,
	[RenderWithPubToken.AssigneeLastName]: visitAssigneeLastNameDirective,
	[RenderWithPubToken.RecipientName]: visitRecipientNameDirective,
	[RenderWithPubToken.RecipientFirstName]: visitRecipientFirstNameDirective,
	[RenderWithPubToken.RecipientLastName]: visitRecipientLastNameDirective,
	[RenderWithPubToken.Link]: visitLinkDirective,
};

const renderMarkdownWithPubPlugin: Plugin<[utils.RenderWithPubContext]> = (context) => {
	return async (tree) => {
		const tokenAuthLinkNodes: NodeMdast[] = [];

		visit(tree, (node) => {
			if (isDirective(node)) {
				// Directive names are case-insensitive
				const directiveName = node.name.toLowerCase() as RenderWithPubToken;
				const directiveVisitor = directiveVisitors[directiveName];
				// Some links, like private form links, require one-time token authentication
				const directiveRendersAuthLink =
					directiveName === RenderWithPubToken.Link &&
					node.attributes?.form !== undefined;
				// Throw an error if the email contains an invalid/undefined directive
				assert(directiveVisitor !== undefined, "Invalid directive used in email.");
				// Collect all auth link nodes to be processed after all other directives
				if (directiveRendersAuthLink) {
					tokenAuthLinkNodes.push(node);
				}
				// Process the directive
				directiveVisitor(node, context);
			}
		});

		// Append one-time auth tokens to authenticated hrefs.
		await Promise.all(
			tokenAuthLinkNodes.map(async (node) => {
				const data = expect(node.data);
				const props = expect(data.hProperties);
				if (isDirective(node)) {
					const attrs = expect(node.attributes);
					if ("form" in attrs) {
						props.href = await utils.renderFormInviteLink(
							expect(attrs.form),
							context.recipient.id,
							context.recipient.user.id,
							context.pub.id
						);
					}
				}
			})
		);
	};
};

export const renderMarkdownWithPub = async (
	text: string,
	context: utils.RenderWithPubContext,
	asMarkdown = false
) => {
	const processorBase = unified()
		.use(remarkParse)
		.use(remarkDirective)
		.use(renderMarkdownWithPubPlugin, context)
		.use(remarkRehype)
		.use(rehypeFormat);

	let processor: Processor<Node, Node, Node, Node, string>;

	if (asMarkdown) {
		// Convert the HTML back to markdown using rehype-remark
		processor = processorBase.use(rehypeRemark).use(rehypeStringify);
	} else {
		processor = processorBase.use(rehypeStringify);
	}

	const result = await processor.process(text);

	return result.toString().trim();
};
