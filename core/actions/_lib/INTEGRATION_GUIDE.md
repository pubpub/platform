# ActionConfigBuilder Integration Guide

This guide shows how to integrate the new **immutable** `ActionConfigBuilder` into existing code.

## Overview

The `ActionConfigBuilder` provides an immutable, functional API for:

1. **Validating** action configs (with or without defaults)
2. **Interpolating** template strings using JSONata expressions
3. **Validating** the final interpolated config
4. **Clear error codes** for different failure modes

## Key Principles

### Immutability

Every method returns a **new instance** - the original is never modified:

```typescript
const builder1 = new ActionConfigBuilder(Action.http);
const builder2 = builder1.withConfig({ url: "https://example.com" });

// builder1 is unchanged
// builder2 is a new instance with the config
```

### Chainability

Methods naturally compose into readable pipelines:

```typescript
const result = await new ActionConfigBuilder(Action.http)
	.withDefaults(defaults)
	.withConfig(config)
	.validate()
	.interpolate(data)
	.then((b) => b.validate())
	.then((b) => b.getResult());
```

### State-Aware Validation

`validate()` works at any stage:

- Before interpolation: validates raw config (allows templates)
- After interpolation: validates interpolated values against schema

## Integration with runActionInstance.ts

### Before (current code)

```typescript
// in runActionInstance.ts around lines 116-180

const actionConfig = {
	...(actionDefaults?.config as Record<string, any>),
	...(args.actionInstance.config as Record<string, any>),
};

const parsedConfig = action.config.schema.safeParse(args.config ?? actionConfig);

if (!parsedConfig.success) {
	const err = {
		error: "Invalid config",
		cause: parsedConfig.error,
		stack,
	};
	// ... error handling
}

// later...
config = resolveWithPubfields(
	{ ...(args.actionInstance.config as {}), ...parsedConfig.data },
	inputPubInput.values,
	configFieldOverrides
);
```

### After (with ActionConfigBuilder)

```typescript
import { ActionConfigBuilder, ActionConfigErrorCode } from "./actions/_lib/ActionConfigBuilder";

// in runActionInstance.ts

const builder = await new ActionConfigBuilder(args.actionInstance.action)
	.withDefaults((actionDefaults?.config as Record<string, any>) ?? {})
	.withConfig(args.actionInstance.config as Record<string, any>)
	.withOverrides(args.config ?? {})
	.validate()
	.interpolate(inputPubInput ? pubValuesToObject(inputPubInput.values) : {})
	.then((b) => b.validate());

const result = builder.getResult();

if (!result.success) {
	return {
		title: "Invalid action configuration",
		error: result.error.message,
		code: result.error.code,
		cause: result.error.zodError ?? result.error.cause,
		stack,
	};
}

const config = result.config;
// config is now validated and ready to use

// helper function
function pubValuesToObject(values: ProcessedPub["values"]) {
	return values.reduce(
		(acc, v) => {
			acc[v.fieldSlug] = v.value;
			return acc;
		},
		{} as Record<string, any>
	);
}
```

## Frontend Usage

### Form Validation Example

```typescript
import { ActionConfigBuilder, ActionConfigErrorCode } from "@/actions/_lib/ActionConfigBuilder";

function ActionConfigForm({ action, defaultConfig, onValidConfig }) {
	const [config, setConfig] = useState({});
	const [errors, setErrors] = useState(null);

	const handleValidate = () => {
		const builder = new ActionConfigBuilder(action)
			.withDefaults(defaultConfig)
			.withConfig(config)
			.validate();

		const result = builder.getResult();

		if (!result.success) {
			setErrors(result.error.zodError?.issues);
			return;
		}

		setErrors(null);
		onValidConfig(result.config);
	};

	return (
		<form>
			{/* form fields */}
			<button onClick={handleValidate}>Validate</button>
			{errors && <ErrorDisplay errors={errors} />}
		</form>
	);
}
```

### Real-Time Validation

```typescript
function ActionConfigEditor({ action, defaultConfig, value, onChange }) {
	const [error, setError] = useState(null);

	useEffect(() => {
		const builder = new ActionConfigBuilder(action)
			.withDefaults(defaultConfig)
			.withConfig(value)
			.validate();

		setError(builder.isError() ? builder.getResult().error : null);
	}, [value, defaultConfig, action]);

	return (
		<div>
			<JsonEditor value={value} onChange={onChange} />
			{error && <ErrorMessage error={error} />}
		</div>
	);
}
```

### Testing Action Config

```typescript
function TestActionPanel({ action, config, defaultConfig }) {
	const [testData, setTestData] = useState({});
	const [result, setResult] = useState(null);

	const handleTest = async () => {
		const builder = await new ActionConfigBuilder(action)
			.withDefaults(defaultConfig)
			.withConfig(config)
			.validate()
			.interpolate(testData)
			.then((b) => b.validate());

		const res = builder.getResult();

		if (!res.success) {
			setResult({ error: res.error });
			return;
		}

		setResult({ success: true, config: res.config });
	};

	return (
		<div>
			<JsonEditor value={testData} onChange={setTestData} />
			<button onClick={handleTest}>Test with Sample Data</button>
			{result && <ResultDisplay result={result} />}
		</div>
	);
}
```

## Error Handling

The builder provides clear error codes for different failure modes:

```typescript
enum ActionConfigErrorCode {
	ACTION_NOT_FOUND = "ACTION_NOT_FOUND",
	INVALID_RAW_CONFIG = "INVALID_RAW_CONFIG",
	INVALID_CONFIG_WITH_DEFAULTS = "INVALID_CONFIG_WITH_DEFAULTS",
	INTERPOLATION_FAILED = "INTERPOLATION_FAILED",
	INVALID_INTERPOLATED_CONFIG = "INVALID_INTERPOLATED_CONFIG",
}
```

### Example Error Handling

```typescript
const builder = await new ActionConfigBuilder(action)
	.withConfig(config)
	.validate()
	.interpolate(data)
	.then((b) => b.validate());

const result = builder.getResult();

if (!result.success) {
	switch (result.error.code) {
		case ActionConfigErrorCode.INVALID_RAW_CONFIG:
			// config structure is wrong (missing fields, wrong types, etc)
			// even before interpolation
			logError("Invalid config structure", result.error.zodError);
			break;

		case ActionConfigErrorCode.INTERPOLATION_FAILED:
			// the interpolation itself failed
			// (missing data, bad jsonata expression, etc)
			logError("Interpolation failed", result.error.cause);
			break;

		case ActionConfigErrorCode.INVALID_INTERPOLATED_CONFIG:
			// interpolation worked, but the result doesn't match the schema
			// e.g. a number field interpolated to a string
			logError("Type mismatch after interpolation", result.error.zodError);
			break;
	}
}
```

## Migration Strategy

### Phase 1: Add alongside existing code

1. Add the builder to new action instances
2. Keep existing code working
3. Test in development

### Phase 2: Refactor existing usage

1. Update `runActionInstance.ts` to use the builder
2. Update frontend forms to use the builder
3. Remove old validation code (`parseActionSchema`, `resolveWithPubfields`)

### Phase 3: Cleanup

1. Remove deprecated functions
2. Update documentation
3. Update tests

## Advanced Usage

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

### Step-by-Step Processing

```typescript
// step 1: validate raw config
const builder1 = new ActionConfigBuilder(Action.http).withConfig(config).validate();

if (builder1.isError()) {
	return handleError(builder1.getResult().error);
}

// step 2: apply custom business logic
const customValidation = myCustomValidator(builder1.unwrap());
if (!customValidation.valid) {
	return handleCustomError(customValidation);
}

// step 3: proceed with interpolation
const builder2 = await builder1.interpolate(data);

if (builder2.isError()) {
	return handleError(builder2.getResult().error);
}

// step 4: final validation
const builder3 = builder2.validate();

return builder3.getResult();
```

## Type Safety

The builder preserves type information from Zod schemas:

```typescript
const builder = new ActionConfigBuilder(Action.http);
const schema = builder.getSchema(); // returns the Zod schema
const schemaWithTemplates = builder.getSchemaWithJsonFields(); // allows template strings
```

## Result Access Methods

The builder provides multiple ways to access results:

```typescript
const builder = new ActionConfigBuilder(Action.http)
	.withConfig({ url: "https://example.com" })
	.validate();

// get full result (success or error)
const result = builder.getResult();

// get config or throw error
const config = builder.unwrap();

// get config or return default
const configOrNull = builder.unwrapOr(null);
const configOrFallback = builder.unwrapOr({ fallback: true });

// boolean checks
if (builder.isSuccess()) {
	console.log("Valid config:", builder.unwrap());
}

if (builder.isError()) {
	console.error("Invalid config:", builder.getResult().error);
}

// get current state
const state = builder.getState(); // "initial" | "validated" | "interpolated"
```

## Testing

The builder is fully tested with 32 unit tests covering:

- Basic usage and error handling
- Immutability (each method returns new instance)
- Config merging (defaults, config, overrides)
- Raw validation (with template strings)
- Validation with defaults
- Interpolation (simple, complex, objects)
- Validation after interpolation
- Full pipeline chaining
- Error propagation
- Result access methods

Run tests:

```bash
pnpm --filter core test ActionConfigBuilder.test.ts
```

## Benefits

✅ **Immutable** - each method returns new instance, easier to reason about  
✅ **Chainable** - natural functional composition  
✅ **Flexible** - can get result at any point in the chain  
✅ **Clear errors** - specific error codes for each failure mode  
✅ **Type-safe** - full Zod integration with type inference  
✅ **Frontend & backend** - same API works everywhere  
✅ **Testable** - easy to test each step independently
