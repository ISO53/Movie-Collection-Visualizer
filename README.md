# Movie Collection Visualizer

[![GitHub Release](https://img.shields.io/github/v/release/ISO53/Movie-Collection-Visualizer?label=GitHub%20Release&style=round-square&color=black)](https://github.com/ISO53/Movie-Collection-Visualizer/releases/latest)
[![License](https://img.shields.io/badge/license-GNU-black.svg?style=round-square)](LICENSE)
![GitHub code size in bytes](https://img.shields.io/github/languages/code-size/ISO53/Movie-Collection-Visualizer?style=round-square&color=black)

A modern Tauri-based application to visualize and manage your movie collection. This project allows users to index movie files from their local directories, fetch high-quality metadata from the OMDb API, and manage their collection with a premium, card-based interface.

![App GUI](https://raw.githubusercontent.com/ISO53/Movie-Collection-Visualizer/master/gui%20ss%20final-min.png)

## Features

- Local Directory Indexing: Automatically scan and watch folders for movie files.
- Automated Metadata Fetching: Retrieve posters, ratings, and plot summaries via OMDb API.
- Modern UI: Clean, card-based interface using Vue 3 and CSS.
- Smart Title Parsing: Advanced filename parsing to identify movie titles and years accurately.
- Offline Capability: Indexed data and posters are stored locally for fast, offline access.
- Collection Management: Search, filter, and manually update movie information.
- Privacy Focused: No data leaves your machine except for API metadata requests.

## Table of Contents

- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
- [Usage](#usage)
  - [OMDb API Configuration](#omdb-api-configuration)
  - [Setting up Library](#setting-up-library)
- [Development](#development)
  - [Running Locally](#running-locally)
  - [Building the Application](#building-the-application)
- [Project Architecture](#project-architecture)
- [Contributing](#contributing)
- [Attribution](#attribution)
- [License](#license)

## Getting Started

### Prerequisites

- Node.js (Latest LTS recommended)
- Rust and Cargo (For Tauri backend)
- System dependencies for Tauri (Refer to the [Tauri Setup Guide](https://tauri.app/start/prerequisites/))

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/ISO53/Movie-Collection-Visualizer.git
   ```
2. Navigate to the project directory:
   ```bash
   cd Movie-Collection-Visualizer
   ```
3. Install dependencies:
   ```bash
   npm install
   ```

## Usage

### OMDb API Configuration

A valid OMDb API key is required to fetch movie information. You can obtain a free or supporter key from the [OMDb API website](https://www.omdbapi.com/apikey.aspx). Once obtained, enter it in the Settings panel within the application.

### Setting up Library

1. Open the Settings panel.
2. Select a "Collection Directory" where your movie files are located.
3. The application will automatically begin parsing filenames and syncing metadata.

## Development

### Running Locally

To start the application in development mode with hot-reloading:
```bash
npm run tauri dev
```

### Building the Application

To generate a production installer for your current platform:
```bash
npm run tauri:build
```

## Project Architecture

- Frontend: Vue 3, Pinia (State Management), Vue Router.
- Backend: Rust (Tauri), SQLite (Local Database).
- Styling: Vanilla CSS with modern cards and glassmorphism effects.
- Icons: Lucide Vue Next.

## Contributing

Contributions are welcome. Please review the [Contributing Guidelines](CONTRIBUTING.md) before opening a pull request or issue.

## Attribution

Movie data provided by [OMDb API](https://www.omdbapi.com/). This data is licensed under [CC BY-NC 4.0 DEED](https://creativecommons.org/licenses/by-nc/4.0).

## License

This project is licensed under the [GNU General Public License v3.0](LICENSE).

---

[![Follow me on GitHub](https://img.shields.io/github/followers/iso53?label=Follow%20%40iso53&style=social)](https://github.com/iso53)
