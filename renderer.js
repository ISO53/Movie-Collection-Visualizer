// ******************** Declare Variables ********************
const {ipcRenderer} = require("electron");

// ************************ JS Starts ************************
getMessageFromMain("popup", popupHandler);
getMessageFromMain("movie-db-status", updateMovieDbStatus);
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

function popupHandler(arg) {
    const popupID = arg.substring(2);

    if (arg.startsWith("o")) {
        // Open popup
        document.getElementById(popupID).classList.remove("hide_popup");
        document.getElementById("blur_background").classList.add("blur");
    } else {
        // Close popup
        document.getElementById(popupID).classList.add("hide_popup");
        document.getElementById("blur_background").classList.remove("blur");
    }
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
    const statusElm = document.getElementById("db_status");
    if (status.startsWith("l")) {
        // Loading
        const extractedStatus = status.substring(1);
        const parts = extractedStatus.split("/");
        const firstNumber = parseInt(parts[0], 10);
        const secondNumber = parseInt(parts[1], 10);

        statusElm.innerHTML = `${firstNumber} out of ${secondNumber} completed.`;
        document.getElementById("loaded_amount_div").style.width = (firstNumber / secondNumber) * 100 + "%";
    } else if (status.startsWith("a")) {
        // Almost done
        statusElm.innerHTML = "We're nearing completion. Please hold for the final steps.";
    } else if (status.startsWith("d")) {
        // Done
        statusElm.innerHTML = "The database has been successfully created. You may now close this window.";
    } else {
        console.log("something went wrong", status);
    }
}
