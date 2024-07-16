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
    width: 2160,
    height: 1440,
    icon: path.join(__dirname, 'assets/app-icon.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
    },
    frame: false,
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

  tray.setToolTip('PHiscord');

  ipcMain.on('update-tray', (event, data) => {
    const { isMicOn, isDeafened } = data;
    updateTray(isMicOn, isDeafened);
  });

  ipcMain.on('notification-received', (event, data) => {
    if(!mainWindow.isFocused())
      mainWindow.flashFrame(true);
  });
  
  mainWindow.once('focus', () => mainWindow.flashFrame(false))

  ipcMain.on('maximize-window', (event, data) => {
    mainWindow.maximize();
  });

  ipcMain.on('unmaximize-window', (event, data) => {
    mainWindow.unmaximize();
  });

  ipcMain.on('minimize-window', (event, data) => {
    mainWindow.minimize();
  });

  ipcMain.on('close-window', (event, data) => {
    mainWindow.close();
  });

  mainWindow.on('maximize', () => {
    mainWindow.webContents.send('window-maximized');
  })

  mainWindow.on('unmaximize', () => {
    mainWindow.webContents.send('window-unmaximized');
  })

})();

app.on('window-all-closed', () => {
  app.quit();
});

const appIconPath = path.join(__dirname, 'assets/app-icon.ico');

const defaultUserTask = {
  program: null,
  arguments: '',
  iconPath: appIconPath,
  iconIndex: 0,
  title: 'PHiscord',
  description: 'New Window'
}

const toggleMuteUserTask = {
  program: null,
  arguments: '',
  iconPath: appIconPath,
  iconIndex: 0,
  title: 'Toggle Mic',
  description: 'Toggles your mic.'
}

const toggleDeafenUserTask = {
  program: null,
  arguments: '',
  iconPath: appIconPath,
  iconIndex: 0,
  title: 'Toggle Deafen',
  description: 'Toggles whether you are deafened or not.'
}

const leaveCallUserTask = {
  program: null,
  arguments: '',
  iconPath: appIconPath,
  iconIndex: 0,
  title: 'Leave Call',
  description: 'Leave your current call.'
}

app.setUserTasks([
  defaultUserTask
]);

ipcMain.on('update-jumplist', (event, data) => {
  const { isInCall } = data;

  if(isInCall) {
    app.setUserTasks([
      defaultUserTask,
      toggleMuteUserTask,
      toggleDeafenUserTask,
      leaveCallUserTask
    ]);
  } else {
    app.setUserTasks([
      defaultUserTask,
      toggleMuteUserTask,
      toggleDeafenUserTask,
    ]);
  }
})