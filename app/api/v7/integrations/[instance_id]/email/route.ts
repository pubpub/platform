/**
 * @swagger
 * /api/integration/{instanceId}/email:
 *   post:
 *     tags:
 *       - Email
 *     parameters:
 *       - $ref: '#/components/parameters/instanceId'
 *     summary: Creates an email for provided users
 *     description: Proxies server with list of users to email
 *     requestBody:
 *       description: List of users to email
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: array
 *             items:
 *               $ref: '#/components/schemas/User'
 *             example:
 *               - id: 123
 *                 name: Luffy
 *                 email: eatmoremeat@pk.jb
 *               - id: 456
 *                 name: Zoro
 *                 email: gottabeatmihawk@sword.com
 *               - id: 789
 *                 name: Nami
 *                 email: gettintothemoney@money.mo
 *               - id: 101112
 *                 name: Usopp
 *                 email: wheresmydad@snipe.com
 *               - id: 131415
 *                 name: Sanji
 *                 email: allbluedreams@baratie.com
 *               - name: Chopper
 *                 email: healndbecute@flower.co
 *     responses:
 *       200:
 *         description: Newly created users
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/User'
 *               example:
 *                 - id: 372
 *                   name: Chopper
 *       400:
 *          description: Invalid Instance ID
 *          content:
 *            application/json:
 *              schema:
 *                $ref: '#/components/schemas/InvalidInstanceId'
 *                example: Invalid Instance ID
 */
export async function POST(request: Request) {
	// TODO: is this too much power for integrations? should we approve templates? a malicious
	// integration sending a mass email on our behalf can't be undone
	// send email to specified users, substituting values from pubs/recipients, and creating users if they don't exist
	// return identity tokens for newly created users
	// why return id tokens? why not just return the users?
}
