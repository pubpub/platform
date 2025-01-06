export const UUID_REGEX = /^(?:urn:uuid:)?[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i;

export const isUuid = (string: string) => {
	return UUID_REGEX.test(string);
};
