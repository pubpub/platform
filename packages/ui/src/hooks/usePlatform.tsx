import * as React from "react"

export type Platform = "mac" | "windows" | "linux" | "unknown"

export function usePlatform(): Platform {
	const [platform, setPlatform] = React.useState<Platform>("unknown")

	React.useEffect(() => {
		if (typeof navigator === "undefined") {
			return
		}

		const userAgent = navigator.userAgent.toLowerCase()
		const platform = navigator.platform?.toLowerCase() || ""

		if (platform.includes("mac") || userAgent.includes("mac")) {
			setPlatform("mac")
			return
		}

		if (platform.includes("win") || userAgent.includes("win")) {
			setPlatform("windows")
			return
		}

		if (platform.includes("linux") || userAgent.includes("linux")) {
			setPlatform("linux")
			return
		}

		setPlatform("unknown")
	}, [])

	return platform
}

export function usePlatformModifierKey(): { symbol: string; name: string; platform: Platform } {
	const platform = usePlatform()

	return React.useMemo(() => {
		if (platform === "mac") {
			return { symbol: "⌘", name: "Cmd", platform }
		}
		return { symbol: "Ctrl", name: "Ctrl", platform }
	}, [platform])
}
