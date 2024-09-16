import { config } from "dotenv";

export const setup = async () => {
	config({
		path: ["./.env.local", "./.env.development", "./.env.test", "./.env.test.local"],
	});

	await import("./prisma/seed");
};
