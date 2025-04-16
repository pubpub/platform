import type { CommunitiesId } from "db/public";

import type {
	ApiTokenInitializer,
	FormInitializer,
	PubFieldsInitializer,
	PubInitializer,
	PubTypeInitializer,
	seedCommunity,
	StageConnectionsInitializer,
	StagesInitializer,
	UsersInitializer,
} from "./seedCommunity";

/**
 * Convenience method in case you want to define the input of `seedCommunity` before actually calling it
 */
export const createSeed = <
	const PF extends PubFieldsInitializer,
	const PT extends PubTypeInitializer<PF>,
	const U extends UsersInitializer,
	const S extends StagesInitializer<U>,
	const SC extends StageConnectionsInitializer<S>,
	const PI extends PubInitializer<PF, PT, U, S>[],
	const F extends FormInitializer<PF, PT, U, S>,
	const AI extends ApiTokenInitializer,
>(props: {
	community: {
		id?: CommunitiesId;
		name: string;
		slug: string;
		avatar?: string;
	};
	pubFields?: PF;
	pubTypes?: PT;
	users?: U;
	stages?: S;
	stageConnections?: SC;
	pubs?: PI;
	forms?: F;
	apiTokens?: AI;
}) => props;

export type Seed = Parameters<typeof createSeed>[0];

export type CommunitySeedOutput<S extends Record<string, any>> = Awaited<
	ReturnType<
		typeof seedCommunity<
			NonNullable<S["pubFields"]>,
			NonNullable<S["pubTypes"]>,
			NonNullable<S["users"]>,
			NonNullable<S["stages"]>,
			NonNullable<S["stageConnections"]>,
			NonNullable<S["pubs"]>,
			NonNullable<S["forms"]>,
			NonNullable<S["apiTokens"]>
		>
	>
>;
