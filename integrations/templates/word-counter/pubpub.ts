import { countWords, countLines } from "alfaaz";
import { InstanceConfig } from "./types";

const updatePubWordCount = async (instanceId: string, pubId: string, wordCount?: number) => {
	console.log(
		`instanceId=${instanceId}`,
		`pubId=${pubId}`,
		wordCount ? `word-counter/word-count=${wordCount}` : ""
	);
};

const updatePubLineCount = async (instanceId: string, pubId: string, lineCount?: number) => {
	console.log(
		`instanceId=${instanceId}`,
		`pubId=${pubId}`,
		lineCount ? `word-counter/line-count=${lineCount}` : ""
	);
};

export const updateWordCount = async (
	instanceId: string,
	pubId: string,
	config: InstanceConfig
) => {
	// const { "pubpub/content": content } = await fetch(`https://v7.pubpub.org/instances/getMetadata`, {
	// 	method: "POST",
	// 	headers: { "Content-Type": "application/json" },
	// 	body: JSON.stringify({
	//    "pubId": pubId,
	//    "instanceId": instanceId,
	// 		"fields": ["pubpub/content"],
	// 	}),
	// });
	const content =
		"Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed non risus. Suspendisse lectus tortor, dignissim sit amet, adipiscing nec, ultricies sed, dolor. Cras elementum ultrices diam. Maecenas ligula massa, varius a, semper congue, euismod non, mi.";
	const words = countWords(content);
	const lines = countLines(content);
	if (config.words) {
		await updatePubWordCount(instanceId, pubId, words);
	}
	if (config.lines) {
		await updatePubLineCount(instanceId, pubId, lines);
	}
	return { words, lines };
};
