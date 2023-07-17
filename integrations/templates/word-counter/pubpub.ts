import { countLines, countWords } from "alfaaz";
import { InstanceConfig } from "./config";

const content =
	"Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed non risus. Suspendisse lectus tortor, dignissim sit amet, adipiscing nec, ultricies sed, dolor. Cras elementum ultrices diam. Maecenas ligula massa, varius a, semper congue, euismod non, mi.";

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

export const updatePubFields = async (
	instanceId: string,
	instanceConfig: InstanceConfig,
	pubId: string
) => {
	const counts: { words?: number; lines?: number } = {};
	if (instanceConfig.words) {
		const words = countWords(content);
		await updatePubWordCount(instanceId, pubId, words);
		counts.words = words;
	}
	if (instanceConfig.lines) {
		const lines = countLines(content);
		await updatePubLineCount(instanceId, pubId, lines);
		counts.lines = lines;
	}
	return counts;
};
