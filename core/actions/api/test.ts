import type {
	DeleteQueryBuilder,
	InsertQueryBuilder,
	OperationNode,
	QueryNode,
	SelectQueryBuilder,
	UpdateQueryBuilder,
} from "kysely";

import { OnNode, RootOperationNode, SelectQueryNode, TableNode } from "kysely";
import { jsonObjectFrom } from "kysely/helpers/postgres";

import "kysely/helpers/postgres";

import { revalidateTag } from "next/cache";

import type Database from "~/kysely/types/Database";
import type { Communities } from "~/kysely/types/public/Communities";
import { db } from "~/kysely/database";
import { CommunitiesId } from "~/kysely/types/public/Communities";
import { UsersId } from "~/kysely/types/public/Users";
import { pubValuesByRef } from "~/lib/server";

export const x = async (community: Communities) => {
	const halfway = db
		.selectFrom("stages")
		.where("stages.community_id", "=", community.id)
		.innerJoin("action_instances", "stages.id", "action_instances.stage_id")
		.innerJoin("action_runs", "action_instances.id", "action_runs.action_instance_id")
		.leftJoin("users", "action_runs.user_id", "users.id")
		.select((eb) => {
			return [
				"action_runs.id",
				"action_runs.config",
				"action_runs.event",
				"action_runs.params",
				"action_runs.status",
				"action_runs.created_at as createdAt",
				jsonObjectFrom(
					eb
						.selectFrom("action_instances")
						.whereRef("action_instances.id", "=", "action_runs.action_instance_id")
						.select(["name", "action"])
				).as("actionInstance"),
				jsonObjectFrom(
					eb
						.selectFrom("stages")
						.whereRef("stages.id", "=", "action_instances.stage_id")
						.select(["id", "name"])
				).as("stage"),
				jsonObjectFrom(
					eb
						.selectFrom("pubs")
						.whereRef("pubs.id", "=", "action_runs.pub_id")
						.select(["id", "created_at as createdAt"])
						.select(pubValuesByRef("action_runs.pub_id"))
				).as("pub"),
				jsonObjectFrom(
					eb
						.selectFrom("users")
						.whereRef("users.id", "=", "action_runs.user_id")
						.select(["id", "firstName", "lastName"])
				).as("user"),
			];
		})
		.orderBy("action_runs.created_at", "desc");

	console.log(halfway.compile());
};

x({ id: "hhhhhh" });

const query = {
	kind: "SelectQueryNode",
	from: {
		kind: "FromNode",
		froms: [
			{
				kind: "TableNode",
				table: {
					kind: "SchemableIdentifierNode",
					identifier: { kind: "IdentifierNode", name: "pubs" },
				},
			},
		],
	},
	with: {
		kind: "WithNode",
		expressions: [
			{
				kind: "CommonTableExpressionNode",
				name: {
					kind: "CommonTableExpressionNameNode",
					table: {
						kind: "TableNode",
						table: {
							kind: "SchemableIdentifierNode",
							identifier: { kind: "IdentifierNode", name: "children" },
						},
					},
					columns: undefined,
				},
				expression: {
					kind: "SelectQueryNode",
					from: {
						kind: "FromNode",
						froms: [
							{
								kind: "TableNode",
								table: {
									kind: "SchemableIdentifierNode",
									identifier: { kind: "IdentifierNode", name: "pubs" },
								},
							},
						],
					},
					selections: [
						{
							kind: "SelectionNode",
							selection: {
								kind: "ReferenceNode",
								table: undefined,
								column: {
									kind: "ColumnNode",
									column: { kind: "IdentifierNode", name: "id" },
								},
							},
						},
						{
							kind: "SelectionNode",
							selection: {
								kind: "ReferenceNode",
								table: undefined,
								column: {
									kind: "ColumnNode",
									column: { kind: "IdentifierNode", name: "parent_id" },
								},
							},
						},
						{
							kind: "SelectionNode",
							selection: {
								kind: "AliasNode",
								node: {
									kind: "RawNode",
									sqlFragments: [
										"(select json_object_agg(",
										".slug, ",
										".value) from ",
										")",
									],
									parameters: [
										{
											kind: "RawNode",
											sqlFragments: ["", ""],
											parameters: [
												{
													kind: "ReferenceNode",
													table: undefined,
													column: {
														kind: "ColumnNode",
														column: {
															kind: "IdentifierNode",
															name: "latest_values",
														},
													},
												},
											],
										},
										{
											kind: "RawNode",
											sqlFragments: ["", ""],
											parameters: [
												{
													kind: "ReferenceNode",
													table: undefined,
													column: {
														kind: "ColumnNode",
														column: {
															kind: "IdentifierNode",
															name: "latest_values",
														},
													},
												},
											],
										},
										{
											kind: "AliasNode",
											node: {
												kind: "SelectQueryNode",
												from: {
													kind: "FromNode",
													froms: [
														{
															kind: "TableNode",
															table: {
																kind: "SchemableIdentifierNode",
																identifier: {
																	kind: "IdentifierNode",
																	name: "pub_values",
																},
															},
														},
													],
												},
												distinctOn: [
													{
														kind: "ReferenceNode",
														table: {
															kind: "TableNode",
															table: {
																kind: "SchemableIdentifierNode",
																identifier: {
																	kind: "IdentifierNode",
																	name: "pub_values",
																},
															},
														},
														column: {
															kind: "ColumnNode",
															column: {
																kind: "IdentifierNode",
																name: "field_id",
															},
														},
													},
												],
												selections: [
													{
														kind: "SelectionNode",
														selection: {
															kind: "ReferenceNode",
															table: {
																kind: "TableNode",
																table: {
																	kind: "SchemableIdentifierNode",
																	identifier: {
																		kind: "IdentifierNode",
																		name: "pub_values",
																	},
																},
															},
															column: { kind: "SelectAllNode" },
														},
													},
													{
														kind: "SelectionNode",
														selection: {
															kind: "ReferenceNode",
															table: undefined,
															column: {
																kind: "ColumnNode",
																column: {
																	kind: "IdentifierNode",
																	name: "slug",
																},
															},
														},
													},
												],
												joins: [
													{
														kind: "JoinNode",
														joinType: "LateralLeftJoin",
														table: {
															kind: "AliasNode",
															node: {
																kind: "SelectQueryNode",
																from: {
																	kind: "FromNode",
																	froms: [
																		{
																			kind: "TableNode",
																			table: {
																				kind: "SchemableIdentifierNode",
																				identifier: {
																					kind: "IdentifierNode",
																					name: "pub_fields",
																				},
																			},
																		},
																	],
																},
																selections: [
																	{
																		kind: "SelectionNode",
																		selection: {
																			kind: "ReferenceNode",
																			table: undefined,
																			column: {
																				kind: "ColumnNode",
																				column: {
																					kind: "IdentifierNode",
																					name: "slug",
																				},
																			},
																		},
																	},
																	{
																		kind: "SelectionNode",
																		selection: {
																			kind: "ReferenceNode",
																			table: undefined,
																			column: {
																				kind: "ColumnNode",
																				column: {
																					kind: "IdentifierNode",
																					name: "id",
																				},
																			},
																		},
																	},
																],
															},
															alias: {
																kind: "IdentifierNode",
																name: "fields",
															},
														},
														on: {
															kind: "OnNode",
															on: {
																kind: "BinaryOperationNode",
																leftOperand: {
																	kind: "ReferenceNode",
																	table: {
																		kind: "TableNode",
																		table: {
																			kind: "SchemableIdentifierNode",
																			identifier: {
																				kind: "IdentifierNode",
																				name: "fields",
																			},
																		},
																	},
																	column: {
																		kind: "ColumnNode",
																		column: {
																			kind: "IdentifierNode",
																			name: "id",
																		},
																	},
																},
																operator: {
																	kind: "OperatorNode",
																	operator: "=",
																},
																rightOperand: {
																	kind: "ReferenceNode",
																	table: {
																		kind: "TableNode",
																		table: {
																			kind: "SchemableIdentifierNode",
																			identifier: {
																				kind: "IdentifierNode",
																				name: "pub_values",
																			},
																		},
																	},
																	column: {
																		kind: "ColumnNode",
																		column: {
																			kind: "IdentifierNode",
																			name: "field_id",
																		},
																	},
																},
															},
														},
													},
												],
												orderBy: {
													kind: "OrderByNode",
													items: [
														{
															kind: "OrderByItemNode",
															orderBy: {
																kind: "ReferenceNode",
																table: {
																	kind: "TableNode",
																	table: {
																		kind: "SchemableIdentifierNode",
																		identifier: {
																			kind: "IdentifierNode",
																			name: "pub_values",
																		},
																	},
																},
																column: {
																	kind: "ColumnNode",
																	column: {
																		kind: "IdentifierNode",
																		name: "field_id",
																	},
																},
															},
															direction: undefined,
														},
														{
															kind: "OrderByItemNode",
															orderBy: {
																kind: "ReferenceNode",
																table: {
																	kind: "TableNode",
																	table: {
																		kind: "SchemableIdentifierNode",
																		identifier: {
																			kind: "IdentifierNode",
																			name: "pub_values",
																		},
																	},
																},
																column: {
																	kind: "ColumnNode",
																	column: {
																		kind: "IdentifierNode",
																		name: "created_at",
																	},
																},
															},
															direction: {
																kind: "RawNode",
																sqlFragments: ["desc"],
																parameters: [],
															},
														},
													],
												},
												where: {
													kind: "WhereNode",
													where: {
														kind: "BinaryOperationNode",
														leftOperand: {
															kind: "ReferenceNode",
															table: {
																kind: "TableNode",
																table: {
																	kind: "SchemableIdentifierNode",
																	identifier: {
																		kind: "IdentifierNode",
																		name: "pub_values",
																	},
																},
															},
															column: {
																kind: "ColumnNode",
																column: {
																	kind: "IdentifierNode",
																	name: "pub_id",
																},
															},
														},
														operator: {
															kind: "OperatorNode",
															operator: "=",
														},
														rightOperand: {
															kind: "ReferenceNode",
															table: {
																kind: "TableNode",
																table: {
																	kind: "SchemableIdentifierNode",
																	identifier: {
																		kind: "IdentifierNode",
																		name: "pubs",
																	},
																},
															},
															column: {
																kind: "ColumnNode",
																column: {
																	kind: "IdentifierNode",
																	name: "id",
																},
															},
														},
													},
												},
											},
											alias: {
												kind: "IdentifierNode",
												name: "latest_values",
											},
										},
									],
								},
								alias: { kind: "IdentifierNode", name: "values" },
							},
						},
					],
					where: {
						kind: "WhereNode",
						where: {
							kind: "BinaryOperationNode",
							leftOperand: {
								kind: "ReferenceNode",
								table: {
									kind: "TableNode",
									table: {
										kind: "SchemableIdentifierNode",
										identifier: { kind: "IdentifierNode", name: "pubs" },
									},
								},
								column: {
									kind: "ColumnNode",
									column: { kind: "IdentifierNode", name: "parent_id" },
								},
							},
							operator: { kind: "OperatorNode", operator: "=" },
							rightOperand: { kind: "ValueNode", value: "s" },
						},
					},
					setOperations: [
						{
							kind: "SetOperationNode",
							operator: "union",
							expression: {
								kind: "SelectQueryNode",
								from: {
									kind: "FromNode",
									froms: [
										{
											kind: "TableNode",
											table: {
												kind: "SchemableIdentifierNode",
												identifier: {
													kind: "IdentifierNode",
													name: "children",
												},
											},
										},
									],
								},
								joins: [
									{
										kind: "JoinNode",
										joinType: "InnerJoin",
										table: {
											kind: "TableNode",
											table: {
												kind: "SchemableIdentifierNode",
												identifier: {
													kind: "IdentifierNode",
													name: "pubs",
												},
											},
										},
										on: {
											kind: "OnNode",
											on: {
												kind: "BinaryOperationNode",
												leftOperand: {
													kind: "ReferenceNode",
													table: {
														kind: "TableNode",
														table: {
															kind: "SchemableIdentifierNode",
															identifier: {
																kind: "IdentifierNode",
																name: "pubs",
															},
														},
													},
													column: {
														kind: "ColumnNode",
														column: {
															kind: "IdentifierNode",
															name: "parent_id",
														},
													},
												},
												operator: { kind: "OperatorNode", operator: "=" },
												rightOperand: {
													kind: "ReferenceNode",
													table: {
														kind: "TableNode",
														table: {
															kind: "SchemableIdentifierNode",
															identifier: {
																kind: "IdentifierNode",
																name: "children",
															},
														},
													},
													column: {
														kind: "ColumnNode",
														column: {
															kind: "IdentifierNode",
															name: "id",
														},
													},
												},
											},
										},
									},
								],
								selections: [
									{
										kind: "SelectionNode",
										selection: {
											kind: "ReferenceNode",
											table: {
												kind: "TableNode",
												table: {
													kind: "SchemableIdentifierNode",
													identifier: {
														kind: "IdentifierNode",
														name: "pubs",
													},
												},
											},
											column: {
												kind: "ColumnNode",
												column: { kind: "IdentifierNode", name: "id" },
											},
										},
									},
									{
										kind: "SelectionNode",
										selection: {
											kind: "ReferenceNode",
											table: {
												kind: "TableNode",
												table: {
													kind: "SchemableIdentifierNode",
													identifier: {
														kind: "IdentifierNode",
														name: "pubs",
													},
												},
											},
											column: {
												kind: "ColumnNode",
												column: {
													kind: "IdentifierNode",
													name: "parent_id",
												},
											},
										},
									},
									{
										kind: "SelectionNode",
										selection: {
											kind: "AliasNode",
											node: {
												kind: "RawNode",
												sqlFragments: [
													"(select json_object_agg(",
													".slug, ",
													".value) from ",
													")",
												],
												parameters: [
													{
														kind: "RawNode",
														sqlFragments: ["", ""],
														parameters: [
															{
																kind: "ReferenceNode",
																table: undefined,
																column: {
																	kind: "ColumnNode",
																	column: {
																		kind: "IdentifierNode",
																		name: "latest_values",
																	},
																},
															},
														],
													},
													{
														kind: "RawNode",
														sqlFragments: ["", ""],
														parameters: [
															{
																kind: "ReferenceNode",
																table: undefined,
																column: {
																	kind: "ColumnNode",
																	column: {
																		kind: "IdentifierNode",
																		name: "latest_values",
																	},
																},
															},
														],
													},
													{
														kind: "AliasNode",
														node: {
															kind: "SelectQueryNode",
															from: {
																kind: "FromNode",
																froms: [
																	{
																		kind: "TableNode",
																		table: {
																			kind: "SchemableIdentifierNode",
																			identifier: {
																				kind: "IdentifierNode",
																				name: "pub_values",
																			},
																		},
																	},
																],
															},
															distinctOn: [
																{
																	kind: "ReferenceNode",
																	table: {
																		kind: "TableNode",
																		table: {
																			kind: "SchemableIdentifierNode",
																			identifier: {
																				kind: "IdentifierNode",
																				name: "pub_values",
																			},
																		},
																	},
																	column: {
																		kind: "ColumnNode",
																		column: {
																			kind: "IdentifierNode",
																			name: "field_id",
																		},
																	},
																},
															],
															selections: [
																{
																	kind: "SelectionNode",
																	selection: {
																		kind: "ReferenceNode",
																		table: {
																			kind: "TableNode",
																			table: {
																				kind: "SchemableIdentifierNode",
																				identifier: {
																					kind: "IdentifierNode",
																					name: "pub_values",
																				},
																			},
																		},
																		column: {
																			kind: "SelectAllNode",
																		},
																	},
																},
																{
																	kind: "SelectionNode",
																	selection: {
																		kind: "ReferenceNode",
																		table: undefined,
																		column: {
																			kind: "ColumnNode",
																			column: {
																				kind: "IdentifierNode",
																				name: "slug",
																			},
																		},
																	},
																},
															],
															joins: [
																{
																	kind: "JoinNode",
																	joinType: "LateralLeftJoin",
																	table: {
																		kind: "AliasNode",
																		node: {
																			kind: "SelectQueryNode",
																			from: {
																				kind: "FromNode",
																				froms: [
																					{
																						kind: "TableNode",
																						table: {
																							kind: "SchemableIdentifierNode",
																							identifier:
																								{
																									kind: "IdentifierNode",
																									name: "pub_fields",
																								},
																						},
																					},
																				],
																			},
																			selections: [
																				{
																					kind: "SelectionNode",
																					selection: {
																						kind: "ReferenceNode",
																						table: undefined,
																						column: {
																							kind: "ColumnNode",
																							column: {
																								kind: "IdentifierNode",
																								name: "slug",
																							},
																						},
																					},
																				},
																				{
																					kind: "SelectionNode",
																					selection: {
																						kind: "ReferenceNode",
																						table: undefined,
																						column: {
																							kind: "ColumnNode",
																							column: {
																								kind: "IdentifierNode",
																								name: "id",
																							},
																						},
																					},
																				},
																			],
																		},
																		alias: {
																			kind: "IdentifierNode",
																			name: "fields",
																		},
																	},
																	on: {
																		kind: "OnNode",
																		on: {
																			kind: "BinaryOperationNode",
																			leftOperand: {
																				kind: "ReferenceNode",
																				table: {
																					kind: "TableNode",
																					table: {
																						kind: "SchemableIdentifierNode",
																						identifier:
																							{
																								kind: "IdentifierNode",
																								name: "fields",
																							},
																					},
																				},
																				column: {
																					kind: "ColumnNode",
																					column: {
																						kind: "IdentifierNode",
																						name: "id",
																					},
																				},
																			},
																			operator: {
																				kind: "OperatorNode",
																				operator: "=",
																			},
																			rightOperand: {
																				kind: "ReferenceNode",
																				table: {
																					kind: "TableNode",
																					table: {
																						kind: "SchemableIdentifierNode",
																						identifier:
																							{
																								kind: "IdentifierNode",
																								name: "pub_values",
																							},
																					},
																				},
																				column: {
																					kind: "ColumnNode",
																					column: {
																						kind: "IdentifierNode",
																						name: "field_id",
																					},
																				},
																			},
																		},
																	},
																},
															],
															orderBy: {
																kind: "OrderByNode",
																items: [
																	{
																		kind: "OrderByItemNode",
																		orderBy: {
																			kind: "ReferenceNode",
																			table: {
																				kind: "TableNode",
																				table: {
																					kind: "SchemableIdentifierNode",
																					identifier: {
																						kind: "IdentifierNode",
																						name: "pub_values",
																					},
																				},
																			},
																			column: {
																				kind: "ColumnNode",
																				column: {
																					kind: "IdentifierNode",
																					name: "field_id",
																				},
																			},
																		},
																		direction: undefined,
																	},
																	{
																		kind: "OrderByItemNode",
																		orderBy: {
																			kind: "ReferenceNode",
																			table: {
																				kind: "TableNode",
																				table: {
																					kind: "SchemableIdentifierNode",
																					identifier: {
																						kind: "IdentifierNode",
																						name: "pub_values",
																					},
																				},
																			},
																			column: {
																				kind: "ColumnNode",
																				column: {
																					kind: "IdentifierNode",
																					name: "created_at",
																				},
																			},
																		},
																		direction: {
																			kind: "RawNode",
																			sqlFragments: ["desc"],
																			parameters: [],
																		},
																	},
																],
															},
															where: {
																kind: "WhereNode",
																where: {
																	kind: "BinaryOperationNode",
																	leftOperand: {
																		kind: "ReferenceNode",
																		table: {
																			kind: "TableNode",
																			table: {
																				kind: "SchemableIdentifierNode",
																				identifier: {
																					kind: "IdentifierNode",
																					name: "pub_values",
																				},
																			},
																		},
																		column: {
																			kind: "ColumnNode",
																			column: {
																				kind: "IdentifierNode",
																				name: "pub_id",
																			},
																		},
																	},
																	operator: {
																		kind: "OperatorNode",
																		operator: "=",
																	},
																	rightOperand: {
																		kind: "ReferenceNode",
																		table: {
																			kind: "TableNode",
																			table: {
																				kind: "SchemableIdentifierNode",
																				identifier: {
																					kind: "IdentifierNode",
																					name: "pubs",
																				},
																			},
																		},
																		column: {
																			kind: "ColumnNode",
																			column: {
																				kind: "IdentifierNode",
																				name: "id",
																			},
																		},
																	},
																},
															},
														},
														alias: {
															kind: "IdentifierNode",
															name: "latest_values",
														},
													},
												],
											},
											alias: { kind: "IdentifierNode", name: "values" },
										},
									},
								],
							},
							all: true,
						},
					],
				},
			},
		],
		recursive: true,
	},
	where: {
		kind: "WhereNode",
		where: {
			kind: "BinaryOperationNode",
			leftOperand: {
				kind: "ReferenceNode",
				table: {
					kind: "TableNode",
					table: {
						kind: "SchemableIdentifierNode",
						identifier: { kind: "IdentifierNode", name: "pubs" },
					},
				},
				column: {
					kind: "ColumnNode",
					column: { kind: "IdentifierNode", name: "id" },
				},
			},
			operator: { kind: "OperatorNode", operator: "=" },
			rightOperand: { kind: "ValueNode", value: "s" },
		},
	},
	selections: [
		{
			kind: "SelectionNode",
			selection: {
				kind: "ReferenceNode",
				table: undefined,
				column: {
					kind: "ColumnNode",
					column: { kind: "IdentifierNode", name: "id" },
				},
			},
		},
		{
			kind: "SelectionNode",
			selection: {
				kind: "AliasNode",
				node: {
					kind: "ReferenceNode",
					table: undefined,
					column: {
						kind: "ColumnNode",
						column: { kind: "IdentifierNode", name: "community_id" },
					},
				},
				alias: { kind: "IdentifierNode", name: "communityId" },
			},
		},
		{
			kind: "SelectionNode",
			selection: {
				kind: "AliasNode",
				node: {
					kind: "ReferenceNode",
					table: undefined,
					column: {
						kind: "ColumnNode",
						column: { kind: "IdentifierNode", name: "created_at" },
					},
				},
				alias: { kind: "IdentifierNode", name: "createdAt" },
			},
		},
		{
			kind: "SelectionNode",
			selection: {
				kind: "AliasNode",
				node: {
					kind: "ReferenceNode",
					table: undefined,
					column: {
						kind: "ColumnNode",
						column: { kind: "IdentifierNode", name: "parent_id" },
					},
				},
				alias: { kind: "IdentifierNode", name: "parentId" },
			},
		},
		{
			kind: "SelectionNode",
			selection: {
				kind: "AliasNode",
				node: {
					kind: "ReferenceNode",
					table: undefined,
					column: {
						kind: "ColumnNode",
						column: { kind: "IdentifierNode", name: "pub_type_id" },
					},
				},
				alias: { kind: "IdentifierNode", name: "pubTypeId" },
			},
		},
		{
			kind: "SelectionNode",
			selection: {
				kind: "AliasNode",
				node: {
					kind: "ReferenceNode",
					table: undefined,
					column: {
						kind: "ColumnNode",
						column: { kind: "IdentifierNode", name: "updated_at" },
					},
				},
				alias: { kind: "IdentifierNode", name: "updatedAt" },
			},
		},
		{
			kind: "SelectionNode",
			selection: {
				kind: "AliasNode",
				node: {
					kind: "RawNode",
					sqlFragments: ["(select json_object_agg(", ".slug, ", ".value) from ", ")"],
					parameters: [
						{
							kind: "RawNode",
							sqlFragments: ["", ""],
							parameters: [
								{
									kind: "ReferenceNode",
									table: undefined,
									column: {
										kind: "ColumnNode",
										column: { kind: "IdentifierNode", name: "latest_values" },
									},
								},
							],
						},
						{
							kind: "RawNode",
							sqlFragments: ["", ""],
							parameters: [
								{
									kind: "ReferenceNode",
									table: undefined,
									column: {
										kind: "ColumnNode",
										column: { kind: "IdentifierNode", name: "latest_values" },
									},
								},
							],
						},
						{
							kind: "AliasNode",
							node: {
								kind: "SelectQueryNode",
								from: {
									kind: "FromNode",
									froms: [
										{
											kind: "TableNode",
											table: {
												kind: "SchemableIdentifierNode",
												identifier: {
													kind: "IdentifierNode",
													name: "pub_values",
												},
											},
										},
									],
								},
								distinctOn: [
									{
										kind: "ReferenceNode",
										table: {
											kind: "TableNode",
											table: {
												kind: "SchemableIdentifierNode",
												identifier: {
													kind: "IdentifierNode",
													name: "pub_values",
												},
											},
										},
										column: {
											kind: "ColumnNode",
											column: { kind: "IdentifierNode", name: "field_id" },
										},
									},
								],
								selections: [
									{
										kind: "SelectionNode",
										selection: {
											kind: "ReferenceNode",
											table: {
												kind: "TableNode",
												table: {
													kind: "SchemableIdentifierNode",
													identifier: {
														kind: "IdentifierNode",
														name: "pub_values",
													},
												},
											},
											column: { kind: "SelectAllNode" },
										},
									},
									{
										kind: "SelectionNode",
										selection: {
											kind: "ReferenceNode",
											table: undefined,
											column: {
												kind: "ColumnNode",
												column: { kind: "IdentifierNode", name: "slug" },
											},
										},
									},
								],
								joins: [
									{
										kind: "JoinNode",
										joinType: "LateralLeftJoin",
										table: {
											kind: "AliasNode",
											node: {
												kind: "SelectQueryNode",
												from: {
													kind: "FromNode",
													froms: [
														{
															kind: "TableNode",
															table: {
																kind: "SchemableIdentifierNode",
																identifier: {
																	kind: "IdentifierNode",
																	name: "pub_fields",
																},
															},
														},
													],
												},
												selections: [
													{
														kind: "SelectionNode",
														selection: {
															kind: "ReferenceNode",
															table: undefined,
															column: {
																kind: "ColumnNode",
																column: {
																	kind: "IdentifierNode",
																	name: "slug",
																},
															},
														},
													},
													{
														kind: "SelectionNode",
														selection: {
															kind: "ReferenceNode",
															table: undefined,
															column: {
																kind: "ColumnNode",
																column: {
																	kind: "IdentifierNode",
																	name: "id",
																},
															},
														},
													},
												],
											},
											alias: { kind: "IdentifierNode", name: "fields" },
										},
										on: {
											kind: "OnNode",
											on: {
												kind: "BinaryOperationNode",
												leftOperand: {
													kind: "ReferenceNode",
													table: {
														kind: "TableNode",
														table: {
															kind: "SchemableIdentifierNode",
															identifier: {
																kind: "IdentifierNode",
																name: "fields",
															},
														},
													},
													column: {
														kind: "ColumnNode",
														column: {
															kind: "IdentifierNode",
															name: "id",
														},
													},
												},
												operator: { kind: "OperatorNode", operator: "=" },
												rightOperand: {
													kind: "ReferenceNode",
													table: {
														kind: "TableNode",
														table: {
															kind: "SchemableIdentifierNode",
															identifier: {
																kind: "IdentifierNode",
																name: "pub_values",
															},
														},
													},
													column: {
														kind: "ColumnNode",
														column: {
															kind: "IdentifierNode",
															name: "field_id",
														},
													},
												},
											},
										},
									},
								],
								orderBy: {
									kind: "OrderByNode",
									items: [
										{
											kind: "OrderByItemNode",
											orderBy: {
												kind: "ReferenceNode",
												table: {
													kind: "TableNode",
													table: {
														kind: "SchemableIdentifierNode",
														identifier: {
															kind: "IdentifierNode",
															name: "pub_values",
														},
													},
												},
												column: {
													kind: "ColumnNode",
													column: {
														kind: "IdentifierNode",
														name: "field_id",
													},
												},
											},
											direction: undefined,
										},
										{
											kind: "OrderByItemNode",
											orderBy: {
												kind: "ReferenceNode",
												table: {
													kind: "TableNode",
													table: {
														kind: "SchemableIdentifierNode",
														identifier: {
															kind: "IdentifierNode",
															name: "pub_values",
														},
													},
												},
												column: {
													kind: "ColumnNode",
													column: {
														kind: "IdentifierNode",
														name: "created_at",
													},
												},
											},
											direction: {
												kind: "RawNode",
												sqlFragments: ["desc"],
												parameters: [],
											},
										},
									],
								},
								where: {
									kind: "WhereNode",
									where: {
										kind: "BinaryOperationNode",
										leftOperand: {
											kind: "ReferenceNode",
											table: {
												kind: "TableNode",
												table: {
													kind: "SchemableIdentifierNode",
													identifier: {
														kind: "IdentifierNode",
														name: "pub_values",
													},
												},
											},
											column: {
												kind: "ColumnNode",
												column: { kind: "IdentifierNode", name: "pub_id" },
											},
										},
										operator: { kind: "OperatorNode", operator: "=" },
										rightOperand: { kind: "ValueNode", value: "s" },
									},
								},
							},
							alias: { kind: "IdentifierNode", name: "latest_values" },
						},
					],
				},
				alias: { kind: "IdentifierNode", name: "values" },
			},
		},
		{
			kind: "SelectionNode",
			selection: {
				kind: "AliasNode",
				node: {
					kind: "RawNode",
					sqlFragments: ["(select to_json(obj) from ", " as obj)"],
					parameters: [
						{
							kind: "SelectQueryNode",
							from: {
								kind: "FromNode",
								froms: [
									{
										kind: "TableNode",
										table: {
											kind: "SchemableIdentifierNode",
											identifier: { kind: "IdentifierNode", name: "users" },
										},
									},
								],
							},
							where: {
								kind: "WhereNode",
								where: {
									kind: "BinaryOperationNode",
									leftOperand: {
										kind: "ReferenceNode",
										table: {
											kind: "TableNode",
											table: {
												kind: "SchemableIdentifierNode",
												identifier: {
													kind: "IdentifierNode",
													name: "users",
												},
											},
										},
										column: {
											kind: "ColumnNode",
											column: { kind: "IdentifierNode", name: "id" },
										},
									},
									operator: { kind: "OperatorNode", operator: "=" },
									rightOperand: {
										kind: "ReferenceNode",
										table: {
											kind: "TableNode",
											table: {
												kind: "SchemableIdentifierNode",
												identifier: {
													kind: "IdentifierNode",
													name: "pubs",
												},
											},
										},
										column: {
											kind: "ColumnNode",
											column: { kind: "IdentifierNode", name: "assignee_id" },
										},
									},
								},
							},
							selections: [
								{
									kind: "SelectionNode",
									selection: {
										kind: "ReferenceNode",
										table: {
											kind: "TableNode",
											table: {
												kind: "SchemableIdentifierNode",
												identifier: {
													kind: "IdentifierNode",
													name: "users",
												},
											},
										},
										column: {
											kind: "ColumnNode",
											column: { kind: "IdentifierNode", name: "id" },
										},
									},
								},
								{
									kind: "SelectionNode",
									selection: {
										kind: "ReferenceNode",
										table: undefined,
										column: {
											kind: "ColumnNode",
											column: { kind: "IdentifierNode", name: "slug" },
										},
									},
								},
								{
									kind: "SelectionNode",
									selection: {
										kind: "ReferenceNode",
										table: undefined,
										column: {
											kind: "ColumnNode",
											column: { kind: "IdentifierNode", name: "firstName" },
										},
									},
								},
								{
									kind: "SelectionNode",
									selection: {
										kind: "ReferenceNode",
										table: undefined,
										column: {
											kind: "ColumnNode",
											column: { kind: "IdentifierNode", name: "lastName" },
										},
									},
								},
								{
									kind: "SelectionNode",
									selection: {
										kind: "ReferenceNode",
										table: undefined,
										column: {
											kind: "ColumnNode",
											column: { kind: "IdentifierNode", name: "avatar" },
										},
									},
								},
								{
									kind: "SelectionNode",
									selection: {
										kind: "AliasNode",
										node: {
											kind: "ReferenceNode",
											table: undefined,
											column: {
												kind: "ColumnNode",
												column: {
													kind: "IdentifierNode",
													name: "created_at",
												},
											},
										},
										alias: { kind: "IdentifierNode", name: "createdAt" },
									},
								},
								{
									kind: "SelectionNode",
									selection: {
										kind: "ReferenceNode",
										table: undefined,
										column: {
											kind: "ColumnNode",
											column: { kind: "IdentifierNode", name: "email" },
										},
									},
								},
								{
									kind: "SelectionNode",
									selection: {
										kind: "AliasNode",
										node: {
											kind: "ReferenceNode",
											table: undefined,
											column: {
												kind: "ColumnNode",
												column: {
													kind: "IdentifierNode",
													name: "community_id",
												},
											},
										},
										alias: { kind: "IdentifierNode", name: "communityId" },
									},
								},
							],
						},
					],
				},
				alias: { kind: "IdentifierNode", name: "assignee" },
			},
		},
		{
			kind: "SelectionNode",
			selection: {
				kind: "AliasNode",
				node: {
					kind: "RawNode",
					sqlFragments: ["(select coalesce(json_agg(agg), '[]') from ", " as agg)"],
					parameters: [
						{
							kind: "SelectQueryNode",
							from: {
								kind: "FromNode",
								froms: [
									{
										kind: "TableNode",
										table: {
											kind: "SchemableIdentifierNode",
											identifier: {
												kind: "IdentifierNode",
												name: "children",
											},
										},
									},
								],
							},
							selections: [
								{
									kind: "SelectionNode",
									selection: {
										kind: "ReferenceNode",
										table: undefined,
										column: {
											kind: "ColumnNode",
											column: { kind: "IdentifierNode", name: "id" },
										},
									},
								},
								{
									kind: "SelectionNode",
									selection: {
										kind: "AliasNode",
										node: {
											kind: "ReferenceNode",
											table: undefined,
											column: {
												kind: "ColumnNode",
												column: {
													kind: "IdentifierNode",
													name: "community_id",
												},
											},
										},
										alias: { kind: "IdentifierNode", name: "communityId" },
									},
								},
								{
									kind: "SelectionNode",
									selection: {
										kind: "AliasNode",
										node: {
											kind: "ReferenceNode",
											table: undefined,
											column: {
												kind: "ColumnNode",
												column: {
													kind: "IdentifierNode",
													name: "created_at",
												},
											},
										},
										alias: { kind: "IdentifierNode", name: "createdAt" },
									},
								},
								{
									kind: "SelectionNode",
									selection: {
										kind: "AliasNode",
										node: {
											kind: "ReferenceNode",
											table: undefined,
											column: {
												kind: "ColumnNode",
												column: {
													kind: "IdentifierNode",
													name: "parent_id",
												},
											},
										},
										alias: { kind: "IdentifierNode", name: "parentId" },
									},
								},
								{
									kind: "SelectionNode",
									selection: {
										kind: "AliasNode",
										node: {
											kind: "ReferenceNode",
											table: undefined,
											column: {
												kind: "ColumnNode",
												column: {
													kind: "IdentifierNode",
													name: "pub_type_id",
												},
											},
										},
										alias: { kind: "IdentifierNode", name: "pubTypeId" },
									},
								},
								{
									kind: "SelectionNode",
									selection: {
										kind: "AliasNode",
										node: {
											kind: "ReferenceNode",
											table: undefined,
											column: {
												kind: "ColumnNode",
												column: {
													kind: "IdentifierNode",
													name: "updated_at",
												},
											},
										},
										alias: { kind: "IdentifierNode", name: "updatedAt" },
									},
								},
								{
									kind: "SelectionNode",
									selection: {
										kind: "ReferenceNode",
										table: undefined,
										column: {
											kind: "ColumnNode",
											column: { kind: "IdentifierNode", name: "values" },
										},
									},
								},
							],
						},
					],
				},
				alias: { kind: "IdentifierNode", name: "children" },
			},
		},
	],
} as const satisfies QueryNode;

export function findTables<T extends OperationNode>(
	node: T | T[],
	tables = new Set<string>()
): Set<string> {
	if (Array.isArray(node)) {
		for (const item of node) {
			findTables(item, tables);
		}
		return tables;
	}

	if (typeof node !== "object") {
		return tables;
	}

	for (const [key, value] of Object.entries(node)) {
		if (typeof value !== "object") {
			continue;
		}

		if (TableNode.is(value)) {
			tables.add(value.table.identifier.name);
			continue;
		}

		findTables(value, tables);
	}

	return tables;
}
export function findTablesSimple(sql: string) {
	const tables = new Set<string>();
	const regex = /from\s+"(\w+)"/g;
	let match;
	while ((match = regex.exec(sql)) !== null) {
		tables.add(match[1]);
	}
	return tables;
}

performance.mark("start-find");
console.log(findTables(query));
performance.mark("end-find");
console.log(performance.measure("find", "start-find", "end-find"));

performance.mark("simple-start");
console.log(
	findTablesSimple(
		`with recursive "children" as (select "id", "parent_id", (select json_object_agg("latest_values".slug, "latest_values".value) from (select distinct on ("pub_values"."field_id") "pub_values".*, "slug" from "pub_values" left join lateral (select "slug", "id" from "pub_fields") as "fields" on "fields"."id" = "pub_values"."field_id" where "pub_values"."pub_id" = "pubs"."id" order by "pub_values"."field_id", "pub_values"."created_at" desc) as "latest_values") as "values" from "pubs" where "pubs"."parent_id" = $1 union all select "pubs"."id", "pubs"."parent_id", (select json_object_agg("latest_values".slug, "latest_values".value) from (select distinct on ("pub_values"."field_id") "pub_values".*, "slug" from "pub_values" left join lateral (select "slug", "id" from "pub_fields") as "fields" on "fields"."id" = "pub_values"."field_id" where "pub_values"."pub_id" = "pubs"."id" order by "pub_values"."field_id", "pub_values"."created_at" desc) as "latest_values") as "values" from "children" inner join "pubs" on "pubs"."parent_id" = "children"."id") select "id", "community_id" as "communityId", "created_at" as "createdAt", "parent_id" as "parentId", "pub_type_id" as "pubTypeId", "updated_at" as "updatedAt", (select json_object_agg("latest_values".slug, "latest_values".value) from (select distinct on ("pub_values"."field_id") "pub_values".*, "slug" from "pub_values" left join lateral (select "slug", "id" from "pub_fields") as "fields" on "fields"."id" = "pub_values"."field_id" where "pub_values"."pub_id" = $2 order by "pub_values"."field_id", "pub_values"."created_at" desc) as "latest_values") as "values", (select to_json(obj) from (select "users"."id", "slug", "firstName", "lastName", "avatar", "created_at" as "createdAt", "email", "community_id" as "communityId" from "users" where "users"."id" = "pubs"."assignee_id") as obj) as "assignee", (select coalesce(json_agg(agg), '[]') from (select "id", "community_id" as "communityId", "created_at" as "createdAt", "parent_id" as "parentId", "pub_type_id" as "pubTypeId", "updated_at" as "updatedAt", "values" from "children") as agg) as "children" from "pubs" where "pubs"."id" = $3`
	)
);
performance.mark("simple-end");
console.log(performance.measure("simple", "simple-start", "simple-end"));

const withCache = async <
	T extends SelectQueryBuilder<Database, keyof Database, any>,
	Result extends ReturnType<
		T["execute" | "executeTakeFirstOrThrow" | "executeTakeFirst" | "stream"]
	> = ReturnType<T["execute" | "executeTakeFirstOrThrow" | "executeTakeFirst" | "stream"]>,
>(
	query: T,
	followUp: (query: T) => Result,
	communityId: string | ((result: Awaited<Result>) => string),
	extra?: { tags?: string[] }
) => {
	const compiledQuery = query.compile();

	db.executeQuery(compiledQuery);

	const result = await followUp(query);
	const cId = typeof communityId === "function" ? communityId(result) : communityId;
	return result;
};

const invalidate = async <
	T extends
		| InsertQueryBuilder<Database, keyof Database, any>
		| UpdateQueryBuilder<Database, keyof Database, keyof Database, any>
		| DeleteQueryBuilder<Database, keyof Database, any>,
	Result extends ReturnType<
		T["execute" | "executeTakeFirstOrThrow" | "executeTakeFirst" | "stream"]
	> = ReturnType<T["execute" | "executeTakeFirstOrThrow" | "executeTakeFirst" | "stream"]>,
>(
	mutation: T,
	followUp: (mutation: T) => Result,
	communityId: string | ((result: Awaited<Result>) => string),
	extra?: { tags?: string[] }
) => {
	const compiledQuery = mutation.compile();

	const query = compiledQuery.query;

	const table = new Set(
		Array.from(compiledQuery.sql.matchAll(/(insert into|delete from|update) "(\w+)"/g)).map(
			([, , table]) => table
		)
	);
	console.log(compiledQuery);
	console.log(table);

	const result = await db.executeQuery(compiledQuery);

	const cId = typeof communityId === "function" ? communityId(result) : communityId;

	Array.from(table).forEach((table) => {
		revalidateTag(`community-${table}_${cId}`);
	});
	return result;
};

invalidate(
	db
		.updateTable("pub_values")
		.set({
			value: JSON.stringify("hello"),
		})
		.where("pub_values.id", "=", "hoi"),
	(mutation) => mutation.execute()
).then((res) => res);

invalidate(
	db
		.with("leave-stage", (db) => db.deleteFrom("PubsInStages").where("pubId", "=", ""))
		.insertInto("PubsInStages")
		.values({ pubId: "q", stageId: "q" }),
	(mutation) => mutation.execute()
);
