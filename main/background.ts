import path from 'path';
import { app, ipcMain, Menu, Tray, BrowserWindow, nativeImage } from 'electron';
import serve from 'electron-serve';
import { createWindow } from './helpers';

const isProd = process.env.NODE_ENV === 'production';

if (isProd) {
  serve({ directory: 'app' });
} else {
  app.setPath('userData', `${app.getPath('userData')} (development)`);
}

(async () => {
  await app.whenReady();

  const mainWindow = createWindow('main', {
    width: 1000,
    height: 600,
    icon: path.join(__dirname, 'assets/app-icon.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  if (isProd) {
    await mainWindow.loadURL('app://./home');
  } else {
    const port = process.argv[2];
    await mainWindow.loadURL(`http://localhost:${port}/home`);
    mainWindow.webContents.openDevTools();
  }

  let tray = new Tray(path.join(__dirname, 'assets/app-icon.png'));

  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Open App',
      click: () => {
        mainWindow.show();
      }
    },
    {
      label: 'Quit',
      click: () => {
        app.quit();
      }
    }
  ]);

  tray.setToolTip('PHiscord');
  tray.setContextMenu(contextMenu);
})();

app.on('window-all-closed', () => {
  app.quit();
});

ipcMain.on('message', async (event, arg) => {
  event.reply('message', `${arg} World!`);
});

const iconPath = path.join(__dirname, 'assets/app-icon.ico');

app.setUserTasks([
  {
    program: process.execPath,
    arguments: '--new-window',
    iconPath: iconPath,
    iconIndex: 0,
    title: 'Test',
    description: 'Create a new window'
  }
])