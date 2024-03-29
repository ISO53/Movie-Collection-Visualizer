# Movie Collection Visualizer

[![GitHub Release](https://img.shields.io/github/v/release/ISO53/Movie-Collection-Visualizer?label=GitHub%20Release&style=round-square&color=black)](https://github.com/ISO53/Movie-Collection-Visualizer/releases/latest)
[![License](https://img.shields.io/badge/license-GNU-black.svg?style=round-square)](LICENSE)
![GitHub code size in bytes](https://img.shields.io/github/languages/code-size/ISO53/Movie-Collection-Visualizer?style=round-square&color=black)

An Electron-based application to visualize and manage your movie collection. This project allows users to import movie information from the file explorer or a TXT file, fetch details from the OMDB API, and view and manage their movie collection with a user-friendly interface. Check out the [website](https://iso53.github.io/Movie-Collection-Visualizer)!

![App GUI](https://raw.githubusercontent.com/ISO53/Movie-Collection-Visualizer/master/gui%20ss%20final-min.png)

## Features

- Import movies from the file explorer or a TXT file.
- Fetch movie details from the OMDB API.
- View and manage your movie collection.
- Interactive filtering based on movie genres.
- Movie searching with movie names, genres, actor names etc.
- Simple and intuitive user interface.
- View additional movie informations by clicking on movie poster.

## Table of Contents

- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
- [Usage](#usage)
  - [OMDB API Key](#omdb-api-key)
  - [Importing Movies](#importing-movies)
  - [Managing Movies](#managing-movies)
- [Development](#development)
  - [Running Locally](#running-locally)
  - [Building the Application](#building-the-application)
- [Contributing](#contributing)
- [Attribution](#attribution)
- [License](#license)

## Getting Started

### Prerequisites

Make sure you have [Node.js](https://nodejs.org/) installed on your machine.

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/ISO53/Movie-Collection-Visualizer.git
2. Locate the project directory
   ```bash
   cd Movie-Collection-Visualizer
3. Install dependencies
   ```bash
   npm install
   
## Usage
   ### OMDB API Key
   You must have an OMDB API key to use this program. You can get it from [omdbapi](https://www.omdbapi.com/apikey.aspx) for free! Then set your OMDB API key by clicking on "OMDB Api" in the Settings menu.

   ### Importing Movies
   Click on "Import Movies" in the File menu to import movies from the file system or a TXT file.

   ### Managing Movies
   Use the interface to view and manage your movie collection. You can delete movies or update details if needed.

## Development
   ### Running Locally
   ```bash
   npm start
   ```
   This will launch the Electron application.

   ### Building the Application
   ```bash
   npm run dist
   ```
   This will create a build of the application for your platform.

## Contributing
   Your contributions are valued! Before opening an issue, please review [our guideline](https://github.com/ISO53/Movie-Collection-Visualizer/blob/master/CONTRIBUTING.md) on how to contribute. We appreciate your cooperation in making our project better.
   
## Attribution
   Movie data provided by [OMDb API](https://www.omdbapi.com/). This data is licensed under [CC BY-NC 4.0 DEED](https://creativecommons.org/licenses/by-nc/4.0).

## License
   This project is licensed under the [GNU General Public License v3.0](LICENSE). Feel free to modify the content and structure based on your preferences and project specifics.

[![Follow me on GitHub](https://img.shields.io/github/followers/iso53?label=Follow%20%40iso53&style=social)](https://github.com/iso53) 
