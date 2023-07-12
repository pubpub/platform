import { countWords, countLines } from "alfaaz";
import { Metric } from "./types";

const patchWordCountMetadata = async (
	instanceId: string,
	pubId: string,
	wordCount?: number,
	lineCount?: number
) => {
	// fetch(`https://v7.pubpub.org/instances/updateMetadata`, {
	// 	method: "POST",
	// 	headers: { "Content-Type": "application/json" },
	// 	body: JSON.stringify({
	//    "pubId": pubId,
	//    "instanceId": instanceId,
	// 		"fields": {
	// 			"word-counter/word-count": wordCount,
	// 			"word-counter/line-count": lineCount,
	// 		},
	// 	}),
	// });
	console.log(
		`instanceId=${instanceId}`,
		`pubId=${pubId}`,
		wordCount ? `word-counter/word-count=${wordCount}` : "",
		lineCount ? `word-counter/line-count=${lineCount}` : ""
	);
};

export const updateWordCount = async (instanceId: string, pubId: string, metric: Metric) => {
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
	const wordCount = countWords(content);
	const lineCount = countLines(content);
	switch (metric) {
		case "words-and-lines":
			await patchWordCountMetadata(pubId, instanceId, wordCount, lineCount);
			return { wordCount, lineCount };
		case "words":
			await patchWordCountMetadata(pubId, instanceId, wordCount);
			return { wordCount };
		case "lines":
			await patchWordCountMetadata(pubId, instanceId, undefined, lineCount);
			return { lineCount };
	}
};
