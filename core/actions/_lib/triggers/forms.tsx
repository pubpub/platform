import dynamic from "next/dynamic"

import { AutomationEvent } from "db/public"
import { Skeleton } from "ui/skeleton"

import { type AdditionalConfigFormReturn, isTriggerWithConfig } from "../triggers"

const PubInStageForDurationConfigForm = dynamic(
	() =>
		import("./PubInStageForDurationConfigForm").then(
			(mod) => mod.PubInStageForDurationConfigForm
		),
	{
		ssr: false,
		loading: () => <Skeleton className="h-20 w-full" />,
	}
)

const WebhookConfigForm = dynamic(
	() => import("./WebhookConfigForm").then((mod) => mod.WebhookConfigForm),
	{
		ssr: false,
		loading: () => <Skeleton className="h-20 w-full" />,
	}
)

type TriggerWithConfigForm<T extends AutomationEvent> = T extends T
	? {
			event: T
			form: AdditionalConfigFormReturn<T>
			idx: number
		}
	: never

export const isTriggerWithConfigForm = <T extends AutomationEvent>(
	props: TriggerWithConfigForm<any>,
	// only used for typesafety
	event: T
): props is TriggerWithConfigForm<T> => {
	return isTriggerWithConfig(props.event) && props.event === event
}

export const TriggerConfigForm = <T extends AutomationEvent>(
	props: TriggerWithConfigForm<T>
): React.ReactNode => {
	if (isTriggerWithConfigForm(props, AutomationEvent.pubInStageForDuration)) {
		return (
			<PubInStageForDurationConfigForm
				event={props.event}
				form={props.form}
				idx={props.idx}
			/>
		)
	} else if (isTriggerWithConfigForm(props, AutomationEvent.webhook)) {
		return <WebhookConfigForm event={props.event} form={props.form} idx={props.idx} />
	}
	return null
}
