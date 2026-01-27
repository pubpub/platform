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

/**
 * COAR Notify seed
 *
 * This seed creates a community configured for COAR Notify workflows, including:
 * - Notification and Review pub types
 * - Webhook-triggered automations for processing COAR Notify payloads
 * - A review workflow that processes incoming review requests
 * - Automations for sending review offers and announcements
 *
 * Webhook endpoint: /api/v0/c/coar-notify/site/webhook/coar-inbox
 *
 * Workflow:
 * 1. Incoming COAR Notify webhook creates a Notification pub in Inbox
 * 2. A Review pub is created and linked to the Notification
 * 3. Review moves through: ReviewInbox -> Reviewing -> Published
 * 4. On Published, an Announce notification is sent back
 */
export async function seedCoarNotify(communityId?: CommunitiesId) {
	const adminId = "dddddddd-dddd-4ddd-dddd-dddddddddd01" as UsersId

	const STAGE_IDS = {
		Inbox: "dddddddd-dddd-4ddd-dddd-dddddddddd10" as StagesId,
		ReviewRequested: "dddddddd-dddd-4ddd-dddd-dddddddddd11" as StagesId,
		Accepted: "dddddddd-dddd-4ddd-dddd-dddddddddd12" as StagesId,
		Rejected: "dddddddd-dddd-4ddd-dddd-dddddddddd13" as StagesId,
		Published: "dddddddd-dddd-4ddd-dddd-dddddddddd14" as StagesId,
		ReviewInbox: "dddddddd-dddd-4ddd-dddd-dddddddddd15" as StagesId,
		Reviewing: "dddddddd-dddd-4ddd-dddd-dddddddddd16" as StagesId,
	}

	const WEBHOOK_PATH = "coar-inbox"

	// Placeholder for the remote inbox URL - update this to point to your actual COAR Notify endpoint
	const REMOTE_INBOX_URL = "http://localhost:4000/inbox"

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
								name: "inbox",
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
								name: "file-plus",
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
											RelatedPub:
												"<<< [{ 'relatedPubId': $.pub.id, 'value': 'Notification' }] >>>",
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
							actions: [{ action: Action.move, config: { stage: STAGE_IDS.Reviewing } }],
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
							actions: [{ action: Action.move, config: { stage: STAGE_IDS.Published } }],
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
								name: "megaphone",
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
												"as:inReplyTo": $.pub.out.relatedpub.values.sourceurl
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
				},
				Rejected: {
					id: STAGE_IDS.Rejected,
				},
			},
			stageConnections: {
				Inbox: {
					to: ["ReviewRequested", "Published"],
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
