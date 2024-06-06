import { sql } from "kysely";

import { AutoFormInputComponentProps } from "ui/auto-form";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "ui/dropdown-menu";
import { FormDescription, FormField, FormItem, FormLabel, FormMessage } from "ui/form";
import { Input } from "ui/input";

import { db } from "~/kysely/database";
import { defineActionConfigServerComponent } from "../_lib/defineConfigServerComponent";
import { action } from "./action";
import { Thingy } from "./dropDown";

const component = defineActionConfigServerComponent(
	action,
	async ({ action, actionInstance, stageId, communityId }) => {
		const communityPubFields = await db
			.with("combined_results", (db) =>
				db
					.selectFrom("pub_fields")
					.distinctOn("pub_fields.id")
					.innerJoin("pub_values", "pub_values.field_id", "pub_fields.id")
					.innerJoin("pubs", "pubs.id", "pub_values.pub_id")
					.where("pubs.community_id", "=", communityId)
					.select([
						"pub_fields.id",
						"pub_fields.name",
						"pub_fields.pubFieldSchemaId",
						"pub_fields.slug",
					])

					.unionAll(
						db
							.selectFrom("pub_fields")
							.distinctOn("pub_fields.id")
							.innerJoin(
								"_PubFieldToPubType",
								"pub_fields.id",
								"_PubFieldToPubType.A"
							)
							.innerJoin("pub_types", "pub_types.id", "_PubFieldToPubType.B")
							.innerJoin("communities", "communities.id", "pub_types.community_id")
							.where("communities.id", "=", communityId)
							.select([
								"pub_fields.id",
								"pub_fields.name",
								"pub_fields.pubFieldSchemaId",
								"pub_fields.slug",
							])
					)
			)
			.selectFrom("combined_results")
			.select([
				"combined_results.id",
				"combined_results.name",
				"combined_results.pubFieldSchemaId",
				"combined_results.slug",
			])
			.distinct()
			.execute();

		const OutputMapField = ({ field, ...props }: AutoFormInputComponentProps) => {
			return (
				<>
					<hr />
					<h3>Output map</h3>
					<span className="text-sm text-gray-500">gore kankerhoer</span>
					<Thingy props={{ ...props, field }} pubFields={communityPubFields} />
				</>
			);
		};

		return (
			<>
				<hr />
				<h3>Output map</h3>
				<span className="text-sm text-gray-500">gore kankerhoer</span>
				<Thingy fieldName="outputMap" pubFields={communityPubFields} />
			</>
		);
		return {
			outputMap: {
				// fieldType: outputMapField,
			},
		};
	}
);

export default component;
