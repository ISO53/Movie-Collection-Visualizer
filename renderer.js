// ******************** Declare Variables ********************
const {ipcRenderer} = require("electron");
const fs = require("fs");
const path = require("path");
var KEY;

// ************************ JS Starts ************************
getMessageFromMain("popup", popupHandler);
getMessageFromMain("movie-db-status", updateMovieDbStatus);
getMessageFromMain("movies", movieHandler);
popupCloseButtonListener();
importFromFileSystemButtonListener();
importFromTXTButtonListener();
omdbApiButtonListener();
readMoviesFromFile();
readOmdbApiKeyFromFile();
rightMovieSearchButtonListener();
chooseRightMovieButtonListener();

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

function movieHandler(arg) {
    if (arg == "refresh") {
        readMoviesFromFile();
    }
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

function importFromTXTButtonListener() {
    document.getElementById("import_from_txt_button").addEventListener("click", () => {
        sendMessageToMain("open-file-system", "txt");
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
        readMoviesFromFile();
    } else {
        console.log("something went wrong", status);
    }
}

async function readMoviesFromFile() {
    try {
        const filePath = path.join(__dirname, "res", "db.json");
        fs.readFile(filePath, "utf-8", (err, jsonStr) => {
            if (err) {
                console.log("Something went wrong trying to read JSON file.");
            }

            const jsonContent = JSON.parse(jsonStr);
            listMoviesOnGUI(jsonContent);
        });
    } catch (error) {
        console.error("Error reading JSON file:", error.message);
    }
}

function listMoviesOnGUI(movies) {
    let moviesDiv = document.getElementById("movies_div");
    moviesDiv.innerHTML = "";

    movies.forEach((movie) => {
        var movieDiv = document.createElement("div");
        movieDiv.className = "movie_div";
        movieDiv.id = movie.imdbID;

        var posterAndRatingDiv = document.createElement("div");
        posterAndRatingDiv.className = "movie_poster_and_rating";

        var posterImg = document.createElement("img");
        posterImg.className = "movie_poster";
        posterImg.src = !movie.PosterPath ? path.join(__dirname, "res", "img", "not_available.png") : movie.PosterPath;

        var ratingH2 = document.createElement("h2");
        ratingH2.className = "movie_rating";
        ratingH2.textContent = movie.imdbRating === "N/A" || !movie.imdbRating ? "?" : movie.imdbRating;

        posterAndRatingDiv.appendChild(posterImg);
        posterAndRatingDiv.appendChild(ratingH2);

        var nameGenresAndMoreDiv = document.createElement("div");
        nameGenresAndMoreDiv.className = "movie_name_genres_and_more";

        var problemDiv = document.createElement("div");
        problemDiv.className = "problem_div";
        problemDiv.innerHTML = "⋮";

        var problemPopupDiv = document.createElement("div");
        problemPopupDiv.className = "problem_popup_div";
        problemPopupDiv.classList.add("hide");
        problemDiv.appendChild(problemPopupDiv);

        var problemPopupElementWrong = document.createElement("h2");
        problemPopupElementWrong.textContent = "Wrong Movie/Poster?";
        problemPopupElementWrong.className = "problem_popup_element";
        problemPopupDiv.appendChild(problemPopupElementWrong);

        var problemPopupDeleteMovie = document.createElement("h2");
        problemPopupDeleteMovie.textContent = "Delete This Movie";
        problemPopupDeleteMovie.className = "problem_popup_element";
        problemPopupDiv.appendChild(problemPopupDeleteMovie);

        var nameAndGenresDiv = document.createElement("div");
        nameAndGenresDiv.className = "movie_name_and_genres";

        var nameH2 = document.createElement("h2");
        nameH2.className = "movie_name";
        nameH2.textContent = !movie.Title ? movie.fileName : movie.Title;

        var genresH2 = document.createElement("h2");
        genresH2.className = "movie_genres";
        genresH2.textContent = movie.Genre === "N/A" || !movie.Genre ? "Not found" : movie.Genre;

        nameAndGenresDiv.appendChild(nameH2);
        nameAndGenresDiv.appendChild(genresH2);

        movieDiv.appendChild(posterAndRatingDiv);
        movieDiv.appendChild(nameGenresAndMoreDiv);

        nameGenresAndMoreDiv.appendChild(nameAndGenresDiv);
        nameGenresAndMoreDiv.appendChild(problemDiv);

        moviesDiv.appendChild(movieDiv);

        problemDiv.addEventListener("click", () => {
            problemPopupDiv.classList.toggle("hide");
        });

        problemPopupElementWrong.addEventListener("click", () => {
            document.getElementById("wrong_movie_poster").src = posterImg.src;
            document.getElementById("wrong_movie_name").textContent = nameH2.textContent;
            document.getElementById("right_movie_poster").src = posterImg.src;
            document.getElementById("wrong_movie_id").textContent = movie.imdbID;
            document.getElementById("wrong_movie_poster_div").classList.remove("hide_popup");
            document.getElementById("blur_background").classList.add("blur");
        });

        problemPopupDeleteMovie.addEventListener("click", ()=>{
            sendMessageToMain("movie", `removeWithFileName,${movie.fileName}`);
            setTimeout(readMoviesFromFile, 200);
        });
    });
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

function rightMovieSearchButtonListener() {
    document.getElementById("right_movie_search_button").addEventListener("click", () => {
        let movieName = document.getElementById("right_movie_search_input").value;
        document.getElementById("right_movie_poster").src = path.join(__dirname, "res", "img", "loading.svg");

        fetch(`https://www.omdbapi.com/?t=${encodeURIComponent(movieName)}&apikey=${KEY}`)
            .then((response) => {
                if (!response.ok) {
                    throw new Error(`HTTP error! Status: ${response.status}`);
                }
                return response.json();
            })
            .then((data) => {
                document.getElementById("right_movie_poster").src = data.Poster;
                document.getElementById("right_movie_search_button").value = data.Title;
                document.getElementById("right_movie_id").textContent = data.imdbID;
            })
            .catch((error) => {
                console.error("Fetch error:", error);
            });
    });
}

function chooseRightMovieButtonListener() {
    document.getElementById("choose_right_movie_button").addEventListener("click", () => {
        let wrongMovieID = document.getElementById("wrong_movie_id").textContent;
        let rightMovieID = document.getElementById("right_movie_id").textContent;

        sendMessageToMain("movie", `remove,${wrongMovieID}`);
        sendMessageToMain("movie", `add,${rightMovieID}`);

        setTimeout(readMoviesFromFile, 200);
    });
}
