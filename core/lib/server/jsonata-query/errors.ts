export class JsonataQueryError extends Error {
	constructor(
		message: string,
		public readonly expression?: string
	) {
		super(message)
		this.name = "JsonataQueryError"
	}
}

export class UnsupportedExpressionError extends JsonataQueryError {
	constructor(
		message: string,
		public readonly nodeType?: string,
		expression?: string
	) {
		super(message, expression)
		this.name = "UnsupportedExpressionError"
	}
}

export class InvalidPathError extends JsonataQueryError {
	constructor(
		message: string,
		public readonly path?: string,
		expression?: string
	) {
		super(message, expression)
		this.name = "InvalidPathError"
	}
}
