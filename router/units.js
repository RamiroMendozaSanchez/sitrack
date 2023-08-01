const express = require('express');
const fs = require('fs');
const router = express.Router();
const cors = require('cors');

const nombreArchivo = 'datos.json';
router.use(cors());
router.get('/unit', (req, res) => {
    console.log("API");

    fs.readFile(nombreArchivo, 'utf8', (err, data) => {
        if (err) {
            console.error('Error al leer el archivo:', err);
        } else {
            try {
                const datosJSON = JSON.parse(data);
                console.log('Contenido del archivo JSON:');
                res.json(datosJSON);
                return datosJSON;
            } catch (error) {
                console.error('Error al analizar el contenido JSON:', error);
            }
        }
    });
});

module.exports = router;
