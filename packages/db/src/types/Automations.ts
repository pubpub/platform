export type AutomationConfig = {
	automationConfig: Record<string, unknown> | null;
	/**
	 * The config for the action instance that will be trigger by the automation
	 */
	actionConfig: Record<string, unknown> | null;
};
