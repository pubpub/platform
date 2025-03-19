import path from "path";

import type { Element, Node, Root } from "hast";

import katex from "katex";
import { rehype } from "rehype";
import rehypeParse from "rehype-parse";
import rehypeStringify from "rehype-stringify";
import { unified } from "unified";
import { filter } from "unist-util-filter";
import { visit } from "unist-util-visit";

const removeProperties = () => (tree: Root) => {
	visit(tree, "element", (node: any) => {
		node.properties = {};
	});
};

export const mathStringToRehypeElement = (htmlString: string): Element[] => {
	const parser = String(rehype().processSync(htmlString));
	const file = unified().use(rehypeParse, { fragment: true }).parse(parser);
	return file.children as Element[];
};

export const rehypeFragmentToHtmlString = (fragment: Element): string => {
	const processor = unified().use(rehypeStringify);
	const file = processor.stringify({ type: "root", children: [fragment] });
	return String(file);
};

export const latexToRehypeNode = (latexString: string, isBlock: boolean): Element => {
	const html = katex.renderToString(latexString, {
		throwOnError: false,
		displayMode: isBlock,
	});

	return {
		type: "element",
		tagName: isBlock ? "div" : "span",
		properties: { className: "math-block" },
		children: mathStringToRehypeElement(html),
	};
};

export const getTextContent = (node: any): string => {
	if (!node) {
		return "";
	}
	if (node.type === "text") {
		return node.value;
	}
	if (node.children) {
		return node.children.map(getTextContent).join("");
	}
	return "";
};
export const tableToObjectArray = (node: any) => {
	if (!node) return [{ type: "empty" }];

	const tbody = node.children.find((child: any) => child.tagName === "tbody");
	if (!tbody) return [{ type: "empty" }];

	const rows: Element[] = tbody.children
		.filter((child: any) => child.tagName === "tr")
		.map((row: any) => {
			return {
				...row,
				children: row.children.filter((child: any) => {
					return child.tagName === "td";
				}),
			};
		});
	if (rows.length === 0) return [{ type: "empty" }];

	const headersHoriz: string[] = rows[0].children
		.filter((child: any) => child.tagName === "td")
		.map((header: any) => getTextContent(header).toLowerCase().replace(/\s+/g, ""));

	const headersVert: string[] = rows.map((row: any) =>
		getTextContent(row.children[0]).toLowerCase().replace(/\s+/g, "")
	);
	const validTypes = [
		"image",
		"video",
		"audio",
		"file",
		"iframe",
		"blockquote",
		"code",
		"math",
		"anchor",
		"reference",
		"footnote",
		"description",
		"table",
	];

	const isHoriz = validTypes.includes(headersVert[1].toLowerCase());
	const isVert = validTypes.includes(headersHoriz[1].toLowerCase());

	const getCellContent = (tableType: string, headerVal: string, cell: any): any => {
		const isTypeWithHtmlValue =
			!["math", "reference"].includes(tableType) && headerVal === "value";
		const isCaption = headerVal === "caption";
		if (isTypeWithHtmlValue || isCaption) {
			return cell.children;
		}

		const isAssetSource =
			["image", "video", "audio", "file"].includes(tableType) && headerVal === "source";
		const isStaticSource = headerVal === "staticimage";
		if (isAssetSource || isStaticSource) {
			const findAnchor = (node: any): any => {
				if (node.tagName === "a") {
					return node;
				}
				if (node.children) {
					for (const child of node.children) {
						const found = findAnchor(child);
						if (found) {
							return found;
						}
					}
				}
				return null;
			};

			const anchor = findAnchor(cell);
			if (anchor && anchor.properties.href) {
				return anchor.properties.href;
			}
		}

		return getTextContent(cell).trim();
	};

	let data;
	if (isHoriz) {
		data = rows.slice(1).map((row: any) => {
			const cells = row.children.filter((child: any) => child.tagName === "td");
			const typeIndex = headersHoriz.findIndex((header) => header === "type");
			const tableType = getTextContent(cells[typeIndex])
				.trim()
				.toLowerCase()
				.replace(/\s+/g, "");
			const obj: { [key: string]: any } = {};
			cells.forEach((cell: any, index: number) => {
				const headerVal = headersHoriz[index];
				obj[headersHoriz[index]] = getCellContent(tableType, headerVal, cell);
			});

			return { ...obj, type: tableType };
		});
	} else if (isVert) {
		data = headersHoriz.slice(1).map((_header, colIndex) => {
			const obj: { [key: string]: any } = {};
			const typeIndex = headersVert.findIndex((header) => header === "type");
			const tableType = getTextContent(rows[typeIndex].children[colIndex + 1])
				.trim()
				.toLowerCase()
				.replace(/\s+/g, "");

			rows.forEach((row: any, rowIndex: number) => {
				const cell = row.children[colIndex + 1];
				const headerVal = headersVert[rowIndex];
				obj[headersVert[rowIndex]] = getCellContent(tableType, headerVal, cell);
			});
			return { ...obj, type: tableType };
		});
	} else {
		return [{ type: "empty" }];
	}
	return data;
};

export const getDescription = (htmlString: string): string => {
	let description = "";
	rehype()
		.use(structureFormatting)
		.use(removeVerboseFormatting)
		.use(removeGoogleLinkForwards)
		.use(() => (tree: Root) => {
			visit(tree, "element", (node: any) => {
				if (node.tagName === "table") {
					const tableData: any = tableToObjectArray(node);
					const tableType = tableData[0].type;
					if (tableType === "description") {
						const valueFragment: Element = {
							type: "element",
							tagName: "span",
							properties: {},
							children: tableData[0].value,
						};
						description = rehypeFragmentToHtmlString(valueFragment).replace(
							/<\/?(span|p)>/g,
							""
						);
						return false;
					}
				}
			});
		})
		.processSync(htmlString);

	return description;
};

export const insertVariables = (tree: Root, varName: string, node: any) => {
	visit(tree, "text", (textNode: any, index: any, parent: any) => {
		if (typeof textNode.value === "string") {
			const regex = new RegExp(`\\{${varName}\\}`, "g");
			let match;
			const elements: any[] = [];
			let lastIndex = 0;

			while ((match = regex.exec(textNode.value)) !== null) {
				const startIndex = match.index;
				const endIndex = regex.lastIndex;

				if (startIndex > lastIndex) {
					elements.push({
						type: "text",
						value: textNode.value.slice(lastIndex, startIndex),
					});
				}

				elements.push(node);
				lastIndex = endIndex;
			}

			if (lastIndex < textNode.value.length) {
				elements.push({
					type: "text",
					value: textNode.value.slice(lastIndex),
				});
			}

			if (elements.length > 0 && parent && typeof index === "number") {
				parent.children.splice(index, 1, ...elements);
			}
		}
	});
};

export const basic = () => (tree: Root) => {
	return tree;
};

export const removeVerboseFormatting = () => (tree: Root) => {
	/* Remove unneededTags */
	const nextTree = filter(tree, (node: any) => {
		if (node.type === "element") {
			const isBlockedElement = ["script", "style"].includes(node.tagName);
			return !isBlockedElement;
		}
		return true;
	});

	/* Remove unneeded attributes */
	visit(nextTree, "element", (node: any) => {
		if (node.properties) {
			delete node.properties.className;
			delete node.properties.style;
		}
	});

	return nextTree;
};

export const structureFormatting = () => (tree: Root) => {
	visit(tree, "element", (node: any, index: any, parent: any) => {
		if (node.properties && node.properties.style) {
			const style = node.properties.style as string;
			if (node.tagName === "span") {
				const styles = style.split(";").map((s) => s.trim().replace(/\s+/g, ""));
				const tags = [];

				if (styles.includes("font-weight:700")) {
					tags.push("b");
				}
				if (styles.includes("font-style:italic")) {
					tags.push("i");
				}
				if (styles.includes("text-decoration:line-through")) {
					tags.push("s");
				}
				if (styles.includes("text-decoration:underline")) {
					tags.push("u");
				}
				if (styles.includes("vertical-align:sub")) {
					tags.push("sub");
				}
				if (styles.includes("vertical-align:super")) {
					tags.push("sup");
				}

				if (tags.length > 0) {
					let newNode: Element = {
						type: "element",
						tagName: tags[0],
						properties: {},
						children: node.children,
					};

					for (let i = 1; i < tags.length; i++) {
						newNode = {
							type: "element",
							tagName: tags[i],
							properties: {},
							children: [newNode],
						};
					}

					if (parent && typeof index === "number") {
						parent.children[index] = newNode;
					}
				}
			}
		}
	});
};

export const structureImages = () => (tree: Root) => {
	visit(tree, "element", (node: any, index: any, parent: any) => {
		if (node.tagName === "table") {
			const tableData: any = tableToObjectArray(node);
			const tableType = tableData[0].type;
			if (tableType === "image") {
				const elements: Element[] = tableData.map((data: any) => ({
					type: "element",
					tagName: "figure",
					properties: {
						dataFigureType: "img",
						id: data.id,
						dataAlign: data.align,
						dataSize: data.size,
						dataHideLabel: data.hidelabel,
					},
					children: [
						{
							type: "element",
							tagName: "img",
							properties: { alt: data.alttext, src: data.source },
							children: [],
						},
						{
							type: "element",
							tagName: "figcaption",
							properties: {},
							children: data.caption || [],
						},
					],
				}));

				if (parent && typeof index === "number") {
					parent.children.splice(index, 1, ...elements);
				}
			}
		}
	});
};

export const structureVideos = () => (tree: Root) => {
	visit(tree, "element", (node: any, index: any, parent: any) => {
		if (node.tagName === "table") {
			const tableData: any = tableToObjectArray(node);
			const tableType = tableData[0].type;
			if (tableType === "video") {
				const elements: Element[] = tableData.map((data: any) => {
					const extension = path.extname(data.source).replace(".", "");
					const type = extension ? `video/${extension}` : undefined;
					return {
						type: "element",
						tagName: "figure",
						properties: {
							dataFigureType: "video",
							id: data.id,
							dataAlign: data.align,
							dataSize: data.size,
							dataHideLabel: data.hidelabel,
						},
						children: [
							{
								type: "element",
								tagName: "video",
								properties: { controls: true, poster: data.staticimage },
								children: [
									{
										type: "element",
										tagName: "source",
										properties: {
											src: data.source,
											type,
										},
									},
									{
										type: "element",
										tagName: "img",
										properties: {
											src: data.staticimage,
											alt: "Video fallback image",
										},
									},
								],
							},
							{
								type: "element",
								tagName: "figcaption",
								properties: {},
								children: data.caption || [],
							},
						],
					};
				});

				if (parent && typeof index === "number") {
					parent.children.splice(index, 1, ...elements);
				}
			}
		}
	});
};

export const structureAudio = () => (tree: Root) => {
	visit(tree, "element", (node: any, index: any, parent: any) => {
		if (node.tagName === "table") {
			const tableData: any = tableToObjectArray(node);
			const tableType = tableData[0].type;
			if (tableType === "audio") {
				const elements: Element[] = tableData.map((data: any) => ({
					type: "element",
					tagName: "figure",
					properties: {
						dataFigureType: "audio",
						id: data.id,
						dataAlign: data.align,
						dataSize: data.size,
						dataHideLabel: data.hidelabel,
					},
					children: [
						{
							type: "element",
							tagName: "audio",
							properties: { controls: true },
							children: [
								{
									type: "element",
									tagName: "source",
									properties: {
										src: data.source,
										type: `audio/${path.extname(data.source).replace(".", "")}`,
									},
								},
							],
						},
						{
							type: "element",
							tagName: "figcaption",
							properties: {},
							children: data.caption || [],
						},
					],
				}));

				if (parent && typeof index === "number") {
					parent.children.splice(index, 1, ...elements);
				}
			}
		}
	});
};
export const structureFiles = () => (tree: Root) => {
	visit(tree, "element", (node: any, index: any, parent: any) => {
		if (node.tagName === "table") {
			const tableData: any = tableToObjectArray(node);
			const tableType = tableData[0].type;
			if (tableType === "file") {
				const elements: Element[] = tableData.map((data: any) => ({
					type: "element",
					tagName: "figure",
					properties: { dataFigureType: "file", id: data.id },
					children: [
						{
							type: "element",
							tagName: "div",
							properties: { className: "file-card" },
							children: [
								{
									type: "element",
									tagName: "span",
									properties: {
										className: "file-name",
									},
									children: [{ type: "text", value: data.filename }],
								},
								{
									type: "element",
									tagName: "a",
									properties: {
										className: "file-button",
										href: data.source,
										download: data.filename,
									},
									children: [{ type: "text", value: "Download" }],
								},
							],
						},
						{
							type: "element",
							tagName: "figcaption",
							properties: {},
							children: data.caption || [],
						},
					],
				}));

				if (parent && typeof index === "number") {
					parent.children.splice(index, 1, ...elements);
				}
			}
		}
	});
};
export const structureIframes = () => (tree: Root) => {
	visit(tree, "element", (node: any, index: any, parent: any) => {
		if (node.tagName === "table") {
			const tableData: any = tableToObjectArray(node);
			const tableType = tableData[0].type;
			if (tableType === "iframe") {
				const elements: Element[] = tableData.map((data: any) => ({
					type: "element",
					tagName: "figure",
					properties: {
						dataFigureType: "iframe",
						id: data.id,
						dataAlign: data.align,
						dataSize: data.size,
						dataHideLabel: data.hidelabel,
					},
					children: [
						{
							type: "element",
							tagName: "iframe",
							properties: {
								src: data.source,
								frameborder: "0",
								"data-fallback-image": data.staticimage,
								height: data.height,
							},
						},
						{
							type: "element",
							tagName: "figcaption",
							properties: {},
							children: data.caption || [],
						},
					],
				}));

				if (parent && typeof index === "number") {
					parent.children.splice(index, 1, ...elements);
				}
			}
		}
	});
};
export const structureBlockMath = () => (tree: Root) => {
	visit(tree, "element", (node: any, index: any, parent: any) => {
		if (node.tagName === "table") {
			const tableData: any = tableToObjectArray(node);
			const tableType = tableData[0].type;
			if (tableType === "math") {
				const elements: Element[] = tableData.map((data: any) => ({
					type: "element",
					tagName: "figure",
					properties: { dataFigureType: "math", id: data.id },
					children: [
						latexToRehypeNode(data.value, true),
						{
							type: "element",
							tagName: "figcaption",
							properties: {},
							children: data.caption || [],
						},
					],
				}));

				if (parent && typeof index === "number") {
					parent.children.splice(index, 1, ...elements);
				}
			}
		}
	});
};
export const structureInlineMath = () => (tree: Root) => {
	visit(tree, "text", (node: any, index: any, parent: any) => {
		if (typeof node.value === "string") {
			const regex = /\$(\S(?:[^$]*\S)?)\$/g;
			let match;
			const elements: any[] = [];
			let lastIndex = 0;

			while ((match = regex.exec(node.value)) !== null) {
				const [_fullMatch, mathContent] = match;
				const startIndex = match.index;
				const endIndex = regex.lastIndex;

				if (startIndex > lastIndex) {
					elements.push({
						type: "text",
						value: node.value.slice(lastIndex, startIndex),
					});
				}

				elements.push(latexToRehypeNode(mathContent, false));
				lastIndex = endIndex;
			}

			if (lastIndex < node.value.length) {
				elements.push({
					type: "text",
					value: node.value.slice(lastIndex),
				});
			}

			if (elements.length > 0 && parent && typeof index === "number") {
				parent.children.splice(index, 1, ...elements);
			}
		}
	});
};
export const structureBlockquote = () => (tree: Root) => {
	visit(tree, "element", (node: any, index: any, parent: any) => {
		if (node.tagName === "table") {
			const tableData: any = tableToObjectArray(node);
			const tableType = tableData[0].type;
			if (tableType === "blockquote") {
				const elements: Element[] = tableData.map((data: any) => ({
					type: "element",
					tagName: "blockquote",
					properties: { id: data.id },
					children: data.value || [],
				}));

				if (parent && typeof index === "number") {
					parent.children.splice(index, 1, ...elements);
				}
			}
		}
	});
};
export const structureCodeBlock = () => (tree: Root) => {
	visit(tree, "element", (node: any, index: any, parent: any) => {
		if (node.tagName === "table") {
			const tableData: any = tableToObjectArray(node);
			const tableType = tableData[0].type;
			if (tableType === "code") {
				const elements: Element[] = tableData.map((data: any) => ({
					type: "element",
					tagName: "pre",
					properties: { id: data.id, "data-lang": data.language },
					children: [
						{
							type: "element",
							tagName: "code",
							children: data.value || [],
						},
					],
				}));

				if (parent && typeof index === "number") {
					parent.children.splice(index, 1, ...elements);
				}
			}
		}
	});
};
export const structureInlineCode = () => (tree: Root) => {
	visit(tree, "text", (node: any, index: any, parent: any) => {
		if (typeof node.value === "string") {
			const regex = /\`(\S[^\`]*\S)\`/g;
			let match;
			const elements: any[] = [];
			let lastIndex = 0;

			while ((match = regex.exec(node.value)) !== null) {
				const [_fullMatch, codeContent] = match;
				const startIndex = match.index;
				const endIndex = regex.lastIndex;

				if (startIndex > lastIndex) {
					elements.push({
						type: "text",
						value: node.value.slice(lastIndex, startIndex),
					});
				}

				elements.push({
					type: "element",
					tagName: "code",
					properties: {},
					children: [{ type: "text", value: codeContent }],
				});
				lastIndex = endIndex;
			}

			if (lastIndex < node.value.length) {
				elements.push({
					type: "text",
					value: node.value.slice(lastIndex),
				});
			}

			if (elements.length > 0 && parent && typeof index === "number") {
				parent.children.splice(index, 1, ...elements);
			}
		}
	});
};
export const structureAnchors = () => (tree: Root) => {
	visit(tree, "element", (node: any, index: any, parent: any) => {
		if (node.tagName === "table") {
			const tableData: any = tableToObjectArray(node);
			const tableType = tableData[0].type;
			if (tableType === "anchor") {
				const elements: Element[] = tableData.map((data: any) => ({
					type: "element",
					tagName: "a",
					properties: { id: data.id },
				}));

				if (parent && typeof index === "number") {
					parent.children.splice(index, 1, ...elements);
				}
			}
		}
	});
};
export const cleanUnusedSpans = () => (tree: Root) => {
	visit(tree, "element", (node: any, index: any, parent: any) => {
		if (
			node.tagName === "span" &&
			(!node.properties || Object.keys(node.properties).length === 0)
		) {
			if (parent && typeof index === "number") {
				parent.children.splice(index, 1, ...node.children);
			}
		}
	});

	visit(tree, "element", (node: any) => {
		if (node.children) {
			for (let i = 0; i < node.children.length - 1; i++) {
				if (node.children[i].type === "text" && node.children[i + 1].type === "text") {
					node.children[i].value += node.children[i + 1].value;
					node.children.splice(i + 1, 1);
					i--;
				}
			}
		}
	});
};

export const structureReferences = () => (tree: Root) => {
	const allReference: any[] = [];
	/* This regex business casued a lot of headache tracking down. */
	/* The use of .test with the /g flag caused inconsistencies. But */
	/* then calling .exec without that /g flag would crash. There may */
	/* be a cleaner solution where we manually reset regex.lastIndex */
	/* in certain places, but it's late and brittle, and this is currently working. */
	const doiBracketRegexTest = new RegExp(/\[(10\.[^\]]+|https?:\/\/doi\.org\/[^\]]+)\]/);
	const doiBracketRegex = new RegExp(/\[(10\.[^\]]+|https?:\/\/doi\.org\/[^\]]+)\]/g);
	visit(tree, (node: any, index: any, parent: any) => {
		/* Remove all links on [doi.org/12] references. */
		if (node.tagName === "u" || node.tagName === "a") {
			const parentText = getTextContent(parent);
			const nodeText = getTextContent(node);
			if (doiBracketRegexTest.test(parentText)) {
				const elements = [
					{
						type: "text",
						value: `[${nodeText}]`,
					},
				];

				if (parent && typeof index === "number") {
					if (elements.length > 0) {
						const prevChild = parent.children[index - 1];
						const nextChild = parent.children[index + 1];

						if (prevChild && prevChild.type === "text") {
							prevChild.value = prevChild.value.slice(0, -1);
						}

						if (nextChild && nextChild.type === "text") {
							nextChild.value = nextChild.value.slice(1);
						}
					}
					parent.children.splice(index, 1, ...elements);
				}
			}
		}
	});

	const doiReferenceCounts: { [key: string]: number } = {};
	visit(tree, (node: any, index: any, parent: any) => {
		if (node.tagName === "table") {
			const tableData: any = tableToObjectArray(node);
			const tableType = tableData[0].type;
			if (tableType === "reference") {
				allReference.push(...tableData);
				if (parent && typeof index === "number") {
					parent.children.splice(index, 1);
				}
			}
		}
		if (typeof node.value === "string") {
			let match;
			const elements: any[] = [];
			let lastIndex = 0;

			while ((match = doiBracketRegex.exec(node.value)) !== null) {
				const [_fullMatch, referenceDoi] = match;
				let currentRefId;
				if (!doiReferenceCounts[referenceDoi]) {
					doiReferenceCounts[referenceDoi] = Object.values(doiReferenceCounts).length + 1;
					currentRefId = `doiRef${doiReferenceCounts[referenceDoi]}`;
					allReference.push({
						type: "Reference",
						id: currentRefId,
						value: referenceDoi,
						unstructuredValue: "",
					});
				} else {
					currentRefId = `doiRef${doiReferenceCounts[referenceDoi]}`;
				}

				const startIndex = match.index;
				const endIndex = doiBracketRegex.lastIndex;

				if (startIndex > lastIndex) {
					elements.push({
						type: "text",
						value: node.value.slice(lastIndex, startIndex),
					});
				}
				elements.push({ type: "text", value: `{${currentRefId}}` });

				lastIndex = endIndex;
			}

			if (lastIndex < node.value.length) {
				elements.push({
					type: "text",
					value: node.value.slice(lastIndex),
				});
			}

			if (elements.length > 0 && parent && typeof index === "number") {
				parent.children.splice(index, 1, ...elements);
			}
		}
	});
	const referenceIds = allReference.map((ref) => ref.id);
	const referenceVarOrder: string[] = [];

	visit(tree, "text", (textNode: any, index: any, parent: any) => {
		if (typeof textNode.value === "string") {
			const regex = new RegExp(/\{([^\{\}]+?)\}/g);
			let match;

			while ((match = regex.exec(textNode.value)) !== null) {
				const [_fullMatch, varName] = match;

				if (referenceIds.includes(varName) && !referenceVarOrder.includes(varName)) {
					referenceVarOrder.push(varName);
				}
			}
		}
	});
	allReference
		.filter((ref) => {
			return referenceVarOrder.includes(ref.id);
		})
		.sort((foo, bar) => {
			return referenceVarOrder.indexOf(foo.id) - referenceVarOrder.indexOf(bar.id);
		})
		.forEach((referenceData, index) => {
			/* TODO: This just orders references by the order they are presented in tables. */
			/* We'll likely want more sophisticated reference things at some point */
			const newNode: Element = {
				type: "element",
				tagName: "a",
				properties: {
					"data-type": "reference",
					"data-value": referenceData.value,
					"data-unstructured-value": referenceData.unstructuredvalue,
				},
				children: [{ type: "text", value: `[${index + 1}]` }],
			};
			insertVariables(tree, referenceData.id, newNode);
		});
};

export const structureFootnotes = () => (tree: Root) => {
	const allFootnotes: any[] = [];
	visit(tree, "element", (node: any, index: any, parent: any) => {
		if (node.tagName === "table") {
			const tableData: any = tableToObjectArray(node);
			const tableType = tableData[0].type;
			if (tableType === "footnote") {
				allFootnotes.push(...tableData);
				if (parent && typeof index === "number") {
					parent.children.splice(index, 1);
				}
			}
		}
	});
	allFootnotes.forEach((footnoteData, index) => {
		const valueHtml = rehypeFragmentToHtmlString({
			type: "element",
			properties: {},
			tagName: "div",
			children: footnoteData.value,
		});
		const newNode: Element = {
			type: "element",
			tagName: "a",
			properties: {
				"data-type": "footnote",
				"data-value": valueHtml,
				"data-structured-value": footnoteData.structuredvalue,
			},
			children: [{ type: "text", value: `[${index + 1}]` }],
		};
		insertVariables(tree, footnoteData.id, newNode);
	});
};

export const removeGoogleLinkForwards = () => (tree: Root) => {
	visit(tree, "element", (node: any) => {
		if (
			node.tagName === "a" &&
			node.properties.href?.startsWith("https://www.google.com/url")
		) {
			const url = new URL(node.properties.href);
			const q = url.searchParams.get("q");
			node.properties.href = q;
		}
	});
};

export const processLocalLinks = () => (tree: Root) => {
	visit(tree, "element", (node: any) => {
		if (node.tagName === "a" && node.properties.href?.startsWith("https://local.pubpub/")) {
			const href = decodeURIComponent(node.properties.href);
			node.properties.href = href.split("local.pubpub/")[1].split("&")[0];
		}
	});
};

export const removeEmptyFigCaption = () => (tree: Root) => {
	const nextTree = filter(tree, (node: any) => {
		if (node.type === "element" && node.tagName === "figcaption") {
			const textContent = getTextContent(node);
			return textContent.trim().length > 0;
		}
		return true;
	});
	return nextTree;
};

export const formatLists = () => (tree: Root) => {
	const groupItems = (items: any[]): any[] => {
		const result: any[] = [];
		const stack: any[] = [];

		items.forEach((item) => {
			while (stack.length && stack[stack.length - 1].level >= item.level) {
				stack.pop();
			}

			if (stack.length) {
				const parent = stack[stack.length - 1];
				if (!parent.childItems) {
					parent.childItems = [];
				}
				parent.childItems.push(item);
			} else {
				result.push(item);
			}

			stack.push(item);
		});

		return result;
	};

	const createNestedList = (items: any[], listType: string) => {
		const nestedList: Element = {
			type: "element",
			tagName: items[0].parentListType,
			properties: {},
			children: items.map((item: any) => {
				const listItem: Element = {
					type: "element",
					tagName: "li",
					properties: item.properties,
					children: item.children,
				};

				if (item.childItems) {
					listItem.children.push(createNestedList(item.childItems, listType));
				}

				return listItem;
			}),
		};

		return nestedList;
	};
	visit(tree, "element", (node: any, index: any, parent: any) => {
		if (node.tagName === "ul" || node.tagName === "ol") {
			const listType = node.tagName;
			const siblings = [];
			let currentIndex = index;
			while (
				parent.children[currentIndex] &&
				["ol", "ul"].includes(parent.children[currentIndex].tagName)
			) {
				siblings.push(parent.children[currentIndex]);
				currentIndex++;
			}
			const items = siblings
				.flatMap((sibling: any) =>
					sibling.children.map((x: any) => ({ ...x, parentListType: sibling.tagName }))
				)
				.filter((child) => {
					return child.tagName === "li";
				})
				.map((item) => {
					return {
						...item,
						level: parseInt(
							item.properties?.style?.match(/margin-left:\s*(\d+)p(t|x)/)?.[1] || "0",
							10
						),
					};
				});
			const groupedItems = groupItems(items);
			const nestedList = createNestedList(groupedItems, listType);

			parent.children.splice(index, siblings.length, nestedList);
		}
	});
};

export const removeDescription = () => (tree: Root) => {
	const nextTree = filter(tree, (node: any) => {
		if (node.tagName === "table") {
			const tableData: any = tableToObjectArray(node);
			const tableType = tableData[0].type;
			if (tableType === "description") {
				return false;
			}
		}
		return true;
	});
	return nextTree;
};

export const formatFigureReferences = () => (tree: Root) => {
	/*
		- Go through and grab all tables with ids
		- Turn into an object with the ids as keys, and the type as value as the text to use (which is using a counter to increment accurately)
		- Go through and get each @mention and replace @mention with that value and a link to it

	*/
	const figureCount: { [key: string]: number } = {};
	const figuresById: any = {};
	visit(tree, "element", (node: any, index: any, parent: any) => {
		if (node.tagName === "table") {
			const tableData: any = tableToObjectArray(node);
			const tableType = tableData[0].type;
			const aggregateFigureTypes = ["image", "audio", "file", "iframe"];
			const independentFigureTypes = ["video", "table", "math"];
			const validFigureTypes = [...aggregateFigureTypes, ...independentFigureTypes];
			if (validFigureTypes.includes(tableType)) {
				tableData.forEach((data: any) => {
					if (data.hidelabel?.toLowerCase() !== "true") {
						const isAggregateType = aggregateFigureTypes.includes(tableType);
						if (isAggregateType) {
							figureCount.total = (figureCount.total || 0) + 1;
						} else {
							figureCount[tableType] = (figureCount[tableType] || 0) + 1;
						}
						figuresById[data.id] = {
							type: tableType,
							figureCount: isAggregateType
								? figureCount.total
								: figureCount[tableType],
							// typeCount: figureCount[tableType],
							// totalCount: figureCount.total,
						};
					}
				});
			}
		}
	});

	visit(tree, "text", (textNode: any, index: any, parent: any) => {
		if (typeof textNode.value === "string") {
			const regex = new RegExp(/(?:^|\s|[\(\[\{])@(\S+?)(?=[\s.;,\)\]\}]|$)/g);
			let match;
			const elements: any[] = [];
			let lastIndex = 0;

			while ((match = regex.exec(textNode.value)) !== null) {
				const [fullMatch, figureId] = match;
				const startIndex = match.index;
				const endIndex = regex.lastIndex;

				if (startIndex > lastIndex) {
					elements.push({
						type: "text",
						value: textNode.value.slice(lastIndex, startIndex),
					});
				}
				if (fullMatch.indexOf(figureId) === 2) {
					/* If there is an opening delimiter (e.g. it's not on a newline), */
					/* make sure that open delimiter is replaced. */
					elements.push({
						type: "text",
						value: fullMatch[0],
					});
				}
				if (figuresById[figureId]) {
					elements.push({
						type: "element",
						tagName: "a",
						properties: {
							href: `#${figureId}`,
							dataFigureCount: figuresById[figureId].figureCount,
							// dataFigureTypeCount: figuresById[figureId].typeCount,
							// dataFigureTotalCountMinusTableVideo:
							// 	figuresById[figureId].totalCountMinusTableVideo,
						},
						children: [],
					});
				} else {
					elements.push({
						type: "text",
						value: fullMatch,
					});
				}
				lastIndex = endIndex;
			}

			if (lastIndex < textNode.value.length) {
				elements.push({
					type: "text",
					value: textNode.value.slice(lastIndex),
				});
			}

			if (elements.length > 0 && parent && typeof index === "number") {
				parent.children.splice(index, 1, ...elements);
			}
		}
	});
};

export const appendFigureAttributes = () => (tree: Root) => {
	/*
	 */
	const figureCount: { [key: string]: number } = {};
	const aggregateFigureTypes = ["img", "audio", "file", "iframe"];
	const independentFigureTypes = ["video", "table", "math"];
	const validFigureTypes = [...aggregateFigureTypes, ...independentFigureTypes];
	visit(tree, "element", (node: any, index: any, parent: any) => {
		if (node.tagName === "figure" && node.properties.dataFigureType !== "table") {
			const tableType = node.properties.dataFigureType;
			if (
				validFigureTypes.includes(tableType) &&
				node.properties.dataHideLabel?.toLowerCase() !== "true"
			) {
				const isAggregateType = aggregateFigureTypes.includes(tableType);
				if (isAggregateType) {
					figureCount.total = (figureCount.total || 0) + 1;
				} else {
					figureCount[tableType] = (figureCount[tableType] || 0) + 1;
				}

				node.properties = {
					...node.properties,
					dataFigureCount: isAggregateType ? figureCount.total : figureCount[tableType],
				};
			}
		}
	});
};

export const structureTables = () => (tree: Root) => {
	visit(tree, "element", (node: any, index: any, parent: any) => {
		if (node.tagName === "table") {
			const tableData: any = tableToObjectArray(node);
			const tableType = tableData[0].type;
			if (tableType === "empty") {
				let foundNonEmpty = false;
				const nextSibling = parent.children.slice(index + 1).find((sibling: any) => {
					const isEmpty = getTextContent(sibling).trim() === "";
					const isTable = sibling.type === "element" && sibling.tagName === "table";
					if (!isEmpty && !isTable) {
						foundNonEmpty = true;
						return false;
					}
					if (isEmpty || foundNonEmpty) {
						return false;
					}
					return true;
				});
				if (nextSibling) {
					const nextTableData: any = tableToObjectArray(nextSibling);
					const nextTableType = nextTableData[0].type;
					if (nextTableType === "table") {
						const figureNode: Element = {
							type: "element",
							tagName: "figure",
							properties: {
								dataFigureType: "table",
								id: nextTableData[0].id,
							},
							children: [
								node,
								{
									type: "element",
									tagName: "figcaption",
									properties: {},
									children: nextTableData[0].caption || [],
								},
							],
						};
						parent.children.splice(index, 1, figureNode);
					}
				}
			}
		}
	});

	const nextTree = filter(tree, (node: any) => {
		if (node.tagName === "table") {
			const tableData: any = tableToObjectArray(node);
			const tableType = tableData[0].type;
			return tableType !== "table";
		}
		return true;
	});
	return nextTree;
};
