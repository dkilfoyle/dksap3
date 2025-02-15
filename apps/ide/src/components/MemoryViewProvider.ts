import * as vscode from "vscode";

function randomString(len = 32): string {
  let text = "";
  const possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  for (let i = 0; i < len; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}

class MemoryViewProvider implements vscode.WebviewViewProvider {
  public readonly viewType = "memory-view.memoryView";
  private _view?: vscode.WebviewView;

  resolveWebviewView(
    webviewView: vscode.WebviewView,
    context: vscode.WebviewViewResolveContext,
    token: vscode.CancellationToken
  ): Thenable<void> | void {
    this._view = webviewView;
    webviewView.webview.options = {
      enableScripts: true,
    };
    webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);

    webviewView.webview.onDidReceiveMessage((data) => {
      switch (data.type) {
        case "colorSelected": {
          vscode.window.activeTextEditor?.insertSnippet(new vscode.SnippetString(`#${data.value}`));
          break;
        }
      }
    });
  }

  show() {
    if (this._view) this._view.show(true);
  }

  public setMemory(memory: number[]) {
    if (this._view) {
      console.log("posting message");
      this._view.webview.postMessage({ command: "setMemory", data: memory });
    }
  }

  public setRange(start: number, end: number) {
    if (this._view) {
      this._view.webview.postMessage({ command: "setRange", data: { start, end } });
    }
  }

  public setPointers(pointers: { sp: number; sb: number; pc: number; hl: number }) {
    if (this._view) {
      this._view.webview.postMessage({ command: "setPointers", data: pointers });
    }
  }

  _getHtmlForWebview(webview: vscode.Webview) {
    // Convert the styles and scripts for the webview into webview URIs
    const scriptUri = "/memview.js"; //webview.asWebviewUri(vscode.Uri.joinPath(this._context.extensionUri, "dist", "editor.js"));
    const styleUri = "/memview.css"; //webview.asWebviewUri(vscode.Uri.joinPath(this._context.extensionUri, "dist", "editor.css"));
    const nonce = randomString();
    return `
        <!DOCTYPE html>
        <html lang="en" class="dark">
        <head>
          <meta charset="UTF-8">
  
          <!--
          Use a content security policy to only allow loading images from https or from our extension directory,
          and only allow scripts that have a specific nonce.
          -->
          <meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src ${webview.cspSource} blob:; font-src ${webview.cspSource}; style-src ${webview.cspSource}; script-src 'nonce-${nonce}';">
  
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
  
          <link href="${styleUri}" rel="stylesheet" />
          <script nonce="${nonce}" src="${scriptUri}" defer></script>
          <title>Memory Viewer</title>
        </head>
        <body>
          <div id="root"></div>
        </body>
        </html>`;
  }
}

export const memoryViewProvider = new MemoryViewProvider();
