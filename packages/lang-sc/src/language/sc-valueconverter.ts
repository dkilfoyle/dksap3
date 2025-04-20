import { CstNode, DefaultValueConverter, GrammarAST, ValueType } from "langium";

export class ScValueConverter extends DefaultValueConverter {
  override runConverter(rule: GrammarAST.AbstractRule, input: string, cstNode: CstNode): ValueType {
    if (rule.name == "HEXNUMBER") {
      return parseInt(input.slice(2), 16);
    } else if (rule.name == "BINNUMBER") {
      return parseInt(input.slice(2), 2);
    } else return super.runConverter(rule, input, cstNode);
  }
}
