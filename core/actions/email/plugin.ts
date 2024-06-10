import assert from "assert";

import type { Node as NodeMdast, Parent as ParentMdast } from "mdast";
import type { Directive } from "micromark-extension-directive";
import type { Node } from "unist";

import { Plugin } from "unified";
import { visit } from "unist-util-visit";

import { expect } from "utils";

import { createToken } from "~/lib/server/token";
import { EmailToken } from "./tokens";

export type EmailDirectivePluginContext = {
	sender: {
		firstName: string;
		lastName: string | null;
		email: string;
	};
	recipient: {
		id: string;
		firstName: string;
		lastName: string | null;
	};
	community: {
		slug: string;
	};
	pub: {
		values: Record<string, string>;
		assignee?: {
			email: string;
		};
	};
};

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

const visitValueDirective = (node: NodeMdast & Directive, context: EmailDirectivePluginContext) => {
	const attrs = expect(node.attributes);
	const value = context.pub.values[expect(attrs.field)];
	node.data = {
		...node.data,
		hName: "span",
		hChildren: [
			{
				type: "text",
				value,
			},
		],
	};
};

const visitSenderNameDirective = (
	node: NodeMdast & Directive,
	context: EmailDirectivePluginContext
) => {
	node.data = {
		...node.data,
		hName: "span",
		hChildren: [
			{
				type: "text",
				value: `${context.sender.firstName} ${context.sender.lastName}`,
			},
		],
	};
};

const visitSenderFirstNameDirective = (
	node: NodeMdast & Directive,
	context: EmailDirectivePluginContext
) => {
	node.data = {
		...node.data,
		hName: "span",
		hChildren: [
			{
				type: "text",
				value: context.sender.firstName,
			},
		],
	};
};

const visitSenderLastNameDirective = (
	node: NodeMdast & Directive,
	context: EmailDirectivePluginContext
) => {
	node.data = {
		...node.data,
		hName: "span",
		hChildren: [
			{
				type: "text",
				value: context.sender.lastName ?? "",
			},
		],
	};
};

const visitRecipientNameDirective = (
	node: NodeMdast & Directive,
	context: EmailDirectivePluginContext
) => {
	node.data = {
		...node.data,
		hName: "span",
		hChildren: [
			{
				type: "text",
				value: `${context.recipient.firstName} ${context.recipient.lastName}`,
			},
		],
	};
};

const visitRecipientFirstNameDirective = (
	node: NodeMdast & Directive,
	context: EmailDirectivePluginContext
) => {
	node.data = {
		...node.data,
		hName: "span",
		hChildren: [
			{
				type: "text",
				value: context.recipient.firstName,
			},
		],
	};
};

const visitRecipientLastNameDirective = (
	node: NodeMdast & Directive,
	context: EmailDirectivePluginContext
) => {
	node.data = {
		...node.data,
		hName: "span",
		hChildren: [
			{
				type: "text",
				value: context.recipient.lastName ?? "",
			},
		],
	};
};

const visitLinkDirective = (node: NodeMdast & Directive, context: EmailDirectivePluginContext) => {
	// `node.attributes` should always be defined for directive nodes
	const attrs = expect(node.attributes);
	// All directives are considered parent nodes
	assert(isParent(node));
	let href: string;
	// :link{email=assignee}
	// :link{email=all@pubpub.org}
	if ("email" in attrs) {
		// The `email` attribute must have a value. For example, :link{email=""}
		// is invalid.
		const to = expect(attrs.email, 'Missing value for "email" attribute');
		// If the email has no label, default to the email address, e.g.
		// :link{email=all@pubpub.org} -> :link[all@pubpub.org]{email=all@pubpub.org}
		if (node.children.length === 0) {
			node.children.push({
				type: "text",
				value: to === "assignee" ? context.sender.email : to,
			});
		}
		// If the user defines the recipient as `"assignee"`, the pub must have an
		// assignee for the email to be sent.
		if (to === "assignee") {
			assert(context.pub.assignee !== undefined, "Pub has no assignee");
			href = `mailto:${context.pub.assignee.email}`;
		} else {
			// The recipient is a static email address
			href = `mailto:${to}`;
		}
	}
	// :link{form=review}
	else if ("form" in attrs) {
		const name = expect(attrs.form, 'Missing value for "form" attribute');
		href = `https://app.pubpub.org/c/${context.community.slug}/forms/${name}`;
	}
	// :link{to=https://example.com}
	else if ("to" in attrs) {
		href = expect(attrs.to, 'Missing value for "to" attribute');
	}
	// :link{field=pubpub:url}
	else if ("field" in attrs) {
		const field = expect(attrs.field, 'Missing value for "field" attribute');
		href = context.pub.values[field];
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

type DirectiveVisitor = (node: NodeMdast & Directive, context: EmailDirectivePluginContext) => void;

const directiveVisitors: Record<EmailToken, DirectiveVisitor> = {
	[EmailToken.Value]: visitValueDirective,
	[EmailToken.SenderName]: visitSenderNameDirective,
	[EmailToken.SenderFirstName]: visitSenderFirstNameDirective,
	[EmailToken.SenderLastName]: visitSenderLastNameDirective,
	[EmailToken.RecipientName]: visitRecipientNameDirective,
	[EmailToken.RecipientFirstName]: visitRecipientFirstNameDirective,
	[EmailToken.RecipientLastName]: visitRecipientLastNameDirective,
	[EmailToken.Link]: visitLinkDirective,
};

export const emailDirectives: Plugin<[EmailDirectivePluginContext]> = (context) => {
	return async (tree) => {
		const tokenAuthLinkNodes: NodeMdast[] = [];

		visit(tree, (node) => {
			if (isDirective(node)) {
				// Directive names are case-insensitive
				const directiveName = node.name.toLowerCase() as EmailToken;
				const directiveVisitor = directiveVisitors[directiveName];
				// Some links, like private form links, require one-time token authentication
				const directiveRendersAuthLink =
					directiveName === EmailToken.Link && node.attributes?.form !== undefined;
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
				const token = await createToken(context.recipient.id);
				const props = expect(data.hProperties);
				const url = new URL(expect(props.href) as string);
				url.searchParams.set("token", token);
				props.href = url.toString();
			})
		);
	};
};
