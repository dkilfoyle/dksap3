import { AstNode } from "langium";
import { AbstractFormatter, Formatting } from "langium/lsp";
import { isDirective, isInstruction, isLabel, isLine, isProgram } from "./generated/ast.js";

export class AsmFormatter extends AbstractFormatter {
  protected override format(node: AstNode): void {
    if (isProgram(node)) {
      const formatter = this.getNodeFormatter(node);
      const nodes = formatter.nodes(...node.lines);
      nodes.prepend(Formatting.noIndent());
    } else if (isLine(node)) {
      const formatter = this.getNodeFormatter(node);
      if (isInstruction(node.instruction)) {
        if (node.instruction.args.length) {
          formatter.nodes(...node.instruction.args).prepend(Formatting.spaces(1));
        }
        if (isLabel(node.label)) {
          formatter.property("instruction").prepend(Formatting.indent());
        } else {
          formatter.property("instruction").prepend(Formatting.indent({ allowLess: true }));
        }
        if (node.comment) {
          let line = node.instruction.op.name;
          if (node.instruction.args.length) line += " ";
          line += node.instruction.args.map((arg) => arg.$cstNode!.text).join(", ");
          formatter.property("comment").prepend({ moves: [{ tabs: 5 - Math.floor(line.length / 4), lines: 0 }], options: {} });
        }
      }
      if (isDirective(node.directive)) {
        // separate label from directive if on same line
        // and indent directive
        if (isLabel(node.label)) {
          formatter.property("directive").prepend(Formatting.indent());
        } else {
          // indent
          formatter.property("directive").prepend(Formatting.indent({ allowLess: true }));
        }
        if (node.directive.args.length) {
          formatter.nodes(...node.directive.args).prepend(Formatting.spaces(1));
          // formatter.keywords(",").prepend(Formatting.spaces(0));
        }
        if (node.comment) {
          let line = node.directive.op.name;
          if (node.directive.args.length) line += " ";
          line += node.directive.args.map((arg) => arg.$cstNode!.text).join(", ");
          formatter.property("comment").prepend({ moves: [{ tabs: 5 - Math.floor(line.length / 4), lines: 0 }], options: {} });
        }
      }
    }

    //   if (isLabel(node.label) && isInstruction(node.instruction)) {
    //     // label and instruction on same line so split
    //     const formatter = this.getNodeFormatter(node);
    //     formatter.property("instruction").prepend(Formatting.indent());
    //   } else if (isInstruction(node.instruction)) {
    //     const formatter = this.getNodeFormatter(node);
    //     formatter.node(node).prepend(Formatting.indent({ allowLess: true }));
    //   }
    // } else if (isComment(node)) {
    //   const formatter = this.getNodeFormatter(node);
    //   formatter.node(node).prepend({ moves: [{ tabs: 8 }], options: {} });
    // } else if (isDirective(node)) {
    //   const formatter = this.getNodeFormatter(node);
    //   formatter.node(node).prepend(Formatting.indent({ allowLess: true }));
    // }
  }
}
