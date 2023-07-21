import autoprefixer from "autoprefixer"
import import_ from "postcss-import"
import mixins from "postcss-mixins"
import nested from "postcss-nested"
import svg from "postcss-inline-svg"
import vars from "postcss-simple-vars"

export default {
	plugins: [import_(), mixins(), nested(), vars(), svg(), autoprefixer()],
}
