/** Copied from legacy */

// the  few we need from codemirror
import { sql } from "@codemirror/lang-sql";
// the lezer parsers that @codemirror depends on
import { parser as cppParser } from "@lezer/cpp";
import { parser as htmlParser } from "@lezer/html";
import { parser as javaParser } from "@lezer/java";
import { parser as javascriptParser } from "@lezer/javascript";
import { parser as jsonParser } from "@lezer/json";
import { parser as markdownParser } from "@lezer/markdown";
import { parser as pythonParser } from "@lezer/python";
import { parser as rustParser } from "@lezer/rust";
import { parser as xmlParser } from "@lezer/xml";

import type { Parsers } from "./types";

import { parser as cssParser } from "@lezer/css";

const parsers: Parsers = {
	cpp: cppParser,
	css: cssParser,
	html: htmlParser,
	sql: sql().language.parser,
	xml: xmlParser,
	javascript: javascriptParser,
	java: javaParser,
	json: jsonParser,
	markdown: markdownParser,
	python: pythonParser,
	rust: rustParser,
};

export default parsers;
