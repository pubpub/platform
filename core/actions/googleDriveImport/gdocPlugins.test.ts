import { rehype } from "rehype";
import { expect, test } from "vitest";

import { logger } from "logger";

import {
	appendFigureAttributes,
	basic,
	cleanUnusedSpans,
	formatFigureReferences,
	formatLists,
	getDescription,
	processLocalLinks,
	removeDescription,
	removeEmptyFigCaption,
	removeGoogleLinkForwards,
	removeVerboseFormatting,
	structureAnchors,
	structureAudio,
	structureBlockMath,
	structureBlockquote,
	structureCodeBlock,
	structureFiles,
	structureFootnotes,
	structureFormatting,
	structureIframes,
	structureImages,
	structureInlineCode,
	structureInlineMath,
	// structureReferences,
	structureTables,
	structureVideos,
	tableToObjectArray,
} from "./gdocPlugins";

export const trimAll = (html: string | void): string => {
	if (!html) {
		return "";
	}
	return html.replace(/[\n\t]+/g, "").trim();
};

test("Convert basic table", async () => {
	const inputNode = JSON.parse(
		'{"type":"element","tagName":"table","children":[{"type":"element","tagName":"tbody","children":[{"type":"element","tagName":"tr","children":[{"type":"element","tagName":"td","children":[{"type":"element","tagName":"p","children":[{"type":"element","tagName":"span","children":[{"type":"text","value":"Type"}]}]}]},{"type":"element","tagName":"td","children":[{"type":"element","tagName":"p","children":[{"type":"text"},{"type":"element","tagName":"span","children":[{"type":"text","value":"Id"}]}]}]},{"type":"element","tagName":"td","children":[{"type":"element","tagName":"p","children":[{"type":"element","tagName":"span","children":[{"type":"text","value":"Content"}]}]}]}]},{"type":"element","tagName":"tr","children":[{"type":"element","tagName":"td","children":[{"type":"element","tagName":"p","children":[{"type":"element","tagName":"span","children":[{"type":"text","value":"Blockquote"}]}]}]},{"type":"element","tagName":"td","children":[{"type":"element","tagName":"p","children":[{"type":"element","tagName":"span","children":[{"type":"text","value":"ntw1zivowk6"}]}]}]},{"type":"element","tagName":"td","children":[{"type":"element","tagName":"p","children":[{"type":"element","tagName":"span","children":[{"type":"text","value":"Share your thoughts!"}]}]},{"type":"element","tagName":"p","children":[{"type":"element","tagName":"u","children":[{"type":"element","tagName":"b","children":[{"type":"element","tagName":"a","properties":{"href":"https://www.pubpub.org"},"children":[{"type":"text","value":"Watch a video tutorial"}]}]}]},{"type":"element","tagName":"span","children":[{"type":"text","value":" on making a PubPub account and commenting."}]}]}]}]}]}]}'
	);
	const expectedOutput = [
		{
			id: "ntw1zivowk6",
			type: "blockquote",
			content:
				"Share your thoughts!Watch a video tutorial on making a PubPub account and commenting.",
		},
	];

	const result = tableToObjectArray(inputNode);

	expect(result).toStrictEqual(expectedOutput);
});

test("Convert double table", async () => {
	const inputNode = JSON.parse(
		'{"type":"element","tagName":"table","children":[{"type":"element","tagName":"tbody","children":[{"type":"element","tagName":"tr","children":[{"type":"element","tagName":"td","children":[{"type":"element","tagName":"p","children":[{"type":"element","tagName":"span","children":[{"type":"text","value":"Type"}]}]}]},{"type":"element","tagName":"td","children":[{"type":"element","tagName":"p","children":[{"type":"text"},{"type":"element","tagName":"span","children":[{"type":"text","value":"Id"}]}]}]},{"type":"element","tagName":"td","children":[{"type":"element","tagName":"p","children":[{"type":"element","tagName":"span","children":[{"type":"text","value":"Alt Text"}]}]}]}]},{"type":"element","tagName":"tr","children":[{"type":"element","tagName":"td","children":[{"type":"element","tagName":"p","children":[{"type":"element","tagName":"span","children":[{"type":"text","value":"Blockquote"}]}]}]},{"type":"element","tagName":"td","children":[{"type":"element","tagName":"p","children":[{"type":"element","tagName":"span","children":[{"type":"text","value":"ntw1zivowk6"}]}]}]},{"type":"element","tagName":"td","children":[{"type":"element","tagName":"p","children":[{"type":"element","tagName":"span","children":[{"type":"text","value":"Share your thoughts!"}]}]},{"type":"element","tagName":"p","children":[{"type":"element","tagName":"u","children":[{"type":"element","tagName":"b","children":[{"type":"element","tagName":"a","properties":{"href":"https://www.pubpub.org"},"children":[{"type":"text","value":"Watch a video tutorial"}]}]}]},{"type":"element","tagName":"span","children":[{"type":"text","value":" on making a PubPub account and commenting."}]}]}]}]},{"type":"element","tagName":"tr","children":[{"type":"element","tagName":"td","children":[{"type":"element","tagName":"p","children":[{"type":"element","tagName":"span","children":[{"type":"text","value":"123"}]}]}]},{"type":"element","tagName":"td","children":[{"type":"element","tagName":"p","children":[{"type":"element","tagName":"span","children":[{"type":"text","value":"abc"}]}]}]},{"type":"element","tagName":"td","children":[{"type":"element","tagName":"p","children":[{"type":"element","tagName":"span","children":[{"type":"text","value":"okay"}]}]}]}]}]}]}'
	);
	const expectedOutput = [
		{
			id: "ntw1zivowk6",
			type: "blockquote",
			alttext:
				"Share your thoughts!Watch a video tutorial on making a PubPub account and commenting.",
		},
		{
			type: "123",
			id: "abc",
			alttext: "okay",
		},
	];

	const result = tableToObjectArray(inputNode);

	expect(result).toStrictEqual(expectedOutput);
});

test("Convert vert table", async () => {
	const inputNode = JSON.parse(
		'{"type":"element","tagName":"table","properties":{},"children":[{"type":"element","tagName":"tbody","properties":{},"children":[{"type":"element","tagName":"tr","properties":{},"children":[{"type":"element","tagName":"td","properties":{},"children":[{"type":"element","tagName":"p","properties":{},"children":[{"type":"element","tagName":"span","properties":{},"children":[{"type":"text","value":"Type"}]}]}]},{"type":"element","tagName":"td","properties":{},"children":[{"type":"element","tagName":"p","properties":{},"children":[{"type":"element","tagName":"span","properties":{},"children":[{"type":"text","value":"Image"}]}]}]}]},{"type":"element","tagName":"tr","properties":{},"children":[{"type":"element","tagName":"td","properties":{},"children":[{"type":"element","tagName":"p","properties":{},"children":[{"type":"element","tagName":"span","properties":{},"children":[{"type":"text","value":"Id"}]}]}]},{"type":"element","tagName":"td","properties":{},"children":[{"type":"element","tagName":"p","properties":{},"children":[{"type":"element","tagName":"span","properties":{},"children":[{"type":"text","value":"n8r4ihxcrly"}]}]}]}]},{"type":"element","tagName":"tr","properties":{},"children":[{"type":"element","tagName":"td","properties":{},"children":[{"type":"element","tagName":"p","properties":{},"children":[{"type":"element","tagName":"span","properties":{},"children":[{"type":"text","value":"Source"}]}]}]},{"type":"element","tagName":"td","properties":{},"children":[{"type":"element","tagName":"p","properties":{},"children":[{"type":"element","tagName":"span","properties":{},"children":[{"type":"text","value":"https://resize-v3.pubpub.org/123"}]}]}]}]},{"type":"element","tagName":"tr","properties":{},"children":[{"type":"element","tagName":"td","properties":{},"children":[{"type":"element","tagName":"p","properties":{},"children":[{"type":"element","tagName":"span","properties":{},"children":[{"type":"text","value":"Alt Text"}]}]}]},{"type":"element","tagName":"td","properties":{},"children":[{"type":"element","tagName":"p","properties":{},"children":[{"type":"element","tagName":"b","properties":{},"children":[{"type":"text","value":"123"}]}]}]}]},{"type":"element","tagName":"tr","properties":{},"children":[{"type":"element","tagName":"td","properties":{},"children":[{"type":"element","tagName":"p","properties":{},"children":[{"type":"element","tagName":"span","properties":{},"children":[{"type":"text","value":"Align"}]}]}]},{"type":"element","tagName":"td","properties":{},"children":[{"type":"element","tagName":"p","properties":{},"children":[{"type":"text","value":"full"}]}]}]},{"type":"element","tagName":"tr","properties":{},"children":[{"type":"element","tagName":"td","properties":{},"children":[{"type":"element","tagName":"p","properties":{},"children":[{"type":"element","tagName":"span","properties":{},"children":[{"type":"text","value":"Size"}]}]}]},{"type":"element","tagName":"td","properties":{},"children":[{"type":"element","tagName":"p","properties":{},"children":[{"type":"text","value":"50"}]}]}]}]}]}'
	);
	const expectedOutput = [
		{
			type: "image",
			id: "n8r4ihxcrly",
			source: "https://resize-v3.pubpub.org/123",
			alttext: "123",
			align: "full",
			size: "50",
		},
	];

	const result = tableToObjectArray(inputNode);

	expect(result).toStrictEqual(expectedOutput);
});

test("Convert link-source table", async () => {
	const inputNode = JSON.parse(
		'{"type":"element","tagName":"table","children":[{"type":"element","tagName":"tbody","children":[{"type":"element","tagName":"tr","children":[{"type":"element","tagName":"td","children":[{"type":"element","tagName":"p","children":[{"type":"element","tagName":"span","children":[{"type":"text","value":"Type"}]}]}]},{"type":"element","tagName":"td","children":[{"type":"element","tagName":"p","children":[{"type":"text"},{"type":"element","tagName":"span","children":[{"type":"text","value":"Source"}]}]}]},{"type":"element","tagName":"td","children":[{"type":"element","tagName":"p","children":[{"type":"element","tagName":"span","children":[{"type":"text","value":"Static Image"}]}]}]}]},{"type":"element","tagName":"tr","children":[{"type":"element","tagName":"td","children":[{"type":"element","tagName":"p","children":[{"type":"element","tagName":"span","children":[{"type":"text","value":"Video"}]}]}]},{"type":"element","tagName":"td","children":[{"type":"element","tagName":"p","children":[{"type":"element","tagName":"span","children":[{"type":"element","tagName":"a","properties":{"href":"https://www.image-url.com"},"children":[{"type":"text","value":"image-filename.png"}]}]}]}]},{"type":"element","tagName":"td","children":[{"type":"element","tagName":"p","children":[{"type":"element","tagName":"span","children":[{"type":"element","tagName":"a","properties":{"href":"https://www.fallback-url.com"},"children":[{"type":"text","value":"fallback-filename.png"}]}]}]}]}]}]}]}'
	);
	const expectedOutput = [
		{
			source: "https://www.image-url.com",
			type: "video",
			staticimage: "https://www.fallback-url.com",
		},
	];

	const result = tableToObjectArray(inputNode);

	expect(result).toStrictEqual(expectedOutput);
});

test("Do Nothing", async () => {
	const inputHtml =
		'<html><head><script src="blah.js"></script><style>.blah{}</style></head><body><div>Content</div></body></html>';
	const expectedOutputHtml =
		'<html><head><script src="blah.js"></script><style>.blah{}</style></head><body><div>Content</div></body></html>';

	const result = await rehype()
		.use(basic)
		.process(inputHtml)
		.then((file) => String(file))
		.catch((error) => {
			logger.error(error);
		});

	expect(trimAll(result)).toBe(trimAll(expectedOutputHtml));
});

test("Structure Formatting", async () => {
	const inputHtml =
		'<html><head></head><body><div>Content <span style="font-weight: 700">Spatial imaging data</span></div></body></html>';
	const expectedOutputHtml =
		"<html><head></head><body><div>Content <b>Spatial imaging data</b></div></body></html>";

	const result = await rehype()
		.use(structureFormatting)
		.process(inputHtml)
		.then((file) => String(file))
		.catch((error) => {
			logger.error(error);
		});

	expect(trimAll(result)).toBe(trimAll(expectedOutputHtml));
});

test("Remove Verbose Attributes", async () => {
	const inputHtml =
		'<html><head><title>Okay</title><script></script></head><body><div>Content <span class="dog" style="font-weight: 700">Spatial imaging data</span></div></body></html>';
	const expectedOutputHtml =
		"<html><head><title>Okay</title></head><body><div>Content <span>Spatial imaging data</span></div></body></html>";

	const result = await rehype()
		.use(removeVerboseFormatting)
		.process(inputHtml)
		.then((file) => String(file))
		.catch((error) => {
			logger.error(error);
		});

	expect(trimAll(result)).toBe(trimAll(expectedOutputHtml));
});

test("Structure Images", async () => {
	const inputHtml = `
		<html>
			<head></head>
			<body>
				<table>
					<tbody>
						<tr>
							<td><p><span>Type</span></p></td>
							<td><p><span>Id</span></p></td>
							<td><p><span>Source</span></p></td>
							<td><p><span>Caption</span></p></td>
							<td><p><span>Alt Text</span></p></td>
							<td><p><span>Align</span></p></td>
							<td><p><span>Size</span></p></td>
						</tr>
						<tr>
							<td><p><span>Image</span></p></td>
							<td><p><span>n8r4ihxcrly</span></p></td>
							<td><p><span>https://resize-v3.pubpub.org/123</span></p></td>
							<td><p><span>With a caption. </span><b>Bold</b></p></td>
							<td><p><b>123</b></p></td>
							<td><p>full</p></td>
							<td><p>50</p></td>
						</tr>
					</tbody>
				</table>
			</body>
		</html>
	`;
	const expectedOutputHtml = `
		<html>
			<head></head>
			<body>
				<figure data-figure-type="img" id="n8r4ihxcrly" data-align="full" data-size="50">
					<img alt="123" src="https://resize-v3.pubpub.org/123">
					<figcaption>
						<p>
							<span>With a caption. </span>
							<b>Bold</b>
						</p>
					</figcaption>
				</figure>
			</body>
		</html>
	`;

	const result = await rehype()
		.use(structureImages)
		.process(inputHtml)
		.then((file) => String(file))
		.catch((error) => {
			logger.error(error);
		});

	expect(trimAll(result)).toBe(trimAll(expectedOutputHtml));
});
test("Structure Images - Vert Table", async () => {
	const inputHtml = `
		<html>
			<head></head>
			<body>
				<table>
					<tbody>
						<tr>
							<td><p><span>Type</span></p></td>
							<td><p><span>Image</span></p></td>
						</tr>
						<tr>
							<td><p><span>Id</span></p></td>
							<td><p><span>n8r4ihxcrly</span></p></td>
						</tr>
						<tr>
							<td><p><span>Source</span></p></td>
							<td><p><span>https://resize-v3.pubpub.org/123</span></p></td>
						</tr>
						<tr>
							<td><p><span>Caption</span></p></td>
							<td><p><span>With a caption. </span><b>Bold</b></p></td>
						</tr>
						<tr>
							<td><p><span>Alt Text</span></p></td>
							<td><p><b>123</b></p></td>
						</tr>
						<tr>
							<td><p><span>Align</span></p></td>
							<td><p>full</p></td>
						</tr>
						<tr>
							<td><p><span>Size</span></p></td>
							<td><p>50</p></td>
						</tr>
					</tbody>
				</table>
			</body>
		</html>
	`;
	const expectedOutputHtml = `
		<html>
			<head></head>
			<body>
				<figure data-figure-type="img" id="n8r4ihxcrly" data-align="full" data-size="50">
					<img alt="123" src="https://resize-v3.pubpub.org/123">
					<figcaption>
						<p>
							<span>With a caption. </span>
							<b>Bold</b>
						</p>
					</figcaption>
				</figure>
			</body>
		</html>
	`;

	const result = await rehype()
		.use(structureImages)
		.process(inputHtml)
		.then((file) => String(file))
		.catch((error) => {
			logger.error(error);
		});

	expect(trimAll(result)).toBe(trimAll(expectedOutputHtml));
});
test("Structure Images - DoubleVert Table", async () => {
	const inputHtml = `
		<html>
			<head></head>
			<body>
				<table>
					<tbody>
						<tr>
							<td><p><span>Type</span></p></td>
							<td><p><span>Image</span></p></td>
							<td><p><span>Image</span></p></td>
						</tr>
						<tr>
							<td><p><span>Id</span></p></td>
							<td><p><span>n8r4ihxcrly</span></p></td>
							<td><p><span>abr4ihxcrly</span></p></td>
						</tr>
						<tr>
							<td><p><span>Source</span></p></td>
							<td><p><span>https://resize-v3.pubpub.org/123</span></p></td>
							<td><p><span>https://resize-v4.pubpub.org/123</span></p></td>
						</tr>
						<tr>
							<td><p><span>Caption</span></p></td>
							<td><p><span>With a caption. </span><b>Bold</b></p></td>
							<td><p></p></td>
						</tr>
						<tr>
							<td><p><span>Alt Text</span></p></td>
							<td><p><b>123</b></p></td>
							<td><p>abc</p></td>
						</tr>
						<tr>
							<td><p><span>Align</span></p></td>
							<td><p>full</p></td>
							<td><p>left</p></td>
						</tr>
						<tr>
							<td><p><span>Size</span></p></td>
							<td><p>50</p></td>
							<td><p>75</p></td>
						</tr>
					</tbody>
				</table>
			</body>
		</html>
	`;
	const expectedOutputHtml = `
		<html>
			<head></head>
			<body>
				<figure data-figure-type="img" id="n8r4ihxcrly" data-align="full" data-size="50">
					<img alt="123" src="https://resize-v3.pubpub.org/123">
					<figcaption>
						<p>
							<span>With a caption. </span>
							<b>Bold</b>
						</p>
					</figcaption>
				</figure>
				<figure data-figure-type="img" id="abr4ihxcrly" data-align="left" data-size="75">
					<img alt="abc" src="https://resize-v4.pubpub.org/123">
					<figcaption><p></p></figcaption>
				</figure>
			</body>
		</html>
	`;

	const result = await rehype()
		.use(structureImages)
		.process(inputHtml)
		.then((file) => String(file))
		.catch((error) => {
			logger.error(error);
		});

	expect(trimAll(result)).toBe(trimAll(expectedOutputHtml));
});

test("Structure Videos", async () => {
	const inputHtml = `
		<html>
			<head></head>
			<body>
				<table>
					<tbody>
						<tr>
							<td><p><span>Type</span></p></td>
							<td><p><span>Id</span></p></td>
							<td><p><span>Source</span></p></td>
							<td><p><span>Caption</span></p></td>
							<td><p><span>Static Image</span></p></td>
							<td><p><span>Align</span></p></td>
							<td><p><span>Size</span></p></td>
						</tr>
						<tr>
							<td><p><span>Video</span></p></td>
							<td><p><span>n8r4ihxcrly</span></p></td>
							<td><p><span>https://resize-v3.pubpub.org/123.mp4</span></p></td>
							<td><p><span>With a caption. </span><b>Bold</b></p></td>
							<td>https://example.com</td>
							<td><p>full</p></td>
							<td><p>50</p></td>
						</tr>
					</tbody>
				</table>
				<table>
					<tbody>
						<tr>
							<td><p><span>Type</span></p></td>
							<td><p><span>Id</span></p></td>
							<td><p><span>Source</span></p></td>
							<td><p><span>Caption</span></p></td>
							<td><p><span>Static Image</span></p></td>
							<td><p><span>Align</span></p></td>
							<td><p><span>Size</span></p></td>
						</tr>
						<tr>
							<td><p><span>Video</span></p></td>
							<td><p><span>n8r4ihxcrly</span></p></td>
							<td><p><span>https://resize-v3.pubpub.org/123</span></p></td>
							<td><p><span>With a caption. </span><b>Bold</b></p></td>
							<td>https://example.com</td>
							<td><p>full</p></td>
							<td><p>50</p></td>
						</tr>
					</tbody>
				</table>
			</body>
		</html>
	`;
	const expectedOutputHtml = `
		<html>
			<head></head>
			<body>
				<figure data-figure-type="video" id="n8r4ihxcrly" data-align="full" data-size="50">
					<video controls poster="https://example.com">
						<source src="https://resize-v3.pubpub.org/123.mp4" type="video/mp4">
						<img src="https://example.com" alt="Video fallback image">
					</video>
					<figcaption>
						<p>
							<span>With a caption. </span>
							<b>Bold</b>
						</p>
					</figcaption>
				</figure>
				<figure data-figure-type="video" id="n8r4ihxcrly" data-align="full" data-size="50">
					<video controls poster="https://example.com">
						<source src="https://resize-v3.pubpub.org/123">
						<img src="https://example.com" alt="Video fallback image">
					</video>
					<figcaption>
						<p>
							<span>With a caption. </span>
							<b>Bold</b>
						</p>
					</figcaption>
				</figure>
			</body>
		</html>
	`;

	const result = await rehype()
		.use(structureVideos)
		.process(inputHtml)
		.then((file) => String(file))
		.catch((error) => {
			logger.error(error);
		});

	expect(trimAll(result)).toBe(trimAll(expectedOutputHtml));
});

test("Structure Audio", async () => {
	const inputHtml = `
		<html>
			<head></head>
			<body>
				<table>
					<tbody>
						<tr>
							<td><p><span>Type</span></p></td>
							<td><p><span>Id</span></p></td>
							<td><p><span>Source</span></p></td>
							<td><p><span>Caption</span></p></td>
							<td><p><span>Align</span></p></td>
							<td><p><span>Size</span></p></td>
						</tr>
						<tr>
							<td><p><span>Audio</span></p></td>
							<td><p><span>n8r4ihxcrly</span></p></td>
							<td><p><span>https://resize-v3.pubpub.org/123.mp3</span></p></td>
							<td><p><span>With a caption. </span><b>Bold</b></p></td>
							<td><p>full</p></td>
							<td><p>50</p></td>
						</tr>
					</tbody>
				</table>
				<table>
					<tbody>
						<tr>
							<td><p><span>Type</span></p></td>
							<td><p><span>Id</span></p></td>
							<td><p><span>Source</span></p></td>
							<td><p><span>Caption</span></p></td>
							<td><p><span>Align</span></p></td>
							<td><p><span>Size</span></p></td>
						</tr>
						<tr>
							<td><p><span>Audio</span></p></td>
							<td><p><span>n8r4ihxcrly</span></p></td>
							<td><p><span>https://resize-v3.pubpub.org/123</span></p></td>
							<td><p><span>With a caption. </span><b>Bold</b></p></td>
							<td><p>full</p></td>
							<td><p>50</p></td>
						</tr>
					</tbody>
				</table>
			</body>
		</html>
	`;
	const expectedOutputHtml = `
		<html>
			<head></head>
			<body>
				<figure data-figure-type="audio" id="n8r4ihxcrly" data-align="full" data-size="50">
					<audio controls>
						<source src="https://resize-v3.pubpub.org/123.mp3" type="audio/mp3">
					</audio>
					<figcaption>
						<p>
							<span>With a caption. </span>
							<b>Bold</b>
						</p>
					</figcaption>
				</figure>
				<figure data-figure-type="audio" id="n8r4ihxcrly" data-align="full" data-size="50">
					<audio controls>
						<source src="https://resize-v3.pubpub.org/123">
					</audio>
					<figcaption>
						<p>
							<span>With a caption. </span>
							<b>Bold</b>
						</p>
					</figcaption>
				</figure>
			</body>
		</html>
	`;

	const result = await rehype()
		.use(structureAudio)
		.process(inputHtml)
		.then((file) => String(file))
		.catch((error) => {
			logger.error(error);
		});

	expect(trimAll(result)).toBe(trimAll(expectedOutputHtml));
});

test("Structure Files", async () => {
	const inputHtml = `
		<html>
			<head></head>
			<body>
				<table>
					<tbody>
						<tr>
							<td><p><span>Type</span></p></td>
							<td><p><span>Id</span></p></td>
							<td><p><span>Source</span></p></td>
							<td><p><span>Filename</span></p></td>
							<td><p><span>Caption</span></p></td>
						</tr>
						<tr>
							<td><p><span>File</span></p></td>
							<td><p><span>n8r4ihxcrly</span></p></td>
							<td><p><span>https://resize-v3.pubpub.org/123.zip</span></p></td>
							<td><p><span>data.zip</span></p></td>
							<td><p><span>With a caption. </span><b>Bold</b></p></td>
						</tr>
					</tbody>
				</table>
			</body>
		</html>
	`;
	const expectedOutputHtml = `
		<html>
			<head></head>
			<body>
				<figure data-figure-type="file" id="n8r4ihxcrly">
					<div class="file-card">
						<span class="file-name">data.zip</span>
						<a class="file-button" href="https://resize-v3.pubpub.org/123.zip" download="data.zip">Download</a>
					</div>
					<figcaption>
						<p>
							<span>With a caption. </span>
							<b>Bold</b>
						</p>
					</figcaption>
				</figure>
			</body>
		</html>
	`;

	const result = await rehype()
		.use(structureFiles)
		.process(inputHtml)
		.then((file) => String(file))
		.catch((error) => {
			logger.error(error);
		});

	expect(trimAll(result)).toBe(trimAll(expectedOutputHtml));
});

test("Structure Iframes", async () => {
	const inputHtml = `
		<html>
			<head></head>
			<body>
				<table>
					<tbody>
						<tr>
							<td><p><span>Type</span></p></td>
							<td><p><span>Id</span></p></td>
							<td><p><span>Source</span></p></td>
							<td><p><span>Caption</span></p></td>
							<td><p><span>Static Image</span></p></td>
							<td><p><span>Align</span></p></td>
							<td><p><span>Size</span></p></td>
							<td><p><span>Height</span></p></td>
						</tr>
						<tr>
							<td><p><span>Iframe</span></p></td>
							<td><p><span>n8r4ihxcrly</span></p></td>
							<td><p><span>https://resize-v3.pubpub.org/123</span></p></td>
							<td><p><span>With a caption. </span><b>Bold</b></p></td>
							<td>https://example.com</td>
							<td><p><span>full</span></p></td>
							<td><p><span>75</span></p></td>
							<td><p><span>450</span></p></td>
						</tr>
					</tbody>
				</table>
			</body>
		</html>
	`;
	const expectedOutputHtml = `
		<html>
			<head></head>
			<body>
				<figure data-figure-type="iframe" id="n8r4ihxcrly" data-align="full" data-size="75">
					<iframe src="https://resize-v3.pubpub.org/123" frameborder="0" data-fallback-image="https://example.com" height="450"></iframe>
					<figcaption>
						<p>
							<span>With a caption. </span>
							<b>Bold</b>
						</p>
					</figcaption>
				</figure>
			</body>
		</html>
	`;

	const result = await rehype()
		.use(structureIframes)
		.process(inputHtml)
		.then((file) => String(file))
		.catch((error) => {
			logger.error(error);
		});

	expect(trimAll(result)).toBe(trimAll(expectedOutputHtml));
});

test("Structure BlockMath", async () => {
	const inputHtml = `
		<html>
			<head></head>
			<body>
				<table>
					<tbody>
						<tr>
							<td><p><span>Type</span></p></td>
							<td><p><span>Id</span></p></td>
							<td><p><span>Value</span></p></td>
							<td><p><span>Caption</span></p></td>
						</tr>
						<tr>
							<td><p><span>Math</span></p></td>
							<td><p><span>n8r4ihxcrly</span></p></td>
							<td><p>x=2</p></td>
							<td><p><span>With a caption. </span><b>Bold</b></p></td>
						</tr>
					</tbody>
				</table>
			</body>
		</html>
	`;
	const expectedOutputHtml = `<html>
		<head></head>
		<body>
			<figure data-figure-type="math" id="n8r4ihxcrly">
				<div class="math-block"><span class="katex-display"><span class="katex"><span class="katex-mathml"><math xmlns="http://www.w3.org/1998/Math/MathML" display="block"><semantics><mrow><mi>x</mi><mo>=</mo><mn>2</mn></mrow><annotation encoding="application/x-tex">x=2</annotation></semantics></math></span><span class="katex-html" aria-hidden="true"><span class="base"><span class="strut" style="height:0.4306em;"></span><span class="mord mathnormal">x</span><span class="mspace" style="margin-right:0.2778em;"></span><span class="mrel">=</span><span class="mspace" style="margin-right:0.2778em;"></span></span><span class="base"><span class="strut" style="height:0.6444em;"></span><span class="mord">2</span></span></span></span></span></div>
				<figcaption><p><span>With a caption. </span><b>Bold</b></p></figcaption>
			</figure>
		</body>
	</html>`;

	const result = await rehype()
		.use(structureBlockMath)
		.process(inputHtml)
		.then((file) => String(file))
		.catch((error) => {
			logger.error(error);
		});

	expect(trimAll(result)).toBe(trimAll(expectedOutputHtml));
});

test("Structure InlineMath", async () => {
	const inputHtml = `
		<html>
			<head></head>
			<body>
				<p>I am just writing a lovely $10 equation like this $y=2x + 5$</p>
				<p>Should also work as long as styling doesn't <b>change throughout, such as $z= 25x + 2$ and <i>so</i> on.</b></p>
				<p>Now consider two different genes, $A$ and $B$, with variation in allelic state across a population of diploid organisms. One gene $A$ has two alleles $A$ and $a$, resulting in three allelic states, </p>
			</body>
		</html>
	`;
	const expectedOutputHtml = `
		<html>
			<head></head>
			<body>
				<p>I am just writing a lovely $10 equation like this <span class="math-block"><span class="katex"><span class="katex-mathml"><math xmlns="http://www.w3.org/1998/Math/MathML"><semantics><mrow><mi>y</mi><mo>=</mo><mn>2</mn><mi>x</mi><mo>+</mo><mn>5</mn></mrow><annotation encoding="application/x-tex">y=2x + 5</annotation></semantics></math></span><span class="katex-html" aria-hidden="true"><span class="base"><span class="strut" style="height:0.625em;vertical-align:-0.1944em;"></span><span class="mord mathnormal" style="margin-right:0.03588em;">y</span><span class="mspace" style="margin-right:0.2778em;"></span><span class="mrel">=</span><span class="mspace" style="margin-right:0.2778em;"></span></span><span class="base"><span class="strut" style="height:0.7278em;vertical-align:-0.0833em;"></span><span class="mord">2</span><span class="mord mathnormal">x</span><span class="mspace" style="margin-right:0.2222em;"></span><span class="mbin">+</span><span class="mspace" style="margin-right:0.2222em;"></span></span><span class="base"><span class="strut" style="height:0.6444em;"></span><span class="mord">5</span></span></span></span></span></p>
				<p>Should also work as long as styling doesn't <b>change throughout, such as <span class="math-block"><span class="katex"><span class="katex-mathml"><math xmlns="http://www.w3.org/1998/Math/MathML"><semantics><mrow><mi>z</mi><mo>=</mo><mn>25</mn><mi>x</mi><mo>+</mo><mn>2</mn></mrow><annotation encoding="application/x-tex">z= 25x + 2</annotation></semantics></math></span><span class="katex-html" aria-hidden="true"><span class="base"><span class="strut" style="height:0.4306em;"></span><span class="mord mathnormal" style="margin-right:0.04398em;">z</span><span class="mspace" style="margin-right:0.2778em;"></span><span class="mrel">=</span><span class="mspace" style="margin-right:0.2778em;"></span></span><span class="base"><span class="strut" style="height:0.7278em;vertical-align:-0.0833em;"></span><span class="mord">25</span><span class="mord mathnormal">x</span><span class="mspace" style="margin-right:0.2222em;"></span><span class="mbin">+</span><span class="mspace" style="margin-right:0.2222em;"></span></span><span class="base"><span class="strut" style="height:0.6444em;"></span><span class="mord">2</span></span></span></span></span> and <i>so</i> on.</b></p>
				<p>Now consider two different genes, <span class="math-block"><span class="katex"><span class="katex-mathml"><math xmlns="http://www.w3.org/1998/Math/MathML"><semantics><mrow><mi>A</mi></mrow><annotation encoding="application/x-tex">A</annotation></semantics></math></span><span class="katex-html" aria-hidden="true"><span class="base"><span class="strut" style="height:0.6833em;"></span><span class="mord mathnormal">A</span></span></span></span></span> and <span class="math-block"><span class="katex"><span class="katex-mathml"><math xmlns="http://www.w3.org/1998/Math/MathML"><semantics><mrow><mi>B</mi></mrow><annotation encoding="application/x-tex">B</annotation></semantics></math></span><span class="katex-html" aria-hidden="true"><span class="base"><span class="strut" style="height:0.6833em;"></span><span class="mord mathnormal" style="margin-right:0.05017em;">B</span></span></span></span></span>, with variation in allelic state across a population of diploid organisms. One gene <span class="math-block"><span class="katex"><span class="katex-mathml"><math xmlns="http://www.w3.org/1998/Math/MathML"><semantics><mrow><mi>A</mi></mrow><annotation encoding="application/x-tex">A</annotation></semantics></math></span><span class="katex-html" aria-hidden="true"><span class="base"><span class="strut" style="height:0.6833em;"></span><span class="mord mathnormal">A</span></span></span></span></span> has two alleles <span class="math-block"><span class="katex"><span class="katex-mathml"><math xmlns="http://www.w3.org/1998/Math/MathML"><semantics><mrow><mi>A</mi></mrow><annotation encoding="application/x-tex">A</annotation></semantics></math></span><span class="katex-html" aria-hidden="true"><span class="base"><span class="strut" style="height:0.6833em;"></span><span class="mord mathnormal">A</span></span></span></span></span> and <span class="math-block"><span class="katex"><span class="katex-mathml"><math xmlns="http://www.w3.org/1998/Math/MathML"><semantics><mrow><mi>a</mi></mrow><annotation encoding="application/x-tex">a</annotation></semantics></math></span><span class="katex-html" aria-hidden="true"><span class="base"><span class="strut" style="height:0.4306em;"></span><span class="mord mathnormal">a</span></span></span></span></span>, resulting in three allelic states, </p>
			</body>
		</html>
		`;

	const result = await rehype()
		.use(structureInlineMath)
		.process(inputHtml)
		.then((file) => String(file))
		.catch((error) => {
			logger.error(error);
		});

	expect(trimAll(result)).toBe(trimAll(expectedOutputHtml));
});

test("Structure Blockquote", async () => {
	const inputHtml = `
		<html>
			<head></head>
			<body>
				<table>
					<tbody>
						<tr>
							<td><p><span>Type</span></p></td>
							<td><p><span>Id</span></p></td>
							<td><p><span>Value</span></p></td>
						</tr>
						<tr>
							<td><p><span>Blockquote</span></p></td>
							<td><p><span>n8r4ihxcrly</span></p></td>
							<td><p><span>With a caption. </span><b>Bold</b></p></td>
						</tr>
					</tbody>
				</table>
			</body>
		</html>
	`;
	const expectedOutputHtml = `
		<html>
			<head></head>
			<body>
				<blockquote id="n8r4ihxcrly">
					<p>
						<span>With a caption. </span>
						<b>Bold</b>
					</p>
				</blockquote>
			</body>
		</html>
	`;

	const result = await rehype()
		.use(structureBlockquote)
		.process(inputHtml)
		.then((file) => String(file))
		.catch((error) => {
			logger.error(error);
		});

	expect(trimAll(result)).toBe(trimAll(expectedOutputHtml));
});

test("Structure Code Block", async () => {
	const inputHtml = `
		<html>
			<head></head>
			<body>
				<table>
					<tbody>
						<tr>
							<td><p><span>Type</span></p></td>
							<td><p><span>Id</span></p></td>
							<td><p><span>Language</span></p></td>
							<td><p><span>Value</span></p></td>
						</tr>
						<tr>
							<td><p><span>Code</span></p></td>
							<td><p><span>n8r4ihxcrly</span></p></td>
							<td><p>cpp</p></td>
							<td><p><span>With a caption. </span><b>Bold</b></p></td>
						</tr>
					</tbody>
				</table>
			</body>
		</html>
	`;
	const expectedOutputHtml = `
		<html>
			<head></head>
			<body>
				<pre id="n8r4ihxcrly" data-lang="cpp">
					<code>
						<p>
							<span>With a caption. </span>
							<b>Bold</b>
						</p>
					</code>
				</pre>
			</body>
		</html>
	`;

	const result = await rehype()
		.use(structureCodeBlock)
		.process(inputHtml)
		.then((file) => String(file))
		.catch((error) => {
			logger.error(error);
		});

	expect(trimAll(result)).toBe(trimAll(expectedOutputHtml));
});

test("Structure InlineCode", async () => {
	const inputHtml = `
		<html>
			<head></head>
			<body>
				<p>I am just writing a lovely \`10 equation like this \`y=2x + 5\`</p>
				<p>Should also work as long as styling doesn't <b>change throughout, such as \`z= 25x + 2\` and <i>so</i> on.</b></p>
			</body>
		</html>
	`;
	const expectedOutputHtml = `
		<html>
			<head></head>
			<body>
				<p>I am just writing a lovely \`10 equation like this <code>y=2x + 5</code></p>
				<p>Should also work as long as styling doesn't <b>change throughout, such as <code>z= 25x + 2</code> and <i>so</i> on.</b></p>
			</body>
		</html>
		`;

	const result = await rehype()
		.use(structureInlineCode)
		.process(inputHtml)
		.then((file) => String(file))
		.catch((error) => {
			logger.error(error);
		});

	expect(trimAll(result)).toBe(trimAll(expectedOutputHtml));
});

test("Structure Anchors", async () => {
	const inputHtml = `
		<html>
			<head></head>
			<body>
				<table>
					<tbody>
						<tr>
							<td><p><span>Type</span></p></td>
							<td><p><span>Id</span></p></td>
						</tr>
						<tr>
							<td><p><span>Anchor</span></p></td>
							<td><p><span>n8r4ihxcrly</span></p></td>
						</tr>
					</tbody>
				</table>
				<h1>Here is my text</h1>
			</body>
		</html>
	`;
	const expectedOutputHtml = `
		<html>
			<head></head>
			<body>
				<a id="n8r4ihxcrly"></a>
				<h1>Here is my text</h1>
			</body>
		</html>
	`;

	const result = await rehype()
		.use(structureAnchors)
		.process(inputHtml)
		.then((file) => String(file))
		.catch((error) => {
			logger.error(error);
		});

	expect(trimAll(result)).toBe(trimAll(expectedOutputHtml));
});

// test("Structure References", async () => {
// 	const inputHtml = `
// 		<html>
// 			<head></head>
// 			<body>
// 				<div><p>Here is some text {ref2}{ref1}, {ref38}</p></div>
// 				<table>
// 					<tbody>
// 						<tr>
// 							<td><p><span>Type</span></p></td>
// 							<td><p><span>Id</span></p></td>
// 							<td><p><span>Value</span></p></td>
// 							<td><p><span>Unstructured Value</span></p></td>
// 						</tr>
// 						<tr>
// 							<td><p><span>Reference</span></p></td>
// 							<td><p><span>ref1</span></p></td>
// 							<td><p><span>https://doi.org/10.57844/arcadia-0zvp-xz86</span></p></td>
// 							<td><p><span></span></p></td>
// 						</tr>
// 						<tr>
// 							<td><p><span>Reference</span></p></td>
// 							<td><p><span>ref2</span></p></td>
// 							<td><p><span>https://doi.org/10.1038/s41586-020-2983-4</span></p></td>
// 							<td><p><span></span></p></td>
// 						</tr>
// 						<tr>
// 							<td><p><span>Reference</span></p></td>
// 							<td><p><span>ref3</span></p></td>
// 							<td><p><span>https://doi.org/10.1016/j.cell.2014.05.041</span></p></td>
// 							<td><p><span></span></p></td>
// 						</tr>
// 						<tr>
// 							<td><p><span>Reference</span></p></td>
// 							<td><p><span>ref4</span></p></td>
// 							<td><p><span>https://doi.org/10.7554/eLife.37072</span></p></td>
// 							<td><p><span></span></p></td>
// 						</tr>
// 					</tbody>
// 				</table>
// 				<p>I'd also like to add [<u><a>10.12341</a></u>] here.</p>
// 				<p>And this should be the same number [10.12341] here. But <a href="cat">this</a> diff, [http://doi.org/10.5123/123]. </p>
// 				<p><span>Two more [</span><u><a href="10.1016/S0167-4781(02)00500-6">10.1016/S0167-4781(02)00500-6</a></u><span>]</span><span>[</span><span>10.abc123</span><span>].</span></p>
// 			</body>
// 		</html>
// 	`;
// 	const expectedOutputHtml = `<html>
// 			<head></head>
// 			<body>
// 				<div>
// 					<p>
// 						Here is some text <a
// 							data-type="reference" data-value="https://doi.org/10.1038/s41586-020-2983-4" data-unstructured-value="">
// 							[1]
// 						</a><a
// 							 data-type="reference" data-value="https://doi.org/10.57844/arcadia-0zvp-xz86" data-unstructured-value="">
// 							[2]
// 						</a>, {ref38}
// 					</p>
// 				</div>
// 				<p>I'd also like to add <a
// 							 data-type="reference" data-value="10.12341">
// 							[3]
// 						</a> here.</p>
// 				<p>And this should be the same number <a
// 							 data-type="reference" data-value="10.12341">
// 							[3]
// 						</a> here. But <a href="cat">this</a> diff, <a
// 							 data-type="reference" data-value="http://doi.org/10.5123/123">
// 							[4]
// 						</a>. </p>
// 				<p>Two more <a
// 							 data-type="reference" data-value="10.1016/S0167-4781(02)00500-6">
// 							[5]
// 						</a><a
// 							 data-type="reference" data-value="10.abc123">
// 							[6]
// 						</a>.</p>
// 			</body>
// 		</html>
// 	`;

// 	const result = await rehype()
// 		.use(cleanUnusedSpans)
// 		.use(structureReferences)
// 		.process(inputHtml)
// 		.then((file) => String(file))
// 		.catch((error) => {
// 			logger.error(error);
// 		});

// 	expect(trimAll(result)).toBe(trimAll(expectedOutputHtml));
// });

test("cleanUnusedSpans", async () => {
	const inputHtml = `
		<html>
			<head></head>
			<body>
				<p><span>Hello </span><span>there.</span></p>
				<p><span>What?</span></p>
			</body>
		</html>
	`;
	const expectedOutputHtml = `<html>
			<head></head>
			<body>
				<p>Hello there.</p>
				<p>What?</p>
			</body>
		</html>
	`;

	const result = await rehype()
		.use(cleanUnusedSpans)
		.process(inputHtml)
		.then((file) => String(file))
		.catch((error) => {
			logger.error(error);
		});

	expect(trimAll(result)).toBe(trimAll(expectedOutputHtml));
});

test("Structure Footnotes", async () => {
	const inputHtml = `
		<html>
			<head></head>
			<body>
				<div><p>Here is some text {ref2}, {ref1}, {ref38}</p></div>
				<table>
					<tbody>
						<tr>
							<td><p><span>Type</span></p></td>
							<td><p><span>Id</span></p></td>
							<td><p><span>Value</span></p></td>
							<td><p><span>Structured Value</span></p></td>
						</tr>
						<tr>
							<td><p><span>Footnote</span></p></td>
							<td><p><span>ref1</span></p></td>
							<td><p><span></span></p></td>
							<td><p><span>https://doi.org/10.57844/arcadia-0zvp-xz86</span></p></td>
						</tr>
						<tr>
							<td><p><span>Footnote</span></p></td>
							<td><p><span>ref2</span></p></td>
							<td><p><span>Hi there, this is my footnote!</span></p></td>
							<td><p><span></span></p></td>
						</tr>
						<tr>
							<td><p><span>Footnote</span></p></td>
							<td><p><span>ref3</span></p></td>
							<td><p><span>https://doi.org/10.1016/j.cell.2014.05.041</span></p></td>
							<td><p><span></span></p></td>
						</tr>
					</tbody>
				</table>
			</body>
		</html>
	`;
	const expectedOutputHtml = `<html><head></head><body><div>
			<p>Here is some text <a data-type="footnote" data-value="<div><p><span>Hi there, this is my footnote!</span></p></div>" data-structured-value="">[2]</a>, <a data-type="footnote" data-value="<div><p><span></span></p></div>" data-structured-value="https://doi.org/10.57844/arcadia-0zvp-xz86">[1]</a>, {ref38}
			</p>
		</div></body></html>`;

	const result = await rehype()
		.use(structureFootnotes)
		.process(inputHtml)
		.then((file) => String(file))
		.catch((error) => {
			logger.error(error);
		});

	expect(trimAll(result)).toBe(trimAll(expectedOutputHtml));
});

test("removeGoogleLinkForwards", async () => {
	const inputHtml = `
		<html>
			<head></head>
			<body>
				<div><p>Here is some text {ref2}, {ref1}, {ref38}</p></div>
				<p>
					<sup>
						<u>
							<a
								href="https://www.google.com/url?q=https://research.arcadiascience.com/icebox&#x26;sa=D&#x26;source=editors&#x26;ust=1735008185029653&#x26;usg=AOvVaw3BrkYrphpexOt8IFnAV6MN"
							>
								Learn more
							</a>
						</u>
					</sup>
				</p>
				<p>Another <a href="https://www.google.com/url?q=https://local.pubpub/%23n84lvlagdc2&amp;sa=D&amp;source=editors&amp;ust=1735008267184897&amp;usg=AOvVaw3-emucfkfJE8CHmFXlcgUo">Figure 1</a>.</p>
				<sup> about the Icebox and the different reasons we ice projects.</sup>
			</body>
		</html>

	`;
	const expectedOutputHtml = `<html>
			<head></head>
			<body>
				<div><p>Here is some text {ref2}, {ref1}, {ref38}</p></div>
				<p>
					<sup>
						<u>
							<a href="https://research.arcadiascience.com/icebox">
								Learn more
							</a>
						</u>
					</sup>
				</p>
				<p>Another <a href="https://local.pubpub/#n84lvlagdc2">Figure 1</a>.</p>
				<sup> about the Icebox and the different reasons we ice projects.</sup>
			</body>
		</html>`;

	const result = await rehype()
		.use(removeGoogleLinkForwards)
		.process(inputHtml)
		.then((file) => String(file))
		.catch((error) => {
			logger.error(error);
		});

	expect(trimAll(result)).toBe(trimAll(expectedOutputHtml));
});

test("processLocalLinks", async () => {
	const inputHtml = `
		<html>
			<head></head>
			<body>
				<div><p>Here is some text {ref2}, {ref1}, {ref38}</p></div>
				<p>
					<sup>
						<u>
							<a href="https://research.arcadiascience.com/icebox">
								Learn more
							</a>
						</u>
					</sup>
				</p>
				<p>Another <a href="https://local.pubpub/#n84lvlagdc2">Figure 1</a>.</p>
				<sup> about the Icebox and the different reasons we ice projects.</sup>
			</body>
		</html>

	`;
	const expectedOutputHtml = `<html>
			<head></head>
			<body>
				<div><p>Here is some text {ref2}, {ref1}, {ref38}</p></div>
				<p>
					<sup>
						<u>
							<a href="https://research.arcadiascience.com/icebox">
								Learn more
							</a>
						</u>
					</sup>
				</p>
				<p>Another <a href="#n84lvlagdc2">Figure 1</a>.</p>
				<sup> about the Icebox and the different reasons we ice projects.</sup>
			</body>
		</html>`;

	const result = await rehype()
		.use(processLocalLinks)
		.process(inputHtml)
		.then((file) => String(file))
		.catch((error) => {
			logger.error(error);
		});

	expect(trimAll(result)).toBe(trimAll(expectedOutputHtml));
});

test("removeEmptyFigCaption", async () => {
	const inputHtml = `
		<html>
			<head></head>
			<body>
				<figure id="n8r4ihxcrly">
					<img alt="123" src="https://resize-v3.pubpub.org/123">
					<figcaption>
						<p><span></span></p>
					</figcaption>
				</figure>
			</body>
		</html>

	`;
	const expectedOutputHtml = `<html>
			<head></head>
			<body>
				<figure id="n8r4ihxcrly">
					<img alt="123" src="https://resize-v3.pubpub.org/123">
				</figure>
			</body>
		</html>`;

	const result = await rehype()
		.use(removeEmptyFigCaption)
		.process(inputHtml)
		.then((file) => String(file))
		.catch((error) => {
			logger.error(error);
		});

	expect(trimAll(result)).toBe(trimAll(expectedOutputHtml));
});

test("formatLists", async () => {
	const inputHtml = `
		<html>
			<head></head>
			<body>
				<p>Hello</p>
				<ul>
					<li style="margin-left: 10pt;"><span>Bullet 1</span></li>
				</ul><ul>
					<li style="margin-left: 20pt;"><span>Bullet 1.1</span></li>
				</ul>
				<p>Hello again</p>
				<ul>
					<li style="margin-left: 10pt;"><span>Bullet 1</span></li>
				</ul><ul>
					<li style="margin-left: 20pt;"><span>Bullet 1.1</span></li>
				</ul><ul>
					<li style="margin-left: 30pt;"><span>Bullet 1.1.1</span></li>
				</ul><ul>
					<li style="margin-left: 10pt;"><span>Bullet 2</span></li>
				</ul>
			</body>
		</html>
	`;
	const expectedOutputHtml = `
		<html>
			<head></head>
			<body>
				<p>Hello</p>
				<ul>
					<li style="margin-left: 10pt;">
						<span>Bullet 1</span>
						<ul>
							<li style="margin-left: 20pt;"><span>Bullet 1.1</span></li>
						</ul>
					</li>
				</ul>
				<p>Hello again</p>
				<ul>
					<li style="margin-left: 10pt;">
						<span>Bullet 1</span>
						<ul>
							<li style="margin-left: 20pt;">
								<span>Bullet 1.1</span>
								<ul>
									<li style="margin-left: 30pt;"><span>Bullet 1.1.1</span></li>
								</ul>
							</li>
						</ul>
					</li>
					<li style="margin-left: 10pt;"><span>Bullet 2</span></li>
				</ul>
			</body>
		</html>
	`;

	const result = await rehype()
		.use(formatLists)
		.process(inputHtml)
		.then((file) => String(file))
		.catch((error) => {
			logger.error(error);
		});

	expect(trimAll(result)).toBe(trimAll(expectedOutputHtml));
});

test("removeDescriptions", async () => {
	const inputHtml = `
		<html>
			<head></head>
			<body><table>
					<tr>
						<td>Type</td>
						<td>Value</td>
					</tr>
					<tr>
						<td>Description</td>
						<td>Seeing how microbes are organized ...</td>
					</tr>
				</table><p>Hello</p>
			</body>
		</html>

	`;
	const expectedOutputHtml = `<html>
			<head></head>
			<body>
				<p>Hello</p>
			</body>
		</html>`;

	const result = await rehype()
		.use(removeDescription)
		.process(inputHtml)
		.then((file) => String(file))
		.catch((error) => {
			logger.error(error);
		});

	expect(trimAll(result)).toBe(trimAll(expectedOutputHtml));
});

test("getDescription", async () => {
	const inputHtml = `
		<html>
			<head></head>
			<body><table>
					<tr>
						<td>Type</td>
						<td>Value</td>
					</tr>
					<tr>
						<td>Description</td>
						<td><p style="padding:0;margin:0;color:#000000;font-size:11pt;font-family:&#x22;Arial&#x22;;line-height:1.0;text-align:left"><span>We previously released a draft genome assembly for the lone star tick, <span style="font-style:italic">A. americanum. </span><span style="color:#000000;font-weight:400;text-decoration:none;vertical-align:baseline;font-size:11pt;font-family:&#x22;Arial&#x22;;font-style:normal">We've now predicted genes from this assembly to use for downstream functional characterization and comparative genomics efforts.</span></p></span></td>
					</tr>
				</table><p>Hello</p>
			</body>
		</html>

	`;
	const expectedOutputHtml = `We previously released a draft genome assembly for the lone star tick, <i>A. americanum. </i>We've now predicted genes from this assembly to use for downstream functional characterization and comparative genomics efforts.`;

	const result = getDescription(inputHtml);

	expect(trimAll(result)).toBe(trimAll(expectedOutputHtml));
});

test("formatFigureReferences", async () => {
	const inputHtml = `
		<html>
			<head></head>
			<body>
				<p>Hello.</p>
				<table>
					<tbody>
						<tr>
							<td><p><span>Type</span></p></td>
							<td><p><span>Id</span></p></td>
							<td><p><span>Source</span></p></td>
						</tr>
						<tr>
							<td><p><span>Iframe</span></p></td>
							<td><p><span>test1</span></p></td>
							<td><p><span>https://resize-v3.pubpub.org/123</span></p></td>
						</tr>
					</tbody>
				</table>
				<table>
					<tbody>
						<tr>
							<td><p><span>Type</span></p></td>
							<td><p><span>Id</span></p></td>
							<td><p><span>Source</span></p></td>
							<td><p><span>Hide Label</span></p></td>
						</tr>
						<tr>
							<td><p><span>Iframe</span></p></td>
							<td><p><span>abra</span></p></td>
							<td><p><span>https://resize-v3.pubpub.org/123</span></p></td>
							<td><p><span>True</span></p></td>
						</tr>
					</tbody>
				</table>
				<p>As seen in @test1 we have more.</p>
				<p>Also seen in @test2 we have an image.</p>
				<p>Again, @test1 shows this.</p>
				<table>
					<tbody>
						<tr>
							<td><p><span>Type</span></p></td>
							<td><p><span>Id</span></p></td>
							<td><p><span>Source</span></p></td>
						</tr>
						<tr>
							<td><p><span>Image</span></p></td>
							<td><p><span>test2</span></p></td>
							<td><p><span>https://resize-v3.pubpub.org/123</span></p></td>
						</tr>
					</tbody>
				</table>
				<p>Again, @test4 shows this.</p>
				<table>
					<tbody>
						<tr>
							<td><p><span>Type</span></p></td>
							<td><p><span>Id</span></p></td>
							<td><p><span>Source</span></p></td>
						</tr>
						<tr>
							<td><p><span>Video</span></p></td>
							<td><p><span>test4</span></p></td>
							<td><p><span>https://resize-v3.pubpub.org/123.mp4</span></p></td>
						</tr>
					</tbody>
				</table>
			</body>
		</html>

	`;
	const expectedOutputHtml = `
		<html>
			<head></head>
			<body>
				<p>Hello.</p>
				<figure data-figure-type="iframe" id="test1">
					<iframe src="https://resize-v3.pubpub.org/123" frameborder="0"></iframe>
				</figure>
				<figure data-figure-type="iframe" id="abra" data-hide-label="True">
					<iframe src="https://resize-v3.pubpub.org/123" frameborder="0"></iframe>
				</figure>
				<p>As seen in <a href="#test1" data-figure-count="1"></a> we have more.</p>
				<p>Also seen in <a href="#test2" data-figure-count="2"></a> we have an image.</p>
				<p>Again, <a href="#test1" data-figure-count="1"></a> shows this.</p>
				<figure data-figure-type="img" id="test2">
					<img src="https://resize-v3.pubpub.org/123">
				</figure>
				<p>Again, <a href="#test4" data-figure-count="1"></a> shows this.</p>
				<figure data-figure-type="video" id="test4">
					<video controls>
						<source src="https://resize-v3.pubpub.org/123.mp4" type="video/mp4">
						<img alt="Video fallback image">
					</video>
				</figure>
			</body>
		</html>
	`;

	const result = await rehype()
		.use(formatFigureReferences)
		.use(structureIframes)
		.use(structureVideos)
		.use(structureImages)
		.use(removeEmptyFigCaption)
		.process(inputHtml)
		.then((file) => String(file))
		.catch((error) => {
			logger.error(error);
		});

	expect(trimAll(result)).toBe(trimAll(expectedOutputHtml));
});

test("formatFigureReferencesWithParens", async () => {
	const inputHtml = `
		<html>
			<head></head>
			<body>
				<p>Hello.</p>
				<table>
					<tbody>
						<tr>
							<td><p><span>Type</span></p></td>
							<td><p><span>Id</span></p></td>
							<td><p><span>Source</span></p></td>
						</tr>
						<tr>
							<td><p><span>Iframe</span></p></td>
							<td><p><span>test1</span></p></td>
							<td><p><span>https://resize-v3.pubpub.org/123</span></p></td>
						</tr>
					</tbody>
				</table>
				<table>
					<tbody>
						<tr>
							<td><p><span>Type</span></p></td>
							<td><p><span>Id</span></p></td>
							<td><p><span>Source</span></p></td>
							<td><p><span>Hide Label</span></p></td>
						</tr>
						<tr>
							<td><p><span>Iframe</span></p></td>
							<td><p><span>abra</span></p></td>
							<td><p><span>https://resize-v3.pubpub.org/123</span></p></td>
							<td><p><span>True</span></p></td>
						</tr>
					</tbody>
				</table>
				<p>As seen in (@test1) we have more.</p>
				<p>Also seen in (@test2) we have an image.</p>
				<p>Again, @test1 shows this.</p>
				<table>
					<tbody>
						<tr>
							<td><p><span>Type</span></p></td>
							<td><p><span>Id</span></p></td>
							<td><p><span>Source</span></p></td>
						</tr>
						<tr>
							<td><p><span>Image</span></p></td>
							<td><p><span>test2</span></p></td>
							<td><p><span>https://resize-v3.pubpub.org/123</span></p></td>
						</tr>
					</tbody>
				</table>
				<p>Again, @test4 shows this.</p>
				<table>
					<tbody>
						<tr>
							<td><p><span>Type</span></p></td>
							<td><p><span>Id</span></p></td>
							<td><p><span>Source</span></p></td>
						</tr>
						<tr>
							<td><p><span>Video</span></p></td>
							<td><p><span>test4</span></p></td>
							<td><p><span>https://resize-v3.pubpub.org/123.mp4</span></p></td>
						</tr>
					</tbody>
				</table>
			</body>
		</html>

	`;
	const expectedOutputHtml = `
		<html>
			<head></head>
			<body>
				<p>Hello.</p>
				<figure data-figure-type="iframe" id="test1">
					<iframe src="https://resize-v3.pubpub.org/123" frameborder="0"></iframe>
				</figure>
				<figure data-figure-type="iframe" id="abra" data-hide-label="True">
					<iframe src="https://resize-v3.pubpub.org/123" frameborder="0"></iframe>
				</figure>
				<p>As seen in (<a href="#test1" data-figure-count="1"></a>) we have more.</p>
				<p>Also seen in (<a href="#test2" data-figure-count="2"></a>) we have an image.</p>
				<p>Again, <a href="#test1" data-figure-count="1"></a> shows this.</p>
				<figure data-figure-type="img" id="test2">
					<img src="https://resize-v3.pubpub.org/123">
				</figure>
				<p>Again, <a href="#test4" data-figure-count="1"></a> shows this.</p>
				<figure data-figure-type="video" id="test4">
					<video controls>
						<source src="https://resize-v3.pubpub.org/123.mp4" type="video/mp4">
						<img alt="Video fallback image">
					</video>
				</figure>
			</body>
		</html>
	`;

	const result = await rehype()
		.use(formatFigureReferences)
		.use(structureIframes)
		.use(structureVideos)
		.use(structureImages)
		.use(removeEmptyFigCaption)
		.process(inputHtml)
		.then((file) => String(file))
		.catch((error) => {
			logger.error(error);
		});

	expect(trimAll(result)).toBe(trimAll(expectedOutputHtml));
});

test("formatFigureReferencesWithStartOfLine", async () => {
	const inputHtml = `
		<html>
			<head></head>
			<body>
				<p>Hello.</p>
				<table>
					<tbody>
						<tr>
							<td><p><span>Type</span></p></td>
							<td><p><span>Id</span></p></td>
							<td><p><span>Source</span></p></td>
						</tr>
						<tr>
							<td><p><span>Iframe</span></p></td>
							<td><p><span>test1</span></p></td>
							<td><p><span>https://resize-v3.pubpub.org/123</span></p></td>
						</tr>
					</tbody>
				</table>
				<table>
					<tbody>
						<tr>
							<td><p><span>Type</span></p></td>
							<td><p><span>Id</span></p></td>
							<td><p><span>Source</span></p></td>
							<td><p><span>Hide Label</span></p></td>
						</tr>
						<tr>
							<td><p><span>Iframe</span></p></td>
							<td><p><span>abra</span></p></td>
							<td><p><span>https://resize-v3.pubpub.org/123</span></p></td>
							<td><p><span>True</span></p></td>
						</tr>
					</tbody>
				</table>
				<p>@test1 shows we have more.</p>
				<p>Also seen <span>in (</span>@test2) we have an image.</p>
				<p>Again, @test1 shows this.</p>
				<table>
					<tbody>
						<tr>
							<td><p><span>Type</span></p></td>
							<td><p><span>Id</span></p></td>
							<td><p><span>Source</span></p></td>
						</tr>
						<tr>
							<td><p><span>Image</span></p></td>
							<td><p><span>test2</span></p></td>
							<td><p><span>https://resize-v3.pubpub.org/123</span></p></td>
						</tr>
					</tbody>
				</table>
				<p>Again, @test4 shows this.</p>
				<table>
					<tbody>
						<tr>
							<td><p><span>Type</span></p></td>
							<td><p><span>Id</span></p></td>
							<td><p><span>Source</span></p></td>
						</tr>
						<tr>
							<td><p><span>Video</span></p></td>
							<td><p><span>test4</span></p></td>
							<td><p><span>https://resize-v3.pubpub.org/123.mp4</span></p></td>
						</tr>
					</tbody>
				</table>
			</body>
		</html>

	`;
	const expectedOutputHtml = `
		<html>
			<head></head>
			<body>
				<p>Hello.</p>
				<figure data-figure-type="iframe" id="test1">
					<iframe src="https://resize-v3.pubpub.org/123" frameborder="0"></iframe>
				</figure>
				<figure data-figure-type="iframe" id="abra" data-hide-label="True">
					<iframe src="https://resize-v3.pubpub.org/123" frameborder="0"></iframe>
				</figure>
				<p><a href="#test1" data-figure-count="1"></a> shows we have more.</p>
				<p>Also seen <span>in (</span><a href="#test2" data-figure-count="2"></a>) we have an image.</p>
				<p>Again, <a href="#test1" data-figure-count="1"></a> shows this.</p>
				<figure data-figure-type="img" id="test2">
					<img src="https://resize-v3.pubpub.org/123">
				</figure>
				<p>Again, <a href="#test4" data-figure-count="1"></a> shows this.</p>
				<figure data-figure-type="video" id="test4">
					<video controls>
						<source src="https://resize-v3.pubpub.org/123.mp4" type="video/mp4">
						<img alt="Video fallback image">
					</video>
				</figure>
			</body>
		</html>
	`;

	const result = await rehype()
		.use(formatFigureReferences)
		.use(structureIframes)
		.use(structureVideos)
		.use(structureImages)
		.use(removeEmptyFigCaption)
		.process(inputHtml)
		.then((file) => String(file))
		.catch((error) => {
			logger.error(error);
		});

	expect(trimAll(result)).toBe(trimAll(expectedOutputHtml));
});

test("formatFigureReferencesWithEndOfLine", async () => {
	const inputHtml = `
		<html>
			<head></head>
			<body>
				<p>Hello.</p>
				<table>
					<tbody>
						<tr>
							<td><p><span>Type</span></p></td>
							<td><p><span>Id</span></p></td>
							<td><p><span>Source</span></p></td>
						</tr>
						<tr>
							<td><p><span>Iframe</span></p></td>
							<td><p><span>test1</span></p></td>
							<td><p><span>https://resize-v3.pubpub.org/123</span></p></td>
						</tr>
					</tbody>
				</table>
				<table>
					<tbody>
						<tr>
							<td><p><span>Type</span></p></td>
							<td><p><span>Id</span></p></td>
							<td><p><span>Source</span></p></td>
							<td><p><span>Hide Label</span></p></td>
						</tr>
						<tr>
							<td><p><span>Iframe</span></p></td>
							<td><p><span>abra</span></p></td>
							<td><p><span>https://resize-v3.pubpub.org/123</span></p></td>
							<td><p><span>True</span></p></td>
						</tr>
					</tbody>
				</table>
				<p>@test1 shows we have more.</p>
				<p>Also seen <span>in (</span>@test2) we have an image.</p>
				<p>Again, @test1 shows this.</p>
				<table>
					<tbody>
						<tr>
							<td><p><span>Type</span></p></td>
							<td><p><span>Id</span></p></td>
							<td><p><span>Source</span></p></td>
						</tr>
						<tr>
							<td><p><span>Image</span></p></td>
							<td><p><span>test2</span></p></td>
							<td><p><span>https://resize-v3.pubpub.org/123</span></p></td>
						</tr>
					</tbody>
				</table>
				<p>Again, @test4<span> shows</span> this.</p>
				<table>
					<tbody>
						<tr>
							<td><p><span>Type</span></p></td>
							<td><p><span>Id</span></p></td>
							<td><p><span>Source</span></p></td>
						</tr>
						<tr>
							<td><p><span>Video</span></p></td>
							<td><p><span>test4</span></p></td>
							<td><p><span>https://resize-v3.pubpub.org/123.mp4</span></p></td>
						</tr>
					</tbody>
				</table>
			</body>
		</html>

	`;
	const expectedOutputHtml = `
		<html>
			<head></head>
			<body>
				<p>Hello.</p>
				<figure data-figure-type="iframe" id="test1">
					<iframe src="https://resize-v3.pubpub.org/123" frameborder="0"></iframe>
				</figure>
				<figure data-figure-type="iframe" id="abra" data-hide-label="True">
					<iframe src="https://resize-v3.pubpub.org/123" frameborder="0"></iframe>
				</figure>
				<p><a href="#test1" data-figure-count="1"></a> shows we have more.</p>
				<p>Also seen <span>in (</span><a href="#test2" data-figure-count="2"></a>) we have an image.</p>
				<p>Again, <a href="#test1" data-figure-count="1"></a> shows this.</p>
				<figure data-figure-type="img" id="test2">
					<img src="https://resize-v3.pubpub.org/123">
				</figure>
				<p>Again, <a href="#test4" data-figure-count="1"></a><span> shows</span> this.</p>
				<figure data-figure-type="video" id="test4">
					<video controls>
						<source src="https://resize-v3.pubpub.org/123.mp4" type="video/mp4">
						<img alt="Video fallback image">
					</video>
				</figure>
			</body>
		</html>
	`;

	const result = await rehype()
		.use(formatFigureReferences)
		.use(structureIframes)
		.use(structureVideos)
		.use(structureImages)
		.use(removeEmptyFigCaption)
		.process(inputHtml)
		.then((file) => String(file))
		.catch((error) => {
			logger.error(error);
		});

	expect(trimAll(result)).toBe(trimAll(expectedOutputHtml));
});

test("appendFigureAttributes", async () => {
	const inputHtml = `
		<html>
			<head></head>
			<body>
				<p>Hello.</p>
				<table>
					<tbody>
						<tr>
							<td><p><span>Type</span></p></td>
							<td><p><span>Id</span></p></td>
							<td><p><span>Source</span></p></td>
						</tr>
						<tr>
							<td><p><span>Iframe</span></p></td>
							<td><p><span>test1</span></p></td>
							<td><p><span>https://resize-v3.pubpub.org/123</span></p></td>
						</tr>
					</tbody>
				</table>
				<table>
					<tbody>
						<tr>
							<td><p><span>Type</span></p></td>
							<td><p><span>Id</span></p></td>
							<td><p><span>Source</span></p></td>
							<td><p><span>Hide Label</span></p></td>
						</tr>
						<tr>
							<td><p><span>Iframe</span></p></td>
							<td><p><span>abra</span></p></td>
							<td><p><span>https://resize-v3.pubpub.org/123</span></p></td>
							<td><p><span>True</span></p></td>
						</tr>
					</tbody>
				</table>
				<table>
					<tbody>
						<tr>
							<td><p><span>Type</span></p></td>
							<td><p><span>Id</span></p></td>
							<td><p><span>Source</span></p></td>
						</tr>
						<tr>
							<td><p><span>Image</span></p></td>
							<td><p><span>test2</span></p></td>
							<td><p><span>https://resize-v3.pubpub.org/123</span></p></td>
						</tr>
					</tbody>
				</table>
				<table>
					<tbody>
						<tr>
							<td><p><span>Type</span></p></td>
							<td><p><span>Id</span></p></td>
							<td><p><span>Source</span></p></td>
							<td><p><span>Caption</span></p></td>
							<td><p><span>Static Image</span></p></td>
							<td><p><span>Align</span></p></td>
							<td><p><span>Size</span></p></td>
						</tr>
						<tr>
							<td><p><span>Video</span></p></td>
							<td><p><span>n8r4ihxcrly</span></p></td>
							<td><p><span>https://resize-v3.pubpub.org/123.mp4</span></p></td>
							<td><p><span>With a caption. </span><b>Bold</b></p></td>
							<td>https://example.com</td>
							<td><p>full</p></td>
							<td><p>50</p></td>
						</tr>
					</tbody>
				</table>
			</body>
		</html>

	`;
	const expectedOutputHtml = `
		<html>
			<head></head>
			<body>
				<p>Hello.</p>
				
				<figure data-figure-type="iframe" id="test1" data-figure-count="1">
					<iframe src="https://resize-v3.pubpub.org/123" frameborder="0"></iframe>
				</figure>
				<figure data-figure-type="iframe" id="abra" data-hide-label="True">
					<iframe src="https://resize-v3.pubpub.org/123" frameborder="0"></iframe>
				</figure>
				<figure data-figure-type="img" id="test2" data-figure-count="2">
					<img src="https://resize-v3.pubpub.org/123">
				</figure>
				<figure data-figure-type="video" id="n8r4ihxcrly" data-align="full" data-size="50" data-figure-count="1">
					<video controls poster="https://example.com">
						<source src="https://resize-v3.pubpub.org/123.mp4" type="video/mp4">
						<img src="https://example.com" alt="Video fallback image">
					</video>
					<figcaption>
						<p>
							<span>With a caption. </span>
							<b>Bold</b>
						</p>
					</figcaption>
				</figure>
			</body>
		</html>
	`;

	const result = await rehype()
		.use(structureVideos)
		.use(structureIframes)
		.use(structureImages)
		.use(appendFigureAttributes)
		.use(removeEmptyFigCaption)
		.process(inputHtml)
		.then((file) => String(file))
		.catch((error) => {
			logger.error(error);
		});

	expect(trimAll(result)).toBe(trimAll(expectedOutputHtml));
});

test("Structure Tables", async () => {
	const inputHtml = `
		<html>
			<head></head>
			<body>
				<table>
					<tbody>
						<tr>
							<td>A</td>
							<td>B</td>
						</tr>
						<tr>
							<td>C and then <sup>2</sup></td>
							<td>D</td>
						</tr>
					</tbody>
				</table>
				<table>
					<tr>
						<td>Type</td>
						<td>Caption</td>
					</tr>
					<tr>
						<td>Table</td>
						<td>
							<p><span>Elephants</span></p>
							<p><em><span>Ca<sup>t</sup>s</span></em></p>
						</td>
					</tr>
				</table>
				<p>Now consider two different genes, $A$ and $B$, with variation in allelic state across a population of diploid organisms. One gene $A$ has two alleles $A$ and $a$, resulting in three allelic states, </p>
			</body>
		</html>
	`;
	const expectedOutputHtml = `
		<html>
			<head></head>
			<body>
				<figure data-figure-type="table">
					<table>
						<tbody>
							<tr>
								<td>A</td>
								<td>B</td>
							</tr>
							<tr>
								<td>C and then <sup>2</sup></td>
								<td>D</td>
							</tr>
						</tbody>
					</table>
					<figcaption>
						<p><span>Elephants</span></p>
						<p><em><span>Ca<sup>t</sup>s</span></em></p>
					</figcaption>
				</figure>
				<p>Now consider two different genes, $A$ and $B$, with variation in allelic state across a population of diploid organisms. One gene $A$ has two alleles $A$ and $a$, resulting in three allelic states, </p>
			</body>
		</html>
		`;

	const result = await rehype()
		.use(structureTables)
		.process(inputHtml)
		.then((file) => String(file))
		.catch((error) => {
			logger.error(error);
		});

	expect(trimAll(result)).toBe(trimAll(expectedOutputHtml));
});
