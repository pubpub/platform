export type Manifest = {
	read?: { [key: string]: { id: string } } | string;
	write?: { [key: string]: { id: string } } | string;
	register?: { [key: string]: { id: string } };
};

// TODO: derive this type from core API contract
export type User = {
	id: string;
	slug: string;
	email: string;
	name: string;
	avatar?: string | null;
	createdAt: Date;
	updatedAt: Date;
};
