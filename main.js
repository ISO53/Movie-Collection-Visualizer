// ******************** Declare Variables ********************
const {app, BrowserWindow, Menu, ipcMain, dialog} = require("electron");
const fs = require("fs");
const path = require("path");

var win;
var KEY;

// ************************ JS Starts ************************
app.whenReady().then(createWindow);
app.on("window-all-closed", () => process.platform !== "darwin" && app.quit());
getMessageFromRenderer("open-file-system", openFileSystem);
getMessageFromRenderer("omdb-api-key", setOmdbApiKey);

// ******************** Declare Functions ********************
function createWindow() {
    win = new BrowserWindow({
        width: 800,
        height: 600,
        autoHideMenuBar: false,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
            devTools: true,
            contentSecurityPolicy: "script-src 'self' 'unsafe-inline';",
        },
    });

    win.loadFile("index.html");
    win.maximize();

    const menu = Menu.buildFromTemplate([
        {
            label: "File",
            submenu: [{role: "quit"}, {label: "Import Movies", click: () => sendMessageToRenderer("open-import-movies-popup")}],
        },
        {
            label: "Settings",
            submenu: [{label: "OMDB Api", click: () => sendMessageToRenderer("open-omdb-api-popup")}],
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
                    sendMessageToRenderer("close-import-movies-popup", ".");
                    sendMessageToRenderer("open-db-create-popup", ".");
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
                    sendMessageToRenderer("close-import-movies-popup", ".");
                    sendMessageToRenderer("open-db-create-popup", ".");
                    readAndParseCsv(selectedCsvFile).then(writeFoldersToJson).catch(console.error);
                }
            })
            .catch(console.error);
    }
}

function getFolderNames(folderPath) {
    const folderNames = [];

    function traverseFolder(currentPath) {
        const files = fs.readdirSync(currentPath);

        files.forEach((file) => {
            const filePath = path.join(currentPath, file);

            if (fs.statSync(filePath).isDirectory()) {
                folderNames.push(file);
                traverseFolder(filePath);
            }
        });
    }

    traverseFolder(folderPath);
    return folderNames;
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
            movieDetailsArray.push(movieDetails);
        }

        sendMessageToRenderer("movie-db-status-loading", `${i + 1}/${movieNames.length}`);
    }

    sendMessageToRenderer("movie-db-status-almost", ".");

    try {
        fs.writeFile(jsonFilePath, JSON.stringify(movieDetailsArray), "utf-8", callback);
        console.log(`Movie details written to ${jsonFilePath}`);
        sendMessageToRenderer("movie-db-status-done", ".");
    } catch (error) {
        console.error("Error writing to JSON file:", error.message);
    }
}

function callback() {
    console.log("DONE");
}

function setOmdbApiKey(key) {
    KEY = key;
    const jsonFilePath = path.join(__dirname, "res", "key.json");
    fs.writeFileSync(jsonFilePath, JSON.stringify({key: key}), "utf-8");
    sendMessageToRenderer("close-omdb-api-popup", ".");
}
