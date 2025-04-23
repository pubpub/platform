import { baseSchema } from "context-editor/schemas";
import { MarkdownExtension } from "prosemirror-remark";
import { ProseMirrorUnified } from "prosemirror-unified";

export const prosemirrorUnified = new ProseMirrorUnified([new MarkdownExtension()]);
