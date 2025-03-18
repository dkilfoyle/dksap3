import { AstNode } from "langium";
import { AbstractFormatter, Formatting, FormattingAction, FormattingActionOptions, FormattingMove } from "langium/lsp";
import { isComment, isDirective, isInstruction, isLine, isProgram } from "./generated/ast.js";
import { userPreferences } from "./asm-userpreferences.js";

function move(move: FormattingMove, options?: FormattingActionOptions): FormattingAction {
  return {
    options: options ?? {},
    moves: [move],
  };
}

export class AsmFormatter extends AbstractFormatter {
  hasLabel = false;
  instrLength = 0;

  protected override format(node: AstNode): void {
    switch (userPreferences.format.style) {
      case 1:
        return this.format1(node);
      case 2:
        return this.format2(node);
      default:
        throw Error();
    }
  }

  format1(node: AstNode) {
    if (isProgram(node)) {
      const formatter = this.getNodeFormatter(node);
      const nodes = formatter.nodes(...node.lines);
      nodes.prepend(Formatting.noIndent());
    } else if (isLine(node)) {
      this.hasLabel = node.label != undefined;
      this.instrLength = 0;
    } else if (isInstruction(node)) {
      const formatter = this.getNodeFormatter(node);
      formatter.property("op").prepend(move({ tabs: userPreferences.format.indentTabs, lines: this.hasLabel ? 0 : 1 }));
      formatter.property("arg1").prepend(Formatting.spaces(1));
      formatter.property("arg2").prepend(Formatting.spaces(1));
      this.instrLength =
        node.op.opname.length + (node.arg1 ? node.arg1!.$cstNode!.length + 1 : 0) + (node.arg2 ? node.arg2!.$cstNode!.length + 2 : 0);
    } else if (isDirective(node)) {
      const formatter = this.getNodeFormatter(node);
      formatter.property("dirname").prepend(move({ tabs: userPreferences.format.indentTabs, lines: this.hasLabel ? 0 : 1 }));
      throw Error("TODO: format directives");
      // formatter.properties("args").prepend(Formatting.spaces(1));
      // this.instrLength = node.dirname.length + node.args.join(", ").length;
    } else if (isComment(node)) {
      const formatter = this.getNodeFormatter(node);
      const tabs = userPreferences.format.commentTabs;
      const pre = Math.floor(this.instrLength / 8);
      if (this.instrLength > 0)
        formatter.property("comment").prepend(move({ tabs: tabs - pre, lines: this.instrLength > 0 ? 0 : 1 }, { allowLess: true }));
    }
  }

  format2(node: AstNode): void {
    // labels have own line
    if (isProgram(node)) {
      const formatter = this.getNodeFormatter(node);
      const nodes = formatter.nodes(...node.lines);
      nodes.prepend(Formatting.noIndent());
    } else if (isLine(node)) {
      const lineFormatter = this.getNodeFormatter(node);

      if (node.instr) {
        const instrFormatter = this.getNodeFormatter(node.instr);
        instrFormatter.property("arg1").prepend(Formatting.spaces(1));
        instrFormatter.property("arg2").prepend(Formatting.spaces(1));
        lineFormatter.property("instr").prepend({ moves: [{ tabs: userPreferences.format.indentTabs }], options: {} });
      }

      if (node.dir) {
        throw Error("TODO: Format directives");
        // const dirFormatter = this.getNodeFormatter(node.dir);
        // dirFormatter.property("dir").prepend({ moves: [{ tabs: userPreferences.format.indentTabs }], options: {} });
        // dirFormatter.properties("args").prepend(Formatting.spaces(1));
      }

      if (node.comment) {
        // comment on same line as label/instr/dir
        let length = 0;
        const indentSize = userPreferences.format.indentTabs * 8;
        if (node.instr)
          length =
            indentSize +
            node.instr.op.opname.length +
            (node.instr.arg1 ? node.instr.arg1.$cstNode!.length + 1 : 0) +
            (node.instr.arg2 ? node.instr.arg2.$cstNode!.length + 2 : 0);
        // else if (node.dir) length = indentSize + node.dir!.$cstNode!.text.length;
        else if (node.label) length = indentSize + 8;

        if (length != 0)
          lineFormatter
            .property("comment")
            .prepend({ moves: [{ tabs: userPreferences.format.commentTabs - Math.floor(length / 8), lines: 0 }], options: {} });
      }

      // // separate label from directive if on same line
      // // and indent directive
      // if (isLabel(node.label)) {
      //   formatter.property("directive").prepend(Formatting.indent());
      // } else {
      //   // indent
      //   formatter.property("directive").prepend(Formatting.indent({ allowLess: true }));
      // }
      // if (node.directive.args.length) {
      //   formatter.nodes(...node.directive.args).prepend(Formatting.spaces(1));
      //   // formatter.keywords(",").prepend(Formatting.spaces(0));
      // }
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
