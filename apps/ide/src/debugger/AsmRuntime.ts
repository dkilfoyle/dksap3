import { AsmDocumentChange } from "@dksap3/lang-asm";
import { AsmDebugSession } from "./AsmDebugSession.ts";
import { BreakpointEvent, OutputEvent, StoppedEvent, TerminatedEvent } from "./dap/events.ts";
import { emulator, Registers } from "@dksap3/cpusim";
import { EmulatorWebviewPanel } from "../components/EmulatorWebviewPanel.ts";
import { MemoryWebviewPanel } from "../components/MemoryWebviewPanel.ts";
import { printOutputChannel } from "./debugger.ts";
import { getLabelForAddress, getSourceLocationForAddress } from "@dksap3/lang-asm";

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

  constructor(public logLevel = 1) {
    console.log("AsmRuntime constructed");
    emulator.bdosCallback = (regs: Registers) => {
      console.log("OSCALL", regs);
    };
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
      console.log(compiledDocs);
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
    this.isDebugging = true;

    MemoryWebviewPanel.sendLinkerInfo(this.compiledAsm.linkerInfo);

    this.frames = [
      {
        index: 0,
        file: this.compiledAsm.uri,
        line: 0,
        name: "__main__",
        stackBase: 0x0140 - 1, // ugly hack, TODO: set to mem.size or config.initialStackBase
      },
    ];

    this.log(`Asm runtime start uri=${this.compiledAsm.uri}`);
    emulator.reset(Array.from(this.compiledAsm.machineCode));
    emulator.ctrl.bdos = this.bdos;

    this.setCurrentLine();
    this.verifyBreakpoints(program);
    this.stop("entry", `Runtime started: machine code ${this.compiledAsm.machineCode.length} bytes`);
  }

  updateUI() {
    // if (emulator.states.length == 1) debugger;
    EmulatorWebviewPanel.sendComputerState(emulator.states);
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
          console.log("returning from ", name, " until ", this.runUntilReturnFrom);
          this.setCurrentLine();
          if (mode != "stepInto" && this.runUntilReturnFrom == name) {
            this.runUntilReturnFrom = "";
            return this.stop("step", `Stepped out of ${name} at PC = ${emulator.regs.pc - 1}`);
          }
        } else this.setCurrentLine();
        break;
      case 0x76: // hlt
        this.setCurrentLine();
        return this.stop("hlt", `HLT at PC = ${emulator.regs.pc - 1}`);
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
    const bps = this._breakPoints.get(this.compiledAsm.uri.replace("file:///", "\\").replace("/", "\\"));
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
    do {
      stepResult = this.step(stepResult);
      steps++;
    } while (stepResult == "continue");
    if (steps > 1) this._debugger!.sendEvent(new OutputEvent(`Asm runtime: Run ${steps} steps, result ${stepResult}\n`));
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
    if (!this.compiledAsm) throw Error("VerityBreakpoints no source");
    if (bps) {
      bps.forEach((bp) => {
        const lineAddressMap = this.compiledAsm!.linkerInfo[path].lineAddressMap;
        if (!lineAddressMap) throw Error(`No linkerinfo for ${path}`);
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
