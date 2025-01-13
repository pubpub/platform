import type {
	KyselyPlugin,
	PluginTransformQueryArgs,
	PluginTransformResultArgs,
	QueryResult,
	RootOperationNode,
	UnknownRow,
} from "kysely"

import { sleep } from "utils"

/**
 * Plugin which add artificial latency to all queries to more easily test Suspense etc
 */
export class ArtificialLatencyPlugin implements KyselyPlugin {
	constructor(
		/**
		 * The delay in milliseconds
		 */
		public delay: number
	) {}

	transformQuery(args: PluginTransformQueryArgs): RootOperationNode {
		return args.node
	}

	async transformResult(args: PluginTransformResultArgs): Promise<QueryResult<UnknownRow>> {
		await sleep(this.delay)
		return args.result
	}
}
