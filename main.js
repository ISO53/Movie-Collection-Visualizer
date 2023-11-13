const { app, BrowserWindow, Menu } = require("electron");
const { dialog } = require("electron");

app.whenReady().then(() => {
    createWindow();
});

const createWindow = () => {
    const win = new BrowserWindow({
        width: 800,
        height: 600,
        autoHideMenuBar: false,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
            contentSecurityPolicy: "script-src 'self' 'unsafe-inline';",
        },
    });
    win.loadFile("index.html");
    //win.webContents.openDevTools();
    win.maximize();

    const menu = Menu.buildFromTemplate([
        {
            label: "File",
            submenu: [
                { role: "quit" },
                { label: "Import Movies", click: () => mainWindow.webContents.executeJavaScript('showImportMoviesPopup();') },
            ],
        },
		{
            label: "Settings",
            submenu: [
                { label: "OMDB Api", click: () => console.log("Item 1 clicked") },
            ],
        },
    ]);

    Menu.setApplicationMenu(menu);
};

app.on("window-all-closed", () => process.platform !== "darwin" && app.quit());
