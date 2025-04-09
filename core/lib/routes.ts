import { z } from "zod";

import type { IsNever, Prettify } from "./types";

type RouteType = "page" | "api";
type SegmentType = "static" | "dynamic" | "catchAll" | "optionalCatchAll";

interface RouteConfig {
	searchParams?: Record<string, z.ZodType<any>>;
	type?: RouteType;
	segmentType?: SegmentType;
	folder?: boolean;
}

type MaybeOptionalMaybeCatchallDynamicRouteParams<P extends string> =
	P extends `$$${infer OptionalCatchall}`
		? {
				[K in OptionalCatchall]?: string[];
			}
		: P extends `$${infer Catchall}`
			? {
					[K in Catchall]: string[];
				}
			: { [K in P]: string };

type RoutePs<
	T extends `/${string}`,
	Params extends Record<string, string | string[] | undefined> | undefined = undefined,
> = T extends `/${infer P}`
	? P extends `$${infer DynamicRoute}`
		? // if theres after the dynamic route, continue
			DynamicRoute extends `${infer ParamName}/${infer Rest}`
			? RoutePs<
					`/${Rest}`,
					Params extends undefined
						? MaybeOptionalMaybeCatchallDynamicRouteParams<ParamName>
						: Prettify<Params & MaybeOptionalMaybeCatchallDynamicRouteParams<ParamName>>
				>
			: // if not, exit
				Params extends undefined
				? MaybeOptionalMaybeCatchallDynamicRouteParams<DynamicRoute>
				: Prettify<Params & MaybeOptionalMaybeCatchallDynamicRouteParams<DynamicRoute>>
		: P extends `${string}/${infer Rest}`
			? RoutePs<`/${Rest}`, Params>
			: Prettify<Params>
	: Prettify<Params>;

type L = RoutePs<"/">;
//   ^?
type L2 = RoutePs<"/$users/henk">;
//   ^?
type L3 = RoutePs<"/users/">;
//   ^?
type L4 = RoutePs<"/users/$$userId/posts/$$$postId/comments/$commentId/yo/yo/$yo/$ya">;
//   ^?
type L5 = RoutePs<"/yo/$henk">;
//   ^?
type L6 = RoutePs<"/$henk/piet/$yo/yo">;
//   ^?

type SearchParamsConfig<T> = T extends { "#config"?: { searchParams?: infer S } } ? S : never;
type SearchParamsType<T, Config extends SearchParamsConfig<T> = SearchParamsConfig<T>> =
	Config extends Record<string, any>
		? {
				[K in keyof SearchParamsConfig<T> & string]: z.infer<SearchParamsConfig<T>[K]>;
			}
		: undefined;

type BuildArgs<Params, Search> = (IsNever<Params> extends true
	? { params?: never }
	: { params: Params }) &
	(IsNever<Search> extends true ? { searchParams?: never } : { searchParams: Search }) & {
		absolute?: boolean;
	};

type PathToGenericPath<
	Path extends string,
	Acc extends string = "",
> = Path extends `/${infer Start}$${infer Dynamic}`
	? Dynamic extends `${string}/${infer Rest}`
		? PathToGenericPath<`/${Rest}`, `${Acc}/${Start}${string}`>
		: `${Acc}/${Path}`
	: `${Acc}/${Path}`;

type P = PathToGenericPath<"/users/$$userId/posts/$$$postId/comments/$commentId/yo/yo/$yo/$ya">;
//   ^?

type RouteBuilder<Path extends string, Params, Search> = {
	path: PathToGenericPath<Path>;
	fullPath: Path;
	params: Params;
	searchParams: Search;
	build: (args: BuildArgs<Params, Search>) => string;
};

// Type transformation for the routes object
type RouteMap<T> = {
	[K in keyof T as K extends "#config" ? never : K]: RouteNode<T[K], `/${K & string}`>;
};

type RouteNode<T, Path extends `/${string}` = "/"> = T extends object
	? {
			[K in keyof T as K extends "#config" ? never : K]: K extends "$route"
				? RouteBuilder<Path, RoutePs<Path>, SearchParamsType<T>>
				: RouteNode<T[K], `${Path}/${K & string}`>;
		} & (T extends { "#config": { folder: true } }
			? {}
			: {
					$route: RouteBuilder<Path, RoutePs<Path>, SearchParamsType<T>>;
				})
	: never;

const getParamsFromPath = <T extends object>(obj: T, path: string[] = []): Record<string, any> => {
	let params: Record<string, any> = {};

	Object.entries(obj).forEach(([key, value]) => {
		if (key.startsWith("$") && key !== "#config") {
			const paramName = key.slice(1);
			const config =
				value && typeof value === "object" ? (value as any)["#config"] : undefined;
			const segmentType = config?.segmentType || "dynamic";

			if (segmentType === "catchAll") {
				params[paramName] = [];
			} else if (segmentType === "optionalCatchAll") {
				params[paramName] = undefined; // optional
			} else {
				params[paramName] = "";
			}
		}

		if (value && typeof value === "object" && key !== "#config") {
			params = { ...params, ...getParamsFromPath(value, [...path, key]) };
		}
	});

	return params;
};

const createPathFromSegments = (segments: string[], obj: any): string => {
	const processedSegments = segments.map((segment) => {
		if (segment.startsWith("$")) {
			const paramName = segment.slice(1);
			const config = obj?.[segment]?.["#config"];
			const segmentType = config?.segmentType || "dynamic";

			if (segmentType === "catchAll") {
				return `[...${paramName}]`;
			} else if (segmentType === "optionalCatchAll") {
				return `[[...${paramName}]]`;
			}
			return `[${paramName}]`;
		}
		return segment;
	});

	return "/" + processedSegments.filter(Boolean).join("/");
};

const buildRoutesObject = <T extends object>(
	definition: T,
	path: string[] = [],
	currentObj: any = definition
): any => {
	const result: any = {};

	Object.entries(definition).forEach(([key, value]) => {
		if (key === "#config") {
			return;
		}

		// Handle segments
		const newPathSegment = key;
		const newPath = [...path, newPathSegment];

		if (value && typeof value === "object") {
			// Process children
			result[key] = buildRoutesObject(value, newPath, currentObj[key]);

			// Check if this node has a route (doesn't have folder: true)
			const config = (value as any)["#config"] as RouteConfig | undefined;
			if (!config || config.folder !== true) {
				const fullPath = createPathFromSegments(newPath, currentObj);
				const paramsObj = getParamsFromPath({ [key]: value });
				const searchParamsSchema = config?.searchParams || {};
				const routeType = config?.type || "page";

				// Add the route builder
				result[key].$route = {
					path: fullPath,
					params: paramsObj,
					searchParams: {} as any,
					type: routeType,
					build: (params: Record<string, any>, search?: Record<string, any>) => {
						let url = fullPath;

						// Replace simple dynamic segments
						Object.entries(params).forEach(([paramKey, paramValue]) => {
							if (Array.isArray(paramValue)) {
								// Handle catch-all segments
								url = url.replace(`[...${paramKey}]`, paramValue.join("/"));
								url = url.replace(
									`[[...${paramKey}]]`,
									paramValue.length ? paramValue.join("/") : ""
								);
							} else {
								// Handle regular dynamic segments
								url = url.replace(`[${paramKey}]`, paramValue);
							}
						});

						if (search) {
							const searchParams = new URLSearchParams();
							Object.entries(search).forEach(([key, value]) => {
								if (value !== undefined) {
									searchParams.set(key, String(value));
								}
							});
							const searchString = searchParams.toString();
							if (searchString) {
								url += `?${searchString}`;
							}
						}

						return url;
					},
				};
			}
		}
	});

	return result;
};

export function createRoutes<T extends object>(definition: T) {
	const routes = buildRoutesObject(definition);
	return routes as RouteMap<T>;
}

// Example usage
export const Routes = createRoutes({
	communties: {},
	confirm: {},
	forgot: {},
	"invalid-token": {},
	login: {
		"#config": {
			searchParams: {
				error: z.string().optional(),
				notice: z.string().optional(),
				body: z.string().optional(),
				redirectTo: z.string().optional(),
			},
		},
	},
	"magic-link": {
		"#config": {
			type: "api",
			searchParams: {
				token: z.string(),
				redirectTo: z.string(),
			},
		},
	},
	reset: {},
	settings: {},
	signup: {},
	c: {
		$communitySlug: {
			"#config": {},
			pubs: {
				$pubId: {
					edit: {},
				},
				create: {
					"#config": {},
				},
			},
			public: {
				"#config": { folder: true },
				forms: {
					"#config": { folder: true },
					fill: {
						"#config": {
							searchParams: {
								pubId: z.string().optional(),
								submitId: z.string().optional(),
								saveStatus: z.string().optional(),
								token: z.string().optional(),
								reason: z.string().optional(),
							},
						},
					},
				},
				signup: {
					"#config": {
						searchParams: {
							notice: z.string().optional(),
							error: z.string().optional(),
							body: z.string().optional(),
							redirectTo: z.string().optional(),
						},
					},
				},
			},
		},
	},

	api: {
		"#config": {
			folder: true, // This is just a folder, not a route
		},
		v0: {
			"#config": {
				folder: true, // This is just a folder, not a route
			},
			c: {
				"#config": {
					folder: true, // This is just a folder, not a route
				},
				$communitySlug: {
					"#config": {
						folder: true, // This is just a folder, not a route
					},
					site: {
						"#config": {
							folder: true, // This is just a folder, not a route
						},
						["$$ts-rest"]: {},
					},
					internal: {
						"#config": {
							folder: true, // This is just a folder, not a route
						},
						["$$ts-rest"]: {},
					},
				},
			},
		},
	},
});

Routes.c.$communitySlug.pubs.$pubId.$route.build({
	params: {
		communitySlug: "test",
		pubId: "123",
	},
});
