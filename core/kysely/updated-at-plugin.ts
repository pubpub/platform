import type {
	KyselyPlugin,
	OnConflictNode,
	PluginTransformQueryArgs,
	PluginTransformResultArgs,
	QueryResult,
	RootOperationNode,
	UnknownRow,
	UpdateQueryNode,
} from "kysely";

import {
	ColumnNode,
	ColumnUpdateNode,
	IdentifierNode,
	OperationNodeTransformer,
	RawNode,
	TableNode,
} from "kysely";

class UpdatedAtTransformer extends OperationNodeTransformer {
	#tablesWithUpdatedAt: string[];

	constructor(tablesWithUpdatedAt?: string[]) {
		super();
		this.#tablesWithUpdatedAt = tablesWithUpdatedAt ?? [];
	}

	transformOnConflict(node: OnConflictNode): OnConflictNode {
		node = super.transformOnConflict(node);

		return this.addUpdatedAtColumn(node);
	}

	transformUpdateQuery(node: UpdateQueryNode): UpdateQueryNode {
		node = super.transformUpdateQuery(node);

		const tableNode = node.table;
		if (
			tableNode &&
			TableNode.is(tableNode) &&
			!this.#tablesWithUpdatedAt.includes(tableNode.table.identifier.name)
		) {
			return node;
		}

		return this.addUpdatedAtColumn(node);
	}

	private addUpdatedAtColumn<T extends UpdateQueryNode | OnConflictNode>(node: T): T {
		// we don't want to update the updatedAt twice, so we filter it out here.
		// this is fine, as we shouldn't be manually updating the updatedAt column
		const nonUpdatedAtColumns = (node.updates ?? []).filter((update) => {
			if (!ColumnNode.is(update.column)) {
				return true;
			}

			if (!IdentifierNode.is(update.column.column)) {
				return true;
			}

			if (update.column.column.name !== "updatedAt") {
				return true;
			}

			return false;
		});

		return {
			...node,
			updates: [
				...nonUpdatedAtColumns,
				ColumnUpdateNode.create(
					ColumnNode.create("updatedAt"),
					RawNode.createWithSql("current_timestamp")
				),
			],
		};
	}
}

/**
 * Plugin which adds sets `updatedAt` column on update for all tables which need it
 */
export class UpdatedAtPlugin implements KyselyPlugin {
	#updatedAtTransformer: UpdatedAtTransformer;

	constructor(tablesWithUpdatedAt: string[]) {
		this.#updatedAtTransformer = new UpdatedAtTransformer(tablesWithUpdatedAt);
	}

	transformQuery(args: PluginTransformQueryArgs): RootOperationNode {
		return this.#updatedAtTransformer.transformNode(args.node);
	}

	async transformResult(args: PluginTransformResultArgs): Promise<QueryResult<UnknownRow>> {
		return args.result;
	}
}
