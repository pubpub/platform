export type RuleConfigBase = {
	ruleConfig: Record<string, unknown> | null;
	/**
	 * The config for the action instance that will be trigger by the rule
	 */
	actionConfig: Record<string, unknown> | null;
};
