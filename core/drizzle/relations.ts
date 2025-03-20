import { relations } from "drizzle-orm/relations";
import { communities, stages, memberGroups, pubTypes, pubs, users, pubFields, pubValues, pubFieldSchema, pubFieldToPubType, authTokens, memberGroupToUser, actionInstances, rules, forms, actionRuns, apiAccessTokens, apiAccessLogs, sessions, apiAccessPermissions, formElements, communityMemberships, pubMemberships, stageMemberships, pubValuesHistory, formMemberships, invites, moveConstraint, pubsInStages } from "./schema";

export const stagesRelations = relations(stages, ({one, many}) => ({
	community: one(communities, {
		fields: [stages.communityId],
		references: [communities.id]
	}),
	actionInstances: many(actionInstances),
	formElements: many(formElements),
	stageMemberships: many(stageMemberships),
	invites: many(invites),
	moveConstraints_stageId: many(moveConstraint, {
		relationName: "moveConstraint_stageId_stages_id"
	}),
	moveConstraints_destinationId: many(moveConstraint, {
		relationName: "moveConstraint_destinationId_stages_id"
	}),
	pubsInStages: many(pubsInStages),
}));

export const communitiesRelations = relations(communities, ({many}) => ({
	stages: many(stages),
	memberGroups: many(memberGroups),
	pubTypes: many(pubTypes),
	pubs: many(pubs),
	pubFields: many(pubFields),
	forms: many(forms),
	apiAccessTokens: many(apiAccessTokens),
	communityMemberships: many(communityMemberships),
	invites: many(invites),
}));

export const memberGroupsRelations = relations(memberGroups, ({one, many}) => ({
	community: one(communities, {
		fields: [memberGroups.communityId],
		references: [communities.id]
	}),
	memberGroupToUsers: many(memberGroupToUser),
	communityMemberships: many(communityMemberships),
	pubMemberships: many(pubMemberships),
	stageMemberships: many(stageMemberships),
	formMemberships: many(formMemberships),
}));

export const pubTypesRelations = relations(pubTypes, ({one, many}) => ({
	community: one(communities, {
		fields: [pubTypes.communityId],
		references: [communities.id]
	}),
	pubs: many(pubs),
	pubFieldToPubTypes: many(pubFieldToPubType),
	forms: many(forms),
}));

export const pubsRelations = relations(pubs, ({one, many}) => ({
	pubType: one(pubTypes, {
		fields: [pubs.pubTypeId],
		references: [pubTypes.id]
	}),
	community: one(communities, {
		fields: [pubs.communityId],
		references: [communities.id]
	}),
	user: one(users, {
		fields: [pubs.assigneeId],
		references: [users.id]
	}),
	pubValues_pubId: many(pubValues, {
		relationName: "pubValues_pubId_pubs_id"
	}),
	pubValues_relatedPubId: many(pubValues, {
		relationName: "pubValues_relatedPubId_pubs_id"
	}),
	actionRuns: many(actionRuns),
	pubMemberships: many(pubMemberships),
	formMemberships: many(formMemberships),
	invites: many(invites),
	pubsInStages: many(pubsInStages),
}));

export const usersRelations = relations(users, ({many}) => ({
	pubs: many(pubs),
	authTokens: many(authTokens),
	memberGroupToUsers: many(memberGroupToUser),
	actionRuns: many(actionRuns),
	apiAccessTokens: many(apiAccessTokens),
	sessions: many(sessions),
	communityMemberships: many(communityMemberships),
	pubMemberships: many(pubMemberships),
	stageMemberships: many(stageMemberships),
	pubValuesHistories: many(pubValuesHistory),
	formMemberships: many(formMemberships),
	invites_userId: many(invites, {
		relationName: "invites_userId_users_id"
	}),
	invites_invitedByUserId: many(invites, {
		relationName: "invites_invitedByUserId_users_id"
	}),
}));

export const pubValuesRelations = relations(pubValues, ({one}) => ({
	pubField: one(pubFields, {
		fields: [pubValues.fieldId],
		references: [pubFields.id]
	}),
	pub_pubId: one(pubs, {
		fields: [pubValues.pubId],
		references: [pubs.id],
		relationName: "pubValues_pubId_pubs_id"
	}),
	pub_relatedPubId: one(pubs, {
		fields: [pubValues.relatedPubId],
		references: [pubs.id],
		relationName: "pubValues_relatedPubId_pubs_id"
	}),
}));

export const pubFieldsRelations = relations(pubFields, ({one, many}) => ({
	pubValues: many(pubValues),
	pubFieldSchema: one(pubFieldSchema, {
		fields: [pubFields.pubFieldSchemaId],
		references: [pubFieldSchema.id]
	}),
	community: one(communities, {
		fields: [pubFields.communityId],
		references: [communities.id]
	}),
	pubFieldToPubTypes: many(pubFieldToPubType),
	formElements: many(formElements),
}));

export const pubFieldSchemaRelations = relations(pubFieldSchema, ({many}) => ({
	pubFields: many(pubFields),
}));

export const pubFieldToPubTypeRelations = relations(pubFieldToPubType, ({one}) => ({
	pubField: one(pubFields, {
		fields: [pubFieldToPubType.a],
		references: [pubFields.id]
	}),
	pubType: one(pubTypes, {
		fields: [pubFieldToPubType.b],
		references: [pubTypes.id]
	}),
}));

export const authTokensRelations = relations(authTokens, ({one}) => ({
	user: one(users, {
		fields: [authTokens.userId],
		references: [users.id]
	}),
}));

export const memberGroupToUserRelations = relations(memberGroupToUser, ({one}) => ({
	memberGroup: one(memberGroups, {
		fields: [memberGroupToUser.a],
		references: [memberGroups.id]
	}),
	user: one(users, {
		fields: [memberGroupToUser.b],
		references: [users.id]
	}),
}));

export const actionInstancesRelations = relations(actionInstances, ({one, many}) => ({
	stage: one(stages, {
		fields: [actionInstances.stageId],
		references: [stages.id]
	}),
	rules_actionInstanceId: many(rules, {
		relationName: "rules_actionInstanceId_actionInstances_id"
	}),
	rules_sourceActionInstanceId: many(rules, {
		relationName: "rules_sourceActionInstanceId_actionInstances_id"
	}),
	actionRuns: many(actionRuns),
}));

export const rulesRelations = relations(rules, ({one}) => ({
	actionInstance_actionInstanceId: one(actionInstances, {
		fields: [rules.actionInstanceId],
		references: [actionInstances.id],
		relationName: "rules_actionInstanceId_actionInstances_id"
	}),
	actionInstance_sourceActionInstanceId: one(actionInstances, {
		fields: [rules.sourceActionInstanceId],
		references: [actionInstances.id],
		relationName: "rules_sourceActionInstanceId_actionInstances_id"
	}),
}));

export const formsRelations = relations(forms, ({one, many}) => ({
	pubType: one(pubTypes, {
		fields: [forms.pubTypeId],
		references: [pubTypes.id]
	}),
	community: one(communities, {
		fields: [forms.communityId],
		references: [communities.id]
	}),
	formElements: many(formElements),
	formMemberships: many(formMemberships),
	invites: many(invites),
}));

export const actionRunsRelations = relations(actionRuns, ({one, many}) => ({
	actionInstance: one(actionInstances, {
		fields: [actionRuns.actionInstanceId],
		references: [actionInstances.id]
	}),
	pub: one(pubs, {
		fields: [actionRuns.pubId],
		references: [pubs.id]
	}),
	user: one(users, {
		fields: [actionRuns.userId],
		references: [users.id]
	}),
	actionRun: one(actionRuns, {
		fields: [actionRuns.sourceActionRunId],
		references: [actionRuns.id],
		relationName: "actionRuns_sourceActionRunId_actionRuns_id"
	}),
	actionRuns: many(actionRuns, {
		relationName: "actionRuns_sourceActionRunId_actionRuns_id"
	}),
	pubValuesHistories: many(pubValuesHistory),
	invites: many(invites),
}));

export const apiAccessLogsRelations = relations(apiAccessLogs, ({one}) => ({
	apiAccessToken: one(apiAccessTokens, {
		fields: [apiAccessLogs.accessTokenId],
		references: [apiAccessTokens.id]
	}),
}));

export const apiAccessTokensRelations = relations(apiAccessTokens, ({one, many}) => ({
	apiAccessLogs: many(apiAccessLogs),
	community: one(communities, {
		fields: [apiAccessTokens.communityId],
		references: [communities.id]
	}),
	user: one(users, {
		fields: [apiAccessTokens.issuedById],
		references: [users.id]
	}),
	apiAccessPermissions: many(apiAccessPermissions),
	pubValuesHistories: many(pubValuesHistory),
}));

export const sessionsRelations = relations(sessions, ({one}) => ({
	user: one(users, {
		fields: [sessions.userId],
		references: [users.id]
	}),
}));

export const apiAccessPermissionsRelations = relations(apiAccessPermissions, ({one}) => ({
	apiAccessToken: one(apiAccessTokens, {
		fields: [apiAccessPermissions.apiAccessTokenId],
		references: [apiAccessTokens.id]
	}),
}));

export const formElementsRelations = relations(formElements, ({one}) => ({
	stage: one(stages, {
		fields: [formElements.stageId],
		references: [stages.id]
	}),
	pubField: one(pubFields, {
		fields: [formElements.fieldId],
		references: [pubFields.id]
	}),
	form: one(forms, {
		fields: [formElements.formId],
		references: [forms.id]
	}),
}));

export const communityMembershipsRelations = relations(communityMemberships, ({one}) => ({
	community: one(communities, {
		fields: [communityMemberships.communityId],
		references: [communities.id]
	}),
	user: one(users, {
		fields: [communityMemberships.userId],
		references: [users.id]
	}),
	memberGroup: one(memberGroups, {
		fields: [communityMemberships.memberGroupId],
		references: [memberGroups.id]
	}),
}));

export const pubMembershipsRelations = relations(pubMemberships, ({one}) => ({
	pub: one(pubs, {
		fields: [pubMemberships.pubId],
		references: [pubs.id]
	}),
	user: one(users, {
		fields: [pubMemberships.userId],
		references: [users.id]
	}),
	memberGroup: one(memberGroups, {
		fields: [pubMemberships.memberGroupId],
		references: [memberGroups.id]
	}),
}));

export const stageMembershipsRelations = relations(stageMemberships, ({one}) => ({
	stage: one(stages, {
		fields: [stageMemberships.stageId],
		references: [stages.id]
	}),
	user: one(users, {
		fields: [stageMemberships.userId],
		references: [users.id]
	}),
	memberGroup: one(memberGroups, {
		fields: [stageMemberships.memberGroupId],
		references: [memberGroups.id]
	}),
}));

export const pubValuesHistoryRelations = relations(pubValuesHistory, ({one}) => ({
	user: one(users, {
		fields: [pubValuesHistory.userId],
		references: [users.id]
	}),
	apiAccessToken: one(apiAccessTokens, {
		fields: [pubValuesHistory.apiAccessTokenId],
		references: [apiAccessTokens.id]
	}),
	actionRun: one(actionRuns, {
		fields: [pubValuesHistory.actionRunId],
		references: [actionRuns.id]
	}),
}));

export const formMembershipsRelations = relations(formMemberships, ({one}) => ({
	form: one(forms, {
		fields: [formMemberships.formId],
		references: [forms.id]
	}),
	user: one(users, {
		fields: [formMemberships.userId],
		references: [users.id]
	}),
	memberGroup: one(memberGroups, {
		fields: [formMemberships.memberGroupId],
		references: [memberGroups.id]
	}),
	pub: one(pubs, {
		fields: [formMemberships.pubId],
		references: [pubs.id]
	}),
}));

export const invitesRelations = relations(invites, ({one}) => ({
	community: one(communities, {
		fields: [invites.communityId],
		references: [communities.id]
	}),
	user_userId: one(users, {
		fields: [invites.userId],
		references: [users.id],
		relationName: "invites_userId_users_id"
	}),
	pub: one(pubs, {
		fields: [invites.pubId],
		references: [pubs.id]
	}),
	form: one(forms, {
		fields: [invites.formId],
		references: [forms.id]
	}),
	stage: one(stages, {
		fields: [invites.stageId],
		references: [stages.id]
	}),
	user_invitedByUserId: one(users, {
		fields: [invites.invitedByUserId],
		references: [users.id],
		relationName: "invites_invitedByUserId_users_id"
	}),
	actionRun: one(actionRuns, {
		fields: [invites.invitedByActionRunId],
		references: [actionRuns.id]
	}),
}));

export const moveConstraintRelations = relations(moveConstraint, ({one}) => ({
	stage_stageId: one(stages, {
		fields: [moveConstraint.stageId],
		references: [stages.id],
		relationName: "moveConstraint_stageId_stages_id"
	}),
	stage_destinationId: one(stages, {
		fields: [moveConstraint.destinationId],
		references: [stages.id],
		relationName: "moveConstraint_destinationId_stages_id"
	}),
}));

export const pubsInStagesRelations = relations(pubsInStages, ({one}) => ({
	pub: one(pubs, {
		fields: [pubsInStages.pubId],
		references: [pubs.id]
	}),
	stage: one(stages, {
		fields: [pubsInStages.stageId],
		references: [stages.id]
	}),
}));