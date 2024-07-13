import {
  screen,
  BrowserWindow,
  BrowserWindowConstructorOptions,
  Rectangle,
  nativeImage,
  ipcMain
} from 'electron'
import Store from 'electron-store'
import path from 'path'

export const createWindow = (
  windowName: string,
  options: BrowserWindowConstructorOptions
): BrowserWindow => {
  const key = 'window-state'
  const name = `window-state-${windowName}`
  const store = new Store<Rectangle>({ name })
  const defaultSize = {
    width: options.width,
    height: options.height,
  }
  let state = {}

  const restore = () => store.get(key, defaultSize)

  const getCurrentPosition = () => {
    const position = win.getPosition()
    const size = win.getSize()
    return {
      x: position[0],
      y: position[1],
      width: size[0],
      height: size[1],
    }
  }

  const windowWithinBounds = (windowState, bounds) => {
    return (
      windowState.x >= bounds.x &&
      windowState.y >= bounds.y &&
      windowState.x + windowState.width <= bounds.x + bounds.width &&
      windowState.y + windowState.height <= bounds.y + bounds.height
    )
  }

  const resetToDefaults = () => {
    const bounds = screen.getPrimaryDisplay().bounds
    return Object.assign({}, defaultSize, {
      x: (bounds.width - defaultSize.width) / 2,
      y: (bounds.height - defaultSize.height) / 2,
    })
  }

  const ensureVisibleOnSomeDisplay = (windowState) => {
    const visible = screen.getAllDisplays().some((display) => {
      return windowWithinBounds(windowState, display.bounds)
    })
    if (!visible) {
      // Window is partially or fully not visible now.
      // Reset it to safe defaults.
      return resetToDefaults()
    }
    return windowState
  }

  const saveState = () => {
    if (!win.isMinimized() && !win.isMaximized()) {
      Object.assign(state, getCurrentPosition())
    }
    store.set(key, state)
  }

  state = ensureVisibleOnSomeDisplay(restore())

  const win = new BrowserWindow({
    ...state,
    ...options,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      ...options.webPreferences,
    },
  })

  const speakerOnIcon = nativeImage.createFromPath(path.join(__dirname, 'assets/speaker-on.png'));
  const speakerOffIcon = nativeImage.createFromPath(path.join(__dirname, 'assets/speaker-off.png'));
  const micOnIcon = nativeImage.createFromPath(path.join(__dirname, 'assets/mic-on.png'));
  const micOffIcon = nativeImage.createFromPath(path.join(__dirname, 'assets/mic-off.png'));
  const videoOnIcon = nativeImage.createFromPath(path.join(__dirname, 'assets/video-on.png'));
  const videoOffIcon = nativeImage.createFromPath(path.join(__dirname, 'assets/video-off.png'));
  const leaveCallIcon = nativeImage.createFromPath(path.join(__dirname, 'assets/leave-call.png'));

  function updateThumbarButtons(isInCall, isMicOn, isDeafened, isVideoOn) {
    if (!isInCall) {
      win.setThumbarButtons([]);
    } else {
      win.setThumbarButtons([
        {
          tooltip: isMicOn ? 'Mute' : 'Unmute',
          icon: isMicOn ? micOnIcon : micOffIcon,
          click() {
            win.webContents.send('toggle-mic');
          },
        },
        {
          tooltip: isDeafened ? 'Undeafen' : 'Deafen',
          icon: isDeafened ? speakerOffIcon : speakerOnIcon,
          click() {
            win.webContents.send('toggle-deafen');
          },
        },
        {
          tooltip: isVideoOn ? 'Stop Video' : 'Start Video',
          icon: isVideoOn ? videoOnIcon : videoOffIcon,
          click() {
            win.webContents.send('toggle-video');
          },
        },
        {
          tooltip: 'Leave Call',
          icon: leaveCallIcon,
          click() {
            win.webContents.send('leave-call');
          },
        },
      ]);
    }
  }

  ipcMain.on('update-thumbar-buttons', (event, data) => {
    const { isInCall, isMicOn, isDeafened, isVideoOn } = data;
    updateThumbarButtons(isInCall, isMicOn, isDeafened, isVideoOn);
  });

  win.on('close', saveState)

  return win
}
