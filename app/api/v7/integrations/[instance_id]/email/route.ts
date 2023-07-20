/**
 * @swagger
 * /api/integration/{instanceId}/email:
 *   post:
 *     tags:
 *       - Email
 *     summary: Creates an email
 *     description: Proxies server with list of users for to send emails to
 *     responses:
 *       200:
 *         description: Identity tokens of of newly created users
 *       400:
 *          description: Invalid ID
 *       404:
 *          description: User(s) not found
 */
export async function POST(request: Request) {
	// TODO: is this too much power for integrations? should we approve templates? a malicious
	// integration sending a mass email on our behalf can't be undone

	// send email to specified users, substituting values from pubs/recipients, and creating users if they don't exist
	// return identity tokens for newly created users
    // why
}
