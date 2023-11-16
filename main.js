// ******************** Declare Variables ********************
const {app, BrowserWindow, Menu, ipcMain, dialog} = require("electron");
const fs = require("fs");
const path = require("path");

var win;
var KEY;

// ************************ JS Starts ************************
app.whenReady().then(createWindow).then(startApp);

// ******************** Declare Functions ********************
function startApp() {
    app.on("window-all-closed", () => process.platform !== "darwin" && app.quit());
    getMessageFromRenderer("open-file-system", openFileSystem);
    getMessageFromRenderer("omdb-api-key", setOmdbApiKey);
    readOmdbApiKeyFromFile();
    sendMessageToRenderer("movie-db-status", "d");
}

function createWindow() {
    win = new BrowserWindow({
        width: 800,
        height: 600,
        autoHideMenuBar: false,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
            // devTools: true,
            contentSecurityPolicy: "script-src 'self' 'unsafe-inline';",
        },
    });

    win.loadFile("index.html");
    win.maximize();
    // win.webContents.openDevTools();

    const menu = Menu.buildFromTemplate([
        {
            label: "File",
            submenu: [{role: "quit"}, {label: "Import Movies", click: () => sendMessageToRenderer("popup", "o_import_movies_div")}],
        },
        {
            label: "Settings",
            submenu: [{label: "OMDB Api", click: () => sendMessageToRenderer("popup", "o_omdb_api_div")}],
        },
    ]);

    Menu.setApplicationMenu(menu);
}

function sendMessageToRenderer(channel, message) {
    if (win && !win.isDestroyed()) {
        win.webContents.send(channel, message);
    }
}

function getMessageFromRenderer(channel, handler) {
    ipcMain.on(channel, (event, arg) => {
        handler(arg);
    });
}

function openFileSystem(arg) {
    if (arg === "dir") {
        dialog
            .showOpenDialog(win, {
                title: "Select Folder",
                properties: ["openDirectory"],
            })
            .then((result) => {
                if (!result.canceled) {
                    const selectedFolder = result.filePaths[0];
                    const movies = getFolderNames(selectedFolder);
                    sendMessageToRenderer("popup", "c_import_movies_div");
                    sendMessageToRenderer("popup", "o_create_movies_library_div");
                    writeFoldersToJson(movies);
                }
            })
            .catch(console.error);
    } else {
        dialog
            .showOpenDialog(win, {
                title: "Open CSV File",
                filters: [{name: "CSV Files", extensions: ["csv"]}],
                properties: ["openFile"],
            })
            .then((result) => {
                if (!result.canceled) {
                    const selectedCsvFile = result.filePaths[0];
                    sendMessageToRenderer("popup", "c_import_movies_div");
                    sendMessageToRenderer("popup", "o_create_movies_library_div");
                    readAndParseCsv(selectedCsvFile).then(writeFoldersToJson).catch(console.error);
                }
            })
            .catch(console.error);
    }
}

function getFolderNames(folderPath) {
    const folderNamesSet = new Set();

    function traverseFolder(currentPath) {
        const files = fs.readdirSync(currentPath);

        files.forEach((file) => {
            const filePath = path.join(currentPath, file);

            if (fs.statSync(filePath).isDirectory()) {
                folderNamesSet.add(file);
                traverseFolder(filePath);
            }
        });
    }

    traverseFolder(folderPath);

    // Convert the Set to an array before returning
    return Array.from(folderNamesSet);
}

function readAndParseCsv(filePath) {
    const csvData = fs.readFileSync(filePath, "utf-8");

    return new Promise((resolve, reject) => {
        parse(
            csvData,
            {
                columns: true,
                skip_empty_lines: true,
            },
            (err, records) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(records);
                }
            }
        );
    });
}

async function writeFoldersToJson(movieNames) {
    const movieDetailsArray = [];
    const nonFoundMovies = [];
    const jsonFilePath = path.join(__dirname, "res", "db.json");

    async function fetchMovieDetails(movieName) {
        const apiUrl = `http://www.omdbapi.com/?t=${encodeURIComponent(movieName)}&apikey=${KEY}`;

        try {
            const response = await fetch(apiUrl);

            if (!response.ok) {
                throw new Error(`Error fetching details for ${movieName}: ${response.statusText}`);
            }

            return await response.json();
        } catch (error) {
            console.error(error.message);
            return null;
        }
    }

    for (let i = 0; i < movieNames.length; i++) {
        const movieDetails = await fetchMovieDetails(movieNames[i]);

        if (movieDetails) {
            // if (movieDetails.Poster) {
            //     downloadImage(movieDetails.Poster, movieDetails.Title);
            //     movieDetails.PosterPath = path.join(__dirname, "res", "posters", `${movieDetails.Title}.jpg`);
            // }

            movieDetailsArray.push(movieDetails);
        } else {
            nonFoundMovies.push(movieNames[i]);
        }

        sendMessageToRenderer("movie-db-status", `l${i + 1}/${movieNames.length}`);
    }

    if (nonFoundMovies.length > 0) {
        console.log("Some movies couldn't be found. Here are the names:");
        console.log(nonFoundMovies);
    }


    sendMessageToRenderer("movie-db-status", "a");

    try {
        fs.writeFile(jsonFilePath, JSON.stringify(movieDetailsArray), "utf-8", () => {
            console.log(`Movie details written to ${jsonFilePath}`);
            sendMessageToRenderer("movie-db-status", "d");
        });
    } catch (error) {
        console.error("Error writing to JSON file:", error.message);
    }
}

function setOmdbApiKey(key) {
    KEY = key;
    const jsonFilePath = path.join(__dirname, "res", "key.json");
    fs.writeFileSync(jsonFilePath, JSON.stringify({key: key}), "utf-8");
    sendMessageToRenderer("popup", "c_omdb_api_div");
}

async function readOmdbApiKeyFromFile() {
    try {
        const filePath = path.join(__dirname, "res", "key.json");
        fs.readFile(filePath, "utf-8", (err, jsonStr) => {
            if (err) {
                console.log("Something went wrong trying to read JSON file.");
            }

            const jsonContent = JSON.parse(jsonStr);

            if (jsonContent && jsonContent.key) {
                KEY = jsonContent.key;
            } else {
                console.error("Invalid JSON file format or missing key.");
            }
        });
    } catch (error) {
        console.error("Error reading JSON file:", error.message);
    }
}

async function downloadImage(url, fileName) {
    try {
        const response = await fetch(url);
        const folderPath = path.join(__dirname, "res", "posters");

        // Ensure the folder exists
        if (!fs.existsSync(folderPath)) {
            fs.mkdirSync(folderPath, {recursive: true});
        }

        // Get the image blob from the response
        const blob = await response.blob();

        // Create a ReadableStream from the blob
        const stream = fs.createWriteStream(path.join(folderPath, `${fileName}.jpg`));
        await new Promise((resolve, reject) => {
            const reader = blob.stream().getReader();
            reader.read().then(function process({done, value}) {
                if (done) {
                    resolve();
                    return;
                }
                stream.write(Buffer.from(value));
                reader.read().then(process);
            });
        });

        console.log(`Image downloaded and saved.`);
    } catch (error) {
        console.error("Error downloading image:", error.message);
    }
}
