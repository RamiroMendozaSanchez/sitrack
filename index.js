const axios = require('axios');
const fs = require('fs');
const express = require('express');
const {MongoClient} = require('mongodb');
const units = require('./router/units');
const server = require('./router/serverInfo');
const os = require('os')

var ids = [];
var listIds = [];
var list = [];
const statusSendInfo = '';
const baseUrl = 'https://hst-api.wialon.us/wialon/ajax.html';
const token = 'a3bb803c27770ea3a0082be2b77c328eE86E433926A9FF64D7223EFB32D698699962043D';
const urlBD = 'mongodb://0.0.0.0:27017/';

async function getsid() {
    try {
        const response = await axios.get(`${baseUrl}?svc=token/login&params={ "token":"${token}" }`);
        var sid = response.data.eid;
        return sid
    } catch (error) {

    }
}

async function Groups(){
    fs.readFile("nameGroups.json", 'utf8', (err, data) => {
        if (err) {
            console.error('Error al leer el archivo:', err);
        } else {
            try {
                const datosJSON = JSON.parse(data);
                console.log('Contenido del archivo JSON Groups:');
                getIds(datosJSON);
            } catch (error) {
                console.error('Error al analizar el contenido JSON:', error);
            }
        }
    });
}

async function getIds(datosJSON) {
    var sid = await getsid();
    //const grupos = await Groups();
    console.log(datosJSON);
    // datosJSON.forEach(grupo => {
    //     console.log(grupo.name);
    // });
    for (const grupo of datosJSON) {
        //console.log(grupo.name);
        try {
            const response = await axios.get(`${baseUrl}?svc=core/search_items&params=
            {"spec":{"itemsType":"avl_unit_group","propName":"sys_name","propValueMask":"${grupo.name}*","sortType":"sys_name","propType":"property"},
            "force":1,"flags":1,"from":0,"to":0}&sid=${sid}`)
            const items = response.data.items;
            for (const item of items) {
                var ids = item.u
                for (const id of ids) {
                    const dataId = {
                        id:id
                    }
                    listIds.push(dataId);
                }
            }
            //console.log(response.data.items);
        } catch (error) {
            console.log(error);
        }
    }
    console.log(listIds);
    createJsonIds(listIds);
    getIdsJson();
}

function createJsonIds(listIds) {

    // Convertir el array en formato JSON
    const jsonData = JSON.stringify(listIds);

    // Escribir el contenido en un archivo
    fs.writeFile('ids.json', jsonData, 'utf8', (err) => {
        if (err) {
            console.error('Error al crear el archivo:', err);
        } else {
            console.log('Archivo JSON de Ids creado correctamente.');
        }
    });

    //console.log(list);
}

function getIdsJson() {
        fs.readFile("ids.json", 'utf8', (err, data) => {
            if (err) {
                console.error('Error al leer el archivo:', err);
            } else {
                try {
                    const datosJSON = JSON.parse(data);
                    console.log('Contenido del archivo JSON IDs:');
                    console.log(datosJSON);
                    for (const id of datosJSON) {
                        
                        ids.push(id.id);
                    }
                } catch (error) {
                    console.error('Error al analizar el contenido JSON:', error);
                }
            }
        });
        console.log(ids);
}

async function getUnits() {
    
    var sid = await getsid();
    const apiSitrackUrl = 'http://54.193.100.127:5175';
    //console.log(ids);
    
    for (const id of ids) {
        try {
            const response = await axios.get(`${baseUrl}?svc=core/search_item&params={"id":"${id}","flags":4611686018427387903}&sid=${sid}`);
            //console.log(response);
            const datos = response.data;
            //console.log(datos.item)

            const name = datos.item.nm;
            const imei = datos.item.uid;
            const utc = datos.item.pos.t;

            const timeObj = new Date(utc * 1000);
            const timeUTC = (timeObj.toISOString()).replace(/[TZ]/g, '');

            const latitud = datos.item.pos.y;
            const longitud = datos.item.pos.x;
            const angle = datos.item.pos.c;
            const satellite = datos.item.pos.sc;
            const velocidad = datos.item.pos.s;
            var battery_voltage = '';
            var gps_valid = '';
            const bv = 's_asgn1' in datos.item.lmsg.p ? battery_voltage = datos.item.lmsg.p.s_asgn1 : 'pwr_ext' in datos.item.lmsg.p ? battery_voltage = datos.item.lmsg.p.pwr_ext : battery_voltage = '0';
            const gpsV = 's_asgn4' in datos.item.lmsg.p ? gps_valid = datos.item.lmsg.p.s_asgn4 : 'valid' in datos.item.lmsg.p ? gps_valid = datos.item.lmsg.p.valid : 'gps_valid' in datos.item.lmsg.p ? gps_valid = datos.item.lmsg.p.gps_valid : gps_valid = 'V';
            var gps_validity = gps_valid == 1 ? 'A' : 'V';
            const data = {
                id: id,
                imei: imei,
                name: name,
                time: timeUTC,
                lat: latitud,
                log: longitud,
                ang: angle,
                sat: satellite,
                speed: velocidad,
                battery_voltage : battery_voltage,
                gps_validity : gps_validity
            };
            
            const dataSitrack = {
                imei_no: imei.toString(),
                lattitude: latitud.toString(),
                longitude: longitud.toString(),
                angle: angle.toString(),
                speed: velocidad.toString(),
                satellite: satellite.toString(),
                time: timeUTC.toString(),
                battery_voltage: battery_voltage.toString(),
                gps_validity: gps_validity.toString()
            }

            console.log(dataSitrack);
            console.log(`Envio a api de sitrack ${dataSitrack.imei_no}`);
            
            axios.post(apiSitrackUrl, dataSitrack)
            .then(response => {
               console.log('Respuesta del servidor', response.data);
            }).catch(error => {
               console.log('Error al hacer la solicitud:', error.message);
            });

            list.push(data);

            //createJson(name,utc,latitud,longitud,velocidad,id);
        } catch (error) {
            //console.error(error);
        }
    }
    console.log("Envio a api finalizado");
    createJson(list);
}
//function readUnitsJson() {

//}
async function getUnitsJson() {
    const api = express();
    const port = 3000;
    api.use('/',units);
    api.use('/server', server)
    api.listen(port, () => {
        console.log(`servidor en funcion en http://127.0.0.1:${port}`);
    })
}

async function createJson(list) {

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
    Groups();
    getUnitsJson();
    setInterval(() => {
        getUnits();
        list.splice(0, list.length);
    }, 60000);


}

// Llamamos a la función para obtener los usuarios
app();
