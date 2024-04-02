// ******************** Declare Variables ********************
const {ipcRenderer} = require("electron");
const path = require("path");
var KEY;
var FILTERS = new Set();
var MOVIES = [];
var CURR_FILTERS = [];
var CURR_SEARCH = "";
var CHARTS_LOADED = false;

// ************************ JS Starts ************************
getMessageFromMain("popup", popupHandler);
getMessageFromMain("movie-db-status", movieDbStatusHandler);
getMessageFromMain("movies", movieHandler);
getMessageFromMain("update", updateHandler);
getMessageFromMain("read-file", readFileHandler);
getMessageFromMain("alert-message", alertMessageHandler);
popupCloseButtonListener();
importMoviesOptionsListener();
omdbApiButtonListener();
readMoviesFromFile();
readOmdbApiKeyFromFile();
rightMovieSearchButtonListener();
chooseRightMovieButtonListener();
filtersDivClickListener();
movieSearchButtonListener();
sortingFilterClickListener();

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
        switch (popupID) {
            case "first_time_div":
                loadFirstTimeSteps();
                break;
            case "movie_stats_div":
                if (!CHARTS_LOADED) {
                    generateCharts();
                }
                break;
            default:
                break;
        }

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

function updateHandler(arg) {
    const versionStatusElm = document.getElementById("last_version_or_not");
    switch (arg) {
        case "error":
            versionStatusElm.innerText = "Couldn't fetch updates. Try again later.";
            break;
        case "no":
            versionStatusElm.innerText = "Looks like you are already running the latest version. No need to update.";
            break;
        default: // There is an update
            versionStatusElm.innerText = "An update is available. Below you can see the changes implemented in this update.";
            document.getElementById("new_features_paragraph").innerHTML = arg;
            document.getElementById("new_features").classList.remove("no_display");
            break;
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

function importMoviesOptionsListener() {
    let options = [
        document.getElementById("import_movies_options_dir"),
        document.getElementById("import_movies_options_txt"),
        document.getElementById("import_movies_options_tor"),
    ];
    options.forEach((option) =>
        option.addEventListener("click", () => {
            sendMessageToMain("open-file-system", option.id.replace("import_movies_options_", ""));
        })
    );
}

function omdbApiButtonListener() {
    document.getElementById("omdb_api_button").addEventListener("click", () => {
        const key = document.getElementById("omdb_api_input").value;
        sendMessageToMain("omdb-api-key", key);
    });
}

function filtersDivClickListener() {
    document.getElementById("filter_div").addEventListener("click", () => {
        resetSearch();
        CURR_FILTERS = getSelectedFilters();
        listMoviesOnGUI();
    });

    function resetSearch() {
        document.getElementById("movie_search_input").value = "";
        CURR_SEARCH = "";
    }
}

function movieSearchButtonListener() {
    const movieSearchButton = document.getElementById("movie_search_button");
    const movieSearchInput = document.getElementById("movie_search_input");

    movieSearchButton.addEventListener("click", () => {
        resetFilters();
        CURR_SEARCH = movieSearchInput.value;
        listMoviesOnGUI();
    });

    movieSearchInput.addEventListener("keypress", (event) => {
        if (event.key === "Enter") {
            resetFilters();
            CURR_SEARCH = movieSearchInput.value;
            listMoviesOnGUI();
        }
    });

    function resetFilters() {
        document
            .getElementById("filter_div")
            .querySelectorAll(".filter_box")
            .forEach((checkbox) => (checkbox.checked = false));
        CURR_FILTERS = [];
    }
}

function sortingFilterClickListener() {
    const elements = [
        document.getElementById("alphabetically"),
        document.getElementById("imdb_rating"),
        document.getElementById("release_date"),
        document.getElementById("duration"),
        document.getElementById("shuffle"),
    ];

    elements.forEach((element) => {
        element.addEventListener("click", () => {
            if (!element.children[2].classList.contains("sort_element_hidden")) {
                element.children[2].classList.toggle("sort_element_increasing");
            }

            resetSelected(element);

            let sortingType = element.id;
            let increasingOrDecreasing = "";
            if (sortingType !== "shuffle") {
                increasingOrDecreasing = element.children[2].classList.contains("sort_element_increasing")
                    ? "_increasing"
                    : "_decreasing";
            }
            sortMovies(sortingType + increasingOrDecreasing);
            console.log(sortingType + increasingOrDecreasing);
            listMoviesOnGUI();
        });
    });

    function resetSelected(elm) {
        elements.forEach((element) => {
            element.children[2].classList.add("sort_element_hidden");
        });
        elm.children[2].classList.remove("sort_element_hidden");
    }
}

function movieDbStatusHandler(status) {
    const statusElm = document.getElementById("db_status");
    const progressElm = document.getElementById("db_remaining");

    if (status.startsWith("l")) {
        // Extract status
        const extractedStatus = status.substring(1);

        // Parse to json
        const jsonifiedStatus = JSON.parse(extractedStatus);

        // Remaining
        const remainingTime = jsonifiedStatus.remainingTime;
        progressElm.innerHTML = `Time remaining: ${formatTime(remainingTime)}`;

        // Loading
        const progress = jsonifiedStatus.progress;
        const parts = progress.split("/");
        const firstNumber = parseInt(parts[0], 10);
        const secondNumber = parseInt(parts[1], 10);

        // Show loading animation
        statusElm.innerHTML = `${firstNumber} out of ${secondNumber} completed.`;
        document.getElementById("loaded_amount_div").style.width = (firstNumber / secondNumber) * 100 + "%";
    } else if (status.startsWith("a")) {
        // Almost done
        statusElm.innerHTML = "We're nearing completion. Please hold for the final steps.";
    } else if (status.startsWith("d")) {
        // Done
        createAlertMessage("success", "Movie database has been created successfully.");
        statusElm.innerHTML = "The database has been successfully created. You may now close this window.";
        progressElm.innerHTML = "";
        readMoviesFromFile();
    } else {
        console.log("something went wrong", status);
    }

    function formatTime(seconds) {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const remainingSeconds = seconds % 60;

        const formattedTime = [
            hours > 0 ? `${hours} hour${hours > 1 ? "s" : ""}` : "",
            minutes > 0 ? `${minutes} minute${minutes > 1 ? "s" : ""}` : "",
            remainingSeconds > 0 ? `${remainingSeconds} second${remainingSeconds > 1 ? "s" : ""}` : "",
        ]
            .filter(Boolean)
            .join(" ");

        return formattedTime;
    }
}

function readMoviesFromFile() {
    sendMessageToMain(
        "read-file",
        JSON.stringify({
            type: "movies",
        })
    );
}

function setFilters(movies) {
    FILTERS.clear();
    const genres = new Set();

    movies.forEach((movie) => movie.Genre && movie.Genre.split(",").forEach((genre) => genres.add(genre.replace(/\s/g, ""))));

    Array.from(genres)
        .sort()
        .forEach((genre) => FILTERS.add(genre));
}

function setMovies(movies) {
    MOVIES = movies;
}

function listFiltersOnGUI() {
    let mainFilterDiv = document.getElementById("filter_div");
    mainFilterDiv.innerHTML = "";

    FILTERS.forEach((filter) => {
        let filterDiv = document.createElement("label");
        filterDiv.className = "filter";

        let filterBox = document.createElement("input");
        filterBox.type = "checkbox";
        filterBox.className = "filter_box";
        filterDiv.appendChild(filterBox);

        let filterText = document.createElement("span");
        filterText.textContent = filter;
        filterText.className = "filter_text";
        filterDiv.appendChild(filterText);

        mainFilterDiv.appendChild(filterDiv);
    });
}

function listMoviesOnGUI() {
    let moviesDiv = document.getElementById("movies_div");
    moviesDiv.innerHTML = "";

    MOVIES.forEach((movie) => {
        if (CURR_FILTERS.length !== 0) {
            if (movie.Genre && movie.Genre !== "N/A" && CURR_FILTERS.every((filterGenre) => movie.Genre.includes(filterGenre))) {
                listMovie(movie);
            }
        } else if (CURR_SEARCH !== "") {
            if (searchMovie(movie, CURR_SEARCH)) {
                listMovie(movie);
            }
        } else {
            listMovie(movie);
        }
    });

    function listMovie(movie) {
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

        problemPopupDeleteMovie.addEventListener("click", () => {
            sendMessageToMain("movie", `removeWithFileName,${movie.fileName}`);
            setTimeout(readMoviesFromFile, 200);
        });

        posterAndRatingDiv.addEventListener("click", () => {
            document.getElementById("movie_header").innerText = movie.Title;
            document.getElementById("movie_info_poster").src = movie.PosterPath;
            document.getElementById("movie_duration").innerText = movie.Runtime;
            document.getElementById("movie_genres").innerHTML = "";
            movie.Genre.split(",").forEach((genre) => {
                let genreElm = document.createElement("h3");
                genreElm.className = "movie_info_genre";
                genreElm.innerText = genre.trim();
                document.getElementById("movie_genres").appendChild(genreElm);
            });
            document.getElementById("movie_info_additionals").innerHTML = "";
            [
                {content: "Director", obj: movie.Director},
                {content: "Writer", obj: movie.Writer},
                {content: "Actors", obj: movie.Actors},
                {content: "Release Date", obj: movie.Released},
                {content: "Awards", obj: movie.Awards},
            ].forEach((addInfo) => {
                let addInfoDiv = document.createElement("movie_info_additional");
                addInfoDiv.className = "movie_info_additional";
                document.getElementById("movie_info_additionals").appendChild(addInfoDiv);

                let addInfoBold = document.createElement("h3");
                addInfoBold.className = "movie_info_additional_bold";
                addInfoBold.innerText = addInfo.content;
                addInfoDiv.appendChild(addInfoBold);

                let addInfoNormal = document.createElement("h3");
                addInfoNormal.className = "movie_info_additional_normal";
                addInfoNormal.innerText = addInfo.obj;
                addInfoDiv.appendChild(addInfoNormal);
            });
            document.getElementById("movie_story_paragraph").innerText = movie.Plot;

            document.getElementById("movie_information_div").classList.remove("hide_popup");
            document.getElementById("blur_background").classList.add("blur");
        });
    }
}

async function readOmdbApiKeyFromFile() {
    sendMessageToMain(
        "read-file",
        JSON.stringify({
            type: "omdb-api-key",
        })
    );
}

function rightMovieSearchButtonListener() {
    document.getElementById("right_movie_search_button").addEventListener("click", () => {
        let movieName = document.getElementById("right_movie_search_input").value;
        document.getElementById("right_movie_poster").src = path.join(__dirname, "res", "img", "loading.svg");

        fetch(`https://www.omdbapi.com/?t=${encodeURIComponent(movieName)}&apikey=${KEY}`)
            .then((response) => {
                if (!response.ok) {
                    createAlertMessage(
                        "warning",
                        "HTTP error during fetching movie details. Could be due to internet connection issues or OMDB key problem."
                    );
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
                createAlertMessage(
                    "warning",
                    "HTTP error during fetching movie details. Could be due to internet connection issues or OMDB key problem."
                );
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

function getSelectedFilters() {
    let selectedFilters = [];
    let filterDiv = document.getElementById("filter_div");
    let checkboxes = filterDiv.querySelectorAll(".filter_box");

    checkboxes.forEach((checkbox) => checkbox.checked && selectedFilters.push(checkbox.nextElementSibling.textContent));

    return selectedFilters;
}

function searchMovie(movieData, searchTerm) {
    try {
        const searchTerms = searchTerm.toLowerCase().split(" ");

        return searchTerms.every((term) => {
            return (
                movieData.Title.toLowerCase().includes(term) ||
                movieData.Year.includes(term) ||
                movieData.Released.toLowerCase().includes(term) ||
                movieData.Genre.toLowerCase().includes(term) ||
                movieData.Director.toLowerCase().includes(term) ||
                movieData.Actors.toLowerCase().includes(term) ||
                movieData.Plot.toLowerCase().includes(term) ||
                movieData.imdbID.toLowerCase().includes(term)
            );
        });
    } catch (error) {
        console.error("Error occured during movie search:", error);
        createAlertMessage("info", "Error occured during movie search.");
        return false;
    }
}

function sortMovies(sortingType) {
    MOVIES.sort((a, b) => {
        switch (sortingType) {
            case "alphabetically_decreasing":
                return (a.Title || "").localeCompare(b.Title || "");
            case "alphabetically_increasing":
                return (b.Title || "").localeCompare(a.Title || "");
            case "imdb_rating_decreasing":
                return (parseFloat(b.imdbRating) || 0) - (parseFloat(a.imdbRating) || 0);
            case "imdb_rating_increasing":
                return (parseFloat(a.imdbRating) || 0) - (parseFloat(b.imdbRating) || 0);
            case "release_date_decreasing":
                return (new Date(b.Released) || 0) - (new Date(a.Released) || 0);
            case "release_date_increasing":
                return (new Date(a.Released) || 0) - (new Date(b.Released) || 0);
            case "duration_decreasing":
                return (parseInt(b.Runtime) || 0) - (parseInt(a.Runtime) || 0);
            case "duration_increasing":
                return (parseInt(a.Runtime) || 0) - (parseInt(b.Runtime) || 0);
            case "shuffle":
                return Math.floor(Math.random() * 3) - 1;
            default:
                return (a.Title || "").localeCompare(b.Title || "");
        }
    });
}

function loadFirstTimeSteps() {
    const step1Elm = document.getElementById("step_1");
    const step2Elm = document.getElementById("step_2");

    step1Elm.classList.remove("successful");
    step2Elm.classList.remove("successful");

    if (KEY !== undefined && KEY !== null) {
        step1Elm.classList.add("successful");
    }

    if (MOVIES !== undefined && MOVIES !== null && MOVIES.length !== 0) {
        step2Elm.classList.add("successful");
    }
}

function readFileHandler(arg) {
    const jsonArg = JSON.parse(arg);

    switch (jsonArg.type) {
        case "movies":
            try {
                let movies = JSON.parse(jsonArg.data);
                setFilters(movies);
                listFiltersOnGUI();
                setMovies(movies);
                listMoviesOnGUI();
                createAlertMessage("success", "Movies imported successfully.");
            } catch (error) {
                console.error("There was an error parsing the JSON file that contains movie information.", error.message);
                createAlertMessage("info", "Error creating movie database. Movies probably hasn't been fetched yet.");
                listMoviesOnGUI();
            }
            break;
        case "omdb-api-key":
            try {
                let jsonContent = JSON.parse(jsonArg.data);

                if (jsonContent && jsonContent.key) {
                    KEY = jsonContent.key;
                    createAlertMessage("success", "OMDB API key setted successfully.");
                } else {
                    console.error("Invalid JSON file format or missing key.");
                    createAlertMessage("info", "Error getting OMDB key. The key probably hasn't been setted yet.");
                }
            } catch (error) {
                console.error("There was an error parsing the JSON file that contains api key.", error.message);
                createAlertMessage("info", "Error getting OMDB key. The key probably hasn't been setted yet.");
                return;
            }
            break;
        default:
            break;
    }
}

function createAlertMessage(type, message) {
    if (type !== "warning" && type !== "success" && type !== "info") {
        console.error("Alert message type is not valid! Given -> ", type);
        return;
    }

    const averageWordLength = 4.7;
    const averageWPMS = 0.3;
    const extraTime = 5000;
    const duration = (message.length / averageWordLength) * averageWPMS + extraTime;

    // Main div for adding alert messages
    const mainMessagesDiv = document.getElementById("alert_messages");

    // Alert message to display
    const alertMessageDiv = createAlertMessageDomElement(type, message);
    mainMessagesDiv.prepend(alertMessageDiv);
    setTimeout(() => alertMessageDiv.classList.remove("alert_slide_right"), 250);

    // Remove the alert message after the specified duration
    setTimeout(() => {
        alertMessageDiv.classList.add("alert_slide_right");
        setTimeout(() => mainMessagesDiv.removeChild(alertMessageDiv), 250);
    }, duration);

    function createAlertMessageDomElement(type, message) {
        const alertMessageDiv = document.createElement("div");
        alertMessageDiv.className = "alert_message";
        alertMessageDiv.classList.add(type + "_color");
        alertMessageDiv.classList.add("alert_slide_right");

        const alertLogo = document.createElement("img");
        alertLogo.className = "alert_logo";
        alertLogo.src = path.join(__dirname, "res", "img", `${type}.svg`);
        alertMessageDiv.appendChild(alertLogo);

        const alertText = document.createElement("p");
        alertText.className = "alert_text";
        alertText.classList.add("truncated_alert");
        alertText.textContent = message;
        alertMessageDiv.appendChild(alertText);
        alertMessageDiv.onclick = () => alertText.classList.toggle("truncated_alert");

        const alertCloseButton = document.createElement("div");
        alertCloseButton.className = "alert_close_button";
        alertCloseButton.textContent = "✖";
        alertMessageDiv.appendChild(alertCloseButton);
        alertCloseButton.onclick = () => {
            alertMessageDiv.classList.add("alert_slide_right");
            setTimeout(() => document.getElementById("alert_messages").removeChild(alertMessageDiv), 250);
        };

        return alertMessageDiv;
    }
}

function alertMessageHandler(arg) {
    const jsonArg = JSON.parse(arg);
    createAlertMessage(jsonArg.type, jsonArg.message);
}

function generateCharts() {
    CHARTS_LOADED = true;

    // Extract years information
    const yearCountMap = {};
    MOVIES.forEach((movie) => {
        const decade = getDecade(movie.Year);
        yearCountMap[decade] = (yearCountMap[decade] || 0) + 1;
    });

    // Extract genres information
    const genreCountMap = {};
    MOVIES.forEach((movie) => {
        movie.Genre.split(",")
            .map((genre) => genre.trim())
            .forEach((genre) => (genreCountMap[genre] = (genreCountMap[genre] || 0) + 1));
    });

    // Extract directors information
    const directorCountMap = {};
    MOVIES.forEach((movie) => {
        movie.Director.split(",")
            .map((director) => director.trim())
            .forEach((director) => (directorCountMap[director] = (directorCountMap[director] || 0) + 1));
    });

    // Extract actors information
    const actorCountMap = {};
    MOVIES.forEach((movie) => {
        movie.Actors.split(",")
            .map((actor) => actor.trim())
            .forEach((actor) => (actorCountMap[actor] = (actorCountMap[actor] || 0) + 1));
    });

    // Limit and sort the data
    const limitedYearCount = limitAndSort(yearCountMap, 5);
    const limitedGenreCount = limitAndSort(genreCountMap, 10);
    const limitedDirectorCount = limitAndSort(directorCountMap, 15);
    const limitedActorCount = limitAndSort(actorCountMap, 20);

    // Create pie charts
    createPieChart("bar", "year_chart", Object.keys(limitedYearCount), Object.values(limitedYearCount));
    createPieChart("bar", "genre_chart", Object.keys(limitedGenreCount), Object.values(limitedGenreCount));
    createPieChart("bar", "director_chart", Object.keys(limitedDirectorCount), Object.values(limitedDirectorCount));
    createPieChart("bar", "actor_chart", Object.keys(limitedActorCount), Object.values(limitedActorCount));

    // Function to create a pie chart
    function createPieChart(type, canvasId, labels, data) {
        new Chart(document.getElementById(canvasId).getContext("2d"), {
            type: type,
            data: {
                labels: labels,
                datasets: [
                    {
                        data: data,
                        backgroundColor: generateRandomColors(data.length),
                        borderWidth: 0,
                    },
                ],
            },
            options: {
                indexAxis: "y",
                plugins: {
                    legend: {
                        display: false,
                    },
                },
            },
        });
    }

    // Function to get the decade from a year
    function getDecade(year) {
        return `${Math.floor(year / 10) * 10}-${Math.floor(year / 10) * 10 + 9}`;
    }

    // Function to limit and sort an object by its values
    function limitAndSort(obj, limit) {
        return Object.fromEntries(
            Object.entries(obj)
                .sort((a, b) => b[1] - a[1])
                .slice(0, limit)
        );
    }

    // Function to create random colors
    function generateRandomColors(numberOfColors) {
        const randomColors = [];

        for (let i = 0; i < numberOfColors; i++) {
            const hue = Math.floor(Math.random() * 360);
            const saturation = Math.random() * 0.5 + 0.4; // Adjusting saturation for diversity
            const value = Math.random() * 0.5 + 0.5; // Adjusting value for diversity

            // Convert HSV to RGB
            const chroma = value * saturation;
            const huePrime = hue / 60;
            const secondLargestComponent = chroma * (1 - Math.abs((huePrime % 2) - 1));
            const m = value - chroma;

            let red = 0,
                green = 0,
                blue = 0;

            if (huePrime >= 0 && huePrime < 1) {
                red = chroma;
                green = secondLargestComponent;
            } else if (huePrime >= 1 && huePrime < 2) {
                red = secondLargestComponent;
                green = chroma;
            } else if (huePrime >= 2 && huePrime < 3) {
                green = chroma;
                blue = secondLargestComponent;
            } else if (huePrime >= 3 && huePrime < 4) {
                green = secondLargestComponent;
                blue = chroma;
            } else if (huePrime >= 4 && huePrime < 5) {
                red = secondLargestComponent;
                blue = chroma;
            } else if (huePrime >= 5 && huePrime <= 6) {
                red = chroma;
                blue = secondLargestComponent;
            }

            red = Math.round((red + m) * 255);
            green = Math.round((green + m) * 255);
            blue = Math.round((blue + m) * 255);

            // Convert RGB to hex
            const hexColor = `#${((1 << 24) | (red << 16) | (green << 8) | blue).toString(16).slice(1)}`;
            randomColors.push(hexColor);
        }

        return randomColors;
    }
}

function openBrowser(link) {
    sendMessageToMain(
        "open-browser",
        JSON.stringify({
            link: link,
        })
    );
}
