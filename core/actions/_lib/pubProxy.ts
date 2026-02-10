// import type { ProcessedPub } from "contracts"

// export const createPubProxy = (pub: ProcessedPub, communitySlug: string): any => {
// 	const valuesMap = new Map<string, ProcessedPub["values"][number]>()

// 	// these are just so that if you do `$.values`/`$.out`/`$.fields` you can see what fields are available
// 	const fields: Record<string, undefined> = {}
// 	const relations: Record<string, undefined> = {}

// 	for (const value of pub.values) {
// 		fields[value.fieldSlug] = undefined
// 		fields[value.fieldSlug.replace(`${communitySlug}:`, "")] = undefined
// 		if (value.relatedPub) {
// 			relations[value.fieldSlug] = undefined
// 			relations[value.fieldSlug.replace(`${communitySlug}:`, "")] = undefined
// 		}
// 		valuesMap.set(value.fieldSlug, value)
// 	}

// 	const pubWithAdditionalFields = { ...pub, fields: undefined, out: relations }

// 	return new Proxy(pubWithAdditionalFields, {
// 		get(target, prop) {
// 			const propStr = String(prop)
// 			const _lowerProp = propStr.toLowerCase()

// 			if (prop === "fields") {
// 				return new Proxy(fields, {
// 					get(_, fieldSlug: string) {
// 						return fields[fieldSlug] || fields[fieldSlug.toLowerCase()]
// 					},
// 				})
// 			}
// 			if (prop === "values") {
// 				return new Proxy(fields, {
// 					get(_, fieldSlug: string) {
// 						const lowerFieldSlug = fieldSlug.toLowerCase()
// 						const val =
// 							valuesMap.get(`${communitySlug}:${fieldSlug}`) ??
// 							valuesMap.get(fieldSlug) ??
// 							valuesMap.get(`${communitySlug}:${lowerFieldSlug}`) ??
// 							valuesMap.get(lowerFieldSlug)
// 						return val?.value
// 					},
// 				})
// 			}

// 			if (prop === "out") {
// 				return new Proxy(relations, {
// 					get(_, fieldSlug: string) {
// 						if (typeof fieldSlug !== "string") {
// 							return undefined
// 						}

// 						if (fieldSlug === "out") {
// 							return relations
// 						}

// 						const lowerFieldSlug = fieldSlug.toLowerCase()

// 						const val =
// 							valuesMap.get(`${communitySlug}:${fieldSlug}`) ??
// 							valuesMap.get(fieldSlug) ??
// 							valuesMap.get(`${communitySlug}:${lowerFieldSlug}`) ??
// 							valuesMap.get(lowerFieldSlug)
// 						if (val && "relatedPub" in val && val.relatedPub) {
// 							return createPubProxy(val.relatedPub, communitySlug)
// 						}
// 						return undefined
// 					},
// 				})
// 			}

// 			if (prop === "in") {
// 				return new Proxy(relations, {
// 					get(_, fieldSlug: string) {
// 						const _lowerFieldSlug = fieldSlug.toLowerCase()
// 						// For "in", we look for pubs that point to this one via fieldSlug
// 						// This proxy doesn't currently support "in" metadata easily as it's not pre-loaded in valuesMap in the same way.
// 						// However, if we had it, we'd look it up here.
// 						return undefined
// 					},
// 				})
// 			}

// 			return target[prop as keyof typeof target]
// 		},
// 	})
// }

import type { ProcessedPub } from "contracts"

// properties that should never be forwarded through the proxy
const BLOCKED_PROPS = new Set([
	"then",
	"catch",
	"finally",
	"constructor",
	"__proto__",
	"prototype",
	"$$typeof",
	"toJSON",
	"valueOf",
	"toString",
	"hasOwnProperty",
	"isPrototypeOf",
	"propertyIsEnumerable",
])

const isBlockedProp = (prop: string | symbol): boolean => {
	if (typeof prop === "symbol") return true
	return BLOCKED_PROPS.has(prop)
}

// creates a proxy that allows case-insensitive lookup but also returns the full object when iterated
const createLookupProxy = <T>(
	data: Record<string, T>,
	communitySlug: string
): Record<string, T> => {
	return new Proxy(data, {
		get(target, prop) {
			if (isBlockedProp(prop)) return undefined
			const propStr = String(prop)
			// direct match
			if (propStr in target) return target[propStr]
			// try with community prefix
			const prefixed = `${communitySlug}:${propStr}`
			if (prefixed in target) return target[prefixed]
			// try lowercase
			const lower = propStr.toLowerCase()
			if (lower in target) return target[lower]
			const prefixedLower = `${communitySlug}:${lower}`
			if (prefixedLower in target) return target[prefixedLower]
			return undefined
		},
		has(target, prop) {
			if (isBlockedProp(prop)) return false
			return prop in target
		},
		ownKeys(target) {
			return Reflect.ownKeys(target)
		},
		getOwnPropertyDescriptor(target, prop) {
			return Object.getOwnPropertyDescriptor(target, prop)
		},
	})
}

export const createPubProxy = (
	pub: ProcessedPub,
	communitySlug: string
): Record<string, unknown> => {
	// build plain objects for all lookups
	const fields: Record<string, true> = {}
	const values: Record<string, unknown> = {}
	const out: Record<string, Record<string, unknown>> = {}

	for (const v of pub.values) {
		const shortSlug = v.fieldSlug.replace(`${communitySlug}:`, "")
		// use short slug as primary key to avoid duplicates
		fields[shortSlug] = true
		values[shortSlug] = v.value

		if (v.relatedPub) {
			out[shortSlug] = createPubProxy(v.relatedPub, communitySlug)
		}
	}

	const fieldsProxy = createLookupProxy(fields, communitySlug)
	const valuesProxy = createLookupProxy(values, communitySlug)
	const outProxy = createLookupProxy(out, communitySlug)

	// build the base object with all pub properties except values (which we override)
	const base: Record<string, unknown> = {}
	for (const key of Object.keys(pub)) {
		if (key === "values") continue
		base[key] = pub[key as keyof ProcessedPub]
	}

	base.fields = fieldsProxy
	base.values = valuesProxy
	base.out = outProxy
	base.in = {} // not implemented yet

	return new Proxy(base, {
		get(target, prop) {
			if (isBlockedProp(prop)) return undefined
			return target[prop as string]
		},
		has(target, prop) {
			if (isBlockedProp(prop)) return false
			return prop in target
		},
		ownKeys(target) {
			return Reflect.ownKeys(target)
		},
		getOwnPropertyDescriptor(target, prop) {
			return Object.getOwnPropertyDescriptor(target, prop)
		},
	})
}
