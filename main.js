const { app, BrowserWindow, dialog, ipcMain } = require('electron');
const fs = require('fs');

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  win.loadFile('index.html');
}

// IPC handler để lưu file
ipcMain.handle('save-fasta-file', async (event, fastaContent) => {
  const result = await dialog.showSaveDialog({
    title: 'Lưu file kết quả Alignment',
    defaultPath: 'result.fasta',
    filters: [
      { name: 'FASTA Files', extensions: ['fasta', 'fa'] },
      { name: 'All Files', extensions: ['*'] }
    ]
  });

  if (!result.canceled) {
    try {
      fs.writeFileSync(result.filePath, fastaContent, 'utf8');
      return { success: true, filePath: result.filePath };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }
  return { success: false, error: 'User canceled' };
});

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});