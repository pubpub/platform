/**
 * @swagger
 * /api/integration/{instanceId}/autocomplete/user:
 *   get:
 *     tags:
 *       - Autocomplete
 *     summary: Finds a user by name or email
 *     description: Returns a suggested user that is queried by name or email
 *     responses:
 *       200:
 *         description: Username and ID
 */
export async function GET(request: Request) {
	// return candidates for autocompleting a form with suggestions from the pubpub user database
	// should search by name and email, but probably only return name and id
}
