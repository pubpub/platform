import { rehype } from "rehype";
import { expect, test } from "vitest";

import { logger } from "logger";

import {
	basic,
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
	structureReferences,
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
						</tr>
						<tr>
							<td><p><span>Image</span></p></td>
							<td><p><span>n8r4ihxcrly</span></p></td>
							<td><p><span>https://resize-v3.pubpub.org/123</span></p></td>
							<td><p><span>With a caption. </span><b>Bold</b></p></td>
							<td><p><b>123</b></p></td>
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
				<figure id="n8r4ihxcrly">
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
							<td><p><span>Static Image</span></p></td>
						</tr>
						<tr>
							<td><p><span>Video</span></p></td>
							<td><p><span>n8r4ihxcrly</span></p></td>
							<td><p><span>https://resize-v3.pubpub.org/123.mp4</span></p></td>
							<td><p><span>With a caption. </span><b>Bold</b></p></td>
							<td>https://example.com</td>
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
				<figure id="n8r4ihxcrly">
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
						</tr>
						<tr>
							<td><p><span>Audio</span></p></td>
							<td><p><span>n8r4ihxcrly</span></p></td>
							<td><p><span>https://resize-v3.pubpub.org/123.mp3</span></p></td>
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
				<figure id="n8r4ihxcrly">
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
				<figure id="n8r4ihxcrly">
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
						</tr>
						<tr>
							<td><p><span>Iframe</span></p></td>
							<td><p><span>n8r4ihxcrly</span></p></td>
							<td><p><span>https://resize-v3.pubpub.org/123</span></p></td>
							<td><p><span>With a caption. </span><b>Bold</b></p></td>
							<td>https://example.com</td>
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
				<figure id="n8r4ihxcrly">
					<iframe src="https://resize-v3.pubpub.org/123" frameborder="0" data-fallback-image="https://example.com"></iframe>
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
			<figure id="n8r4ihxcrly">
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
			</body>
		</html>
	`;
	const expectedOutputHtml = `
		<html>
			<head></head>
			<body>
				<p>I am just writing a lovely $10 equation like this <span class="math-block"><span class="katex"><span class="katex-mathml"><math xmlns="http://www.w3.org/1998/Math/MathML"><semantics><mrow><mi>y</mi><mo>=</mo><mn>2</mn><mi>x</mi><mo>+</mo><mn>5</mn></mrow><annotation encoding="application/x-tex">y=2x + 5</annotation></semantics></math></span><span class="katex-html" aria-hidden="true"><span class="base"><span class="strut" style="height:0.625em;vertical-align:-0.1944em;"></span><span class="mord mathnormal" style="margin-right:0.03588em;">y</span><span class="mspace" style="margin-right:0.2778em;"></span><span class="mrel">=</span><span class="mspace" style="margin-right:0.2778em;"></span></span><span class="base"><span class="strut" style="height:0.7278em;vertical-align:-0.0833em;"></span><span class="mord">2</span><span class="mord mathnormal">x</span><span class="mspace" style="margin-right:0.2222em;"></span><span class="mbin">+</span><span class="mspace" style="margin-right:0.2222em;"></span></span><span class="base"><span class="strut" style="height:0.6444em;"></span><span class="mord">5</span></span></span></span></span></p>
				<p>Should also work as long as styling doesn't <b>change throughout, such as <span class="math-block"><span class="katex"><span class="katex-mathml"><math xmlns="http://www.w3.org/1998/Math/MathML"><semantics><mrow><mi>z</mi><mo>=</mo><mn>25</mn><mi>x</mi><mo>+</mo><mn>2</mn></mrow><annotation encoding="application/x-tex">z= 25x + 2</annotation></semantics></math></span><span class="katex-html" aria-hidden="true"><span class="base"><span class="strut" style="height:0.4306em;"></span><span class="mord mathnormal" style="margin-right:0.04398em;">z</span><span class="mspace" style="margin-right:0.2778em;"></span><span class="mrel">=</span><span class="mspace" style="margin-right:0.2778em;"></span></span><span class="base"><span class="strut" style="height:0.7278em;vertical-align:-0.0833em;"></span><span class="mord">25</span><span class="mord mathnormal">x</span><span class="mspace" style="margin-right:0.2222em;"></span><span class="mbin">+</span><span class="mspace" style="margin-right:0.2222em;"></span></span><span class="base"><span class="strut" style="height:0.6444em;"></span><span class="mord">2</span></span></span></span></span> and <i>so</i> on.</b></p>
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

test("Structure References", async () => {
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
							<td><p><span>Unstructured Value</span></p></td>
						</tr>
						<tr>
							<td><p><span>Reference</span></p></td>
							<td><p><span>ref1</span></p></td>
							<td><p><span>https://doi.org/10.57844/arcadia-0zvp-xz86</span></p></td>
							<td><p><span></span></p></td>
						</tr>
						<tr>
							<td><p><span>Reference</span></p></td>
							<td><p><span>ref2</span></p></td>
							<td><p><span>https://doi.org/10.1038/s41586-020-2983-4</span></p></td>
							<td><p><span></span></p></td>
						</tr>
						<tr>
							<td><p><span>Reference</span></p></td>
							<td><p><span>ref3</span></p></td>
							<td><p><span>https://doi.org/10.1016/j.cell.2014.05.041</span></p></td>
							<td><p><span></span></p></td>
						</tr>
						<tr>
							<td><p><span>Reference</span></p></td>
							<td><p><span>ref4</span></p></td>
							<td><p><span>https://doi.org/10.7554/eLife.37072</span></p></td>
							<td><p><span></span></p></td>
						</tr>
					</tbody>
				</table>
			</body>
		</html>
	`;
	const expectedOutputHtml = `<html>
			<head></head>
			<body>
				<div>
					<p>
						Here is some text <a 
							data-type="reference" data-value="https://doi.org/10.1038/s41586-020-2983-4" data-unstructured-value="">
							[2]
						</a>, <a
							 data-type="reference" data-value="https://doi.org/10.57844/arcadia-0zvp-xz86" data-unstructured-value="">
							[1]
						</a>, {ref38}
					</p>
				</div>
			</body>
		</html>
	`;

	const result = await rehype()
		.use(structureReferences)
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
