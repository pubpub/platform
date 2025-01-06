type PubPath = `/c/${string}/pubs/${string}`;
type PubEditPath = `/c/${string}/pubs/${string}/edit`;
type PubCreatePath = `/c/${string}/pubs/create`;

export const pubPath = (communitySlug: string, pubSlug: string): PubPath =>
	`/c/${communitySlug}/pubs/${pubSlug}` as const;
export const pubEditPath = (communitySlug: string, pubSlug: string): PubEditPath =>
	`/c/${communitySlug}/pubs/${pubSlug}/edit` as const;
export const pubCreatePath = (communitySlug: string): PubCreatePath =>
	`/c/${communitySlug}/pubs/create` as const;
