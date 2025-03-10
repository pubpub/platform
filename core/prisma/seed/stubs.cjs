const stubFn = (fn) => fn;

module.exports = {
	cache: stubFn,
	useId: stubFn,
	forwardRef: stubFn,
	autoCache: stubFn,
	autoRevalidate: stubFn,
	NextResponse: {},
	// Add other stubbed methods as needed
};
