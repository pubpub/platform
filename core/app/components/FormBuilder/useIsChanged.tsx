import { parseAsBoolean, useQueryState } from "nuqs"

export const useIsChanged = () => {
	const [isChanged, setIsChanged] = useQueryState(
		"unsavedChanges",
		parseAsBoolean.withDefault(false).withOptions({
			history: "replace",
			scroll: false,
		})
	)

	return [isChanged, setIsChanged] as const
}
