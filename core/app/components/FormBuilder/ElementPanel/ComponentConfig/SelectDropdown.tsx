import type { InputComponent } from "db/public"
import type { ComponentConfigFormProps } from "./types"

import MultivalueBase from "./MultivalueBase"

export default (props: ComponentConfigFormProps<InputComponent.selectDropdown>) => {
	return <MultivalueBase label="Dropdown" {...props} />
}
