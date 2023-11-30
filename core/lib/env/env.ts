export const getEnvVar = (varName) => {
	const value = process.env[varName];
	if (!value) {
		throw new Error(`Environment variable ${varName} not found`);
	}
	return value;
};
