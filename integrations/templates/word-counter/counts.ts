import { countLines, countWords } from "alfaaz";
import { InstanceConfig } from "./config";

const content =
	"Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed non risus. Suspendisse lectus tortor, dignissim sit amet, adipiscing nec, ultricies sed, dolor. Cras elementum ultrices diam. Maecenas ligula massa, varius a, semper congue, euismod non, mi.";

export const makeWordCountPatch = async (instanceConfig: InstanceConfig) => {
	const patch: { "word-counter/word-count"?: number; "word-counter/line-count"?: number } = {};
	if (instanceConfig.words) {
		patch["word-counter/word-count"] = countWords(content);
	}
	if (instanceConfig.lines) {
		patch["word-counter/line-count"] = countLines(content);
	}
	return patch;
};
