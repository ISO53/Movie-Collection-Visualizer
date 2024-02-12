// ******************** Declare Variables ********************
const {app, BrowserWindow, Menu, ipcMain, dialog} = require("electron");
const fs = require("fs-extra");
const path = require("path");
const readline = require("readline");
const ptn = require("parse-torrent-name");
const {marked} = require("marked");

const USER_DATA_PATH = app.getPath("userData");

var win;
var KEY;

// ************************ JS Starts ************************
app.whenReady().then(createWindow).then(startApp);

// ******************** Declare Functions ********************
function startApp() {
    app.on("window-all-closed", () => process.platform !== "darwin" && app.quit());
    createJsonFiles();
    getMessageFromRenderer("open-file-system", openFileSystem);
    getMessageFromRenderer("omdb-api-key", setOmdbApiKey);
    getMessageFromRenderer("movie", movieHandler);
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
            submenu: [
                {role: "quit"},
                {label: "Import Movies", click: () => sendMessageToRenderer("popup", "o_import_movies_div")},
                {label: "Refresh Movies", click: () => sendMessageToRenderer("movies", "refresh")},
            ],
        },
        {
            label: "Settings",
            submenu: [{label: "OMDB Api", click: () => sendMessageToRenderer("popup", "o_omdb_api_div")}],
        },
        {
            label: "Help",
            submenu: [
                {label: "First Time", click: () => sendMessageToRenderer("popup", "o_first_time_div")},
                {label: "Want to Contribute", click: () => sendMessageToRenderer("popup", "o_want_to_contribute_div")},
                {label: "Check Updates", click: () => checkUpdates() && sendMessageToRenderer("popup", "o_check_updates_div")},
                {label: "About", click: () => sendMessageToRenderer("popup", "o_about_div")},
            ],
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
    switch (arg) {
        case "dir":
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
            break;
        case "txt":
            dialog
                .showOpenDialog(win, {
                    title: "Open TXT File",
                    filters: [{name: "TXT Files", extensions: ["txt"]}],
                    properties: ["openFile"],
                })
                .then((result) => {
                    if (!result.canceled) {
                        const selectedTxtFile = result.filePaths[0];
                        sendMessageToRenderer("popup", "c_import_movies_div");
                        sendMessageToRenderer("popup", "o_create_movies_library_div");
                        readAndParseTxt(selectedTxtFile).then(writeFoldersToJson).catch(console.error);
                    }
                })
                .catch(console.error);
            break;
        case "tor":
            dialog
                .showOpenDialog(win, {
                    title: "Select Folder",
                    properties: ["openDirectory"],
                })
                .then((result) => {
                    if (!result.canceled) {
                        const selectedFolder = result.filePaths[0];
                        const movies = getVideoFileNames(selectedFolder).map((torrentMovieName) => ptn(torrentMovieName).title);
                        sendMessageToRenderer("popup", "c_import_movies_div");
                        sendMessageToRenderer("popup", "o_create_movies_library_div");
                        writeFoldersToJson(movies);
                    }
                })
                .catch(console.error);
            break;
        default:
            break;
    }
}

function getFolderNames(folderPath) {
    const folderNamesSet = new Set();

    function traverseFolder(currentPath) {
        const files = fs.readdirSync(currentPath);

        files.forEach((file) => {
            const filePath = path.join(currentPath, file);

            if (fs.statSync(filePath).isDirectory()) {
                const subDirectories = fs
                    .readdirSync(filePath)
                    .filter((subFile) => fs.statSync(`${filePath}/${subFile}`).isDirectory());

                if (subDirectories.length === 0) {
                    folderNamesSet.add(file);
                }
                traverseFolder(filePath);
            }
        });
    }

    traverseFolder(folderPath);

    // Convert the Set to an array before returning
    return Array.from(folderNamesSet);
}

function getVideoFileNames(folderPath) {
    const videoFileNamesSet = new Set();
    const videoExtensions = [".mp4", ".avi", ".mkv", ".mov", ".wmv", ".flv"];

    function traverseFolder(currentPath) {
        const files = fs.readdirSync(currentPath);

        files.forEach((file) => {
            const filePath = path.join(currentPath, file);

            if (fs.statSync(filePath).isDirectory()) {
                traverseFolder(filePath);
            } else {
                const ext = path.extname(file).toLowerCase();

                if (videoExtensions.includes(ext)) {
                    videoFileNamesSet.add(file);
                }
            }
        });
    }

    traverseFolder(folderPath);

    // Convert the Set to an array before returning
    return Array.from(videoFileNamesSet);
}

function readAndParseTxt(filePath) {
    return new Promise((resolve, reject) => {
        const lines = [];

        const rl = readline.createInterface({
            input: fs.createReadStream(filePath),
            crlfDelay: Infinity, // Recognize both '\r\n' and '\n' as line endings
        });

        rl.on("line", (line) => {
            lines.push(line);
        });

        rl.on("close", () => {
            resolve(lines);
        });

        rl.on("error", (err) => {
            reject(err);
        });
    });
}

async function writeFoldersToJson(movieNames) {
    const movieDetailsArray = [];
    const jsonFilePath = path.join(USER_DATA_PATH, "res", "db.json");

    async function fetchMovieDetails(movieName) {
        const apiUrl = `https://www.omdbapi.com/?t=${encodeURIComponent(movieName)}&apikey=${KEY}`;

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

    let totalTime = 0; // Total time spent on fetching
    let averageTime = 0; // Average fetching time

    for (let i = 0; i < movieNames.length; i++) {
        // start fetch time
        const startTime = new Date();

        const movieDetails = await fetchMovieDetails(movieNames[i]);

        if (movieDetails) {
            // Add downloaded poster path to movie data
            if (movieDetails.Poster && movieDetails.Poster != "N/A") {
                downloadImage(movieDetails.Poster, movieDetails.Title);
                movieDetails.PosterPath = path.join(app.getAppPath(), "res", "posters", `${movieDetails.Title}.jpg`);
            }

            // Add file name for movie to movie data
            movieDetails.fileName = movieNames[i];

            movieDetailsArray.push(movieDetails);
        }

        // end fetch time
        const endTime = new Date();

        // calculate time difference
        const timeDiff = (endTime - startTime) / 1000;
        totalTime += timeDiff;
        averageTime = totalTime / (i + 1);

        // Calculate estimated time remaining
        const remainingTime = averageTime * (movieNames.length - (i + 1));

        sendMessageToRenderer(
            "movie-db-status",
            "l" +
                JSON.stringify({
                    progress: `${i + 1}/${movieNames.length}`,
                    remainingTime: remainingTime.toFixed(0),
                })
        );

        const progressPercent = (i + 1) / movieNames.length;
        win.setProgressBar(progressPercent < 1 ? progressPercent : -1);
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
    const jsonFilePath = path.join(USER_DATA_PATH, "res", "key.json");
    fs.writeFileSync(jsonFilePath, JSON.stringify({key: key}), "utf-8");
    sendMessageToRenderer("popup", "c_omdb_api_div");
}

async function readOmdbApiKeyFromFile() {
    try {
        const filePath = path.join(USER_DATA_PATH, "res", "key.json");
        fs.readFile(filePath, "utf-8", (err, jsonStr) => {
            if (err) {
                console.log("Something went wrong trying to read JSON file.");
            }

            let jsonContent;
            try {
                jsonContent = JSON.parse(jsonStr);
            } catch (error) {
                console.error("There was an error parsing json file.");
                return;
            }

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
        const folderPath = path.join(USER_DATA_PATH, "res", "posters");

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

function movieHandler(arg) {
    const [opt, imdbID] = arg.split(",");

    fs.readFile(path.join(USER_DATA_PATH, "res", "db.json"), "utf-8", (err, data) => {
        if (err) {
            console.error("Error reading JSON file:", err.message);
            return;
        }

        try {
            let jsonData;
            try {
                jsonData = JSON.parse(data);
            } catch (error) {
                console.error("There was an error parsing json file.");
                return;
            }

            if (opt === "remove") {
                // Find the index of the object with the wrong movie id
                const indexToRemove = jsonData.findIndex((movie) => movie.imdbID === imdbID);

                // Remove the object with the wrong movie name
                if (indexToRemove !== -1) {
                    jsonData.splice(indexToRemove, 1);
                } else {
                    console.log("Movie not found in the JSON data.");
                }

                // Write modified json to file
                fs.writeFileSync(path.join(USER_DATA_PATH, "res", "db.json"), JSON.stringify(jsonData, null, 2));
                console.log("Update successful. JSON file has been modified.");
            } else if (opt === "add") {
                fetch(`https://www.omdbapi.com/?i=${imdbID}&apikey=${KEY}`)
                    .then((response) => {
                        if (!response.ok) {
                            throw new Error(`HTTP error! Status: ${response.status}`);
                        }
                        return response.json();
                    })
                    .then((data) => {
                        // Download poster image for the movie
                        downloadImage(data.Poster, data.Title);
                        data.PosterPath = path.join(USER_DATA_PATH, "res", "posters", `${data.Title}.jpg`);

                        // Modify the data object
                        jsonData.push(data);

                        // Write modified json to file
                        fs.writeFileSync(path.join(USER_DATA_PATH, "res", "db.json"), JSON.stringify(jsonData, null, 2));
                        console.log("Update successful. JSON file has been modified.");
                    })
                    .catch((error) => {
                        console.error("Error fetching movie details:", error);
                    });
            } else if (opt === "removeWithFileName") {
                // Here imdbID variable is actually filename
                // Find the index of the object with the filename
                const indexToRemove = jsonData.findIndex((movie) => movie.fileName === imdbID);

                // Remove the object
                if (indexToRemove !== -1) {
                    jsonData.splice(indexToRemove, 1);
                } else {
                    console.log("Movie not found in the JSON data.");
                }

                // Write modified json to file
                fs.writeFileSync(path.join(USER_DATA_PATH, "res", "db.json"), JSON.stringify(jsonData, null, 2));
                console.log("Update successful. JSON file has been modified.");
            }
        } catch (parseError) {
            console.error("Error parsing JSON:", parseError.message);
        }
    });
}

function checkUpdates() {
    fetch("https://api.github.com/repos/iso53/Movie-Collection-Visualizer/releases/latest")
        .then((response) => {
            if (!response.ok) {
                return null;
            }
            return response.json();
        })
        .then((releaseData) => {
            if (releaseData === null) {
                console.log(`Failed to fetch latest release. Status: ${response.status}`);
                sendMessageToRenderer("update", "error");
                return;
            }

            if (releaseData.tag_name !== app.getVersion()) {
                console.log("VERSION", app.getVersion());
                let releaseDataFormattedbody = marked.parse(releaseData.body);
                sendMessageToRenderer("update", releaseDataFormattedbody);
            } else {
                sendMessageToRenderer("update", "no");
            }
        })
        .catch((error) => {
            console.error("Error checking for updates:", error.message);
        });

    return true;
}

function createJsonFiles() {
    // res
    fs.ensureDirSync(path.dirname(USER_DATA_PATH));

    // res/posters
    fs.ensureDirSync(path.dirname(path.join(USER_DATA_PATH, "posters")));

    // Create an empty db.json file if it doesn't exist
    const dbJsonPath = "res/db.json";
    if (!fs.existsSync(path.join(USER_DATA_PATH, dbJsonPath))) {
        try {
            fs.writeFileSync(path.join(USER_DATA_PATH, dbJsonPath), "{}", "utf-8");
            console.log("res/db.json successfully written to ", path.join(USER_DATA_PATH, dbJsonPath));
        } catch (error) {
            console.error("Error writing file:", error.message);
        }
    }

    // Create an empty key.json file if it doesn't exist
    const keyJsonPath = "res/key.json";
    if (!fs.existsSync(path.join(USER_DATA_PATH, keyJsonPath))) {
        try {
            fs.writeFileSync(path.join(USER_DATA_PATH, keyJsonPath), "{}", "utf-8");
            console.log(keyJsonPath, " successfully written to ", path.join(USER_DATA_PATH, keyJsonPath));
        } catch (error) {
            console.error("Error writing file:", error.message);
        }
    }
}
