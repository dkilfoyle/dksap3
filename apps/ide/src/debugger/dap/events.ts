/* eslint-disable @typescript-eslint/no-explicit-any */
import { Event } from "./messages";
import { DebugProtocol } from "@vscode/debugprotocol";

export class StoppedEvent extends Event implements DebugProtocol.StoppedEvent {
  body: {
    reason: string;
  };

  public constructor(reason: string, threadId?: number, exceptionText?: string) {
    super("stopped");
    this.body = {
      reason: reason,
    };
    if (typeof threadId === "number") {
      (this as DebugProtocol.StoppedEvent).body.threadId = threadId;
    }
    if (typeof exceptionText === "string") {
      (this as DebugProtocol.StoppedEvent).body.text = exceptionText;
    }
  }
}

export class ContinuedEvent extends Event implements DebugProtocol.ContinuedEvent {
  body: {
    threadId: number;
  };

  public constructor(threadId: number, allThreadsContinued?: boolean) {
    super("continued");
    this.body = {
      threadId: threadId,
    };

    if (typeof allThreadsContinued === "boolean") {
      (<DebugProtocol.ContinuedEvent>this).body.allThreadsContinued = allThreadsContinued;
    }
  }
}

export class InitializedEvent extends Event implements DebugProtocol.InitializedEvent {
  public constructor() {
    super("initialized");
  }
}

export class TerminatedEvent extends Event implements DebugProtocol.TerminatedEvent {
  public constructor(restart?: any) {
    super("terminated");
    if (typeof restart === "boolean" || restart) {
      // eslint-disable-next-line @typescript-eslint/no-this-alias
      const e: DebugProtocol.TerminatedEvent = this;
      e.body = {
        restart: restart,
      };
    }
  }
}

export class ExitedEvent extends Event implements DebugProtocol.ExitedEvent {
  body: {
    exitCode: number;
  };

  public constructor(exitCode: number) {
    super("exited");
    this.body = {
      exitCode: exitCode,
    };
  }
}

export class OutputEvent extends Event implements DebugProtocol.OutputEvent {
  body: {
    category: string;
    output: string;
    data?: any;
  };

  public constructor(output: string, category: string = "console", data?: any) {
    super("output");
    this.body = {
      category: category,
      output: output,
    };
    if (data !== undefined) {
      this.body.data = data;
    }
  }
}

export class ThreadEvent extends Event implements DebugProtocol.ThreadEvent {
  body: {
    reason: string;
    threadId: number;
  };

  public constructor(reason: string, threadId: number) {
    super("thread");
    this.body = {
      reason: reason,
      threadId: threadId,
    };
  }
}

export class BreakpointEvent extends Event implements DebugProtocol.BreakpointEvent {
  body: {
    reason: string;
    breakpoint: DebugProtocol.Breakpoint;
  };

  public constructor(reason: string, breakpoint: DebugProtocol.Breakpoint) {
    super("breakpoint");
    this.body = {
      reason: reason,
      breakpoint: breakpoint,
    };
  }
}

export class ModuleEvent extends Event implements DebugProtocol.ModuleEvent {
  body: {
    reason: "new" | "changed" | "removed";
    module: DebugProtocol.Module;
  };

  public constructor(reason: "new" | "changed" | "removed", module: DebugProtocol.Module) {
    super("module");
    this.body = {
      reason: reason,
      module: module,
    };
  }
}

export class LoadedSourceEvent extends Event implements DebugProtocol.LoadedSourceEvent {
  body: {
    reason: "new" | "changed" | "removed";
    source: DebugProtocol.Source;
  };

  public constructor(reason: "new" | "changed" | "removed", source: DebugProtocol.Source) {
    super("loadedSource");
    this.body = {
      reason: reason,
      source: source,
    };
  }
}

export class CapabilitiesEvent extends Event implements DebugProtocol.CapabilitiesEvent {
  body: {
    capabilities: DebugProtocol.Capabilities;
  };

  public constructor(capabilities: DebugProtocol.Capabilities) {
    super("capabilities");
    this.body = {
      capabilities: capabilities,
    };
  }
}

export class ProgressStartEvent extends Event implements DebugProtocol.ProgressStartEvent {
  body: {
    progressId: string;
    title: string;
  };

  public constructor(progressId: string, title: string, message?: string) {
    super("progressStart");
    this.body = {
      progressId: progressId,
      title: title,
    };
    if (typeof message === "string") {
      (this as DebugProtocol.ProgressStartEvent).body.message = message;
    }
  }
}

export class ProgressUpdateEvent extends Event implements DebugProtocol.ProgressUpdateEvent {
  body: {
    progressId: string;
  };

  public constructor(progressId: string, message?: string) {
    super("progressUpdate");
    this.body = {
      progressId: progressId,
    };
    if (typeof message === "string") {
      (this as DebugProtocol.ProgressUpdateEvent).body.message = message;
    }
  }
}

export class ProgressEndEvent extends Event implements DebugProtocol.ProgressEndEvent {
  body: {
    progressId: string;
  };

  public constructor(progressId: string, message?: string) {
    super("progressEnd");
    this.body = {
      progressId: progressId,
    };
    if (typeof message === "string") {
      (this as DebugProtocol.ProgressEndEvent).body.message = message;
    }
  }
}

export class InvalidatedEvent extends Event implements DebugProtocol.InvalidatedEvent {
  body: {
    areas?: DebugProtocol.InvalidatedAreas[];
    threadId?: number;
    stackFrameId?: number;
  };

  public constructor(areas?: DebugProtocol.InvalidatedAreas[], threadId?: number, stackFrameId?: number) {
    super("invalidated");
    this.body = {};
    if (areas) {
      this.body.areas = areas;
    }
    if (threadId) {
      this.body.threadId = threadId;
    }
    if (stackFrameId) {
      this.body.stackFrameId = stackFrameId;
    }
  }
}

export class MemoryEvent extends Event implements DebugProtocol.MemoryEvent {
  body: {
    memoryReference: string;
    offset: number;
    count: number;
  };

  public constructor(memoryReference: string, offset: number, count: number) {
    super("memory");
    this.body = { memoryReference, offset, count };
  }
}
