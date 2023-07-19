import { countLines, countWords } from "alfaaz"
import { InstanceConfig } from "./config"
import { PubPatch } from "./pubpub"

const content =
	"Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed non risus. Suspendisse lectus tortor, dignissim sit amet, adipiscing nec, ultricies sed, dolor. Cras elementum ultrices diam. Maecenas ligula massa, varius a, semper congue, euismod non, mi."

export const makeWordCountPatch = (instanceConfig: InstanceConfig) => {
	const patch: PubPatch = {}
	if (instanceConfig.words) {
		patch["word-counts/word-count"] = countWords(content)
	}
	if (instanceConfig.lines) {
		patch["word-counts/line-count"] = countLines(content)
	}
	return patch
}
