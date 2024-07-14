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

  const defaultContextMenu = Menu.buildFromTemplate([
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
    },
  ]);

  tray.setContextMenu(defaultContextMenu);

  function updateTray(isMicOn, isDeafened) {
    const contextMenu = Menu.buildFromTemplate([
      {
        label: 'Open App',
        click: () => {
          mainWindow.show();
        }
      },
      {
        label: 'Mute',
        type: 'checkbox',
        checked: !isMicOn,
        click: () => {
          mainWindow.webContents.send('toggle-mic');
        }
      },
      {
        label: 'Deafen',
        type: 'checkbox',
        checked: isDeafened,
        click: () => {
          mainWindow.webContents.send('toggle-deafen');
        }
      },
      {
        label: 'Quit',
        click: () => {
          app.quit();
        }
      },
    ]);
    tray.setContextMenu(contextMenu);
  }

  ipcMain.on('update-tray', (event, data) => {
    const { isMicOn, isDeafened } = data;
    updateTray(isMicOn, isDeafened);
  });

  tray.setToolTip('PHiscord');

  ipcMain.on('notification-received', (event, data) => {
    if(!mainWindow.isFocused())
      mainWindow.flashFrame(true);
  });
  
  mainWindow.once('focus', () => mainWindow.flashFrame(false))
})();

app.on('window-all-closed', () => {
  app.quit();
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

app.setJumpList([])

