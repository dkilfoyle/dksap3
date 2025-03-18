import { Disposable, Webview, WebviewPanel, window, ViewColumn } from "vscode";
import { ComputerState } from "@dksap3/cpusim";

function getNonce() {
  let text = "";
  const possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  for (let i = 0; i < 32; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}

export class EmulatorWebviewPanel {
  public static currentPanel: EmulatorWebviewPanel | undefined;
  private readonly _panel: WebviewPanel;
  private _disposables: Disposable[] = [];

  private constructor(panel: WebviewPanel) {
    this._panel = panel;
    this._panel.onDidDispose(() => this.dispose(), null, this._disposables);
    this._panel.webview.html = this._getWebviewContent();
    this._setWebviewMessageListener(this._panel.webview);
  }

  public static render() {
    if (EmulatorWebviewPanel.currentPanel) {
      EmulatorWebviewPanel.currentPanel._panel.reveal(ViewColumn.One, true);
    } else {
      const panel = window.createWebviewPanel(
        "emulatorPanel",
        "Emulator",
        { viewColumn: ViewColumn.Two, preserveFocus: true },
        {
          enableScripts: true,
        }
      );
      EmulatorWebviewPanel.currentPanel = new EmulatorWebviewPanel(panel);
    }
  }

  public dispose() {
    EmulatorWebviewPanel.currentPanel = undefined;
    this._panel.dispose();
    while (this._disposables.length) {
      const disposable = this._disposables.pop();
      if (disposable) {
        disposable.dispose();
      }
    }
  }

  static sendComputerState(cs: ComputerState[]) {
    if (EmulatorWebviewPanel.currentPanel) {
      EmulatorWebviewPanel.currentPanel?._panel.webview.postMessage({ command: "setComputerState", data: cs });
    }
  }

  private _getWebviewContent() {
    const scriptUri = "/emulator.js";
    const stylesUri = "/emulator.css";
    const nonce = getNonce();
    return /*html*/ `
      <!DOCTYPE html>
      <html lang="en" class="dark">
        <head>
          <meta charset="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <link rel="stylesheet" type="text/css" href="${stylesUri}">
          <title>Emulator</title>
        </head>
        <body>
          <div id="root"></div>
          <script type="module" nonce="${nonce}" src="${scriptUri}"></script>
        </body>
      </html>
    `;
  }

  private _setWebviewMessageListener(webview: Webview) {
    webview.onDidReceiveMessage(
      (message: any) => {
        const command = message.command;
        const text = message.text;

        switch (command) {
          case "hello":
            // Code that should run in response to the hello message command
            window.showInformationMessage(text);
            return;
          // Add more switch case statements here as more webview message commands
          // are created within the webview context (i.e. inside media/main.js)
        }
      },
      undefined,
      this._disposables
    );
  }
}
