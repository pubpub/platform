import type { Action } from "../types"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"

export const useActionForm = (action: Action) => {
	const form = useForm({
		resolver: zodResolver(action.config.schema),
	})
	return form
}
