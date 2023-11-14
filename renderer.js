// ******************** Declare Variables ********************
const {ipcRenderer} = require("electron");

// ************************ JS Starts ************************
getMessageFromMain("open-import-movies-popup", openImportMoviesPopup);
getMessageFromMain("open-omdb-api-popup", openOmdbApiPopup);
getMessageFromMain("close-omdb-api-popup", closeOmdbApiPopup);
getMessageFromMain("open-db-create-popup", openDbCreatePopup);
getMessageFromMain("movie-db-status-loading", updateMovieDbStatus);
getMessageFromMain("close-import-movies-popup", closeImportMoviesPopup);
popupCloseButtonListener();
importFromFileSystemButtonListener();
importFromCSVButtonListener();
omdbApiButtonListener();

// ******************** Declare Functions ********************
function sendMessageToMain(channel, message) {
    ipcRenderer.send(channel, message);
}

function getMessageFromMain(channel, handler) {
    ipcRenderer.on(channel, (event, arg) => {
        handler(arg);
    });
}

function openImportMoviesPopup() {
    document.getElementById("import_movies_div").classList.remove("hide_popup");
    document.getElementById("blur_background").classList.add("blur");
}

function openOmdbApiPopup() {
    document.getElementById("omdb_api_div").classList.remove("hide_popup");
    document.getElementById("blur_background").classList.add("blur");
}

function openDbCreatePopup() {
    document.getElementById("create_movies_library_div").classList.remove("hide_popup");
    document.getElementById("blur_background").classList.add("blur");
}

function closeOmdbApiPopup() {
    document.getElementById("omdb_api_div").classList.add("hide_popup");
    document.getElementById("blur_background").classList.remove("blur");
}

function closeImportMoviesPopup() {
    document.getElementById("import_movies_div").classList.add("hide_popup");
    document.getElementById("blur_background").classList.remove("blur");
}

function popupCloseButtonListener() {
    document.querySelectorAll(".popup_close_button").forEach((closeButton) => {
        closeButton.addEventListener("click", () => {
            closeButton.parentNode.classList.add("hide_popup");
            document.getElementById("blur_background").classList.remove("blur");
        });
    });
}

function importFromFileSystemButtonListener() {
    document.getElementById("import_from_file_system_button").addEventListener("click", () => {
        sendMessageToMain("open-file-system", "dir");
    });
}

function importFromCSVButtonListener() {
    document.getElementById("import_from_csv_button").addEventListener("click", () => {
        sendMessageToMain("open-file-system", "csv");
    });
}

function omdbApiButtonListener() {
    document.getElementById("omdb_api_button").addEventListener("click", () => {
        const key = document.getElementById("omdb_api_input").value;
        sendMessageToMain("omdb-api-key", key);
    });
}

function updateMovieDbStatus(status) {
    document.getElementById("db_status").innerHTML = status;

    const parts = status.split("/");

    const firstNumber = parseInt(parts[0], 10);
    const secondNumber = parseInt(parts[1], 10);

    document.getElementById("loaded_amount_div").style.width = (firstNumber / secondNumber * 100) + "%";
}
