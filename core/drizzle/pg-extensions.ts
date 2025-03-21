import type { PgTable, PgView } from "drizzle-orm/pg-core";

import {
	entityKind,
	getTableName,
	getViewName,
	isSQLWrapper,
	isTable,
	SQL,
	sql,
} from "drizzle-orm";
import { PgDialect } from "drizzle-orm/pg-core";
import {
	DummyDriver,
	Kysely,
	PostgresAdapter,
	PostgresIntrospector,
	PostgresQueryCompiler,
} from "kysely";

import type { Database } from "db/Database";

import type { QB } from "~/lib/server/cache/types";

const pgDialect = new PgDialect();

const stubKysely = new Kysely<Database>({
	dialect: {
		createAdapter: () => new PostgresAdapter(),
		createDriver: () => new DummyDriver(),
		createIntrospector: (db) => new PostgresIntrospector(db),
		createQueryCompiler: () => new PostgresQueryCompiler(),
	},
});

// Enums as objects for better DX

export interface ProcedureParameter {
	name: string;
	type: string;
	default?: string;
}

type ReferencingForOperation = {
	INSERT: {
		old?: never;
		new: string;
	};
	UPDATE: {
		old?: string;
		new?: string;
	};
	DELETE: {
		old: string;
		new?: never;
	};
	TRUNCATE: never;
};

// Procedure languages
export type ProcedureLanguage =
	| "sql"
	| "plpgsql"
	| "c"
	| "internal"
	| "python"
	| "perl"
	| "tcl"
	| "javascript";

// Volatility options
export type VolatilityType = "immutable" | "stable" | "volatile";

// Procedure options
export interface ProcedureOptions {
	cost?: number;
	rows?: number;
	parallel?: "unsafe" | "restricted" | "safe";
	leakproof?: boolean;
	window?: boolean;
	language?: ProcedureLanguage;
	replace?: boolean;
	volatility?: VolatilityType;
	strictness?: "strict" | "called_on_null_input";
	schema?: string;
}

// Parameter definition
export interface ProcedureParameter {
	name: string;
	type: string;
	default?: string;
}

// Base procedure builder with just the name
export class PgProcedureBuilder<TName extends string = string> {
	static readonly [entityKind]: string = "PgProcedureBuilder";

	private _name: TName;

	constructor(name: TName) {
		this._name = name;
	}

	// Define parameters
	parameter(name: string, type: string, defaultValue?: string): PgProcedureWithParameters<TName> {
		return new PgProcedureWithParameters<TName>({
			name: this._name,
			parameters: [{ name, type, default: defaultValue }],
		});
	}

	parameters(params: ProcedureParameter[]): PgProcedureWithParameters<TName> {
		return new PgProcedureWithParameters<TName>({
			name: this._name,
			parameters: params,
		});
	}

	// Skip parameters
	returns(returnType: string): PgProcedureWithReturns<TName> {
		return new PgProcedureWithReturns<TName>({
			name: this._name,
			parameters: [],
			returns: returnType,
		});
	}
}

// Builder after parameters are defined
export class PgProcedureWithParameters<TName extends string = string> {
	static readonly [entityKind]: string = "PgProcedureWithParameters";

	readonly _: {
		readonly name: TName;
		readonly parameters: ProcedureParameter[];
	};

	constructor(config: { name: TName; parameters: ProcedureParameter[] }) {
		this._ = config;
	}

	// Add another parameter
	parameter(name: string, type: string, defaultValue?: string): PgProcedureWithParameters<TName> {
		return new PgProcedureWithParameters<TName>({
			...this._,
			parameters: [...this._.parameters, { name, type, default: defaultValue }],
		});
	}

	// Define return type
	returns(returnType: string): PgProcedureWithReturns<TName> {
		return new PgProcedureWithReturns<TName>({
			...this._,
			returns: returnType,
		});
	}
}

// Builder after return type is defined
export class PgProcedureWithReturns<TName extends string = string> {
	static readonly [entityKind]: string = "PgProcedureWithReturns";

	readonly _: {
		readonly name: TName;
		readonly parameters: ProcedureParameter[];
		readonly returns: string;
	};

	constructor(config: { name: TName; parameters: ProcedureParameter[]; returns: string }) {
		this._ = config;
	}

	// Define language and other options
	language(lang: "sql"): PgProcedureWithLanguage<TName, "sql">;
	language(lang: "plpgsql"): PgProcedureWithLanguage<TName, "plpgsql">;
	language(
		lang: Exclude<ProcedureLanguage, "sql" | "plpgsql">
	): PgProcedureWithLanguage<TName, Exclude<ProcedureLanguage, "sql" | "plpgsql">>;
	language(lang: ProcedureLanguage): PgProcedureWithLanguage<TName, ProcedureLanguage> {
		return new PgProcedureWithLanguage<TName, typeof lang>({
			...this._,
			language: lang,
		});
	}
}

type BodyLang<L extends ProcedureLanguage> = L extends "sql"
	? string | ReturnType<typeof sql> | ((qb: Kysely<Database>) => QB<any>)
	: L extends "plpgsql"
		? string | ReturnType<typeof sql>
		: never;

// Builder after language is defined
export class PgProcedureWithLanguage<
	TName extends string = string,
	TLanguage extends ProcedureLanguage = ProcedureLanguage,
> {
	static readonly [entityKind]: string = "PgProcedureWithLanguage";

	readonly _: {
		readonly name: TName;
		readonly parameters: ProcedureParameter[];
		readonly returns: string;
		readonly language: TLanguage;
	};

	protected options: ProcedureOptions = {};

	constructor(config: {
		name: TName;
		parameters: ProcedureParameter[];
		returns: string;
		language: TLanguage;
	}) {
		this._ = config;
	}

	// Additional options
	with(options: Omit<ProcedureOptions, "language">): this {
		const newInstance = new (this.constructor as any)({
			...this._,
		});

		newInstance.options = {
			...this.options,
			...options,
		};

		return newInstance;
	}

	// Define the body based on language
	as(body: BodyLang<TLanguage>): PgProcedureComplete<TName, TLanguage> {
		return new PgProcedureComplete<TName, TLanguage>({
			...this._,
			options: this.options,
			body,
		});
	}
}

// Final builder with all properties defined
export class PgProcedureComplete<
	TName extends string = string,
	TLanguage extends ProcedureLanguage = ProcedureLanguage,
> {
	static readonly [entityKind]: string = "PgProcedureComplete";

	readonly _: {
		readonly name: TName;
		readonly parameters: ProcedureParameter[];
		readonly returns: string;
		readonly language: TLanguage;
		readonly options: ProcedureOptions;
		readonly body: BodyLang<TLanguage>;
	};

	constructor(config: {
		name: TName;
		parameters: ProcedureParameter[];
		returns: string;
		language: TLanguage;
		options: ProcedureOptions;
		body: BodyLang<TLanguage>;
	}) {
		this._ = config;
	}

	// Get the compiled body
	getBody(driver?: any): string {
		const body = this._.body;

		if (typeof body === "function") {
			// Handle query builder function for SQL language
			if (this._.language === "sql") {
				const result = body(stubKysely);
				return result.compile().sql;
			}
			throw new Error(`Function bodies are only supported for SQL language`);
		} else if (typeof body === "string") {
			return body;
		} else if (body instanceof SQL) {
			// Handle SQL tag template
			return pgDialect.sqlToQuery(body).sql;
		}

		console.log("body", body);
		throw new Error(`Invalid procedure body type for ${this}`);
	}

	// Generate the CREATE FUNCTION statement
	getCreateStatement(driver?: any): string {
		const bodyText = this.getBody(driver);

		const paramsString =
			this._.parameters.length > 0
				? this._.parameters
						.map(
							(p) => `${p.name} ${p.type}${p.default ? ` DEFAULT ${p.default}` : ""}`
						)
						.join(", ")
				: "";

		const options = this._.options;

		// Build additional options if specified
		const volatility = options.volatility ? ` ${options.volatility.toUpperCase()}` : "";
		const strictness = options.strictness
			? ` ${options.strictness.toUpperCase().replace("_", " ")}`
			: "";
		const leakproof = options.leakproof ? " LEAKPROOF" : "";
		const parallel = options.parallel ? ` PARALLEL ${options.parallel.toUpperCase()}` : "";
		const cost = options.cost !== undefined ? ` COST ${options.cost}` : "";
		const rows = options.rows !== undefined ? ` ROWS ${options.rows}` : "";
		const window = options.window ? " WINDOW" : "";

		return `
${options.replace !== false ? "CREATE OR REPLACE" : "CREATE"} FUNCTION 
${options.schema ? `"${options.schema}".` : ""}"${this._.name}"(${paramsString}) 
RETURNS ${this._.returns} 
LANGUAGE ${this._.language}${volatility}${strictness}${leakproof}${parallel}${cost}${rows}${window}
AS $BODY$
${bodyText}
$BODY$;
`.trim();
	}

	// Generate DROP statement
	getDropStatement(): string {
		return `DROP FUNCTION IF EXISTS ${this._.options.schema ? `"${this._.options.schema}".` : ""}"${this._.name}";`;
	}

	// For JSON serialization to snapshot
	toJSON() {
		return {
			name: this._.name,
			schema: this._.options.schema || "public",
			parameters: this._.parameters,
			returns: this._.returns,
			language: this._.language,
			options: this._.options,
			// For snapshot we don't include the actual body, just a hash
			hash: hashString(this.getBody() || ""),
		};
	}
}

// Simple hash function for body content
function hashString(str: string): string {
	let hash = 0;
	for (let i = 0; i < str.length; i++) {
		const char = str.charCodeAt(i);
		hash = (hash << 5) - hash + char;
		hash = hash & hash;
	}
	return hash.toString(16);
}

// Factory function
export function pgProcedure<TName extends string>(name: TName): PgProcedureBuilder<TName> {
	return new PgProcedureBuilder<TName>(name);
}
// Types

export const timing = {
	before: "BEFORE",
	after: "AFTER",
	insteadOf: "INSTEAD OF",
} as const;

export type TimingPoint = (typeof timing)[keyof typeof timing];

export const operation = {
	insert: "INSERT",
	update: "UPDATE",
	delete: "DELETE",
	truncate: "TRUNCATE",
} as const;

export type Operation = (typeof operation)[keyof typeof operation];
// ForEach constants
export const forEach = {
	row: "ROW",
	statement: "STATEMENT",
} as const;

export type ForEach = (typeof forEach)[keyof typeof forEach];

// Trigger builder core with immutable pattern
export class PgTriggerBuilderCore<
	TConfig extends {
		name: string;
		table?: PgTable<any> | PgView<any>;
		isView?: boolean;
		timing?: TimingPoint;
		operation?: Operation | Operation[];
		referencing?: ReferencingForOperation[keyof ReferencingForOperation];
		condition?: string | ReturnType<typeof sql>;
	},
> {
	static readonly [entityKind]: string = "PgTriggerBuilder";

	readonly _: {
		readonly name: TConfig["name"];
		readonly table: TConfig["table"];
		readonly isView: TConfig["isView"];
		readonly timing: TConfig["timing"];
		readonly operation: TConfig["operation"];
		readonly condition: TConfig["condition"];
	};

	protected config: {
		forEach?: ForEach;
		condition?: string | ReturnType<typeof sql>;
		procedure?: PgProcedureComplete<any, any> | string;
		procedureSchema?: string;
		args?: string[];
		referencing?: ReferencingForOperation[keyof ReferencingForOperation];
	} = {};

	constructor(config: TConfig) {
		this._ = {
			name: config.name,
			table: config.table,
			isView: config.isView,
			timing: config.timing,
			operation: config.operation,
		} as any;
	}

	/**
	 * forEach is required for tables but not for views
	 *
	 * @default "STATEMENT"
	 */
	forEach(scope: ForEach): this {
		if (this._.isView && scope === "ROW") {
			throw new Error("FOR EACH ROW is not supported for views");
		}

		const newInstance = new (this.constructor as any)({
			...this._,
		});

		newInstance.config = {
			...this.config,
			forEach: scope,
		};

		return newInstance;
	}

	/**
	 * optional condition for the trigger
	 */
	when(cond: string | ReturnType<typeof sql>): this {
		const newInstance = new (this.constructor as any)({
			...this._,
		});

		newInstance.config = {
			...this.config,
			condition: cond,
		};

		return newInstance;
	}

	/**
	 * procedure for the trigger
	 */
	execute(procedure: PgProcedureComplete<any, any> | string): this {
		const newInstance = new (this.constructor as any)({
			...this._,
		});

		newInstance.config = {
			...this.config,
			procedure,
		};

		return newInstance;
	}

	procedureSchema(schema: string): this {
		const newInstance = new (this.constructor as any)({
			...this._,
		});

		newInstance.config = {
			...this.config,
			procedureSchema: schema,
		};

		return newInstance;
	}

	/**
	 * optional arguments for the trigger
	 */
	args(...args: string[]): this {
		const newInstance = new (this.constructor as any)({
			...this._,
		});

		newInstance.config = {
			...this.config,
			args,
		};

		return newInstance;
	}

	// Get the table/view name
	getObjectName(): string {
		if (!this._.table) {
			throw new Error(`Trigger ${this._.name} has no table/view defined`);
		}
		if (isTable(this._.table)) {
			return getTableName(this._.table);
		}
		return getViewName(this._.table);
	}

	// Get the table/view schema
	getObjectSchema(): string {
		if (!this._.table) {
			throw new Error(`Trigger ${this._.name} has no table/view defined`);
		}

		return this._.table._?.schema?.name || "public";
	}

	// Format operation for SQL
	getOperation(): string {
		if (!this._.operation) {
			throw new Error(`Trigger ${this._.name} has no operation defined`);
		}

		if (Array.isArray(this._.operation)) {
			return this._.operation.join(" OR ");
		}
		return this._.operation;
	}

	// Generate CREATE TRIGGER statement
	getCreateStatement(driver?: any): string {
		if (!this._.table || !this._.timing || !this._.operation || !this.config.procedure) {
			throw new Error(`Trigger ${this._.name} is missing required properties`);
		}

		// ForEach is required for tables but not for views
		if (!this._.isView && !this.config.forEach) {
			throw new Error(`Trigger ${this._.name} is missing FOR EACH clause`);
		}

		const conditionText = this.config.condition
			? `\nWHEN (${
					typeof this.config.condition === "string"
						? this.config.condition
						: pgDialect.sqlToQuery(this.config.condition).sql
				})`
			: "";

		const forEachText = this._.isView ? "" : `FOR EACH ${this.config.forEach}`;

		const argsText =
			this.config.args && this.config.args.length > 0
				? `(${this.config.args.join(", ")})`
				: "";

		const procedureName =
			typeof this.config.procedure === "string"
				? this.config.procedure
				: this.config.procedure._.name;

		const referencingText = this.config.referencing
			? `\nREFERENCING ${this.config.referencing.old ? `OLD TABLE AS ${this.config.referencing.old}` : ""} ${this.config.referencing.new ? `NEW TABLE AS ${this.config.referencing.new}` : ""}`
			: "";

		return `
CREATE OR REPLACE TRIGGER "${this._.name}"
${this._.timing} ${this.getOperation()}
ON ${this.getObjectSchema() ? `"${this.getObjectSchema()}".` : ""}"${this.getObjectName()}"${referencingText}
${forEachText}${conditionText}
EXECUTE FUNCTION ${this.config.procedureSchema ? `"${this.config.procedureSchema}".` : ""}${procedureName}(${argsText});
`.trim();
	}

	// Generate DROP TRIGGER statement
	getDropStatement(): string {
		if (!this._.table) {
			throw new Error(`Trigger ${this._.name} has no table/view defined`);
		}

		return `DROP TRIGGER IF EXISTS "${this._.name}" ON ${this.getObjectSchema() ? `"${this.getObjectSchema()}".` : ""}"${this.getObjectName()}";`;
	}

	// For JSON serialization to snapshot
	toJSON() {
		return {
			name: this._.name,
			object: this._.table ? this.getObjectName() : undefined,
			schema: this._.table ? this.getObjectSchema() : undefined,
			isView: this._.isView,
			timing: this._.timing,
			operation: this._.operation,
			forEach: this.config.forEach,
			condition:
				typeof this.config.condition === "string"
					? this.config.condition
					: "-- SQL condition to be compiled at runtime",
			procedure: this.config.procedure,
			procedureSchema: this.config.procedureSchema,
			args: this.config.args && this.config.args.length > 0 ? this.config.args : undefined,
		};
	}
}

// Initial trigger builder that knows the name
export class PgTriggerBuilder<TName extends string = string> {
	static readonly [entityKind]: string = "PgTriggerBuilder";

	private _name: TName;

	constructor(name: TName) {
		this._name = name;
	}

	// Assign table/view
	on<T extends PgTable<any> | PgView<any>>(table: T): PgTriggerTableAssigned<TName, T> {
		return new PgTriggerTableAssigned<TName, T>({
			name: this._name,
			table,
			isView: !isTable(table),
		});
	}
}

// Builder after table is assigned
export class PgTriggerTableAssigned<
	TName extends string = string,
	TTable extends PgTable<any> | PgView<any> = PgTable<any> | PgView<any>,
> extends PgTriggerBuilderCore<{
	name: TName;
	table: TTable;
	isView: boolean;
}> {
	// Table triggers
	before<O extends Operation | Operation[]>(
		op: O
	): PgTriggerWithTimingAndOperation<TName, TTable, "BEFORE", O> {
		if (this._.isView) {
			throw new Error("BEFORE timing is not supported for views");
		}

		return new PgTriggerWithTimingAndOperation<TName, TTable, "BEFORE", O>({
			...this._,
			timing: "BEFORE",
			operation: op,
		});
	}

	after<O extends Operation | Operation[]>(
		op: O
	): PgTriggerWithTimingAndOperation<TName, TTable, "AFTER", O> {
		if (this._.isView) {
			throw new Error("AFTER timing is not supported for views");
		}

		return new PgTriggerWithTimingAndOperation<TName, TTable, "AFTER", O>({
			...this._,
			timing: "AFTER",
			operation: op,
		});
	}

	// View triggers
	insteadOf<O extends Operation | Operation[]>(
		op: O
	): PgTriggerWithTimingAndOperation<TName, TTable, "INSTEAD OF", O> {
		if (!this._.isView) {
			throw new Error("INSTEAD OF timing is only supported for views");
		}

		return new PgTriggerWithTimingAndOperation<TName, TTable, "INSTEAD OF", O>({
			...this._,
			timing: "INSTEAD OF",
			operation: op,
		});
	}
}

// Builder after timing and operation are assigned
export class PgTriggerWithTimingAndOperation<
	TName extends string = string,
	TTable extends PgTable<any> | PgView<any> = PgTable<any> | PgView<any>,
	TTiming extends TimingPoint = TimingPoint,
	TOperation extends Operation | Operation[] = Operation | Operation[],
> extends PgTriggerBuilderCore<{
	name: TName;
	table: TTable;
	isView: boolean;
	timing: TTiming;
	operation: TOperation;
}> {
	referencing(
		referencing: TOperation extends Operation ? ReferencingForOperation[TOperation] : never
	): this {
		const newInstance = new (this.constructor as any)({
			...this._,
		});

		newInstance.config = {
			...this.config,
			referencing,
		};

		return newInstance;
	}
}

export function pgTrigger<TName extends string>(name: TName): PgTriggerBuilder<TName> {
	return new PgTriggerBuilder<TName>(name);
}
