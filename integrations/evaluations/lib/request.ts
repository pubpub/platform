import { cookies, headers } from "next/headers"

export const cookie = (name: string) => {
	const _cookies = cookies()
	const _headers = headers().get("Set-Cookie")
	const setCookiePatern = new RegExp(`${name}=(.*?);`)
	if (_headers) {
		const m = _headers.match(setCookiePatern)
		if (m) {
			return decodeURIComponent(m?.[1]!)
		}
	}
	if (_cookies.has(name)) {
		return decodeURIComponent(_cookies.get(name)!.value)
	}
	return undefined
}
