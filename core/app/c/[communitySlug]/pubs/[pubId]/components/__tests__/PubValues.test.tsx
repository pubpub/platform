import { fireEvent, render, screen, within } from "@testing-library/react"

import "@testing-library/jest-dom/vitest"

import { describe, expect, it } from "vitest"

import type { FullProcessedPub } from "~/lib/server"
import { PubValues } from "../PubValues"
import * as articlePub from "./article-pub-fixture.json"
import * as authorPub from "./author-pub-fixture.json"

describe("rendering related pub values", () => {
	const renderArticle = () =>
		render(<PubValues pub={articlePub as unknown as FullProcessedPub} />)
	const renderAuthor = () => render(<PubValues pub={authorPub as unknown as FullProcessedPub} />)
	it("groups values by the field", () => {
		renderArticle()
		expect(screen.getAllByRole("heading", { name: "Tables" }).length).toBe(1)
		const tablesNode = within(screen.getByTestId("Tables-value"))
		expect(tablesNode.getAllByRole("link").length).toBe(2)
	})
	it("renders the value of a relationship field before a link to the related pub", () => {
		// TODO: this should probably test the entire value + link combo exists, not just the two
		// elements separately
		renderAuthor()
		const articlesNode = within(screen.getByTestId("Articles-value"))
		expect(articlesNode.getByText(/Edited:/)).toBeVisible()
		expect(
			articlesNode.getByRole("link", {
				name: "Identification of capsid-like proteins in venomous and parasitic animals",
			})
		).toBeVisible()

		expect(articlesNode.getByText("Wrote:")).toBeVisible()
		expect(
			articlesNode.getByRole("link", {
				name: "A Comment on Capsid Identification",
			})
		).toBeVisible()
	})
	it("doesn't render the title", () => {
		renderAuthor()
		expect(screen.queryByText("James McJimothy")).not.toBeInTheDocument()
		expect(screen.queryByRole("heading", { name: "Name" })).not.toBeInTheDocument()
	})
	it("handles cycles gracefully", () => {
		renderAuthor()
		expect(screen.queryByText("James McJimothy")).not.toBeInTheDocument()
		const articleLink = screen.getByRole("link", {
			name: "Identification of capsid-like proteins in venomous and parasitic animals",
		})
		expect(articleLink.nextSibling).not.toBeNull()
		fireEvent.click(articleLink.nextSibling!)
		const contributorsNode = within(screen.getByTestId("Contributors-value"))
		expect(contributorsNode.getByText("Current pub")).toBeVisible()
		expect(contributorsNode.queryByRole("link")).not.toBeInTheDocument()
		expect(contributorsNode.queryByRole("button")).not.toBeInTheDocument()
		expect(contributorsNode.getByText("James McJimothy")).toBeVisible()
	})
	it("renders collapsed related values to depth 2", () => {
		renderAuthor()
		expect(screen.queryByText("Citations")).not.toBeInTheDocument()
		fireEvent.click(screen.getByRole("button", { name: "Show pub contents" }))
		expect(screen.getByRole("heading", { name: "Citations" })).toBeVisible()
		const citationsNode = within(screen.getByTestId("Citations-value"))
		expect(citationsNode.getAllByRole("link").length).toBe(2)
		expect(citationsNode.queryByRole("button")).not.toBeInTheDocument()
	})
	it("renders all the values", () => {
		renderArticle()
		const allFields = [
			"Publication Date",
			"Creation Date",
			"Last Edited",
			"Avatar",
			"Description",
			"Abstract",
			"License",
			"PubContent",
			"DOI",
			"URL",
			"Inline Citation Style",
			"Citation Style",
			"Tag",
			"ConnectedPubs",
			"Contributors",
			"Downloads",
			"Tables",
			"Images",
			"Citations",
		]

		allFields.forEach((field) => {
			expect(screen.getByRole("heading", { name: field })).toBeVisible()
			expect(screen.getByTestId(`${field}-value`)).toBeVisible()
			expect(screen.getByTestId(`${field}-value`)).not.toBeEmptyDOMElement()
		})
	})
})
