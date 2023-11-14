// ******************** Declare Variables ********************
const {app, BrowserWindow, Menu, ipcMain, dialog} = require("electron");
const fs = require("fs");
const path = require("path");

let win;

// ************************ JS Starts ************************
app.whenReady().then(createWindow);
app.on("window-all-closed", () => process.platform !== "darwin" && app.quit());
getMessageFromRenderer("open-file-system", openFileSystem);

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

                    readAndParseCsv(selectedCsvFile)
                        .then(writeFoldersToJson)
                        .catch(console.error);
                }
            })
            .catch(console.error);
    }

    console.log(movies);
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

function writeFoldersToJson(folderNames) {
    const jsonFilePath = path.join(__dirname, "db.json");
    const folderObjects = folderNames.map((folderName) => ({folderName}));

    fs.writeFileSync(jsonFilePath, JSON.stringify(folderObjects, null, 2), "utf-8");
    console.log("Folders written to JSON file.");
}
