"use client"

import type { PubsId, PubTypes } from "db/public"
import type { PubCardClientPub } from "../pubs/PubCard/PubCardClient"

import { useRef, useState } from "react"

import { Button } from "ui/button"

import { PanelHeader, SidePanel } from "~/app/components/SidePanel"
import { FormPubSearchSelect } from "../pubs/FormPubSearchSelect"

type AddRelatedPubsPanelProps = {
	title: string
	formSlug: string
	fieldSlug: string
	relatedPubs: PubCardClientPub[]
	onCancel: () => void
	onChangeRelatedPubs: (pubs: PubCardClientPub[]) => void
	disabledPubs?: PubsId[]
	pubTypes?: Pick<PubTypes, "id" | "name">[]
	currentPubId?: PubsId
}

export const AddRelatedPubsPanel = (props: AddRelatedPubsPanelProps) => {
	const sidebarRef = useRef(null)
	const [selected, setSelected] = useState<PubCardClientPub[]>(props.relatedPubs)

	const handleUpdate = () => {
		props.onChangeRelatedPubs(selected)
		props.onCancel()
	}

	return (
		<SidePanel ref={sidebarRef}>
			<div className="flex flex-col gap-2">
				<PanelHeader title={props.title} showCancel onCancel={props.onCancel} />
				<FormPubSearchSelect
					formSlug={props.formSlug}
					fieldSlug={props.fieldSlug}
					currentPubId={props.currentPubId}
					selectedPubs={selected}
					onSelectedPubsChange={setSelected}
					disabledPubIds={props.disabledPubs}
					pubTypeIds={props.pubTypes?.map((t) => t.id)}
					mode="multi"
					placeholder="Search for Pubs to add..."
					maxHeight="calc(100vh - 200px)"
				/>
			</div>
			<div className="mt-auto flex w-full justify-between gap-2">
				<Button type="button" variant="outline" className="flex-1" onClick={props.onCancel}>
					Cancel
				</Button>
				<Button
					type="button"
					data-testid="add-related-pub-button"
					onClick={handleUpdate}
					className="flex-1 bg-blue-500 hover:bg-blue-600"
				>
					Update
				</Button>
			</div>
		</SidePanel>
	)
}
