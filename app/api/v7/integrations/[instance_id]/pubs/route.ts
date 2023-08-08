/**
 * @swagger
 * /api/v7/integrations/{instanceId}/pubs:
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
 *                   - attack: Gomu-Gomu no Jet Pistol
 *                     level: 1
 *                     id: "123"
 *                   - attack: Gomu-Gomu no Jet Gattling Gun
 *                     level: 2
 *                     id: "456"
 *                   - attack: Gumu-Gumu no Jet Bazooka
 *                     level: 3
 *                     id: "789"
 *                   - attack: Gumu-Gumu no Jet Gattling Bazooka
 *                     level: 4
 *                     id: "101112"
 *                   - attack: Gumu-Gumu no Red Hawk
 *                     level: 5
 *                     id: "131415"
 *       400:
 *         description: Instance not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/InstanceNotFound'
 *               example: Instance not found
 *       401:
 *         description: Invalid Instance ID
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/InvalidInstanceId'
 *               example: Invalid Instance ID
 *       403:
 *         description: You dont have access to do this
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/InvalidAccessToken'
 *               example: Invalid API key supplied
 */
export async function GET(request: Request) {
	// Return all pubs in scope for this instance
	// include id in return
}

/*
export async function POST(request: Request) {
    // Create a new pub
}
*/
