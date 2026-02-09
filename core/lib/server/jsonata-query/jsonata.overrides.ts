// Type definitions for jsonata 2.x
// Project: https://github.com/jsonata-js/jsonata
// Definitions by: Nick <https://github.com/nick121212> and Michael M. Tiller <https://github.com/xogeny>
// Enhanced AST types for programmatic analysis

declare module "jsonata" {
	function jsonata(str: string, options?: jsonata.JsonataOptions): jsonata.Expression
	namespace jsonata {
		interface JsonataOptions {
			/** attempt to recover on parse errors and return partial AST with errors array */
			recover?: boolean
			/** custom RegExp engine constructor */
			RegexEngine?: RegExp
		}

		// ============================================================================
		// Base Node Types
		// ============================================================================

		interface BaseNode {
			/** character position in source expression where this node begins */
			position?: number
			/** the value associated with this node (type varies by node type) */
			value?: unknown
			/**
			 * when true, forces the result to be wrapped in an array even if singleton
			 * triggered by empty square brackets: `expr[]`
			 */
			keepArray?: boolean
		}

		/**
		 * used internally to track parent (%) operator resolution across path steps
		 * the parent operator allows referencing the context value from outer path steps
		 * @example `Account.Order.Product.(Price * %.Quantity)` - % refers to Order
		 */
		interface AncestorSlot {
			/** internal label for binding the ancestor value */
			label: string
			/** how many levels up to look (1 = immediate parent) */
			level: number
			/** internal index for tracking multiple parent references */
			index: number
		}

		// ============================================================================
		// Literal Nodes
		// ============================================================================

		/**
		 * string literal - can use single or double quotes
		 * @example `"hello world"` or `'hello world'`
		 * supports escape sequences: \", \\, \/, \b, \f, \n, \r, \t, \uXXXX
		 */
		interface StringNode extends BaseNode {
			type: "string"
			value: string
		}

		/**
		 * number literal - JSON-compatible number format
		 * @example `42`, `-3.14`, `1.5e10`
		 */
		interface NumberNode extends BaseNode {
			type: "number"
			value: number
		}

		/**
		 * boolean or null literal
		 * @example `true`, `false`, `null`
		 */
		interface ValueNode extends BaseNode {
			type: "value"
			value: boolean | null
		}

		/**
		 * regular expression literal
		 * @example `/pattern/` or `/pattern/i` or `/pattern/m`
		 * flags: i (case-insensitive), m (multiline)
		 * g flag is automatically added for JSONata's regex functions
		 */
		interface RegexNode extends BaseNode {
			type: "regex"
			value: RegExp
		}

		// ============================================================================
		// Identifier Nodes
		// ============================================================================

		/**
		 * field name reference - accesses a property from the context object
		 * @example `Name` - simple field
		 * @example `Account.Name` - nested field access
		 * @example `` `field-name` `` - backtick-quoted name for special characters
		 */
		interface NameNode extends BaseNode {
			type: "name"
			/** the field name to access */
			value: string
			/** internal: true when participating in tuple streaming */
			tuple?: boolean
			/** internal: ancestor reference for parent (%) operator */
			ancestor?: AncestorSlot
		}

		/**
		 * variable reference - accesses a bound variable
		 * @example `$x` - user-defined variable
		 * @example `$` - the root input document
		 * @example `$$` - the root of the current expression context
		 * special variables:
		 * - `$` refers to the root input
		 * - `$$` refers to the entire input at expression start
		 */
		interface VariableNode extends BaseNode {
			type: "variable"
			/** the variable name (without $ prefix) - empty string for $ */
			value: string
		}

		// ============================================================================
		// Wildcard Nodes
		// ============================================================================

		/**
		 * single-level wildcard - matches all fields at current level
		 * @example `Account.*` - all fields of Account
		 * @example `Account.Order.*` - all fields of each Order
		 */
		interface WildcardNode extends BaseNode {
			type: "wildcard"
			value: "*"
			/** internal: true when participating in tuple streaming */
			tuple?: boolean
			/** internal: ancestor reference for parent (%) operator */
			ancestor?: AncestorSlot
		}

		/**
		 * recursive descendant wildcard - matches all nested values at any depth
		 * @example `Account.**` - all values at any depth under Account
		 * @example `**.Price` - all Price fields anywhere in the document
		 */
		interface DescendantNode extends BaseNode {
			type: "descendant"
			value: "**"
		}

		/**
		 * parent operator - references the context value from an outer path step
		 * allows correlation between nested values and their containers
		 * @example `Account.Order.Product.(Price * %.Quantity)` - % refers to Order
		 * @example `Account.(Order.Product[$price < %.limit])` - % refers to Account
		 */
		interface ParentNode extends BaseNode {
			type: "parent"
			/** information about which ancestor level to reference */
			slot: AncestorSlot
		}

		// ============================================================================
		// Operator Types
		// ============================================================================

		/** arithmetic operators: +, -, *, /, % */
		type ArithmeticOperator = "+" | "-" | "*" | "/" | "%"

		/**
		 * comparison operators
		 * = and != perform deep equality comparison
		 * <, <=, >, >= work on numbers and strings
		 */
		type ComparisonOperator = "=" | "!=" | "<" | "<=" | ">" | ">="

		/**
		 * boolean operators - operands are cast to boolean first
		 * @example `$a and $b` - both must be truthy
		 * @example `$a or $b` - at least one must be truthy
		 */
		type BooleanOperator = "and" | "or"

		/**
		 * string concatenation operator
		 * @example `"Hello" & " " & "World"` => "Hello World"
		 * operands are cast to string
		 */
		type StringOperator = "&"

		/**
		 * range operator - creates an array of integers
		 * @example `[1..5]` => [1, 2, 3, 4, 5]
		 * @example `[5..1]` => undefined (empty - range must be ascending)
		 */
		type RangeOperator = ".."

		/**
		 * inclusion/membership operator
		 * @example `"a" in ["a", "b", "c"]` => true
		 * @example `5 in [1, 2, 3]` => false
		 */
		type InclusionOperator = "in"

		type BinaryOperatorValue =
			| ArithmeticOperator
			| ComparisonOperator
			| BooleanOperator
			| StringOperator
			| RangeOperator
			| InclusionOperator

		// ============================================================================
		// Binary Expression Nodes
		// ============================================================================

		/**
		 * binary expression - two operands with an operator
		 * @example `$a + $b` - arithmetic
		 * @example `$a = $b` - comparison
		 * @example `$a and $b` - boolean
		 * @example `$a & $b` - string concatenation
		 * @example `1..10` - range
		 * @example `$x in $list` - inclusion
		 */
		interface BinaryNode extends BaseNode {
			type: "binary"
			/** the operator */
			value: BinaryOperatorValue
			/** left-hand side operand */
			lhs: ExprNode
			/** right-hand side operand */
			rhs: ExprNode
		}

		// ============================================================================
		// Path Expression Nodes
		// ============================================================================

		/**
		 * a filter predicate stage within a path step
		 * @example `Account.Order[Price > 100]` - the `[Price > 100]` part
		 */
		interface FilterStage {
			type: "filter"
			/** the predicate expression to evaluate for each item */
			expr: ExprNode
			position?: number
		}

		/**
		 * position variable binding stage using the # operator
		 * @example `Account.Order#$i` - binds the array index to $i
		 * @example `Account.Order#$i[Price > 100]` - can be combined with predicates
		 */
		interface IndexStage {
			type: "index"
			/** the variable name to bind the index to (without $) */
			value: string
			position?: number
		}

		type Stage = FilterStage | IndexStage

		/**
		 * a sort term within an order-by expression
		 */
		interface SortTerm {
			/** true for descending order (>) false for ascending (<) */
			descending: boolean
			/** the expression to evaluate for comparison */
			expression: ExprNode
		}

		/**
		 * order-by/sort node - created from the ^ operator
		 * @example `Account.Order^(Price)` - ascending by Price
		 * @example `Account.Order^(>Price)` - descending by Price
		 * @example `Account.Order^(>Price, <Date)` - multiple sort terms
		 */
		interface SortNode extends BaseNode {
			type: "sort"
			/** array of sort terms in priority order */
			terms: SortTerm[]
			/** additional stages (predicates, index bindings) to apply after sorting */
			stages?: Stage[]
		}

		/**
		 * additional properties that can appear on any step within a path
		 * these are merged onto the step node, not a separate type
		 */
		interface PathStepExtensions {
			/** filter/predicate stages applied after the step is evaluated */
			stages?: Stage[]
			/** filter predicates (used on non-path expressions) */
			predicate?: FilterStage[]
			/** object grouping expression */
			group?: GroupExpression
			/**
			 * focus variable binding from @ operator
			 * @example `Account@$a.Order` - binds Account value to $a for use later in path
			 * @example `Account@$a.Order[Price < $average($a.Products.Price)]`
			 */
			focus?: string
			/**
			 * position/index variable binding from # operator
			 * @example `Account.Order#$i` - binds current array index to $i
			 */
			index?: string
			/**
			 * true when this step participates in tuple streaming
			 * (internal optimization for multi-value context propagation)
			 */
			tuple?: boolean
			/** reference to ancestor binding from parent (%) operator */
			ancestor?: AncestorSlot
			/** preserve singleton arrays in output */
			keepArray?: boolean
			/**
			 * true when this step is an array constructor that should not be flattened
			 * @example `Account.Order.[[Product, Price]]`
			 */
			consarray?: boolean
			/** for function chaining via dot operator - name of next function to call */
			nextFunction?: string
		}

		/**
		 * a path expression - sequence of steps separated by dot operator
		 * @example `Account.Order.Product` - simple path
		 * @example `Account.Order[Price > 100].Product` - path with predicate
		 * @example `Account@$a.Order.Product[Price < $average($a.Products.Price)]` - with focus binding
		 * @example `Account.Order^(>Price)` - path with sort
		 */
		interface PathNode extends BaseNode {
			type: "path"
			/**
			 * the steps in this path expression
			 * steps can be any expression plus PathStepExtensions properties
			 */
			steps: ((ExprNode & Partial<PathStepExtensions>) | SortNode)[]
			/** when true, result is always an array even for singletons */
			keepSingletonArray?: boolean
			/** true when path contains tuple-streaming steps (focus/index binding) */
			tuple?: boolean
			/** parent (%) references that need resolution at a higher level */
			seekingParent?: AncestorSlot[]
		}

		// ============================================================================
		// Bind Expression (Variable Assignment)
		// ============================================================================

		/**
		 * variable binding/assignment expression using :=
		 * @example `$x := 5` - binds 5 to $x
		 * @example `$result := Account.Order.Product.Price` - binds path result to $result
		 */
		interface BindNode extends BaseNode {
			type: "bind"
			value: ":="
			/** the variable to bind to (must be a variable reference) */
			lhs: VariableNode
			/** the expression whose result is bound to the variable */
			rhs: ExprNode
		}

		// ============================================================================
		// Apply Expression (Function Application ~>)
		// ============================================================================

		/**
		 * function application/chaining using ~>
		 * pipes the LHS result into the RHS function as its first argument
		 * @example `$data ~> $sum()` - passes $data as first arg to $sum
		 * @example `Account.Order.Price ~> $sum() ~> $formatNumber()` - chaining
		 * @example `$f ~> $g` - function composition (creates a new function)
		 */
		interface ApplyNode extends BaseNode {
			type: "apply"
			value: "~>"
			/** expression whose result becomes the first argument */
			lhs: ExprNode
			/** function to apply (or another function for composition) */
			rhs: ExprNode
		}

		// ============================================================================
		// Unary Expression Nodes
		// ============================================================================

		/**
		 * numeric negation
		 * @example `-5` or `-$price`
		 */
		interface NegationNode extends BaseNode {
			type: "unary"
			value: "-"
			expression: ExprNode
		}

		/**
		 * array constructor - creates a new array from expressions
		 * @example `[1, 2, 3]` - literal array
		 * @example `[Account.Order.Price, Account.Order.Quantity]` - from expressions
		 * @example `Account.Order.[[Price, Quantity]]` - nested array in path
		 */
		interface ArrayConstructorNode extends BaseNode {
			type: "unary"
			value: "["
			/** the expressions that form the array elements */
			expressions: ExprNode[]
			/** when true, array should not be flattened during path evaluation */
			consarray?: boolean
		}

		/**
		 * object constructor - creates a new object from key-value pairs
		 * @example `{"name": "John", "age": 30}` - literal object
		 * @example `{Product.Name: Product.Price}` - dynamic keys/values
		 * @example `Account.Order.{ProductID: Price}` - object from each order
		 */
		interface ObjectConstructorNode extends BaseNode {
			type: "unary"
			value: "{"
			/** array of [key, value] expression pairs */
			lhs: [ExprNode, ExprNode][]
		}

		type UnaryNode = NegationNode | ArrayConstructorNode | ObjectConstructorNode

		// ============================================================================
		// Function Nodes
		// ============================================================================

		/**
		 * function invocation
		 * @example `$sum(Account.Order.Price)` - calling built-in function
		 * @example `$myFunc(1, 2, 3)` - calling user-defined function
		 * @example `$substring("hello", 0, 3)` - with multiple arguments
		 */
		interface FunctionNode extends BaseNode {
			type: "function"
			value: "("
			/** the function to call (usually a variable or path to function) */
			procedure: ExprNode
			/** the arguments to pass to the function */
			arguments: ExprNode[]
			/** when chaining functions via dot, the next function name (for thenable detection) */
			nextFunction?: string
		}

		/**
		 * placeholder for partial function application
		 * @example `$add(?, 5)` - the ? becomes a placeholder
		 */
		interface PartialPlaceholderNode extends BaseNode {
			type: "operator"
			value: "?"
		}

		/**
		 * partial function application - creates a new function with some args pre-bound
		 * @example `$add(?, 5)` - returns a function that adds 5 to its argument
		 * @example `$substringBefore(?, "-")` - function that gets text before "-"
		 */
		interface PartialNode extends BaseNode {
			type: "partial"
			value: "("
			/** the function to partially apply */
			procedure: ExprNode
			/** arguments where ? marks positions for future arguments */
			arguments: (ExprNode | PartialPlaceholderNode)[]
		}

		/** a parameter in a lambda function definition */
		interface LambdaArgument {
			type: "variable"
			/** the parameter name (without $) */
			value: string
			position?: number
		}

		/** parsed function signature for type checking */
		interface LambdaSignature {
			validate: (args: unknown[], context: unknown) => unknown[]
		}

		/**
		 * lambda/function definition
		 * @example `function($x) { $x * 2 }` - simple lambda
		 * @example `λ($x, $y) { $x + $y }` - using lambda symbol (λ)
		 * @example `function($x)<n:n> { $x * 2 }` - with type signature
		 * @example `$map([1,2,3], function($v) { $v * 2 })` - inline lambda
		 */
		interface LambdaNode extends BaseNode {
			type: "lambda"
			/** the parameter list */
			arguments: LambdaArgument[]
			/** the function body expression */
			body: ExprNode
			/** optional type signature for argument validation (parsed from <...>) */
			signature?: LambdaSignature
			/** internal: true when optimized for tail-call */
			thunk?: boolean
		}

		// ============================================================================
		// Condition Node (Ternary Operator)
		// ============================================================================

		/**
		 * conditional/ternary expression
		 * @example `$x > 0 ? "positive" : "non-positive"` - with else
		 * @example `$x > 0 ? "positive"` - without else (returns undefined if false)
		 * @example `$value ?: "default"` - elvis operator (shorthand for $value ? $value : "default")
		 * @example `$value ?? "default"` - coalescing operator (returns "default" if $value doesn't exist)
		 */
		interface ConditionNode extends BaseNode {
			type: "condition"
			/** the condition to evaluate (cast to boolean) */
			condition: ExprNode
			/** expression to evaluate if condition is truthy */
			then: ExprNode
			/** expression to evaluate if condition is falsy (optional) */
			else?: ExprNode
		}

		// ============================================================================
		// Block Node (Sequence of Expressions)
		// ============================================================================

		/**
		 * block expression - sequence of expressions separated by semicolons
		 * executes in order, returns the result of the last expression
		 * creates a new scope for variable bindings
		 * @example `($x := 5; $y := 10; $x + $y)` - returns 15
		 * @example `Account.($name := Name; $orders := Order; {"name": $name, "total": $sum($orders.Price)})`
		 */
		interface BlockNode extends BaseNode {
			type: "block"
			/** expressions to evaluate in sequence */
			expressions: ExprNode[]
			/** internal: true if block contains an array constructor */
			consarray?: boolean
		}

		// ============================================================================
		// Transform Node (Object Transformer)
		// ============================================================================

		/**
		 * object transformer - clones input and applies updates/deletions
		 * @example `| Account | {"status": "active"} |` - adds/updates status field
		 * @example `| Account.Order | {"discount": 0.1}, ["tax"] |` - update and delete
		 * @example `$ ~> | Account | {"verified": true} |` - transform in pipeline
		 */
		interface TransformNode extends BaseNode {
			type: "transform"
			/** path pattern to match objects to transform */
			pattern: ExprNode
			/** object expression with fields to add/update */
			update: ExprNode
			/** optional: string or array of strings - field names to delete */
			delete?: ExprNode
		}

		// ============================================================================
		// Group Expression (Object Grouping)
		// ============================================================================

		/**
		 * object grouping expression - groups values by key
		 * used when object constructor follows expression without dot separator
		 * @example `Account.Order.Product{Category: Price}` - groups prices by category
		 * @example `Account.Order{OrderID: $sum(Product.Price)}` - aggregate per group
		 */
		interface GroupExpression {
			/** array of [key, value] expression pairs */
			lhs: [ExprNode, ExprNode][]
			position?: number
		}

		// ============================================================================
		// Error Node (Recovery Mode)
		// ============================================================================

		interface ErrorNode extends BaseNode {
			type: "error"
			error: JsonataError
			lhs?: ExprNode
			remaining?: unknown[]
		}

		// ============================================================================
		// Union Type of All Expression Nodes
		// ============================================================================

		type ExprNode =
			| StringNode
			| NumberNode
			| ValueNode
			| RegexNode
			| NameNode
			| VariableNode
			| WildcardNode
			| DescendantNode
			| ParentNode
			| BinaryNode
			| PathNode
			| BindNode
			| ApplyNode
			| UnaryNode
			| FunctionNode
			| PartialNode
			| LambdaNode
			| ConditionNode
			| BlockNode
			| TransformNode
			| SortNode
			| ErrorNode

		// ============================================================================
		// Type Guards (suggested implementations - not provided by JSONata)
		// ============================================================================

		/**
		 * type guard helpers for working with the AST
		 * note: these are type declarations only - you must implement them yourself
		 * @example
		 * ```typescript
		 * function isStringNode(node: ExprNode): node is StringNode {
		 *   return node.type === "string";
		 * }
		 * ```
		 */

		function isStringNode(node: ExprNode): node is StringNode
		function isNumberNode(node: ExprNode): node is NumberNode
		function isValueNode(node: ExprNode): node is ValueNode
		function isRegexNode(node: ExprNode): node is RegexNode
		function isNameNode(node: ExprNode): node is NameNode
		function isVariableNode(node: ExprNode): node is VariableNode
		function isWildcardNode(node: ExprNode): node is WildcardNode
		function isDescendantNode(node: ExprNode): node is DescendantNode
		function isParentNode(node: ExprNode): node is ParentNode
		function isBinaryNode(node: ExprNode): node is BinaryNode
		function isPathNode(node: ExprNode): node is PathNode
		function isBindNode(node: ExprNode): node is BindNode
		function isApplyNode(node: ExprNode): node is ApplyNode
		function isUnaryNode(node: ExprNode): node is UnaryNode
		function isFunctionNode(node: ExprNode): node is FunctionNode
		function isPartialNode(node: ExprNode): node is PartialNode
		function isLambdaNode(node: ExprNode): node is LambdaNode
		function isConditionNode(node: ExprNode): node is ConditionNode
		function isBlockNode(node: ExprNode): node is BlockNode
		function isTransformNode(node: ExprNode): node is TransformNode
		function isSortNode(node: ExprNode): node is SortNode
		function isErrorNode(node: ExprNode): node is ErrorNode

		// ============================================================================
		// AST Visitor Interface (suggested pattern for traversal)
		// ============================================================================

		/**
		 * visitor pattern interface for traversing the AST
		 * implement this interface to process each node type differently
		 * @example
		 * ```typescript
		 * const visitor: AstVisitor<string> = {
		 *   visitString: (node) => `"${node.value}"`,
		 *   visitNumber: (node) => String(node.value),
		 *   visitPath: (node) => node.steps.map(s => visit(s)).join("."),
		 *   // ... etc
		 * };
		 * ```
		 */
		interface AstVisitor<T> {
			visitString?(node: StringNode): T
			visitNumber?(node: NumberNode): T
			visitValue?(node: ValueNode): T
			visitRegex?(node: RegexNode): T
			visitName?(node: NameNode): T
			visitVariable?(node: VariableNode): T
			visitWildcard?(node: WildcardNode): T
			visitDescendant?(node: DescendantNode): T
			visitParent?(node: ParentNode): T
			visitBinary?(node: BinaryNode): T
			visitPath?(node: PathNode): T
			visitBind?(node: BindNode): T
			visitApply?(node: ApplyNode): T
			visitUnary?(node: UnaryNode): T
			visitFunction?(node: FunctionNode): T
			visitPartial?(node: PartialNode): T
			visitLambda?(node: LambdaNode): T
			visitCondition?(node: ConditionNode): T
			visitBlock?(node: BlockNode): T
			visitTransform?(node: TransformNode): T
			visitSort?(node: SortNode): T
			visitError?(node: ErrorNode): T
		}

		// ============================================================================
		// Error Types
		// ============================================================================

		/**
		 * error codes follow the pattern:
		 * - S0xxx: static/syntax errors (parse time)
		 * - T0xxx: type errors
		 * - D0xxx: dynamic errors (evaluation time)
		 */
		interface JsonataError extends Error {
			/**
			 * error code identifying the type of error
			 * @example "S0201" - syntax error
			 * @example "T2001" - type error (left side must be number)
			 * @example "D1001" - dynamic error (number out of range)
			 */
			code: string
			/** character position in source where error occurred */
			position: number
			/** the token that caused the error */
			token: string
			/** additional context value for the error message */
			value?: unknown
			/** second context value (for comparison errors) */
			value2?: unknown
		}

		// ============================================================================
		// Environment Types
		// ============================================================================

		/**
		 * execution environment - holds variable bindings during evaluation
		 */
		interface Environment {
			/** bind a value to a name in this environment frame */
			bind(name: string | symbol, value: unknown): void
			/** look up a value by name, searching up through parent frames */
			lookup(name: string | symbol): unknown
			/** the timestamp captured at start of evaluation (used by $now() and $millis()) */
			readonly timestamp: Date
			/** whether this environment supports async operations */
			readonly async: boolean
		}

		/**
		 * focus object passed as `this` to registered functions
		 */
		interface Focus {
			/** the current execution environment */
			readonly environment: Environment
			/** the current context value (input at this point in evaluation) */
			readonly input: unknown
		}

		// ============================================================================
		// Expression Interface
		// ============================================================================

		/**
		 * compiled JSONata expression ready for evaluation
		 */
		interface Expression {
			/**
			 * evaluate the expression against input data
			 * @param input - the JSON data to query/transform
			 * @param bindings - optional variable bindings to make available
			 * @returns promise resolving to the result
			 */
			evaluate(input: unknown, bindings?: Record<string, unknown>): Promise<unknown>

			/**
			 * evaluate the expression with a callback
			 * @param input - the JSON data to query/transform
			 * @param bindings - optional variable bindings
			 * @param callback - called with (error, result)
			 */
			evaluate(
				input: unknown,
				bindings: Record<string, unknown> | undefined,
				callback: (err: JsonataError, resp: unknown) => void
			): void

			/**
			 * bind a value to a variable name in this expression's environment
			 * @param name - variable name (without $)
			 * @param value - value to bind
			 */
			assign(name: string, value: unknown): void

			/**
			 * register a custom function
			 * @param name - function name (without $)
			 * @param implementation - the function implementation
			 * @param signature - optional type signature for argument validation
			 * @example
			 * ```javascript
			 * expr.registerFunction('double', (x) => x * 2, '<n:n>');
			 * ```
			 */
			registerFunction(
				name: string,
				implementation: (this: Focus, ...args: unknown[]) => unknown,
				signature?: string
			): void

			/**
			 * get the parsed AST for this expression
			 * useful for static analysis, code generation, or building tools
			 */
			ast(): ExprNode

			/**
			 * get any parse errors (only available when recover option was true)
			 */
			errors(): JsonataError[] | undefined
		}

		// ============================================================================
		// Built-in Function Signatures
		// ============================================================================

		/**
		 * function signature syntax (used in registerFunction and lambda definitions):
		 *
		 * signature format: `<params:return>`
		 *
		 * type symbols:
		 * - `s` = string
		 * - `n` = number
		 * - `b` = boolean
		 * - `o` = object
		 * - `a` = array (can be parameterized: `a<n>` = array of numbers)
		 * - `f` = function
		 * - `x` = any type
		 * - `j` = JSON (any valid JSON value)
		 * - `(...)` = choice of types: `(ns)` = number or string
		 *
		 * modifiers:
		 * - `-` = required argument
		 * - `?` = optional argument
		 * - `+` = one or more arguments
		 *
		 * @example `<n-n?:n>` = first number required, second optional, returns number
		 * @example `<a<n>:n>` = array of numbers in, number out
		 * @example `<x-:b>` = any type in, boolean out
		 */
		const builtinFunctions: {
			// aggregation functions
			/** sum of numbers: $sum([1,2,3]) => 6 */
			sum: "<a<n>:n>"
			/** count items: $count([1,2,3]) => 3 */
			count: "<a:n>"
			/** maximum number: $max([1,2,3]) => 3 */
			max: "<a<n>:n>"
			/** minimum number: $min([1,2,3]) => 1 */
			min: "<a<n>:n>"
			/** arithmetic mean: $average([1,2,3]) => 2 */
			average: "<a<n>:n>"

			// string functions
			/** convert to string: $string(123) => "123" */
			string: "<x-b?:s>"
			/** substring: $substring("hello", 1, 3) => "ell" */
			substring: "<s-nn?:s>"
			/** text before delimiter: $substringBefore("hello-world", "-") => "hello" */
			substringBefore: "<s-s:s>"
			/** text after delimiter: $substringAfter("hello-world", "-") => "world" */
			substringAfter: "<s-s:s>"
			/** to lowercase: $lowercase("HELLO") => "hello" */
			lowercase: "<s-:s>"
			/** to uppercase: $uppercase("hello") => "HELLO" */
			uppercase: "<s-:s>"
			/** string length: $length("hello") => 5 */
			length: "<s-:n>"
			/** trim whitespace: $trim("  hi  ") => "hi" */
			trim: "<s-:s>"
			/** pad string: $pad("x", 5, "-") => "--x--" */
			pad: "<s-ns?:s>"
			/** regex match: $match("abc", /[a-z]/) */
			match: "<s-f<s:o>n?:a<o>>"
			/** contains: $contains("hello", "ell") => true */
			contains: "<s-(sf):b>"
			/** replace: $replace("hello", "l", "L") => "heLLo" */
			replace: "<s-(sf)(sf)n?:s>"
			/** split: $split("a,b,c", ",") => ["a","b","c"] */
			split: "<s-(sf)n?:a<s>>"
			/** join: $join(["a","b","c"], ",") => "a,b,c" */
			join: "<a<s>s?:s>"
			/** format number: $formatNumber(1234.5, "#,##0.00") => "1,234.50" */
			formatNumber: "<n-so?:s>"
			/** format in base: $formatBase(255, 16) => "ff" */
			formatBase: "<n-n?:s>"
			/** format integer: $formatInteger(123, "w") => "one hundred and twenty-three" */
			formatInteger: "<n-s:s>"
			/** parse integer: $parseInteger("one hundred", "w") => 100 */
			parseInteger: "<s-s:n>"

			// numeric functions
			/** to number: $number("123") => 123 */
			number: "<(nsb)-:n>"
			/** floor: $floor(3.7) => 3 */
			floor: "<n-:n>"
			/** ceiling: $ceil(3.2) => 4 */
			ceil: "<n-:n>"
			/** round: $round(3.456, 2) => 3.46 */
			round: "<n-n?:n>"
			/** absolute value: $abs(-5) => 5 */
			abs: "<n-:n>"
			/** square root: $sqrt(16) => 4 */
			sqrt: "<n-:n>"
			/** power: $power(2, 3) => 8 */
			power: "<n-n:n>"
			/** random 0-1: $random() => 0.7263... */
			random: "<:n>"

			// boolean functions
			/** to boolean: $boolean("") => false */
			boolean: "<x-:b>"
			/** logical not: $not(true) => false */
			not: "<x-:b>"
			/** exists check: $exists(field) => true/false */
			exists: "<x:b>"

			// array functions
			/** append: $append([1,2], [3,4]) => [1,2,3,4] */
			append: "<xx:a>"
			/** reverse: $reverse([1,2,3]) => [3,2,1] */
			reverse: "<a:a>"
			/** shuffle: $shuffle([1,2,3]) => [2,3,1] */
			shuffle: "<a:a>"
			/** unique values: $distinct([1,1,2]) => [1,2] */
			distinct: "<x:x>"
			/** sort: $sort([3,1,2]) => [1,2,3] */
			sort: "<af?:a>"
			/** zip arrays: $zip([1,2],[3,4]) => [[1,3],[2,4]] */
			zip: "<a+>"

			// object functions
			/** object keys: $keys({"a":1}) => ["a"] */
			keys: "<x-:a<s>>"
			/** lookup field: $lookup(obj, "key") */
			lookup: "<x-s:x>"
			/** spread: $spread({"a":1}) => [{"a":1}] */
			spread: "<x-:a<o>>"
			/** merge objects: $merge([{a:1},{b:2}]) => {a:1,b:2} */
			merge: "<a<o>:o>"
			/** iterate: $each(obj, fn) */
			each: "<o-f:a>"
			/** filter object: $sift(obj, fn) */
			sift: "<o-f?:o>"

			// higher-order functions
			/** map: $map([1,2], fn) */
			map: "<af>"
			/** filter: $filter([1,2,3], fn) */
			filter: "<af>"
			/** find single: $single([1,2,3], fn) */
			single: "<af?>"
			/** reduce/fold: $reduce([1,2,3], fn, init) */
			reduce: "<afj?:j>"

			// encoding functions
			/** base64 encode: $base64encode("hello") => "aGVsbG8=" */
			base64encode: "<s-:s>"
			/** base64 decode: $base64decode("aGVsbG8=") => "hello" */
			base64decode: "<s-:s>"
			/** URL encode component: $encodeUrlComponent("a b") => "a%20b" */
			encodeUrlComponent: "<s-:s>"
			/** URL encode: $encodeUrl("http://a b") */
			encodeUrl: "<s-:s>"
			/** URL decode component */
			decodeUrlComponent: "<s-:s>"
			/** URL decode */
			decodeUrl: "<s-:s>"

			// date/time functions
			/** current ISO timestamp: $now() => "2024-01-15T..." */
			now: "<s?s?:s>"
			/** current milliseconds: $millis() => 1705312800000 */
			millis: "<:n>"
			/** parse to millis: $toMillis("2024-01-15T...") */
			toMillis: "<s-s?:n>"
			/** millis to string: $fromMillis(1705312800000) */
			fromMillis: "<n-s?s?:s>"

			// other functions
			/** evaluate string as expression: $eval("1+2") => 3 */
			eval: "<sx?:x>"
			/** deep clone: $clone(obj) */
			clone: "<(oa)-:o>"
			/** throw error: $error("message") */
			error: "<s?:x>"
			/** assertion: $assert(condition, "message") */
			assert: "<bs?:x>"
			/** get type: $type(value) => "string"|"number"|... */
			type: "<x:s>"
		}

		// ============================================================================
		// Operator Precedence (for reference)
		// ============================================================================

		/**
		 * operator precedence - higher number = binds tighter
		 * useful for building parsers or pretty printers
		 */
		const operatorPrecedence: {
			/** path/map operator */
			".": 75
			/** filter/predicate, array constructor */
			"[": 80
			/** object constructor/grouping */
			"{": 70
			/** function call, grouping */
			"(": 80
			/** focus variable binding: Account@$a.Order */
			"@": 80
			/** index variable binding: Account.Order#$i */
			"#": 80
			/** expression separator in blocks */
			";": 80
			/** key-value separator */
			":": 80
			/** conditional operator */
			"?": 20
			/** addition */
			"+": 50
			/** subtraction */
			"-": 50
			/** multiplication */
			"*": 60
			/** division */
			"/": 60
			/** modulo */
			"%": 60
			/** transform pattern delimiter */
			"|": 20
			/** equality */
			"=": 40
			/** less than */
			"<": 40
			/** greater than */
			">": 40
			/** order-by/sort */
			"^": 40
			/** descendant wildcard */
			"**": 60
			/** range operator */
			"..": 20
			/** variable binding */
			":=": 10
			/** not equal */
			"!=": 40
			/** less than or equal */
			"<=": 40
			/** greater than or equal */
			">=": 40
			/** function application/chaining */
			"~>": 40
			/** elvis operator (default if falsy) */
			"?:": 40
			/** null coalescing (default if undefined) */
			"??": 40
			/** boolean AND */
			and: 30
			/** boolean OR */
			or: 25
			/** array inclusion */
			in: 40
			/** string concatenation */
			"&": 50
		}

		// ============================================================================
		// Quick Reference: All Node Types
		// ============================================================================

		/**
		 * complete list of AST node types produced by the parser:
		 *
		 * LITERALS:
		 * - string: "hello"
		 * - number: 42
		 * - value: true, false, null
		 * - regex: /pattern/flags
		 *
		 * IDENTIFIERS:
		 * - name: field name (Account, Order, etc.)
		 * - variable: $x, $, $$
		 *
		 * WILDCARDS:
		 * - wildcard: * (all fields at this level)
		 * - descendant: ** (all nested values)
		 * - parent: % (reference parent context)
		 *
		 * PATHS:
		 * - path: sequence of steps (Account.Order.Product)
		 *
		 * BINARY:
		 * - binary: arithmetic, comparison, boolean, string ops
		 * - bind: variable assignment (:=)
		 * - apply: function application (~>)
		 *
		 * UNARY:
		 * - negation: -expr
		 * - array constructor: [expr, expr]
		 * - object constructor: {key: value}
		 *
		 * FUNCTIONS:
		 * - function: function call
		 * - partial: partial application with ?
		 * - lambda: function definition
		 *
		 * CONTROL:
		 * - condition: ternary ?: and ?:/?? operators
		 * - block: (expr; expr; expr)
		 *
		 * OTHER:
		 * - transform: |pattern|update,delete|
		 * - sort: order-by ^(expr)
		 * - error: parse error (recovery mode)
		 */
		type AllNodeTypes =
			| "string"
			| "number"
			| "value"
			| "regex"
			| "name"
			| "variable"
			| "wildcard"
			| "descendant"
			| "parent"
			| "path"
			| "binary"
			| "bind"
			| "apply"
			| "unary"
			| "function"
			| "partial"
			| "lambda"
			| "condition"
			| "block"
			| "transform"
			| "sort"
			| "error"
	}
	export default jsonata
}
