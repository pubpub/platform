import { countLines, countWords } from "alfaaz"
import { InstanceConfig } from "./config"
import manifest from "./pubpub-manifest.json"
import * as sdk from "@pubpub/integration-sdk"

const content =
	"Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed non risus. Suspendisse lectus tortor, dignissim sit amet, adipiscing nec, ultricies sed, dolor. Cras elementum ultrices diam. Maecenas ligula massa, varius a, semper congue, euismod non, mi."

export const makeWordCountPatch = (instanceConfig: InstanceConfig) => {
	const patch = {} as sdk.Put<typeof manifest>
	if (instanceConfig.words) {
		patch["word-counts/word-count"] = countWords(content)
	}
	if (instanceConfig.lines) {
		patch["word-counts/line-count"] = countLines(content)
	}
	return patch
}
