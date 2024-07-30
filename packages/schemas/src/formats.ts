/**
 * Taken from https://github.com/sinclairzx81/typebox/tree/master/example/formats
 */

import { FormatRegistry } from "@sinclair/typebox";

const Email =
	/^[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/i;

/**
 * `[ajv-formats]` Internet Email Address [RFC 5321, section 4.1.2.](http://tools.ietf.org/html/rfc5321#section-4.1.2)
 * @example `user@domain.com`
 */
export function IsEmail(value: string): boolean {
	return Email.test(value);
}

const Url =
	/^(?:https?|wss?|ftp):\/\/(?:\S+(?::\S*)?@)?(?:(?!(?:10|127)(?:\.\d{1,3}){3})(?!(?:169\.254|192\.168)(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z0-9\u{00a1}-\u{ffff}]+-)*[a-z0-9\u{00a1}-\u{ffff}]+)(?:\.(?:[a-z0-9\u{00a1}-\u{ffff}]+-)*[a-z0-9\u{00a1}-\u{ffff}]+)*(?:\.(?:[a-z\u{00a1}-\u{ffff}]{2,})))(?::\d{2,5})?(?:\/[^\s]*)?$/iu;

/**
 * `[ajv-formats:deprecated]` A uniform resource locator as defined in [RFC 1738](https://www.rfc-editor.org/rfc/rfc1738)
 * @example `http://domain.com`
 */
export function IsUrl(value: string) {
	return Url.test(value);
}

const Uuid = /^(?:urn:uuid:)?[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i;

/**
 * `[ajv-formats]` A Universally Unique Identifier as defined by [RFC 4122](https://datatracker.ietf.org/doc/html/rfc4122).
 * @example `9aa8a673-8590-4db2-9830-01755844f7c1`
 */
export function IsUuid(value: string): boolean {
	return Uuid.test(value);
}

export const registerFormats = () => {
	FormatRegistry.Set("email", IsEmail);
	FormatRegistry.Set("uri", IsUrl);
	FormatRegistry.Set("uuid", IsUuid);
};
