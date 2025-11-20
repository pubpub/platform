// this weird setup with the `cts` is to trick `tsx` into using CommonJS modules, even though we are using type: module
// because we want to stub out things in `register-stub.cjs` but that only works with CommonJS modules

require("../seed")
