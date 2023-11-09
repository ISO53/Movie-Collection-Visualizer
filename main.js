const { app, BrowserWindow } = require("electron");
const { dialog } = require("electron");


app.whenReady().then(() => {
	createWindow();
});

const createWindow = () => {
	const win = new BrowserWindow({
		width: 800,
		height: 600,
		autoHideMenuBar: true,
		webPreferences: {
			nodeIntegration: true,
			contextIsolation: false,
			contentSecurityPolicy: "script-src 'self' 'unsafe-inline';",
		},
	});
	win.loadFile("index.html");
	//win.webContents.openDevTools();
	win.maximize();
};

app.on("window-all-closed", () => process.platform !== "darwin" && app.quit());
