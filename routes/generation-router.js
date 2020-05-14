const express = require('express');
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const GenCtrl = require('../controllers/generation-ctrl');

const router = express.Router();

router.post('/generate', GenCtrl.generate);

// Swagger set up
const options = {
    swaggerDefinition: {
      openapi: "3.0.0",
      info: {
        title: "TFM-BPMN-To-Trello-API",
        version: "1.0.0",
        description:
          "Documentation API TFM-BPMN-To-Trello",
        license: {
          name: "MIT",
          url: "https://choosealicense.com/licenses/mit/"
        },
        contact: {
          name: "Swagger",
          url: "https://swagger.io",
          email: "Info@SmartBear.com"
        },
      },
      components: {
        securitySchemes: {
          bearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
          }
        }
      },
      security: [{
        bearerAuth: []
      }],
      servers: [
        {
          url: process.env.urlApp
        }
      ]
    },
    apis: ["./controllers/generation-ctrl.js"],        
  };
  const specs = swaggerJsdoc(options);
  router.use("/docs", swaggerUi.serve);
  router.get(
    "/docs",
    swaggerUi.setup(specs, {
      explorer: true
    })
  );


router.get("/docs", swaggerUi.setup(specs, { explorer: true }));

module.exports = router