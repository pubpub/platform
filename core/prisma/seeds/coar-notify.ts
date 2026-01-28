import type { CommunitiesId, StagesId, UsersId } from "db/public"

import {
	Action,
	AutomationConditionBlockType,
	AutomationEvent,
	CoreSchemaType,
	MemberRole,
} from "db/public"

import { env } from "~/lib/env/env"
import { seedCommunity } from "../seed/seedCommunity"

export async function seedCoarNotify(communityId?: CommunitiesId) {
	const adminId = "dddddddd-dddd-4ddd-dddd-dddddddddd01" as UsersId

	const STAGE_IDS = {
		// Notification processing stages
		Inbox: "dddddddd-dddd-4ddd-dddd-dddddddddd10" as StagesId,
		// Review workflow stages
		ReviewInbox: "dddddddd-dddd-4ddd-dddd-dddddddddd15" as StagesId,
		Reviewing: "dddddddd-dddd-4ddd-dddd-dddddddddd16" as StagesId,
		Published: "dddddddd-dddd-4ddd-dddd-dddddddddd14" as StagesId,
		// Outbound request stages
		ReviewRequested: "dddddddd-dddd-4ddd-dddd-dddddddddd11" as StagesId,
		Accepted: "dddddddd-dddd-4ddd-dddd-dddddddddd12" as StagesId,
		Rejected: "dddddddd-dddd-4ddd-dddd-dddddddddd13" as StagesId,
	}

	const WEBHOOK_PATH = "coar-inbox"

	// Default remote inbox URL - can be changed in UI for testing
	const REMOTE_INBOX_URL = "http://localhost:4000/api/inbox"

	return seedCommunity(
		{
			community: {
				id: communityId,
				name: "COAR Notify",
				slug: "coar-notify",
				avatar: `${env.PUBPUB_URL}/demo/croc.png`,
			},
			pubFields: {
				Title: { schemaName: CoreSchemaType.String },
				Content: { schemaName: CoreSchemaType.String },
				Payload: { schemaName: CoreSchemaType.String },
				SourceURL: { schemaName: CoreSchemaType.String },
				RelatedPub: { schemaName: CoreSchemaType.String, relation: true },
			},
			pubTypes: {
				Submission: {
					Title: { isTitle: true },
					Content: { isTitle: false },
				},
				Notification: {
					Title: { isTitle: true },
					Payload: { isTitle: false },
					SourceURL: { isTitle: false },
					RelatedPub: { isTitle: false },
				},
				Review: {
					Title: { isTitle: true },
					Content: { isTitle: false },
					RelatedPub: { isTitle: false },
				},
			},
			users: {
				admin: {
					id: adminId,
					firstName: "COAR",
					lastName: "Admin",
					email: "coar-admin@pubpub.org",
					password: "pubpub-coar",
					role: MemberRole.admin,
				},
				jillAdmin: {
					id: "0cd4b908-b4f6-41be-9463-28979fefb4cd" as UsersId,
					existing: true,
					role: MemberRole.admin,
				},
			},
			pubs: [
				{
					pubType: "Submission",
					stage: "Inbox",
					values: { Title: "Sample Submission for Review" },
				},
			],
			stages: {
				Inbox: {
					id: STAGE_IDS.Inbox,
					automations: {
						"Process COAR Notification": {
							icon: {
								name: "mail",
								color: "#3b82f6",
							},
							triggers: [
								{
									event: AutomationEvent.webhook,
									config: { path: WEBHOOK_PATH },
								},
							],
							actions: [
								{
									action: Action.createPub,
									config: {
										stage: STAGE_IDS.Inbox,
										formSlug: "notification-default-editor",
										pubValues: {
											Title: "URL: {{ $.json.object.id }} - Type: {{ $join($.json.type, ', ') }}",
											Payload: "{{ $string($.json) }}",
											SourceURL: "{{ $.json.object.id }}",
										},
									},
								},
							],
						},
						"Create Review for Notification": {
							icon: {
								name: "plus-circle",
								color: "#10b981",
							},
							triggers: [
								{
									event: AutomationEvent.pubEnteredStage,
									config: {},
								},
							],
							condition: {
								type: AutomationConditionBlockType.AND,
								items: [
									{
										kind: "condition",
										type: "jsonata",
										expression: "$.pub.pubType.name = 'Notification'",
									},
								],
							},
							actions: [
								{
									action: Action.createPub,
									config: {
										stage: STAGE_IDS.ReviewInbox,
										formSlug: "review-default-editor",
										pubValues: {
											Title: "Review for: {{ $.pub.values.title }}",
										},
										relationConfig: {
											fieldSlug: "coar-notify:relatedpub",
											relatedPubId: "{{ $.pub.id }}",
											value: "Notification",
											direction: "source",
										},
									},
								},
							],
						},
					},
				},
				ReviewInbox: {
					id: STAGE_IDS.ReviewInbox,
					automations: {
						"Start Review": {
							icon: {
								name: "play",
								color: "#8b5cf6",
							},
							triggers: [{ event: AutomationEvent.pubEnteredStage, config: {} }],
							actions: [
								{ action: Action.move, config: { stage: STAGE_IDS.Reviewing } },
							],
						},
					},
				},
				Reviewing: {
					id: STAGE_IDS.Reviewing,
					automations: {
						"Finish Review": {
							icon: {
								name: "check-circle",
								color: "#22c55e",
							},
							triggers: [{ event: AutomationEvent.pubEnteredStage, config: {} }],
							actions: [
								{ action: Action.move, config: { stage: STAGE_IDS.Published } },
							],
						},
					},
				},
				ReviewRequested: {
					id: STAGE_IDS.ReviewRequested,
					automations: {
						"Offer Review": {
							icon: {
								name: "send",
								color: "#f59e0b",
							},
							triggers: [
								{
									event: AutomationEvent.pubEnteredStage,
									config: {},
								},
							],
							actions: [
								{
									action: Action.http,
									config: {
										url: REMOTE_INBOX_URL,
										method: "POST",
										body: {
											"@context": [
												"https://www.w3.org/ns/activitystreams",
												"https://coar-notify.net",
											],
											type: ["Offer", "coar-notify:ReviewAction"],
											id: "urn:uuid:{{ $.pub.id }}",
											actor: {
												id: "{{ $.env.PUBPUB_URL }}/c/{{ $.community.slug }}",
												type: "Service",
												name: "{{ $.community.name }}",
											},
											object: {
												id: "{{ $.env.PUBPUB_URL }}/c/{{ $.community.slug }}/pub/{{ $.pub.id }}",
												type: ["Page", "sorg:AboutPage"],
											},
											target: {
												id: REMOTE_INBOX_URL.replace("/inbox", ""),
												inbox: REMOTE_INBOX_URL,
												type: "Service",
											},
										},
									},
								},
							],
						},
					},
				},
				Published: {
					id: STAGE_IDS.Published,
					automations: {
						"Announce Review": {
							icon: {
								name: "send",
								color: "#ec4899",
							},
							triggers: [
								{
									event: AutomationEvent.pubEnteredStage,
									config: {},
								},
							],
							actions: [
								{
									action: Action.http,
									config: {
										url: REMOTE_INBOX_URL,
										method: "POST",
										body: `<<< {
											"@context": [
												"https://www.w3.org/ns/activitystreams",
												"https://coar-notify.net"
											],
											"type": ["Announce", "coar-notify:ReviewAction"],
											"id": "urn:uuid:" & $.pub.id,
											"object": {
												"id": $.env.PUBPUB_URL & "/c/" & $.community.slug & "/pub/" & $.pub.id,
												"type": ["Page", "sorg:Review"],
												"as:inReplyTo": $.pub.out.RelatedPub.values.SourceURL
											},
											"target": {
												"id": "${REMOTE_INBOX_URL.replace("/inbox", "")}",
												"inbox": "${REMOTE_INBOX_URL}",
												"type": "Service"
											}
										} >>>`,
									},
								},
							],
						},
					},
				},
				Accepted: {
					id: STAGE_IDS.Accepted,
					automations: {
						"Send Accept Acknowledgement": {
							icon: {
								name: "check",
								color: "#22c55e",
							},
							triggers: [
								{
									event: AutomationEvent.pubEnteredStage,
									config: {},
								},
							],
							condition: {
								type: AutomationConditionBlockType.AND,
								items: [
									{
										kind: "condition",
										type: "jsonata",
										expression: "$.pub.pubType.name = 'Notification'",
									},
								],
							},
							actions: [
								{
									action: Action.http,
									config: {
										url: REMOTE_INBOX_URL,
										method: "POST",
										body: `<<< (
											$payload := $parse($.pub.values.Payload);
											{
												"@context": [
													"https://www.w3.org/ns/activitystreams",
													"https://coar-notify.net"
												],
												"type": "Accept",
												"id": "urn:uuid:" & $.pub.id & ":accept",
												"actor": {
													"id": $.env.PUBPUB_URL & "/c/" & $.community.slug,
													"type": "Service",
													"name": $.community.name
												},
												"inReplyTo": $payload.id,
												"object": $payload.object ~> $sift(function($v, $k) { $k != "@context" }),
												"origin": {
													"id": $.env.PUBPUB_URL & "/c/" & $.community.slug,
													"inbox": $.env.PUBPUB_URL & "/api/v0/c/" & $.community.slug & "/site/webhook/${WEBHOOK_PATH}",
													"type": "Service"
												},
												"target": $payload.actor
											}
										) >>>`,
									},
								},
							],
						},
					},
				},
				Rejected: {
					id: STAGE_IDS.Rejected,
					automations: {
						"Send Reject Acknowledgement": {
							icon: {
								name: "x",
								color: "#ef4444",
							},
							triggers: [
								{
									event: AutomationEvent.pubEnteredStage,
									config: {},
								},
							],
							condition: {
								type: AutomationConditionBlockType.AND,
								items: [
									{
										kind: "condition",
										type: "jsonata",
										expression: "$.pub.pubType.name = 'Notification'",
									},
								],
							},
							actions: [
								{
									action: Action.http,
									config: {
										url: REMOTE_INBOX_URL,
										method: "POST",
										body: `<<< (
											$payload := $parse($.pub.values.Payload);
											{
												"@context": [
													"https://www.w3.org/ns/activitystreams",
													"https://coar-notify.net"
												],
												"type": "Reject",
												"id": "urn:uuid:" & $.pub.id & ":reject",
												"actor": {
													"id": $.env.PUBPUB_URL & "/c/" & $.community.slug,
													"type": "Service",
													"name": $.community.name
												},
												"inReplyTo": $payload.id,
												"object": $payload.object ~> $sift(function($v, $k) { $k != "@context" }),
												"origin": {
													"id": $.env.PUBPUB_URL & "/c/" & $.community.slug,
													"inbox": $.env.PUBPUB_URL & "/api/v0/c/" & $.community.slug & "/site/webhook/${WEBHOOK_PATH}",
													"type": "Service"
												},
												"target": $payload.actor,
												"summary": "The review request was rejected."
											}
										) >>>`,
									},
								},
							],
						},
					},
				},
			},
			stageConnections: {
				Inbox: {
					to: ["ReviewRequested", "Published", "Accepted", "Rejected"],
				},
				ReviewInbox: {
					to: ["Reviewing"],
				},
				Reviewing: {
					to: ["Published"],
				},
				ReviewRequested: {
					to: ["Accepted", "Rejected"],
				},
			},
		},
		{
			randomSlug: false,
		}
	)
}
