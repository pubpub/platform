/**
 * @swagger
 * /api/integration/{instanceId}/accessToken:
 *   post:
 *     tags:
 *      - Authentication
 *     parameters:
 *       - $ref: '#/components/parameters/instanceId'
 *       - $ref: '#/components/parameters/apikey'
 *     summary: Authenticates a PubPub API token(will eventually authorize a PubPub signed token with permissions)
 *     description: Returns a authenticated user
 *     responses:
 *       200:
 *         description: a user
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AccessToken'
 *               example:
 *                 id: 321
 *                 name: 'Mugiwara D. Luffy'
 *       403:
 *         description: Invlaid API key
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/InvalidApiKey'
 *               example: Invalid API key supplied
 */
export async function POST(request: Request) {
	// Verify the signature on a token _and_ whether the user is authorized to access a particular
	// resource
}
