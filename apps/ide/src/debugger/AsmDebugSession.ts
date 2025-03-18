/* eslint-disable @typescript-eslint/no-unused-vars */
import { DebugSession } from "./dap/DebugSession";
import { Handles } from "./dap/Handles";
import { Subject } from "./dap/await-notify";
import { InitializedEvent, TerminatedEvent } from "./dap/events";
import { Breakpoint, Scope, Source, StackFrame, Thread } from "./dap/features";

import { asmRuntime } from "./AsmRuntime";
import { emulator } from "@dksap3/cpusim";
import { DebugProtocol } from "@vscode/debugprotocol";

interface LaunchRequestArguments extends DebugProtocol.LaunchRequestArguments {
  /** An absolute path to the "program" to debug. */
  program: string;
  labels: Record<string, number>;
  /** Automatically stop target after launch. If not specified, target does not stop. */
  stopOnEntry?: boolean;
  /** enable logging the Debug Adapter Protocol */
  trace?: boolean;
}

export class AsmDebugSession extends DebugSession {
  public static THREAD_ID = 1;
  private _variableHandles = new Handles<string>();
  private _cancelationTokens = new Map<number, boolean>();
  labels: Record<string, number> = {};

  private _configurationDone = new Subject();
  constructor() {
    super(false);
    this.setDebuggerLinesStartAt1(false);
    this.setDebuggerColumnsStartAt1(false);
    asmRuntime.setDebugSession(this);
  }
  protected initializeRequest(response: DebugProtocol.InitializeResponse, _args: DebugProtocol.InitializeRequestArguments): void {
    response.body = response.body || {};
    response.body.supportsConfigurationDoneRequest = true;
    response.body.supportsEvaluateForHovers = true;
    // response.body.supportsStepBack = true;
    // response.body.supportsDataBreakpoints = true;
    // response.body.supportsCompletionsRequest = true;
    // response.body.completionTriggerCharacters = [".", "["];
    // response.body.supportsCancelRequest = true;
    // response.body.supportsBreakpointLocationsRequest = true;
    response.body.supportsReadMemoryRequest = true;

    this.sendResponse(response);
    this.sendEvent(new InitializedEvent());
  }

  protected configurationDoneRequest(response: DebugProtocol.ConfigurationDoneResponse, args: DebugProtocol.ConfigurationDoneArguments): void {
    super.configurationDoneRequest(response, args);
    this._configurationDone.notify();
  }

  protected async launchRequest(response: DebugProtocol.LaunchResponse, args: LaunchRequestArguments) {
    // make sure to 'Stop' the buffered logging if 'trace' is not set
    // logger.setup(args.trace ? Logger.LogLevel.Verbose : Logger.LogLevel.Stop, false);

    asmRuntime.setSource(args.program);
    this.labels = args.labels;

    // wait until configuration has finished (and configurationDoneRequest has been called)
    await this._configurationDone.wait(1000);

    // start the program in the runtime
    asmRuntime.start(args.program, !!args.stopOnEntry);

    this.sendResponse(response);
  }

  protected threadsRequest(response: DebugProtocol.ThreadsResponse): void {
    // runtime supports no threads so just return a default thread.
    response.body = {
      threads: [new Thread(AsmDebugSession.THREAD_ID, "thread 1")],
    };
    this.sendResponse(response);
  }

  protected setBreakPointsRequest(response: DebugProtocol.SetBreakpointsResponse, args: DebugProtocol.SetBreakpointsArguments): void {
    const path = <string>args.source.path;
    const clientLines = args.lines || [];
    asmRuntime.clearBreakpoints(path);

    // set and verify breakpoint locations
    const actualBreakpoints = clientLines.map((l) => {
      const { verified, line, id } = asmRuntime.setBreakPoint(path, this.convertClientLineToDebugger(l));
      const bp = <DebugProtocol.Breakpoint>new Breakpoint(verified, this.convertDebuggerLineToClient(line));
      bp.id = id;
      return bp;
    });

    // send back the actual breakpoint positions
    response.body = {
      breakpoints: actualBreakpoints,
    };
    this.sendResponse(response);
  }

  // protected breakpointLocationsRequest(
  //   response: DebugProtocol.BreakpointLocationsResponse,
  //   args: DebugProtocol.BreakpointLocationsArguments,
  //   request?: DebugProtocol.Request
  // ): void {
  //   if (args.source.path) {
  //     const bps = asmRuntime.getBreakpoints(args.source.path, this.convertClientLineToDebugger(args.line));
  //     response.body = {
  //       breakpoints: bps.map((col) => {
  //         return {
  //           line: args.line,
  //           column: this.convertDebuggerColumnToClient(col),
  //         };
  //       }),
  //     };
  //   } else {
  //     response.body = {
  //       breakpoints: [],
  //     };
  //   }
  //   this.sendResponse(response);
  // }

  protected stackTraceRequest(response: DebugProtocol.StackTraceResponse, _args: DebugProtocol.StackTraceArguments): void {
    // const startFrame = typeof args.startFrame === "number" ? args.startFrame : 0;
    // const maxLevels = typeof args.levels === "number" ? args.levels : 1000;
    // const endFrame = startFrame + maxLevels;

    const stk = asmRuntime.stack();

    response.body = {
      stackFrames: stk.map((f) => new StackFrame(f.index, f.name, this.createSource(f.file), this.convertDebuggerLineToClient(f.line), 0)), //, this.convertDebuggerLineToClient(f.line))),
      totalFrames: stk.length,
    };
    this.sendResponse(response);
  }

  protected scopesRequest(response: DebugProtocol.ScopesResponse, _args: DebugProtocol.ScopesArguments): void {
    response.body = {
      scopes: [
        new Scope("8bit Registers", this._variableHandles.create("Registers8"), false),
        new Scope("8bit Registers2", this._variableHandles.create("Registers8b"), false),
        new Scope("16bit Registers", this._variableHandles.create("Registers16"), false),
        new Scope("Pointers", this._variableHandles.create("Pointers"), false),
        new Scope("Labels", this._variableHandles.create("Labels"), true),
      ],
    };
    this.sendResponse(response);
  }

  protected async variablesRequest(
    response: DebugProtocol.VariablesResponse,
    args: DebugProtocol.VariablesArguments,
    _request?: DebugProtocol.Request
  ) {
    const variables: DebugProtocol.Variable[] = [];

    const id = this._variableHandles.get(args.variablesReference);

    if (id == "Registers8") {
      variables.push({
        name: "a",
        type: "integer",
        value: `0x${emulator.alu.acc.toString(16)}, ${emulator.alu.acc}`,
        variablesReference: 0,
      });
      variables.push({
        name: "b",
        type: "integer",
        value: `0x${emulator.regs.b.toString(16)}, ${emulator.regs.b}`,
        variablesReference: 0,
      });
      variables.push({
        name: "c",
        type: "integer",
        value: `0x${emulator.regs.c.toString(16)}, ${emulator.regs.c}`,
        variablesReference: 0,
      });
      variables.push({
        name: "d",
        type: "integer",
        value: `0x${emulator.regs.d.toString(16)}, ${emulator.regs.d}`,
        variablesReference: 0,
      });
      variables.push({
        name: "e",
        type: "integer",
        value: `0x${emulator.regs.e.toString(16)}, ${emulator.regs.e}`,
        variablesReference: 0,
      });
      variables.push({
        name: "h",
        type: "integer",
        value: `0x${emulator.regs.h.toString(16)}, ${emulator.regs.h}`,
        variablesReference: 0,
      });
      variables.push({
        name: "l",
        type: "integer",
        value: `0x${emulator.regs.l.toString(16)}, ${emulator.regs.l}`,
        variablesReference: 0,
      });
    } else if (id == "Registers8b") {
      variables.push({
        name: "a",
        type: "integer",
        value: `0b${emulator.alu.acc.toString(2).padStart(8, "0")}`,
        variablesReference: 0,
      });
      variables.push({
        name: "b",
        type: "integer",
        value: `0b${emulator.regs.b.toString(2).padStart(8, "0")}`,
        variablesReference: 0,
      });
      variables.push({
        name: "c",
        type: "integer",
        value: `0b${emulator.regs.c.toString(2).padStart(8, "0")}`,
        variablesReference: 0,
      });
      variables.push({
        name: "d",
        type: "integer",
        value: `0b${emulator.regs.d.toString(2).padStart(8, "0")}`,
        variablesReference: 0,
      });
      variables.push({
        name: "e",
        type: "integer",
        value: `0b${emulator.regs.e.toString(2).padStart(8, "0")}`,
        variablesReference: 0,
      });
      variables.push({
        name: "h",
        type: "integer",
        value: `0b${emulator.regs.h.toString(2).padStart(8, "0")}`,
        variablesReference: 0,
      });
      variables.push({
        name: "l",
        type: "integer",
        value: `0b${emulator.regs.l.toString(2).padStart(8, "0")}`,
        variablesReference: 0,
      });
    } else if (id == "Registers16") {
      variables.push({
        name: "bc",
        type: "integer",
        value: `0x${emulator.regs.bc.toString(16)}, ${emulator.regs.bc}`,
        variablesReference: 0,
      });
      variables.push({
        name: "de",
        type: "integer",
        value: `0x${emulator.regs.de.toString(16)}, ${emulator.regs.de}`,
        variablesReference: 0,
      });
      variables.push({
        name: "hl",
        type: "integer",
        value: `0x${emulator.regs.hl.toString(16)}, ${emulator.regs.hl}`,
        variablesReference: 0,
      });
      variables.push({
        name: "sp",
        type: "integer",
        value: `0x${emulator.regs.sp.toString(16)}, ${emulator.regs.sp}`,
        variablesReference: 0,
      });
      variables.push({
        name: "wz",
        type: "integer",
        value: `0x${emulator.regs.wz.toString(16)}, ${emulator.regs.wz}`,
        variablesReference: 0,
      });
    } else if (id == "Labels") {
      if (!asmRuntime.compiledAsm) throw Error();
      Object.entries(asmRuntime.compiledAsm.identifierMap).forEach(([lbl, addr]) => {
        variables.push({
          name: lbl,
          type: "integer",
          value: "0x" + addr.toString(16),
          variablesReference: 0,
        });
      });
    } else if (id == "Pointers") {
      const hl = emulator.mem.ram.at(emulator.regs.hl);
      const sp = emulator.mem.ram.at(emulator.regs.sp);
      const wz = emulator.mem.ram.at(emulator.regs.wz);
      const pc = emulator.mem.ram.at(emulator.regs.pc);
      variables.push({
        name: "hl",
        type: "integer",
        value: `0x${hl?.toString(16).padStart(2, "0")}, ${hl}`,
        variablesReference: 0,
      });
      variables.push({
        name: "wz",
        type: "integer",
        value: `0x${wz?.toString(16).padStart(2, "0")}, ${wz}`,
        variablesReference: 0,
      });
      variables.push({
        name: "sp",
        type: "integer",
        value: `0x${sp?.toString(16).padStart(2, "0")}, ${sp}`,
        variablesReference: 0,
        memoryReference: "sp",
      });
      variables.push({
        name: "pc",
        type: "integer",
        value: `0x${pc?.toString(16).padStart(2, "0")}, ${sp}`,
        variablesReference: 0,
        memoryReference: "pc",
      });
    }

    response.body = {
      variables: variables,
    };
    this.sendResponse(response);
  }

  protected evaluateRequest(
    response: DebugProtocol.EvaluateResponse,
    args: DebugProtocol.EvaluateArguments,
    request?: DebugProtocol.Request
  ): void {
    let result = "";
    if (args.context == "hover") {
      switch (args.expression.toUpperCase()) {
        case "A":
          result = `a: 0x${emulator.alu.acc.toString(16)}, ${emulator.alu.acc}`;
          break;
        case "C":
          result = `c: 0x${emulator.regs.c.toString(16)}, ${emulator.regs.c}`;
          break;
        case "E":
          result = `e: 0x${emulator.regs.e.toString(16)}, ${emulator.regs.e}`;
          break;
        case "L":
          result = `l: 0x${emulator.regs.l.toString(16)}, ${emulator.regs.l}`;
          break;
        case "B":
        case "BC":
          result = ` b: 0x${emulator.regs.b.toString(16)}, ${emulator.regs.b}\nbc: 0x${emulator.regs.bc.toString(16)}, ${emulator.regs.bc}`;
          break;
        case "D":
        case "DE":
          result = ` d: 0x${emulator.regs.d.toString(16)}, ${emulator.regs.d}\nde: 0x${emulator.regs.de.toString(16)}, ${emulator.regs.de}`;
          break;
        case "H":
        case "HL":
          result = `  h: 0x${emulator.regs.h.toString(16)}, ${emulator.regs.h}\n hl: 0x${emulator.regs.hl.toString(16)}, ${
            emulator.regs.hl
          }\n@hl: 0x${emulator.mem.ram.at(emulator.regs.hl)?.toString(16)}, ${emulator.mem.ram.at(emulator.regs.hl)}`;
          break;
        default:
          // could be a label
          if (this.labels[args.expression] != undefined) {
            result = ` ${args.expression}: 0x${this.labels[args.expression].toString(16)}, ${this.labels[args.expression]}\n@${
              args.expression
            }: 0x${emulator.mem.ram.at(this.labels[args.expression])?.toString(16)}, ${emulator.mem.ram.at(this.labels[args.expression])}`;
          } else {
            return this.sendResponse(response);
          }
      }
    }
    response.body = {
      result,
      variablesReference: 0,
    };
    this.sendResponse(response);
  }

  protected readMemoryRequest(
    response: DebugProtocol.ReadMemoryResponse,
    args: DebugProtocol.ReadMemoryArguments,
    request?: DebugProtocol.Request
  ): void {
    response.body = {
      address: args.memoryReference,
      data: btoa(String.fromCharCode.apply(null, asmRuntime.getMemory(args.memoryReference))),
    };
    this.sendResponse(response);
  }

  protected continueRequest(response: DebugProtocol.ContinueResponse, _args: DebugProtocol.ContinueArguments): void {
    asmRuntime.run("continue");
    this.sendResponse(response);
  }

  protected nextRequest(response: DebugProtocol.NextResponse, _args: DebugProtocol.NextArguments): void {
    // asmRuntime.step({ running: false, showStages: true, mode: "next" });
    asmRuntime.run("stepOver");
    this.sendResponse(response);
  }

  protected stepInRequest(
    response: DebugProtocol.StepInResponse,
    _args: DebugProtocol.StepInArguments,
    _request?: DebugProtocol.Request
  ): void {
    asmRuntime.run("stepInto");
    this.sendResponse(response);
  }

  protected stepOutRequest(
    response: DebugProtocol.StepOutResponse,
    _args: DebugProtocol.StepOutArguments,
    _request?: DebugProtocol.Request
  ): void {
    asmRuntime.run("stepOut");
    this.sendResponse(response);
  }

  protected cancelRequest(_response: DebugProtocol.CancelResponse, args: DebugProtocol.CancelArguments) {
    if (args.requestId) {
      this._cancelationTokens.set(args.requestId, true);
    }
  }

  protected async terminateRequest(response: DebugProtocol.TerminateResponse, _args: DebugProtocol.TerminateArguments): Promise<void> {
    this.sendResponse(response);
    this.sendEvent(new TerminatedEvent());
  }

  private createSource(filePath: string): Source {
    const name = filePath.slice(filePath.lastIndexOf("/") + 1);
    const path = filePath.replace("file://", "");
    return new Source(name, path, undefined, undefined, undefined);
  }
}
