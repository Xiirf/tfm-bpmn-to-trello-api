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
    const { teamName, file } = req.body;

    if (!teamName || !file) {
        return res.status(400).json({
            error: 'Debe indicar el teamName y el fichero',
        })
    }

    readBPMN.getElementfromDiagram(xmlContent).then((data) => {
        var tasks = data.tasks;
        var boardName = data.boardName;
		console.log(JSON.stringify(tasks));

        if (!tasks){
            return res.status(400).json({
                error: 'No task in diagram',
            });
        }
        //Création du board
        createElement.createBoard(boardName)
            .then((idBoard) => {
				createElement.createList(idBoard, tasks)
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