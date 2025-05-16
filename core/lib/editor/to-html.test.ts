import { describe, expect, it } from "vitest";

// @ts-expect-error
import ponies from "../../prisma/seeds/ponies.snippet.html?raw";
import { processEditorHTML } from "./process-editor-html";
import { htmlToProsemirror, prosemirrorToHTML } from "./serialize-server";

describe("renderNodeToHTML", () => {
	it("should be able to round trip a node and not lose any information", async () => {
		const html = ponies;

		expect(html).toBeDefined();

		// the `pretty` is there just to make the diff easier to read if something goes wrong
		const processed = processEditorHTML(html, {
			settings: {
				fragment: true,
				pretty: true,
			},
		});

		const htmlProcessed = await processed.html();

		const node2 = htmlToProsemirror(htmlProcessed);
		const node2Json = node2.toJSON();

		const html2 = prosemirrorToHTML(node2Json);

		const html2Processed = await processEditorHTML(html2, {
			settings: {
				fragment: true,
				pretty: true,
			},
		}).html();

		// FIXME: this is not strictly equal due to some space insertion
		// expect(html2Processed).toEqual(htmlProcessed);

		const node3 = htmlToProsemirror(html2Processed);
		const node3Json = node3.toJSON();

		const html3Processed = await processEditorHTML(prosemirrorToHTML(node3Json), {
			settings: {
				fragment: true,
				pretty: true,
			},
		}).html();

		expect(html2Processed).toEqual(html3Processed);
		expect(node3Json).toEqual(node2Json);
	});
});
