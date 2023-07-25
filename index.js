const axios = require('axios');
const { log, Console } = require('console');
const fs = require('fs');
const express = require('express');

var ids = [18441592
    , 16018352
    , 15960748
    , 26497815
    , 26481991
    , 16464642
    , 26481998
    , 19480674
    , 25241733
    , 25241711
    , 25241772
    , 24835874
    , 24836021
    , 23624090
    , 26481982
    , 26481986
    , 26481993
    , 19645652
    , 26041095
    , 15821193];
var list = [];
async function getsid() {
    const token = 'a3bb803c27770ea3a0082be2b77c328eE86E433926A9FF64D7223EFB32D698699962043D';
    try {
        const response = await axios.get('https://hst-api.wialon.us/wialon/ajax.html?svc=token/login&params={ "token":"a3bb803c27770ea3a0082be2b77c328eE86E433926A9FF64D7223EFB32D698699962043D" }');
        var sid = response.data.eid;
        return sid
    } catch (error) {

    }
}

async function getUnits(ids) {
    var sid = await getsid();

    //console.log(ids);

    for (const id of ids) {
        try {
            const response = await axios.get('https://hst-api.wialon.us/wialon/ajax.html?svc=core/search_item&params={"id":' + id + ',"flags":4611686018427387903}&sid=' + sid + '');
            //console.log(response);
            const datos = response.data;
            console.log(datos.item)

            const name = datos.item.nm;
            const imei = datos.item.uid;
            const utc = datos.item.pos.t;

            const timeObj = new Date(utc * 1000);
            const timeUTC = timeObj.toISOString();

            const latitud = datos.item.pos.y;
            const longitud = datos.item.pos.x;
            const angle = datos.item.pos.c;
            const satellite = datos.item.pos.sc;
            const velocidad = datos.item.pos.s;


            const data = {
                id: id,
                imei: imei,
                name: name,
                time: timeUTC,
                lat: latitud,
                log: longitud,
                ang: angle,
                sat: satellite,
                speed: velocidad
            };

            list.push(data);

            //createJson(name,utc,latitud,longitud,velocidad,id);
        } catch (error) {
            //console.error(error);
        }
    }
    createJson(list);
}
//function readUnitsJson() {

//}

async function getUnitsJson() {
    const api = express();
    const port = 3000;
    const nombreArchivo = 'datos.json';
    api.get('/unit', (req, res) => {

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
    api.listen(port, () => {
        console.log(`servidor en funcion en http://127.0.0.1:${port}`);
    })
}

function createJson(list) {

    // Convertir el array en formato JSON
    const jsonData = JSON.stringify(list);

    // Escribir el contenido en un archivo
    fs.writeFile('datos.json', jsonData, 'utf8', (err) => {
        if (err) {
            console.error('Error al crear el archivo:', err);
        } else {
            console.log('Archivo JSON creado correctamente.');
        }
    });

    //console.log(list);


}



function app() {
    getUnitsJson();
    setInterval(() => {
        getUnits(ids);
        list.splice(0, list.length);
    }, 15000);


}

// Llamamos a la función para obtener los usuarios
app();
