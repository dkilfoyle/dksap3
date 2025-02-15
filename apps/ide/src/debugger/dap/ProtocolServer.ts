/* eslint-disable @typescript-eslint/no-explicit-any */
import type * as vscode from "vscode";
import { EventEmitter } from "vscode";
import { DebugProtocol } from "@vscode/debugprotocol";
import { Response } from "./messages";

export class ProtocolServer implements vscode.DebugAdapter {
  private static TWO_CRLF = "\r\n\r\n";
  private _sendMessage = new EventEmitter<DebugProtocol.ProtocolMessage>();
  onDidSendMessage = this._sendMessage.event;

  private _sequence: number = 1;
  private _pendingRequests = new Map<number, (response: DebugProtocol.Response) => void>();

  constructor(private logging = false) {}

  // ---- implements vscode.Debugadapter interface ---------------------------

  public dispose(): any {}

  public handleMessage(msg: DebugProtocol.ProtocolMessage): void {
    if (msg.type === "request") {
      if (this.logging) console.log("receiving request", msg);
      this.dispatchRequest(<DebugProtocol.Request>msg);
    } else if (msg.type === "response") {
      if (this.logging) console.log("receiving response");
      const response = <DebugProtocol.Response>msg;
      const clb = this._pendingRequests.get(response.request_seq);
      if (clb) {
        this._pendingRequests.delete(response.request_seq);
        if (this.logging) console.log("enacting response", response);
        clb(response);
      }
    }
  }

  public sendEvent(event: DebugProtocol.Event): void {
    if (this.logging) console.log("sending event", event);
    this._send("event", event);
  }

  public sendResponse(response: DebugProtocol.Response): void {
    if (this.logging) console.log("sending response", response);
    if (response.seq > 0) {
      console.error(`attempt to send more than one response for command ${response.command}`);
    } else {
      this._send("response", response);
    }
  }

  public sendRequest(command: string, args: any, timeout: number, cb: (response: DebugProtocol.Response) => void): void {
    const request: any = {
      command: command,
    };
    if (args && Object.keys(args).length > 0) {
      request.arguments = args;
    }

    if (this.logging) console.log("sending request", request);
    this._send("request", request);

    if (cb) {
      this._pendingRequests.set(request.seq, cb);

      const timer = setTimeout(() => {
        clearTimeout(timer);
        const clb = this._pendingRequests.get(request.seq);
        if (clb) {
          this._pendingRequests.delete(request.seq);
          clb(new Response(request, "timeout"));
        }
      }, timeout);
    }
  }

  // ---- protected ----------------------------------------------------------

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  protected dispatchRequest(request: DebugProtocol.Request): void {}

  // ---- private ------------------------------------------------------------

  private _send(typ: "request" | "response" | "event", message: DebugProtocol.ProtocolMessage): void {
    message.type = typ;
    message.seq = this._sequence++;
    this._sendMessage.fire(message);
  }
}
