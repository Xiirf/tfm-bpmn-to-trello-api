var readBPMN = require('../readDiagram/readBPMN');
const createElement = require('../apiTrello/createProcess');
/**
 * @swagger
 * path:
 *  /generate:
 *    post:
 *      summary: Generate board Trello
 *      tags: [Trello]
 *      requestBody:
 *        required: true
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              required:
 *                - teamName
 *                - file
 *              properties:
 *                teamName:
 *                  type: string
 *                  description: Trello team name.
 *                file:
 *                  type: string
 *                  description: file(xml).
 *      responses:
 *        "201":
 *          description: Table generated (Trello)
 *        "500":
 *          description: Error (see description)
 */
exports.generate = (req, res) => {
    const { teamName, file, token, key } = req.body;

    if (!teamName || !file || !token || !key) {
        return res.status(400).json({
            error: 'Debe indicar el teamName, el fichero, el token y la key',
        })
    }

    readBPMN.getElementfromDiagram(file).then((data) => {
        var tasks = data.tasks;
        var boardName = data.boardName;
		console.log(JSON.stringify(tasks));

        if (!tasks){
            return res.status(400).json({
                error: 'No task in diagram',
            });
        }
        //Création du board
        createElement.createBoard(boardName, teamName, token, key)
            .then((idBoard) => {
				createElement.createList(idBoard, tasks, token, key)
				.then(() => {
					res.status(201).json({
                        error: 'Board created',
                    })
				})
				.catch((error) => {
					res.status(500).json({
                        error,
                    })
				})
			})
			.catch((error) => {
				res.status(500).json({
                    error,
                })
			});
    });
}