import type { MarkType } from "prosemirror-model";
import type { EditorState, Transaction } from "prosemirror-state";

export const emailOrUriRegexBase =
	"(?<mailto>mailto:)?(?<emailOrUri>(?:(?:(https|http|ftp)+)://)?(?:\\S+(?::\\S*)?(?<atSign>@))?(?:(?:([a-z0-9][a-z0-9-]*)?[a-z0-9]+)(?:\\.(?:[a-z0-9-])*[a-z0-9]+)*(?:\\.(?:[a-z]{2,})(:\\d{1,5})?))(?:/[^\\s]*)?)";

// Returns a function to determine if the matched content is a url or an email and add a link mark
// to it if so
export const createLinkRuleHandler = (
	markType: MarkType,
	transaction?: Transaction,
	appendWhitespace = false
) => {
	return (state: EditorState, match: RegExpMatchArray, start: number, end: number) => {
		const resolvedStart = state.doc.resolve(start);
		const tr = transaction ?? state.tr;
		if (!resolvedStart.parent.type.allowsMarkType(markType)) {
			return tr;
		}

		if (!match.groups) {
			return tr;
		}
		const emailOrUri = match.groups.emailOrUri;

		const href = `${match.groups.atSign ? "mailto:" : ""}${emailOrUri}`;

		const link = state.schema.text(emailOrUri, [state.schema.mark(markType, { href })]);

		const content = [link];

		if (appendWhitespace) {
			const whitespace = state.schema.text(match.groups.whitespace);
			content.push(whitespace);
		}

		return tr.replaceWith(start, end, content);
	};
};
export const markdownLinkRegex = new RegExp(
	`\\[(?<linkText>[^\\]]+)\\]\\((${emailOrUriRegexBase})\\)`,
	"g"
);
