export class IntegrationApiError extends Error {
	toJSON() {
		return {
			message: this.message,
			cause: this.cause,
		};
	}
}
