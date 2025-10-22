# ActionConfigBuilder

An immutable, functional builder for validating, interpolating, and managing action configurations in PubPub v7.

## Problem

Previously, action configuration handling was scattered across multiple places:

1. Config validation happened inline in `runActionInstance.ts`
2. Defaults handling was mixed with validation
3. Interpolation used `resolveWithPubfields` (limited to pub fields only)
4. No clear error codes for different failure modes
5. Difficult to use on the frontend for real-time validation
6. Hard to tell if interpolation failed vs. final validation failed

## Solution

The `ActionConfigBuilder` provides a clean, immutable API that:

✅ **Immutable by design** - each method returns a new instance  
✅ **Fully chainable** - natural functional composition  
✅ **Works everywhere** - same code on frontend and backend  
✅ **Clear errors** - specific error codes for each failure mode  
✅ **Type-safe** - leverages Zod schemas with full type inference  
✅ **Flexible** - can get result at any point in the chain  
✅ **Correct** - properly handles JSON interpolation for all field types

## Quick Start

```typescript
import { ActionConfigBuilder } from "./actions/_lib/ActionConfigBuilder";

// simple usage with full chain
const result = await new ActionConfigBuilder(Action.http)
	.withDefaults({ method: "GET" })
	.withConfig({ url: "{{ $.url }}" })
	.validate()
	.interpolate({ url: "https://example.com" })
	.then((b) => b.validate())
	.then((b) => b.getResult());

if (!result.success) {
	console.error(result.error.code, result.error.message);
	return;
}

// use the validated, interpolated config
const config = result.config;
```

## Key Concepts

### Immutability

Every method returns a **new instance** - the original is never modified:

```typescript
const builder1 = new ActionConfigBuilder(Action.http);
const builder2 = builder1.withConfig({ url: "https://example.com" });

// builder1 is unchanged, builder2 has the config
console.log(builder1.getMergedConfig()); // {}
console.log(builder2.getMergedConfig()); // { url: "https://example.com" }
```

### Chainability

Methods naturally compose:

```typescript
const builder = new ActionConfigBuilder(Action.http)
	.withDefaults(defaults)
	.withConfig(config)
	.withOverrides(overrides)
	.validate();
```

### State-Aware Validation

The `validate()` method is smart - it validates based on the current state:

- **initial** → validates raw config (allows templates)
- **validated** → returns existing result (idempotent)
- **interpolated** → validates against original schema (catches type mismatches)

```typescript
// validates raw config with templates
const builder1 = new ActionConfigBuilder(Action.http)
	.withConfig({ url: "{{ $.url }}", method: "GET" })
	.validate();

// interpolate
const builder2 = await builder1.interpolate({ url: "https://example.com" });

// validate again - now checks if interpolated values match schema
const builder3 = builder2.validate();
```

## Features

### 1. Immutable, Functional API

```typescript
// each method returns a new instance
const result = await new ActionConfigBuilder(Action.http)
	.withConfig({ url: "{{ $.url }}" })
	.validate()
	.interpolate({ url: "https://example.com" })
	.then((b) => b.validate());
```

### 2. Result Access at Any Point

```typescript
const builder = new ActionConfigBuilder(Action.http)
	.withConfig({ url: "https://example.com" })
	.validate();

// multiple ways to get the result
const result = builder.getResult(); // { success: true, config: {...} }
const config = builder.unwrap(); // throws if error
const configOrNull = builder.unwrapOr(null); // returns null if error
const isOk = builder.isSuccess(); // boolean check
```

### 3. Clear Error Codes

```typescript
enum ActionConfigErrorCode {
	ACTION_NOT_FOUND,
	INVALID_RAW_CONFIG,
	INVALID_CONFIG_WITH_DEFAULTS,
	INTERPOLATION_FAILED,
	INVALID_INTERPOLATED_CONFIG,
}
```

Each error includes:

- `code` - the error code for programmatic handling
- `message` - human-readable description
- `zodError` - detailed validation errors (when applicable)
- `cause` - the underlying error (for interpolation failures)

### 4. Error Propagation

Once an error occurs, it propagates through the chain:

```typescript
const builder = await new ActionConfigBuilder(Action.http)
	.withConfig({ url: "not-a-url" })
	.validate() // fails here
	.interpolate({ url: "https://example.com" }) // skipped
	.then((b) => b.validate()); // still has original error

builder.isError(); // true
```

## Usage Examples

### Backend: runActionInstance

```typescript
const builder = await new ActionConfigBuilder(actionInstance.action)
	.withDefaults(communityDefaults?.config ?? {})
	.withConfig(actionInstance.config)
	.validate()
	.interpolate(pubValues)
	.then((b) => b.validate());

const result = builder.getResult();

if (!result.success) {
	return {
		error: result.error.message,
		code: result.error.code,
		stack,
	};
}

// use result.config for action execution
```

### Frontend: Real-time Validation

```typescript
function ActionForm({ action, defaultConfig }) {
	const [config, setConfig] = useState({});
	const [error, setError] = useState(null);

	const handleChange = (newConfig) => {
		setConfig(newConfig);

		const builder = new ActionConfigBuilder(action)
			.withDefaults(defaultConfig)
			.withConfig(newConfig)
			.validate();

		setError(builder.isError() ? builder.getResult().error : null);
	};

	return (
		<div>
			<ConfigEditor value={config} onChange={handleChange} />
			{error && <ErrorMessage error={error} />}
		</div>
	);
}
```

### Frontend: Testing with Sample Data

```typescript
async function testActionConfig(action, config, sampleData) {
	const builder = await new ActionConfigBuilder(action)
		.withConfig(config)
		.validate()
		.interpolate(sampleData)
		.then((b) => b.validate());

	const result = builder.getResult();

	if (!result.success) {
		switch (result.error.code) {
			case ActionConfigErrorCode.INTERPOLATION_FAILED:
				return { error: "Missing or invalid sample data" };
			case ActionConfigErrorCode.INVALID_INTERPOLATED_CONFIG:
				return { error: "Sample data produces invalid config" };
			default:
				return { error: "Invalid config structure" };
		}
	}

	return { success: true, config: result.config };
}
```

## Interpolation

The builder uses `@pubpub/json-interpolate` for template string interpolation:

### Simple Interpolation

```typescript
// string fields
url: "{{ $.baseUrl }}";

// number fields
timeout: "{{ $.maxTimeout }}";

// enum fields
method: "{{ $.httpMethod }}";
```

### JSONata Expressions

```typescript
// transformations
url: "{{ $uppercase($.domain) }}";

// conditionals
status: "{{ $.count > 10 ? 'high' : 'low' }}";

// array/object operations
emails: "{{ $.users[active=true].email }}";
```

### Structured Data

```typescript
// objects in string fields (like HTTP body)
body: '{ "title": "{{ $.title }}", "count": {{ $.count }} }';

// after interpolation, this becomes:
body: '{"title":"My Title","count":42}';
```

## Error Handling

### Comprehensive Error Handling

```typescript
const builder = await new ActionConfigBuilder(action)
	.withConfig(config)
	.validate()
	.interpolate(data)
	.then((b) => b.validate());

const result = builder.getResult();

if (!result.success) {
	const { error } = result;

	switch (error.code) {
		case ActionConfigErrorCode.ACTION_NOT_FOUND:
			return handleMissingAction();

		case ActionConfigErrorCode.INVALID_RAW_CONFIG:
			// config structure is invalid (even with templates)
			return handleInvalidStructure(error.zodError);

		case ActionConfigErrorCode.INVALID_CONFIG_WITH_DEFAULTS:
			// config with defaults doesn't satisfy schema
			return handleMissingRequiredFields(error.zodError);

		case ActionConfigErrorCode.INTERPOLATION_FAILED:
			// interpolation failed (missing data, bad expression)
			return handleInterpolationError(error.cause);

		case ActionConfigErrorCode.INVALID_INTERPOLATED_CONFIG:
			// interpolation worked but result doesn't match schema
			return handleTypeMismatch(error.zodError);
	}
}
```

### Frontend Error Display

```typescript
function ErrorMessage({ error }: { error: ActionConfigError }) {
	const getMessage = () => {
		switch (error.code) {
			case ActionConfigErrorCode.INVALID_RAW_CONFIG:
				return `Invalid configuration: ${formatZodError(error.zodError)}`;
			case ActionConfigErrorCode.INTERPOLATION_FAILED:
				return `Template error: ${error.cause?.message}`;
			case ActionConfigErrorCode.INVALID_INTERPOLATED_CONFIG:
				return `Value error: ${formatZodError(error.zodError)}`;
			default:
				return error.message;
		}
	};

	return <div className="error">{getMessage()}</div>;
}
```

## Type Safety

The builder preserves full type information:

```typescript
const builder = new ActionConfigBuilder(Action.http);

// get the raw Zod schema
const schema = builder.getSchema();
type HttpConfig = z.infer<typeof schema>;

// get schema that accepts template strings
const schemaWithTemplates = builder.getSchemaWithJsonFields();
type HttpConfigWithTemplates = z.infer<typeof schemaWithTemplates>;
```

## Testing

The builder includes comprehensive tests (32 tests):

```bash
pnpm --filter core test ActionConfigBuilder.test.ts
```

Test coverage includes:

- ✅ Basic builder creation and error handling
- ✅ Immutability (each method returns new instance)
- ✅ Config merging (defaults + config + overrides)
- ✅ Raw validation with template strings
- ✅ Validation with defaults applied
- ✅ Simple and complex interpolation
- ✅ JSONata expressions
- ✅ Structured data in strings
- ✅ Validation after interpolation
- ✅ Fluent API chaining
- ✅ Error propagation through chains
- ✅ Result access methods (getResult, unwrap, unwrapOr)

## API Reference

### Constructor

```typescript
new ActionConfigBuilder(actionName: Action)
```

### Configuration Methods (returns new instance)

- `withDefaults(defaults: Record<string, any>): ActionConfigBuilder` - set default config
- `withConfig(config: Record<string, any>): ActionConfigBuilder` - set main config
- `withOverrides(overrides: Record<string, any>): ActionConfigBuilder` - set override config

### Validation Methods (returns new instance)

- `validate(): ActionConfigBuilder` - validate based on current state
- `validateWithDefaults(): ActionConfigBuilder` - validate with defaults applied

### Interpolation Methods (returns promise of new instance)

- `async interpolate(data: unknown): Promise<ActionConfigBuilder>` - interpolate templates

### Result Methods

- `getResult(): ActionConfigResult` - get current result (success or error)
- `unwrap(): Record<string, any>` - get config or throw if error
- `unwrapOr(defaultValue): Record<string, any> | null` - get config or return default
- `isSuccess(): boolean` - check if current state is successful
- `isError(): boolean` - check if current state has error
- `getState(): BuilderState` - get current state ("initial" | "validated" | "interpolated")

### Schema Methods

- `getSchema(): z.ZodObject<any> | null` - get raw Zod schema
- `getSchemaWithJsonFields(): z.ZodObject<any> | null` - get schema with templates
- `getMergedConfig(): Record<string, any>` - get merged config (pre-validation)

### Types

```typescript
type ActionConfigResult<T = Record<string, any>> =
	| { success: true; config: T }
	| { success: false; error: ActionConfigError };

type ActionConfigError = {
	code: ActionConfigErrorCode;
	message: string;
	zodError?: ZodError;
	cause?: unknown;
};

enum ActionConfigErrorCode {
	ACTION_NOT_FOUND = "ACTION_NOT_FOUND",
	INVALID_RAW_CONFIG = "INVALID_RAW_CONFIG",
	INVALID_CONFIG_WITH_DEFAULTS = "INVALID_CONFIG_WITH_DEFAULTS",
	INTERPOLATION_FAILED = "INTERPOLATION_FAILED",
	INVALID_INTERPOLATED_CONFIG = "INVALID_INTERPOLATED_CONFIG",
}

type BuilderState = "initial" | "validated" | "interpolated";
```

## Patterns

### Full Pipeline

```typescript
const result = await new ActionConfigBuilder(Action.http)
	.withDefaults(defaults)
	.withConfig(config)
	.validate()
	.interpolate(data)
	.then((b) => b.validate())
	.then((b) => b.getResult());
```

### Validation Only (no interpolation)

```typescript
const builder = new ActionConfigBuilder(Action.http).withConfig(config).validate();

if (builder.isSuccess()) {
	console.log("Config is valid:", builder.unwrap());
}
```

### Conditional Logic

```typescript
let builder = new ActionConfigBuilder(Action.http).withConfig(config);

if (shouldUseDefaults) {
	builder = builder.withDefaults(defaults).validateWithDefaults();
} else {
	builder = builder.validate();
}

const result = builder.getResult();
```

### Error Recovery

```typescript
const builder = new ActionConfigBuilder(Action.http).withConfig(userConfig).validate();

if (builder.isError()) {
	// try again with fallback config
	const fallbackBuilder = new ActionConfigBuilder(Action.http)
		.withConfig(fallbackConfig)
		.validate();

	if (fallbackBuilder.isSuccess()) {
		return fallbackBuilder.unwrap();
	}
}

return builder.unwrapOr(null);
```

## Files

- `ActionConfigBuilder.ts` - main builder implementation
- `ActionConfigBuilder.test.ts` - comprehensive test suite (32 tests)
- `ActionConfigBuilder.example.ts` - usage examples
- `INTEGRATION_GUIDE.md` - integration guide for existing code
- `README_ActionConfigBuilder.md` - this file

## Next Steps

1. Review the immutable API and tests
2. Try using it in `runActionInstance.ts`
3. Update frontend forms to use the builder
4. Remove old validation code once migration is complete

## Migration Path

### Immediate Use

The builder can be used immediately alongside existing code. No breaking changes.

### Gradual Migration

1. Use builder for new action instances
2. Gradually update existing code
3. Keep both systems working during transition

### Future Cleanup

Once fully migrated:

- Remove `parseActionSchema`
- Remove `resolveWithPubfields` (or keep for backwards compat)
- Update all action-related code to use builder
