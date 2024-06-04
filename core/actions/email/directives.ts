import { Token } from "marked";
import { Directive, DirectiveConfig } from "marked-directive";

import { expect } from "utils";

export const EmailDirective = ["formLink"] as const;
export type EmailDirective = (typeof EmailDirective)[number];
export const AuthDirective = new Set<EmailDirective>(["formLink"]);

export type EmailContext = {
	community: {
		slug: string;
	};
};

export const formLink = (context: EmailContext): DirectiveConfig => ({
	level: "inline",
	marker: ":",
	renderer(token) {
		const slug = expect(token.attrs?.slug, "FormLink directive missing slug attribute");
		const auth = expect(token.auth, "Auth token missing, unexpected error occurred");
		if (token.meta.name === "formLink") {
			return `<a href="https://app.pubpub.org/c/${context.community.slug}/form/${slug}?token=${auth}">${token.text}</a>`;
		}
		return false;
	},
});

export const isDirective = (token: Token): token is Directive => {
	return (
		typeof token === "object" &&
		token !== null &&
		"meta" in token &&
		/^directive(?:Inline|Block)[0-9]*$/g.test(token.type)
	);
};

export const isValidEmailDirective = (directive: Directive): directive is Directive => {
	return EmailDirective.includes(directive.meta.name as EmailDirective);
};

export const directiveUsesAuth = (directive: Directive): boolean => {
	return AuthDirective.has(directive.meta.name as EmailDirective);
};
