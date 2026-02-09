"use client"

import type { CoarNotifyPayload } from "~/lib/store"

import { useState } from "react"

import {
	createAcceptPayload,
	createAnnounceIngestPayload,
	createAnnounceReviewPayload,
	createOfferIngestPayload,
	createOfferReviewPayload,
	createRejectPayload,
	type PayloadTemplateType,
} from "~/lib/payloads"

interface SendNotificationFormProps {
	onSent: () => void
}

type FormMode = "template" | "custom"

const TEMPLATE_OPTIONS: PayloadTemplateType[] = [
	"Offer Review",
	"Announce Review",
	"Offer Ingest",
	"Announce Ingest",
	"Accept",
	"Reject",
]

export function SendNotificationForm({ onSent }: SendNotificationFormProps) {
	const [mode, setMode] = useState<FormMode>("template")
	const [targetUrl, setTargetUrl] = useState(
		"http://localhost:3000/api/v0/c/coar-notify/site/webhook/coar-inbox"
	)
	const [templateType, setTemplateType] = useState<PayloadTemplateType>("Offer Review")
	const [customPayload, setCustomPayload] = useState("")
	const [isSending, setIsSending] = useState(false)
	const [error, setError] = useState<string | null>(null)
	const [success, setSuccess] = useState(false)

	// Template fields
	const [preprintId, setPreprintId] = useState("12345")
	const [reviewId, setReviewId] = useState("review-001")
	const [repositoryUrl, setRepositoryUrl] = useState("http://localhost:4000")
	const [serviceUrl, setServiceUrl] = useState("http://localhost:3000")
	const [serviceName, setServiceName] = useState("Mock Review Service")
	const [aggregatorUrl, setAggregatorUrl] = useState("http://localhost:4000")
	const [inReplyTo, setInReplyTo] = useState("")

	const generatePayload = (): CoarNotifyPayload => {
		switch (templateType) {
			case "Offer Review":
				return createOfferReviewPayload({ preprintId, repositoryUrl, serviceUrl })
			case "Announce Review":
				return createAnnounceReviewPayload({
					preprintId,
					reviewId,
					repositoryUrl,
					serviceUrl,
					serviceName,
				})
			case "Offer Ingest":
				return createOfferIngestPayload({ reviewId, serviceUrl, aggregatorUrl })
			case "Announce Ingest":
				return createAnnounceIngestPayload({ reviewId, serviceUrl, aggregatorUrl })
			case "Accept":
				return createAcceptPayload({ inReplyTo, repositoryUrl, serviceUrl })
			case "Reject":
				return createRejectPayload({ inReplyTo, repositoryUrl, serviceUrl })
		}
	}

	const handleSend = async () => {
		setError(null)
		setSuccess(false)
		setIsSending(true)

		try {
			let payload: CoarNotifyPayload
			if (mode === "template") {
				payload = generatePayload()
			} else {
				payload = JSON.parse(customPayload)
			}

			const res = await fetch("/api/send", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ targetUrl, payload }),
			})

			const data = await res.json()

			if (!res.ok) {
				setError(data.error || "Failed to send notification")
			} else {
				setSuccess(true)
				onSent()
				setTimeout(() => setSuccess(false), 3000)
			}
		} catch (err) {
			setError(err instanceof Error ? err.message : "Failed to send notification")
		} finally {
			setIsSending(false)
		}
	}

	const handlePreview = () => {
		try {
			const payload = generatePayload()
			setCustomPayload(JSON.stringify(payload, null, 2))
			setMode("custom")
		} catch (err) {
			setError(err instanceof Error ? err.message : "Failed to generate payload")
		}
	}

	const renderTemplateFields = () => {
		switch (templateType) {
			case "Offer Review":
				return (
					<>
						<div>
							<label
								htmlFor="preprintId"
								className="mb-1 block font-medium text-gray-700 text-sm"
							>
								Preprint ID
							</label>
							<input
								type="text"
								id="preprintId"
								value={preprintId}
								onChange={(e) => setPreprintId(e.target.value)}
								className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
							/>
						</div>
						<div>
							<label
								htmlFor="repositoryUrl"
								className="mb-1 block font-medium text-gray-700 text-sm"
							>
								Repository URL
							</label>
							<input
								type="text"
								id="repositoryUrl"
								value={repositoryUrl}
								onChange={(e) => setRepositoryUrl(e.target.value)}
								className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
							/>
						</div>
						<div>
							<label
								htmlFor="serviceUrl"
								className="mb-1 block font-medium text-gray-700 text-sm"
							>
								Service URL (target)
							</label>
							<input
								type="text"
								id="serviceUrl"
								value={serviceUrl}
								onChange={(e) => setServiceUrl(e.target.value)}
								className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
							/>
						</div>
					</>
				)
			case "Announce Review":
				return (
					<>
						<div>
							<label
								htmlFor="preprintId"
								className="mb-1 block font-medium text-gray-700 text-sm"
							>
								Preprint ID
							</label>
							<input
								type="text"
								id="preprintId"
								value={preprintId}
								onChange={(e) => setPreprintId(e.target.value)}
								className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
							/>
						</div>
						<div>
							<label
								htmlFor="reviewId"
								className="mb-1 block font-medium text-gray-700 text-sm"
							>
								Review ID
							</label>
							<input
								type="text"
								id="reviewId"
								value={reviewId}
								onChange={(e) => setReviewId(e.target.value)}
								className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
							/>
						</div>
						<div>
							<label
								htmlFor="repositoryUrl"
								className="mb-1 block font-medium text-gray-700 text-sm"
							>
								Repository URL
							</label>
							<input
								type="text"
								id="repositoryUrl"
								value={repositoryUrl}
								onChange={(e) => setRepositoryUrl(e.target.value)}
								className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
							/>
						</div>
						<div>
							<label
								htmlFor="serviceUrl"
								className="mb-1 block font-medium text-gray-700 text-sm"
							>
								Service URL
							</label>
							<input
								type="text"
								id="serviceUrl"
								value={serviceUrl}
								onChange={(e) => setServiceUrl(e.target.value)}
								className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
							/>
						</div>
						<div>
							<label
								htmlFor="serviceName"
								className="mb-1 block font-medium text-gray-700 text-sm"
							>
								Service Name
							</label>
							<input
								type="text"
								id="serviceName"
								value={serviceName}
								onChange={(e) => setServiceName(e.target.value)}
								className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
							/>
						</div>
					</>
				)
			case "Offer Ingest":
			case "Announce Ingest":
				return (
					<>
						<div>
							<label
								htmlFor="reviewId"
								className="mb-1 block font-medium text-gray-700 text-sm"
							>
								Review ID
							</label>
							<input
								type="text"
								id="reviewId"
								value={reviewId}
								onChange={(e) => setReviewId(e.target.value)}
								className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
							/>
						</div>
						<div>
							<label
								htmlFor="serviceUrl"
								className="mb-1 block font-medium text-gray-700 text-sm"
							>
								Service URL
							</label>
							<input
								type="text"
								id="serviceUrl"
								value={serviceUrl}
								onChange={(e) => setServiceUrl(e.target.value)}
								className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
							/>
						</div>
						<div>
							<label
								htmlFor="aggregatorUrl"
								className="mb-1 block font-medium text-gray-700 text-sm"
							>
								Aggregator URL
							</label>
							<input
								type="text"
								id="aggregatorUrl"
								value={aggregatorUrl}
								onChange={(e) => setAggregatorUrl(e.target.value)}
								className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
							/>
						</div>
					</>
				)
			case "Accept":
			case "Reject":
				return (
					<>
						<div>
							<label
								htmlFor="inReplyTo"
								className="mb-1 block font-medium text-gray-700 text-sm"
							>
								In Reply To (Offer ID)
							</label>
							<input
								type="text"
								id="inReplyTo"
								value={inReplyTo}
								onChange={(e) => setInReplyTo(e.target.value)}
								placeholder="urn:uuid:..."
								className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
							/>
						</div>
						<div>
							<label
								htmlFor="repositoryUrl"
								className="mb-1 block font-medium text-gray-700 text-sm"
							>
								Repository URL
							</label>
							<input
								type="text"
								id="repositoryUrl"
								value={repositoryUrl}
								onChange={(e) => setRepositoryUrl(e.target.value)}
								className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
							/>
						</div>
						<div>
							<label
								htmlFor="serviceUrl"
								className="mb-1 block font-medium text-gray-700 text-sm"
							>
								Service URL
							</label>
							<input
								type="text"
								id="serviceUrl"
								value={serviceUrl}
								onChange={(e) => setServiceUrl(e.target.value)}
								className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
							/>
						</div>
					</>
				)
		}
	}

	return (
		<div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
			<h2 className="mb-4 font-semibold text-lg">Send Notification</h2>

			{/* Mode Toggle */}
			<div className="mb-4 flex gap-1 rounded-lg bg-gray-100 p-1">
				<button
					type="button"
					onClick={() => setMode("template")}
					className={`flex-1 rounded-md px-3 py-1.5 font-medium text-sm transition-colors ${
						mode === "template"
							? "bg-white text-gray-900 shadow-sm"
							: "text-gray-600 hover:text-gray-900"
					}`}
				>
					Template
				</button>
				<button
					type="button"
					onClick={() => setMode("custom")}
					className={`flex-1 rounded-md px-3 py-1.5 font-medium text-sm transition-colors ${
						mode === "custom"
							? "bg-white text-gray-900 shadow-sm"
							: "text-gray-600 hover:text-gray-900"
					}`}
				>
					Custom JSON
				</button>
			</div>

			<div className="space-y-4">
				{/* Target URL */}
				<div>
					<label
						htmlFor="targetUrl"
						className="mb-1 block font-medium text-gray-700 text-sm"
					>
						Target URL
					</label>
					<input
						id="targetUrl"
						type="text"
						value={targetUrl}
						onChange={(e) => setTargetUrl(e.target.value)}
						className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
						placeholder="http://localhost:3000/api/v0/c/..."
					/>
				</div>

				{mode === "template" ? (
					<>
						{/* Template Type */}
						<div>
							<label
								htmlFor="templateType"
								className="mb-1 block font-medium text-gray-700 text-sm"
							>
								Notification Type
							</label>
							<select
								id="templateType"
								value={templateType}
								onChange={(e) =>
									setTemplateType(e.target.value as PayloadTemplateType)
								}
								className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
							>
								{TEMPLATE_OPTIONS.map((opt) => (
									<option key={opt} value={opt}>
										{opt}
									</option>
								))}
							</select>
						</div>

						{/* Template-specific fields */}
						{renderTemplateFields()}

						{/* Preview button */}
						<button
							type="button"
							onClick={handlePreview}
							className="w-full rounded-md border border-gray-300 bg-white px-4 py-2 font-medium text-gray-700 text-sm hover:bg-gray-50"
						>
							Preview JSON
						</button>
					</>
				) : (
					<div>
						<label
							htmlFor="customPayload"
							className="mb-1 block font-medium text-gray-700 text-sm"
						>
							JSON Payload
						</label>
						<textarea
							id="customPayload"
							value={customPayload}
							onChange={(e) => setCustomPayload(e.target.value)}
							className="h-64 w-full rounded-md border border-gray-300 px-3 py-2 font-mono text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
							placeholder='{"@context": [...], "type": [...], ...}'
						/>
					</div>
				)}

				{/* Error/Success Messages */}
				{error && (
					<div className="rounded-md bg-red-50 p-3 text-red-700 text-sm">{error}</div>
				)}
				{success && (
					<div className="rounded-md bg-green-50 p-3 text-green-700 text-sm">
						Notification sent successfully!
					</div>
				)}

				{/* Send Button */}
				<button
					type="button"
					onClick={handleSend}
					disabled={isSending}
					className="w-full rounded-md bg-blue-600 px-4 py-2 font-medium text-sm text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
				>
					{isSending ? "Sending..." : "Send Notification"}
				</button>
			</div>
		</div>
	)
}
