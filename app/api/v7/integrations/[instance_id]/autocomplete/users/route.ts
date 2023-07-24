/**
 * @swagger
 * /api/integration/{instanceId}/autocomplete/user:
 *   get:
 *     tags:
 *       - Autocomplete
 *     description: Returns a suggested user that is queried by name or email
 *     parameters:
 *       - $ref: '#/components/parameters/instanceId'
 *     summary: Finds a user by name or email
 *     requestBody:
 *       description: User to be queried by name or email
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *             example:
 *               name: Mugi
 *
 *     responses:
 *       200:
 *         description: Username and ID
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *             example:
 *               id: 123
 *               name: 'Mugiwara D. Luffy'
 * 
 *       204:
 *         description: No user found
 *         content:
 *           application/json:
 *             schema:
 *               type: string
 *               example: 
 *                 'No user found'
 *
 */
export async function GET(request: Request) {
	// return candidates for autocompleting a form with suggestions from the pubpub user database
	// should search by name and email, but probably only return name and id
}
