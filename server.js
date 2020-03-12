const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

const userRouter = require('./routes/generation-router');

const app = express()

const apiPort = (process.env.PORT || 8000);

app.use(bodyParser.urlencoded({ extended: true }))
app.use(cors())
app.use(bodyParser.json())

app.get('/', (req, res) => {
    res.send('API TFM-BPMN-TO-TRELLO');
})

app.use('/api/v1', userRouter)

app.listen(apiPort, () => console.log(`Server running on port ${apiPort}`));