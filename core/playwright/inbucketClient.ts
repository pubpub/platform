type MailboxMessage = {
	mailbox: string
	id: string
	from: string
	subject: string
	date: string
	size: number
}

type MailboxResponse = MailboxMessage[]

export type MessageResponse = {
	mailbox: string
	id: string
	from: string
	subject: string
	date: string
	size: number
	body: Body
	header: Header
	attachments: Attachment[]
}

type Attachment = {
	filename: string
	"content-type": string
	"download-link": string
	"view-link": string
	md5: string
}

type Header = {
	"Content-Type": string[]
	Date: string[]
	From: string[]
	"Mime-Version": string[]
	Subject: string[]
	To: string[]
}

type Body = {
	text: string
	html?: string
}

type DeleteResponse = "OK"

type Name = string & { __brand: "Name" }
type Id = string & { __brand: "Id" }

type Paths = [
	[`api/v1/mailbox/${Name}`, "GET"],
	[`api/v1/mailbox/${Name}/${Id}`, "GET"],
	[`api/v1/mailbox/${Name}/${Id}/source`, "GET"],
	[`api/v1/mailbox/${Name}/${Id}`, "DELETE"],
	[`api/v1/mailbox/${Name}`, "DELETE"],
]

type Path = Paths[number]

export class InbucketClient {
	constructor(private readonly url: string) {
		if (!url.endsWith("/")) {
			this.url += "/"
		}
	}

	#get = async <T extends Path>(path: T[0], method: T[1]) => {
		const response = await fetch(`${this.url}${path}`, {
			method,
			headers: {
				"Content-Type": "application/json",
			},
		})

		if (!response.ok) {
			throw new Error(`Request to ${path} failed with status ${response.status}`)
		}

		return response.json()
	}

	getMailbox = async (mailbox: string) => {
		let contents = (await this.#get(
			`api/v1/mailbox/${mailbox as Name}`,
			"GET"
		)) as MailboxResponse

		return {
			contents,
			/**
			 * Get first email to arrive within `interval` seconds from now
			 * for the given mailbox.
			 *
			 * @default interval = 5
			 */
			getLatestMessage: async (interval = 5) => {
				// findLast because stuff is returned in reverse order
				const latestMessage = contents.findLast(
					(message) => new Date(message.date) < new Date(Date.now() + interval * 1000)
				)
				if (!latestMessage) {
					throw new Error(
						`No messages found for mailbox ${mailbox} delivered in the last ${interval} seconds`
					)
				}

				const message = await this.getMessage(latestMessage.mailbox, latestMessage.id)

				return message
			},
			deleteContents: async () => {
				contents = []
				return await this.deleteMailboxContents(mailbox)
			},
		}
	}

	getMessage = async (mailbox: string, id: string) => {
		const message = (await this.#get(
			`api/v1/mailbox/${mailbox as Name}/${id as Id}`,
			"GET"
		)) as MessageResponse

		return {
			message,
			delete: async () => {
				return await this.deleteMessage(mailbox, id)
			},
		}
	}

	getMessageSource = async (mailbox: string, id: string) => {
		return this.#get(
			`api/v1/mailbox/${mailbox as Name}/${id as Id}/source`,
			"GET"
		) as Promise<string>
	}

	deleteMailboxContents = async (mailbox: string) => {
		return this.#get(`api/v1/mailbox/${mailbox as Name}`, "DELETE") as Promise<DeleteResponse>
	}

	deleteMessage = async (mailbox: string, id: string) => {
		return this.#get(
			`api/v1/mailbox/${mailbox as Name}/${id as Id}`,
			"DELETE"
		) as Promise<DeleteResponse>
	}
}
