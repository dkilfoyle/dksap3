import { AsmDocumentChange, getLabelInfo } from "@dksap3/lang-asm";
import { AsmDebugSession } from "./AsmDebugSession.ts";
import { BreakpointEvent, OutputEvent, StoppedEvent, TerminatedEvent } from "./dap/events.ts";
import { emulator } from "@dksap3/cpusim";
import { EmulatorWebviewPanel } from "../components/EmulatorWebviewPanel.ts";
import { MemoryWebviewPanel } from "../components/MemoryWebviewPanel.ts";
import { printOutputChannel } from "./debugger.ts";
import { getLabelForAddress, getSourceLocationForAddress } from "@dksap3/lang-asm";
import { asmLanguageClient, sourceAsts } from "../config.ts";
import { isProgram } from "../../../../packages/lang-asm/src/language/generated/ast.ts";
import { AstNodeWithTextRegion } from "langium";
import * as vscode from "vscode";

interface IAsmBreakpoint {
  id: number;
  line: number;
  verified: boolean;
}

export interface IStackFrame {
  index: number;
  name: string;
  file: string;
  line: number;
  stackBase: number;
  stackLabels: Record<string, string>;
}

export interface IRuntimeState {
  frames: { name: string; file: string; base: number; mem: number[]; labels: Record<string, string> }[];
  hlLabel: string;
  deLabel: string;
}

type IStepMode = "stepInto" | "stepOut" | "stepOver" | "continue";
type IStepResult = IStepMode | "stop";

export const compiledDocs: Record<string, AsmDocumentChange> = {};

export class AsmRuntime {
  // RUNTIME is zero based positions
  private _breakPoints = new Map<string, IAsmBreakpoint[]>();
  private _breakpointId = 1;
  public compiledAsm?: AsmDocumentChange;
  private _debugger?: AsmDebugSession;
  public frames: IStackFrame[] = [];
  public animateRunning = false;
  public runUntilReturnFrom = "";
  public isDebugging = false;
  public hlLabel = "";
  public deLabel = "";

  constructor(public logLevel = 2) {
    emulator.bdosAddress = 7;
  }

  log(msg: string) {
    if (this.logLevel == 1) console.log(`RUNTIME: ${msg}`);
  }

  setDebugSession(dap: AsmDebugSession) {
    this._debugger = dap;
  }

  setSource(program: string) {
    // const fn = `file://${program.replace("\\", "/").replace("\\", "/")}`;
    this.compiledAsm = compiledDocs[program];
    if (!this.compiledAsm) {
      // console.log(compiledDocs);
      throw Error(`No compiled result for ${program}`);
    }
  }

  getMemory(memoryReference: string) {
    if (memoryReference == "sp") {
      return Array.from(emulator.mem.ram.slice(emulator.regs.sp, emulator.regs.sp + 100));
    }
    return [];
  }

  bdos(c: number, de: number) {
    if (c == 9) {
      // print from de until $
      const dollarAddr = emulator.mem.ram.slice(de).findIndex((x) => String.fromCharCode(x) == "$");
      const str = String.fromCharCode(...emulator.mem.ram.slice(de, de + dollarAddr));
      str.split("\r\n").forEach((line) => printOutputChannel(line));
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  start(program: string, _stopOnEntry: boolean) {
    if (!this._debugger) throw Error("No debug session set");
    if (!this.compiledAsm) throw Error("No source");
    this.runUntilReturnFrom = "";
    this.hlLabel = "";
    this.deLabel = "";
    this.isDebugging = true;
    asmLanguageClient?.sendNotification("statusChange", { isDebugging: true });

    MemoryWebviewPanel.sendLinkerInfo(this.compiledAsm.linkerInfo);

    this.frames = [
      {
        index: 0,
        file: this.compiledAsm.uri,
        line: 0,
        name: "entry",
        stackBase: 0x0140 - 1, // ugly hack, TODO: set to mem.size or config.initialStackBase
        stackLabels: {},
      },
    ];

    this.log(`Asm runtime start uri=${this.compiledAsm.uri}`);
    emulator.reset(Array.from(this.compiledAsm.machineCode));

    const mainPC = getLabelInfo(this.compiledAsm.linkerInfo, "main");
    if (mainPC) {
      console.log("Running emulator until PC in main @ ", mainPC.globalAddress);
      while (emulator.regs.pc != mainPC.globalAddress) {
        // console.log("skipping until main PC=", emulator.regs.pc);
        this.step("continue");
      }
    }

    // emulator.ctrl.bdos = this.bdos;

    this.setCurrentLine();
    // this.verifyBreakpoints(program);
    this.stop("entry", `Runtime started: machine code ${this.compiledAsm.machineCode.length} bytes`);
  }

  updateUI() {
    // if (emulator.states.length == 1) debugger;
    EmulatorWebviewPanel.sendComputerState(emulator.states);
    EmulatorWebviewPanel.sendRuntimeState({
      frames: this.frames.map((f) => ({
        file: f.file,
        name: f.name,
        base: f.stackBase,
        mem: emulator.regs.sp == 0 ? [] : Array.from(new Uint16Array(emulator.mem.ram.slice(emulator.regs.sp, f.stackBase + 1).buffer)),
        labels: f.stackLabels,
      })),
      hlLabel: this.hlLabel,
      deLabel: this.deLabel,
    });
    MemoryWebviewPanel.sendMemory(Array.from(emulator.mem.ram));
    MemoryWebviewPanel.sendStackFrames(this.frames);
    MemoryWebviewPanel.sendPointers({
      sp: emulator.regs.sp,
      sb: emulator.regs.stackBase || 0,
      pc: emulator.regs.pc,
      hl: emulator.regs.hl,
    });
  }

  stop(type: "step" | "hlt" | "breakpoint" | "entry", output: string): IStepResult {
    switch (type) {
      case "entry":
        this._debugger!.sendEvent(new StoppedEvent("entry", AsmDebugSession.THREAD_ID));
        break;
      case "step":
        this._debugger!.sendEvent(new StoppedEvent("step", AsmDebugSession.THREAD_ID));
        break;
      case "hlt":
        this._debugger!.sendEvent(new TerminatedEvent());
        this.isDebugging = false;
        asmLanguageClient?.sendNotification("statusChange", { isDebugging: false });
        vscode.commands.executeCommand("workbench.view.explorer");
        break;
      case "breakpoint":
        this._debugger!.sendEvent(new StoppedEvent("breakpoint", AsmDebugSession.THREAD_ID));
        break;
    }
    this._debugger!.sendEvent(new OutputEvent(`${output}\n`));

    this.updateUI();

    return "stop";
  }

  step(mode: IStepMode): IStepResult {
    this.log(
      `${mode} file ${this.frames[0].file} line ${this.frames[0].line + 1}, fn=${this.frames[0].name} PC=${
        emulator.regs.pc
      }, Instr=${emulator.mem.ram.at(emulator.regs.pc)} until ${this.runUntilReturnFrom}`
    );

    const prevPC = emulator.regs.pc;
    const prevSP = emulator.regs.sp;
    const prevStackLabel = this.frames[0]?.stackLabels[emulator.regs.sp.toString()];
    emulator.step();

    if (this.animateRunning) {
      // await this.updateUI();
    }

    // console.log(this.frames);

    switch (emulator.ir.out) {
      case 0xcd: // call
      case 0xf4: // cp
      case 0xfc: // cm
      case 0xc4: // cnz
      case 0xcc: // cz
      case 0xe4: // cpo
      case 0xec: // cpe
      case 0xd4: // cnc
      case 0xdc: // cc
        if (emulator.ctrl.callResult == "pass") {
          // call or conditional call
          const label = getLabelForAddress(this.compiledAsm!.linkerInfo, emulator.regs.pc);
          if (!label) {
            throw Error("Unable to find label");
          }
          const name = label ? label.labelInfo.name : "unknown";
          this.frames.unshift({
            name,
            file: label?.file.filename,
            line: 0,
            index: this.frames.length - 1,
            stackBase: emulator.regs.sp - 1,
            stackLabels: {},
          });
          this.setCurrentLine();
          if (mode != "stepInto") {
            if (mode != "continue" && this.runUntilReturnFrom == "") this.runUntilReturnFrom = this.frames[0].name;
            return "continue";
          }
        } else {
          this.setCurrentLine();
        }
        break;

      case 0xc9: // ret
      case 0xf0: // rp
      case 0xf8: // rm
      case 0xc0: // rnz
      case 0xc8: // rz
      case 0xe0: // rpo
      case 0xe8: // rpe
      case 0xd0: // rnc
      case 0xd8: // rc
        if (emulator.ctrl.returnResult == "pass") {
          const name = this.frames.shift()!.name;
          // console.log("returning from ", name, " until ", this.runUntilReturnFrom);
          this.setCurrentLine();
          if (mode != "stepInto" && this.runUntilReturnFrom == name) {
            this.runUntilReturnFrom = "";
            return this.stop("step", `Stepped out of ${name} at PC = ${emulator.regs.pc - 1}`);
          }
        } else this.setCurrentLine();
        break;
      case 0xc5:
      case 0xd5:
      case 0xe5: // push reg
      case 0xf9: // sphl
        {
          // TODO retrieve line label eg push d ; param1
          const loc = getSourceLocationForAddress(this.compiledAsm!.linkerInfo, prevPC);
          if (loc) {
            const ast = sourceAsts[loc.filename];
            if (loc && isProgram(ast)) {
              const line = ast.lines.find((l) => {
                const lt = l as AstNodeWithTextRegion;
                return lt.$textRegion?.range.start.line == loc.line;
              });
              if (line && line.comment) {
                if (emulator.ir.out == 0xf9) {
                  // sphl
                  for (let i = emulator.regs.sp; i < prevSP; i += 2) {
                    this.frames[0].stackLabels[i.toString()] = line.comment.comment + `[${(i - emulator.regs.sp) / 2}]`;
                  }
                } else this.frames[0].stackLabels[emulator.regs.sp.toString()] = line.comment.comment;
              }
            }
          }
        }
        this.setCurrentLine();
        break;
      case 0xf5: // push psw
        this.frames[0].stackLabels[emulator.regs.sp.toString()] = "psw";
        this.setCurrentLine();
        break;
      case 0xd1: // pop d
        this.deLabel = prevStackLabel || "pop d";
        this.setCurrentLine();
        break;
      case 0xe1: // pop h
        this.hlLabel = prevStackLabel || "pop h";
        this.setCurrentLine();
        break;
      case 0x24: // inr h
      case 0x2c: // inr l
      case 0x25: // dcr h
      case 0x2d: // dcr l
      case 0x23: // inx h
      case 0x2b: // dcx h
      case 0x09: // dad b
      case 0x19: // dad d
      case 0x29: // dad h
      case 0x39: // dad sp
      case 0x21: // lxi h
      case 0x2a: // lhld h
      case 0x60: // mov h,reg
      case 0x61:
      case 0x62:
      case 0x63:
      case 0x64:
      case 0x65:
      case 0x66:
      case 0x67:
      case 0x68: // mov l,reg
      case 0x69:
      case 0x6a:
      case 0x6b:
      case 0x6c:
      case 0x6d:
      case 0x6e:
      case 0x6f:
      case 0x26: // mvi h/l
      case 0x2e:
        this.hlLabel = "";
        this.setCurrentLine();
        break;
      case 0x14: // inr d
      case 0x1c: // inr e
      case 0x15: // dcr d
      case 0x1d: // dcr e
      case 0x13: // inx de
      case 0x1b: // dcx de
      case 0x11: // lxi de
      case 0x50: // mov d,reg
      case 0x51:
      case 0x52:
      case 0x53:
      case 0x54:
      case 0x55:
      case 0x56:
      case 0x57:
      case 0x58: // mov e,reg
      case 0x59:
      case 0x5a:
      case 0x5b:
      case 0x5c:
      case 0x5d:
      case 0x5e:
      case 0x5f:
      case 0x16: // mvi h/l
      case 0x1e:
        this.deLabel = "";
        this.setCurrentLine();
        break;
      case 0x76: // hlt
        this.setCurrentLine();
        return this.stop("hlt", `HLT at PC = ${emulator.regs.pc - 1}, HL = ${emulator.regs.hl}`);
      case 0xd3: // out
        this._debugger!.sendEvent(new OutputEvent(`Out A=${emulator.alu.acc}, HL=${emulator.regs.hl}\n`));
        this.setCurrentLine();
        break;
      default:
        this.setCurrentLine();
    }

    if (this.isBreakpoint()) {
      return this.stop("breakpoint", `Hit breakpoint at PC=${emulator.regs.pc}`);
    }

    if (mode == "continue") return "continue";
    else {
      return this.stop("step", `Step: new PC = ${emulator.regs.pc}, cycles = ${emulator.states.length / 2}`);
    }
  }

  isBreakpoint() {
    if (!this.compiledAsm) throw Error("isBreakpoint no source");
    const curLine = this.frames[0].line;
    const bps = this._breakPoints.get(this.compiledAsm.uri.replace("file:///", "\\").replaceAll("/", "\\"));
    return bps?.find((bp) => bp.line == curLine);
  }

  setCurrentLine() {
    const pc = emulator.regs.pc;
    const filepos = getSourceLocationForAddress(this.compiledAsm!.linkerInfo, pc);
    if (filepos) {
      this.frames[0].line = filepos.line;
      this.frames[0].file = filepos.filename;
    }
  }

  run(mode: IStepMode) {
    let stepResult: IStepResult = mode;
    let steps = 0;
    const fps = 5;
    let fpsInterval = 0,
      now = 0,
      then = 0,
      elapsed = 0;

    const animate = () => {
      // console.log("Step result", stepResult);
      if (stepResult == "stop") return;
      requestAnimationFrame(animate);
      now = Date.now();
      elapsed = now - then;

      if (elapsed > fpsInterval) {
        then = now - (elapsed % fpsInterval);
        stepResult = this.step(stepResult as IStepMode);
        steps++;
        MemoryWebviewPanel.sendPointers({
          sp: emulator.regs.sp,
          sb: emulator.regs.stackBase || 0,
          pc: emulator.regs.pc,
          hl: emulator.regs.hl,
        });
        EmulatorWebviewPanel.sendComputerState(emulator.states);
        EmulatorWebviewPanel.sendRuntimeState({
          frames: this.frames.map((f) => ({
            file: f.file,
            name: f.name,
            base: f.stackBase,
            mem: emulator.regs.sp == 0 ? [] : Array.from(new Uint16Array(emulator.mem.ram.slice(emulator.regs.sp, f.stackBase + 1).buffer)),
            labels: f.stackLabels,
          })),
          hlLabel: this.hlLabel,
          deLabel: this.deLabel,
        });
      }
    };

    const start = () => {
      fpsInterval = 1000 / fps;
      then = Date.now();
      animate();
    };

    start();
    if (steps > 1) this._debugger!.sendEvent(new OutputEvent(`Asm runtime: Run ${steps} steps, result ${stepResult}\n`));

    // let stepResult: IStepResult = mode;
    // let steps = 0;
    // do {
    //   stepResult = this.step(stepResult);
    //   steps++;
    //   MemoryWebviewPanel.sendPointers({
    //     sp: emulator.regs.sp,
    //     sb: emulator.regs.stackBase || 0,
    //     pc: emulator.regs.pc,
    //     hl: emulator.regs.hl,
    //   });
    // } while (stepResult == "continue");
    // if (steps > 1) this._debugger!.sendEvent(new OutputEvent(`Asm runtime: Run ${steps} steps, result ${stepResult}\n`));
  }

  public setBreakPoint(path: string, line: number): IAsmBreakpoint {
    const bp = <IAsmBreakpoint>{ verified: false, line, id: this._breakpointId++ };
    let bps = this._breakPoints.get(path);
    if (!bps) {
      bps = new Array<IAsmBreakpoint>();
      this._breakPoints.set(path, bps);
    }
    bps.push(bp);

    this.verifyBreakpoints(path);

    return bp;
  }

  verifyBreakpoints(path: string) {
    const bps = this._breakPoints.get(path);
    let uri = path;
    if (!path.startsWith("builtin")) {
      if (!path.startsWith("file")) {
        uri = "file://" + path.replaceAll("\\", "/");
      }
    }
    // console.log("Verify breakpoints", path, uri);
    if (!this.compiledAsm) throw Error("VerityBreakpoints no source");
    const lineAddressMap = this.compiledAsm!.linkerInfo[uri]?.lineAddressMap;
    if (!lineAddressMap) {
      console.error(`No linkerinfo for ${path}`);
      return;
    }
    if (bps) {
      bps.forEach((bp) => {
        if (lineAddressMap[bp.line]) {
          // only instruction lines appear in lineAddressMap
          bp.verified = true;
          this._debugger?.sendEvent(new BreakpointEvent("changed", { verified: bp.verified, id: bp.id }));
        }
      });
    }
  }

  public clearBreakPoint(path: string, line: number): IAsmBreakpoint | undefined {
    const bps = this._breakPoints.get(path);
    if (bps) {
      const index = bps.findIndex((bp) => bp.line === line);
      if (index >= 0) {
        const bp = bps[index];
        bps.splice(index, 1);
        return bp;
      }
    }
    return undefined;
  }

  public clearBreakpoints(path: string): void {
    this._breakPoints.delete(path);
  }

  public stack() {
    return this.frames;
  }
}

export const asmRuntime = new AsmRuntime();
