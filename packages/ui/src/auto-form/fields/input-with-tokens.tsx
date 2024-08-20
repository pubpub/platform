/**
 * Wrapper around the MarkdownEditor which makes it smaller
 * and can also disable rendering Markdown properties
 */

import * as React from "react";

import type { AutoFormInputComponentProps } from "../types";
import MarkdownEditor from "./markdown";

export default function InputWithTokens(props: AutoFormInputComponentProps) {
	return <MarkdownEditor {...props} size="sm" tokensOnly />;
}
