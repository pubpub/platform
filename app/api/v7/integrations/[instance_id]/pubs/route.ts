/**
 * @swagger
 * /api/integration/{instanceId}/pubs:
 *   get:
 *     tags:
 *       - Pubs
 *     parameters:
 *       - $ref: '#/components/parameters/instanceId'
 *     summary: Finds all Pubs in an instance
 *     description: Returns all Pubs in an instance by Pubs
 *     responses:
 *       200:
 *         description: A collection of Pub fields
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 ref: '#/components/schemas/PubFields'
 *                 example:
 *                   - MyField: Gomu-Gomu no Jet Pistol
 *                     Level: 1
 *                   - MyField: Gomu-Gomu no Jet Gattling Gun
 *                     Level: 2
 *                   - MyField: Gumu-Gumu no Jet Bazooka
 *                     Level: 3
 *                   - MyField: Gumu-Gumu no Jet Gattling Bazooka
 *                     Level: 4
 *                   - MyField: Gumu-Gumu no Red Hawk
 *                     Level: 5
 *       400:
 *         description: Invalid Instance ID
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/InvalidInstanceId'
 *               example: Invalid Instance ID
 */
export async function GET(request: Request) {
	// Return all pubs in scope for this instance
}

/*
export async function POST(request: Request) {
    // Create a new pub
}
*/
