import autoprefixer from "autoprefixer"
import import_ from "postcss-import"
import mixins from "postcss-mixins"
import nested from "postcss-nested"

export default {
	plugins: [import_(), mixins(), nested(), autoprefixer()],
}
