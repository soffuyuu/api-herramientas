const http = require("node:http");
const url = require("node:url");
const puerto = 3000;
const fs = require("node:fs");

//leer directamente el JSON existente con las categorias
let arregloHerramientas = JSON.parse(fs.readFileSync("herramientas.json", "utf8"));

//Funcion para obtener todas las herramientas de todas las categoriams
function obtenerTodasLasHerramientas() {
    let herramientas = [];
    for (const categoria in arregloHerramientas) {
        herramientas = herramientas.concat(arregloHerramientas[categoria].herramienta);
    }
    return herramientas;
}

const server = http.createServer((request, response) => {
    response.setHeader("Access-Control-Allow-Origin", "*");
    response.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    response.setHeader("Access-Control-Allow-Headers", "Content-Type");

    if (request.method === "OPTIONS") {
        response.writeHead(204);
        response.end();
        return;
    }

    const parsedUrl = url.parse(request.url, true);
    const path = parsedUrl.pathname;

    //Descomponemos la ruta en partes para que quede como: /accesibilidadWeb/1
    const partesRuta = path.split('/').filter(Boolean); //Filtramos valores vacois
    const categoria = partesRuta[0]; // Primera parte es la categoria
    const idHerramienta = partesRuta[1]; // Segunda parte es el ID de la herramienta

    // Ruta principal - devuelve todas las herramientas
    if (path === "/") {
        if (request.method === "GET") {
            const objetoRespuesta = {
                "endpoints": regresarArregloEndpoints()
            };
            response.statusCode = 200;
            response.setHeader("Content-Type", "application/json; charset=utf-8");
            response.end(JSON.stringify(objetoRespuesta));
        } else if (request.method === "POST") {
            let body = "";
            request.on("data", chunk => {
                body += chunk.toString();
            });
            request.on("end", () => {
                const nuevaHerramienta = JSON.parse(body);
                nuevaHerramienta.id = obtenerTodasLasHerramientas().length > 0 ? obtenerTodasLasHerramientas().length + 1 : 1;

                arregloHerramientas.accesibilidadWeb.herramienta.push(nuevaHerramienta); 
                fs.writeFileSync("herramientas.json", JSON.stringify(arregloHerramientas, null, 2), "utf8");

                response.statusCode = 201;
                response.setHeader("Content-Type", "application/json; charset=utf-8");
                response.end(JSON.stringify({ mensaje: "Herramienta agregada satisfactoriamente" }));
            });
        }
    } else if (categoria && idHerramienta) {
        // Verificamos si la categoria existe en nuestro arreglo de herramientas
        if (arregloHerramientas[categoria] && arregloHerramientas[categoria].herramienta) {
            const herramientasCategoria = arregloHerramientas[categoria].herramienta;

            // Buscamos la herramienta en la categoria correspondiente
            const herramienta = herramientasCategoria.find(herr => herr.id.toString() === idHerramienta);

            if (!herramienta) {
                response.statusCode = 404;
                response.setHeader("Content-Type", "application/json; charset=utf-8");
                response.end(JSON.stringify({ mensaje: "Herramienta no encontrada en la categoría " + categoria }));
                return;
            }

            if (request.method === "GET") {
                response.statusCode = 200;
                response.setHeader("Content-Type", "application/json; charset=utf-8");
                response.end(JSON.stringify(herramienta));
            } else if (request.method === "PUT") {
                let body = "";
                request.on("data", chunk => {
                    body += chunk.toString();
                });
                request.on("end", () => {
                    const datosActualizados = JSON.parse(body);
                    Object.assign(herramienta, datosActualizados);
                    fs.writeFileSync("herramientas.json", JSON.stringify(arregloHerramientas, null, 2), "utf8");

                    response.statusCode = 200;
                    response.setHeader("Content-Type", "application/json; charset=utf-8");
                    response.end(JSON.stringify({ mensaje: "Herramienta actualizada satisfactoriamente" }));
                });
            } else if (request.method === "DELETE") {
                arregloHerramientas[categoria].herramienta = arregloHerramientas[categoria].herramienta.filter(herr => herr.id !== herramienta.id);
                fs.writeFileSync("herramientas.json", JSON.stringify(arregloHerramientas, null, 2), "utf8");

                response.statusCode = 200;
                response.setHeader("Content-Type", "application/json; charset=utf-8");
                response.end(JSON.stringify({ mensaje: "Herramienta eliminada satisfactoriamente" }));
            }
        } else {
            response.statusCode = 404;
            response.setHeader("Content-Type", "application/json; charset=utf-8");
            response.end(JSON.stringify({ mensaje: "Categoría no encontrada" }));
        }
    } else {
        response.statusCode = 404;
        response.setHeader("Content-Type", "application/json; charset=utf-8");
        response.end(JSON.stringify({ mensaje: "Ruta no válida" }));
    }
});

function regresarArregloEndpoints() {
    const categorias = ["accesibilidadWeb", "capacitacion", "disenoDeInterfaces", "desarrolloWeb"];
    const arregloHerramientas = [];

    categorias.forEach(categoria => {
        const herramientas = JSON.parse(fs.readFileSync("herramientas.json", "utf8"))[categoria].herramienta;

        herramientas.forEach(herramienta => {
            arregloHerramientas.push({
                "id": herramienta.id,
                "categoria": categoria,
                "name": herramienta.titulo,
                "endpoint": `http://localhost:${puerto}/${categoria}/${herramienta.id}`
            });
        });
    });

    return arregloHerramientas;
}

server.listen(puerto, () => {
    console.log("Servidor de VisionUX Lab encendido! Ejecutándose en http://localhost:" + puerto);
});
