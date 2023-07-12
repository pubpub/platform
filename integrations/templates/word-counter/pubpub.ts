import { countWords, countLines } from "alfaaz";
import { Metric } from "./types";

const patchWordCountMetadata = async (pubId: string, wordCount?: number, lineCount?: number) => {
	// fetch(`https://v7.pubpub.org/pubs/${pubId}/metadata`, {
	// 	method: "PATCH",
	// 	headers: { "Content-Type": "application/json" },
	// 	body: JSON.stringify({
	// 		"word-counter/word-count": wordCount,
	// 		"word-counter/line-count": lineCount,
	// 	}),
	// });
	console.log(
		`pubId=${pubId}`,
		wordCount ? `word-counter/word-count=${wordCount}` : "",
		lineCount ? `word-counter/line-count=${lineCount}` : ""
	);
};

export const updateWordCount = async (pubId: string, metric: Metric) => {
	// const content = await fetch(`https://v7.pubpub.org/pubs/${pubId}/content`).then((res) => res.text())
	const content =
		"Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed non risus. Suspendisse lectus tortor, dignissim sit amet, adipiscing nec, ultricies sed, dolor. Cras elementum ultrices diam. Maecenas ligula massa, varius a, semper congue, euismod non, mi.";
	const wordCount = countWords(content);
	const lineCount = countLines(content);
	switch (metric) {
		case "words-and-lines":
			await patchWordCountMetadata(pubId, wordCount, lineCount);
			return { wordCount, lineCount };
		case "words":
			await patchWordCountMetadata(pubId, wordCount);
			return { wordCount };
		case "lines":
			await patchWordCountMetadata(pubId, undefined, lineCount);
			return { lineCount };
	}
};
