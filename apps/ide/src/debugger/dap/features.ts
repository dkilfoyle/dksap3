/* eslint-disable @typescript-eslint/no-explicit-any */
import { DebugProtocol } from "@vscode/debugprotocol";

export class Source implements DebugProtocol.Source {
  name: string;
  path?: string;
  sourceReference: number;

  public constructor(name: string, path?: string, id: number = 0, origin?: string, data?: any) {
    this.name = name;
    this.path = path;
    this.sourceReference = id;
    if (origin) {
      (<any>this).origin = origin;
    }
    if (data) {
      (<any>this).adapterData = data;
    }
  }
}

export class Scope implements DebugProtocol.Scope {
  name: string;
  variablesReference: number;
  expensive: boolean;

  public constructor(name: string, reference: number, expensive: boolean = false) {
    this.name = name;
    this.variablesReference = reference;
    this.expensive = expensive;
  }
}

export class StackFrame implements DebugProtocol.StackFrame {
  id: number;
  name: string;
  source?: DebugProtocol.Source;
  line: number;
  column: number;
  endLine?: number;
  endColumn?: number;
  canRestart?: boolean;
  instructionPointerReference?: string;
  moduleId?: number | string;
  presentationHint?: "normal" | "label" | "subtle";

  public constructor(i: number, nm: string, src?: Source, ln: number = 0, col: number = 0) {
    this.id = i;
    this.source = src;
    this.line = ln;
    this.column = col;
    this.name = nm;
  }
}

export class Thread implements DebugProtocol.Thread {
  id: number;
  name: string;

  public constructor(id: number, name: string) {
    this.id = id;
    if (name) {
      this.name = name;
    } else {
      this.name = "Thread #" + id;
    }
  }
}

export class Variable implements DebugProtocol.Variable {
  name: string;
  value: string;
  variablesReference: number;

  public constructor(name: string, value: string, ref: number = 0, indexedVariables?: number, namedVariables?: number) {
    this.name = name;
    this.value = value;
    this.variablesReference = ref;
    if (typeof namedVariables === "number") {
      (<DebugProtocol.Variable>this).namedVariables = namedVariables;
    }
    if (typeof indexedVariables === "number") {
      (<DebugProtocol.Variable>this).indexedVariables = indexedVariables;
    }
  }
}

export class Breakpoint implements DebugProtocol.Breakpoint {
  verified: boolean;

  public constructor(verified: boolean, line?: number, column?: number, source?: Source) {
    this.verified = verified;
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const e: DebugProtocol.Breakpoint = this;
    if (typeof line === "number") {
      e.line = line;
    }
    if (typeof column === "number") {
      e.column = column;
    }
    if (source) {
      e.source = source;
    }
  }

  public setId(id: number) {
    (this as DebugProtocol.Breakpoint).id = id;
  }
}

export class Module implements DebugProtocol.Module {
  id: number | string;
  name: string;

  public constructor(id: number | string, name: string) {
    this.id = id;
    this.name = name;
  }
}
