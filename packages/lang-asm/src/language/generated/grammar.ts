/******************************************************************************
 * This file was generated by langium-cli 3.3.0.
 * DO NOT EDIT MANUALLY!
 ******************************************************************************/

import type { Grammar } from 'langium';
import { loadGrammarFromJson } from 'langium';

let loadedAsmGrammar: Grammar | undefined;
export const AsmGrammar = (): Grammar => loadedAsmGrammar ?? (loadedAsmGrammar = loadGrammarFromJson(`{
  "$type": "Grammar",
  "isDeclared": true,
  "name": "Asm",
  "rules": [
    {
      "$type": "ParserRule",
      "entry": true,
      "name": "Program",
      "definition": {
        "$type": "Group",
        "elements": [
          {
            "$type": "RuleCall",
            "rule": {
              "$ref": "#/rules@30"
            },
            "arguments": [],
            "cardinality": "*"
          },
          {
            "$type": "Assignment",
            "feature": "lines",
            "operator": "+=",
            "terminal": {
              "$type": "RuleCall",
              "rule": {
                "$ref": "#/rules@1"
              },
              "arguments": []
            },
            "cardinality": "*"
          }
        ]
      },
      "definesHiddenTokens": false,
      "fragment": false,
      "hiddenTokens": [],
      "parameters": [],
      "wildcard": false
    },
    {
      "$type": "ParserRule",
      "name": "Line",
      "definition": {
        "$type": "Alternatives",
        "elements": [
          {
            "$type": "Group",
            "elements": [
              {
                "$type": "Assignment",
                "feature": "label",
                "operator": "=",
                "terminal": {
                  "$type": "RuleCall",
                  "rule": {
                    "$ref": "#/rules@2"
                  },
                  "arguments": []
                }
              },
              {
                "$type": "Alternatives",
                "elements": [
                  {
                    "$type": "Assignment",
                    "feature": "instr",
                    "operator": "=",
                    "terminal": {
                      "$type": "RuleCall",
                      "rule": {
                        "$ref": "#/rules@4"
                      },
                      "arguments": []
                    }
                  },
                  {
                    "$type": "Assignment",
                    "feature": "dir",
                    "operator": "=",
                    "terminal": {
                      "$type": "RuleCall",
                      "rule": {
                        "$ref": "#/rules@27"
                      },
                      "arguments": []
                    }
                  }
                ],
                "cardinality": "?"
              },
              {
                "$type": "Assignment",
                "feature": "comment",
                "operator": "=",
                "terminal": {
                  "$type": "RuleCall",
                  "rule": {
                    "$ref": "#/rules@3"
                  },
                  "arguments": []
                },
                "cardinality": "?"
              },
              {
                "$type": "RuleCall",
                "rule": {
                  "$ref": "#/rules@30"
                },
                "arguments": [],
                "cardinality": "?"
              }
            ]
          },
          {
            "$type": "Group",
            "elements": [
              {
                "$type": "Alternatives",
                "elements": [
                  {
                    "$type": "Assignment",
                    "feature": "instr",
                    "operator": "=",
                    "terminal": {
                      "$type": "RuleCall",
                      "rule": {
                        "$ref": "#/rules@4"
                      },
                      "arguments": []
                    }
                  },
                  {
                    "$type": "Assignment",
                    "feature": "dir",
                    "operator": "=",
                    "terminal": {
                      "$type": "RuleCall",
                      "rule": {
                        "$ref": "#/rules@27"
                      },
                      "arguments": []
                    }
                  }
                ]
              },
              {
                "$type": "Assignment",
                "feature": "comment",
                "operator": "=",
                "terminal": {
                  "$type": "RuleCall",
                  "rule": {
                    "$ref": "#/rules@3"
                  },
                  "arguments": []
                },
                "cardinality": "?"
              },
              {
                "$type": "RuleCall",
                "rule": {
                  "$ref": "#/rules@30"
                },
                "arguments": [],
                "cardinality": "?"
              }
            ]
          },
          {
            "$type": "Group",
            "elements": [
              {
                "$type": "Assignment",
                "feature": "comment",
                "operator": "=",
                "terminal": {
                  "$type": "RuleCall",
                  "rule": {
                    "$ref": "#/rules@3"
                  },
                  "arguments": []
                }
              },
              {
                "$type": "RuleCall",
                "rule": {
                  "$ref": "#/rules@30"
                },
                "arguments": [],
                "cardinality": "?"
              }
            ]
          },
          {
            "$type": "RuleCall",
            "rule": {
              "$ref": "#/rules@30"
            },
            "arguments": []
          }
        ]
      },
      "definesHiddenTokens": false,
      "entry": false,
      "fragment": false,
      "hiddenTokens": [],
      "parameters": [],
      "wildcard": false
    },
    {
      "$type": "ParserRule",
      "name": "Label",
      "definition": {
        "$type": "Group",
        "elements": [
          {
            "$type": "Assignment",
            "feature": "name",
            "operator": "=",
            "terminal": {
              "$type": "RuleCall",
              "rule": {
                "$ref": "#/rules@22"
              },
              "arguments": []
            }
          },
          {
            "$type": "Keyword",
            "value": ":"
          }
        ]
      },
      "definesHiddenTokens": false,
      "entry": false,
      "fragment": false,
      "hiddenTokens": [],
      "parameters": [],
      "wildcard": false
    },
    {
      "$type": "ParserRule",
      "name": "Comment",
      "definition": {
        "$type": "Assignment",
        "feature": "comment",
        "operator": "=",
        "terminal": {
          "$type": "RuleCall",
          "rule": {
            "$ref": "#/rules@31"
          },
          "arguments": []
        }
      },
      "definesHiddenTokens": false,
      "entry": false,
      "fragment": false,
      "hiddenTokens": [],
      "parameters": [],
      "wildcard": false
    },
    {
      "$type": "ParserRule",
      "name": "Instruction",
      "definition": {
        "$type": "Alternatives",
        "elements": [
          {
            "$type": "RuleCall",
            "rule": {
              "$ref": "#/rules@15"
            },
            "arguments": []
          },
          {
            "$type": "RuleCall",
            "rule": {
              "$ref": "#/rules@5"
            },
            "arguments": []
          },
          {
            "$type": "RuleCall",
            "rule": {
              "$ref": "#/rules@7"
            },
            "arguments": []
          },
          {
            "$type": "RuleCall",
            "rule": {
              "$ref": "#/rules@11"
            },
            "arguments": []
          },
          {
            "$type": "RuleCall",
            "rule": {
              "$ref": "#/rules@13"
            },
            "arguments": []
          },
          {
            "$type": "RuleCall",
            "rule": {
              "$ref": "#/rules@9"
            },
            "arguments": []
          },
          {
            "$type": "RuleCall",
            "rule": {
              "$ref": "#/rules@17"
            },
            "arguments": []
          },
          {
            "$type": "RuleCall",
            "rule": {
              "$ref": "#/rules@19"
            },
            "arguments": []
          }
        ]
      },
      "definesHiddenTokens": false,
      "entry": false,
      "fragment": false,
      "hiddenTokens": [],
      "parameters": [],
      "wildcard": false
    },
    {
      "$type": "ParserRule",
      "name": "R8R8Instruction",
      "inferredType": {
        "$type": "InferredType",
        "name": "Instr"
      },
      "definition": {
        "$type": "Group",
        "elements": [
          {
            "$type": "Assignment",
            "feature": "op",
            "operator": "=",
            "terminal": {
              "$type": "RuleCall",
              "rule": {
                "$ref": "#/rules@6"
              },
              "arguments": []
            }
          },
          {
            "$type": "Assignment",
            "feature": "arg1",
            "operator": "=",
            "terminal": {
              "$type": "RuleCall",
              "rule": {
                "$ref": "#/rules@23"
              },
              "arguments": []
            }
          },
          {
            "$type": "Keyword",
            "value": ","
          },
          {
            "$type": "Assignment",
            "feature": "arg2",
            "operator": "=",
            "terminal": {
              "$type": "RuleCall",
              "rule": {
                "$ref": "#/rules@23"
              },
              "arguments": []
            }
          }
        ]
      },
      "definesHiddenTokens": false,
      "entry": false,
      "fragment": false,
      "hiddenTokens": [],
      "parameters": [],
      "wildcard": false
    },
    {
      "$type": "ParserRule",
      "name": "R8R8Operation",
      "inferredType": {
        "$type": "InferredType",
        "name": "Operation"
      },
      "definition": {
        "$type": "Assignment",
        "feature": "opname",
        "operator": "=",
        "terminal": {
          "$type": "Keyword",
          "value": "mov"
        }
      },
      "definesHiddenTokens": false,
      "entry": false,
      "fragment": false,
      "hiddenTokens": [],
      "parameters": [],
      "wildcard": false
    },
    {
      "$type": "ParserRule",
      "name": "R8Imm8Instruction",
      "inferredType": {
        "$type": "InferredType",
        "name": "Instr"
      },
      "definition": {
        "$type": "Group",
        "elements": [
          {
            "$type": "Assignment",
            "feature": "op",
            "operator": "=",
            "terminal": {
              "$type": "RuleCall",
              "rule": {
                "$ref": "#/rules@8"
              },
              "arguments": []
            }
          },
          {
            "$type": "Assignment",
            "feature": "arg1",
            "operator": "=",
            "terminal": {
              "$type": "RuleCall",
              "rule": {
                "$ref": "#/rules@23"
              },
              "arguments": []
            }
          },
          {
            "$type": "Keyword",
            "value": ","
          },
          {
            "$type": "Assignment",
            "feature": "arg2",
            "operator": "=",
            "terminal": {
              "$type": "RuleCall",
              "rule": {
                "$ref": "#/rules@25"
              },
              "arguments": []
            }
          }
        ]
      },
      "definesHiddenTokens": false,
      "entry": false,
      "fragment": false,
      "hiddenTokens": [],
      "parameters": [],
      "wildcard": false
    },
    {
      "$type": "ParserRule",
      "name": "R8Imm8Operation",
      "inferredType": {
        "$type": "InferredType",
        "name": "Operation"
      },
      "definition": {
        "$type": "Assignment",
        "feature": "opname",
        "operator": "=",
        "terminal": {
          "$type": "Keyword",
          "value": "mvi"
        }
      },
      "definesHiddenTokens": false,
      "entry": false,
      "fragment": false,
      "hiddenTokens": [],
      "parameters": [],
      "wildcard": false
    },
    {
      "$type": "ParserRule",
      "name": "R16Imm16Instruction",
      "inferredType": {
        "$type": "InferredType",
        "name": "Instr"
      },
      "definition": {
        "$type": "Group",
        "elements": [
          {
            "$type": "Assignment",
            "feature": "op",
            "operator": "=",
            "terminal": {
              "$type": "RuleCall",
              "rule": {
                "$ref": "#/rules@10"
              },
              "arguments": []
            }
          },
          {
            "$type": "Assignment",
            "feature": "arg1",
            "operator": "=",
            "terminal": {
              "$type": "RuleCall",
              "rule": {
                "$ref": "#/rules@24"
              },
              "arguments": []
            }
          },
          {
            "$type": "Keyword",
            "value": ","
          },
          {
            "$type": "Assignment",
            "feature": "arg2",
            "operator": "=",
            "terminal": {
              "$type": "RuleCall",
              "rule": {
                "$ref": "#/rules@26"
              },
              "arguments": []
            }
          }
        ]
      },
      "definesHiddenTokens": false,
      "entry": false,
      "fragment": false,
      "hiddenTokens": [],
      "parameters": [],
      "wildcard": false
    },
    {
      "$type": "ParserRule",
      "name": "R16Imm16Operation",
      "inferredType": {
        "$type": "InferredType",
        "name": "Operation"
      },
      "definition": {
        "$type": "Assignment",
        "feature": "opname",
        "operator": "=",
        "terminal": {
          "$type": "Keyword",
          "value": "lxi"
        }
      },
      "definesHiddenTokens": false,
      "entry": false,
      "fragment": false,
      "hiddenTokens": [],
      "parameters": [],
      "wildcard": false
    },
    {
      "$type": "ParserRule",
      "name": "R8Instruction",
      "inferredType": {
        "$type": "InferredType",
        "name": "Instr"
      },
      "definition": {
        "$type": "Group",
        "elements": [
          {
            "$type": "Assignment",
            "feature": "op",
            "operator": "=",
            "terminal": {
              "$type": "RuleCall",
              "rule": {
                "$ref": "#/rules@12"
              },
              "arguments": []
            }
          },
          {
            "$type": "Assignment",
            "feature": "arg1",
            "operator": "=",
            "terminal": {
              "$type": "RuleCall",
              "rule": {
                "$ref": "#/rules@23"
              },
              "arguments": []
            }
          }
        ]
      },
      "definesHiddenTokens": false,
      "entry": false,
      "fragment": false,
      "hiddenTokens": [],
      "parameters": [],
      "wildcard": false
    },
    {
      "$type": "ParserRule",
      "name": "R8Operation",
      "inferredType": {
        "$type": "InferredType",
        "name": "Operation"
      },
      "definition": {
        "$type": "Assignment",
        "feature": "opname",
        "operator": "=",
        "terminal": {
          "$type": "Alternatives",
          "elements": [
            {
              "$type": "Keyword",
              "value": "inr"
            },
            {
              "$type": "Keyword",
              "value": "dcr"
            },
            {
              "$type": "Keyword",
              "value": "add"
            },
            {
              "$type": "Keyword",
              "value": "adc"
            },
            {
              "$type": "Keyword",
              "value": "sub"
            },
            {
              "$type": "Keyword",
              "value": "sbb"
            },
            {
              "$type": "Keyword",
              "value": "ana"
            },
            {
              "$type": "Keyword",
              "value": "ora"
            },
            {
              "$type": "Keyword",
              "value": "xra"
            },
            {
              "$type": "Keyword",
              "value": "cmp"
            }
          ]
        }
      },
      "definesHiddenTokens": false,
      "entry": false,
      "fragment": false,
      "hiddenTokens": [],
      "parameters": [],
      "wildcard": false
    },
    {
      "$type": "ParserRule",
      "name": "R16Instruction",
      "inferredType": {
        "$type": "InferredType",
        "name": "Instr"
      },
      "definition": {
        "$type": "Group",
        "elements": [
          {
            "$type": "Assignment",
            "feature": "op",
            "operator": "=",
            "terminal": {
              "$type": "RuleCall",
              "rule": {
                "$ref": "#/rules@14"
              },
              "arguments": []
            }
          },
          {
            "$type": "Assignment",
            "feature": "arg1",
            "operator": "=",
            "terminal": {
              "$type": "RuleCall",
              "rule": {
                "$ref": "#/rules@24"
              },
              "arguments": []
            }
          }
        ]
      },
      "definesHiddenTokens": false,
      "entry": false,
      "fragment": false,
      "hiddenTokens": [],
      "parameters": [],
      "wildcard": false
    },
    {
      "$type": "ParserRule",
      "name": "R16Operation",
      "inferredType": {
        "$type": "InferredType",
        "name": "Operation"
      },
      "definition": {
        "$type": "Assignment",
        "feature": "opname",
        "operator": "=",
        "terminal": {
          "$type": "Alternatives",
          "elements": [
            {
              "$type": "Keyword",
              "value": "inx"
            },
            {
              "$type": "Keyword",
              "value": "dcx"
            },
            {
              "$type": "Keyword",
              "value": "dad"
            },
            {
              "$type": "Keyword",
              "value": "ldax"
            },
            {
              "$type": "Keyword",
              "value": "stax"
            },
            {
              "$type": "Keyword",
              "value": "push"
            },
            {
              "$type": "Keyword",
              "value": "pop"
            }
          ]
        }
      },
      "definesHiddenTokens": false,
      "entry": false,
      "fragment": false,
      "hiddenTokens": [],
      "parameters": [],
      "wildcard": false
    },
    {
      "$type": "ParserRule",
      "name": "AddrInstruction",
      "inferredType": {
        "$type": "InferredType",
        "name": "Instr"
      },
      "definition": {
        "$type": "Group",
        "elements": [
          {
            "$type": "Assignment",
            "feature": "op",
            "operator": "=",
            "terminal": {
              "$type": "RuleCall",
              "rule": {
                "$ref": "#/rules@16"
              },
              "arguments": []
            }
          },
          {
            "$type": "Assignment",
            "feature": "arg1",
            "operator": "=",
            "terminal": {
              "$type": "RuleCall",
              "rule": {
                "$ref": "#/rules@21"
              },
              "arguments": []
            }
          }
        ]
      },
      "definesHiddenTokens": false,
      "entry": false,
      "fragment": false,
      "hiddenTokens": [],
      "parameters": [],
      "wildcard": false
    },
    {
      "$type": "ParserRule",
      "name": "AddrOperation",
      "inferredType": {
        "$type": "InferredType",
        "name": "Operation"
      },
      "definition": {
        "$type": "Assignment",
        "feature": "opname",
        "operator": "=",
        "terminal": {
          "$type": "Alternatives",
          "elements": [
            {
              "$type": "Keyword",
              "value": "jmp"
            },
            {
              "$type": "Keyword",
              "value": "jp"
            },
            {
              "$type": "Keyword",
              "value": "jm"
            },
            {
              "$type": "Keyword",
              "value": "jnz"
            },
            {
              "$type": "Keyword",
              "value": "jz"
            },
            {
              "$type": "Keyword",
              "value": "jpo"
            },
            {
              "$type": "Keyword",
              "value": "jpe"
            },
            {
              "$type": "Keyword",
              "value": "jnc"
            },
            {
              "$type": "Keyword",
              "value": "jc"
            },
            {
              "$type": "Keyword",
              "value": "lda"
            },
            {
              "$type": "Keyword",
              "value": "sta"
            },
            {
              "$type": "Keyword",
              "value": "call"
            },
            {
              "$type": "Keyword",
              "value": "lhld"
            },
            {
              "$type": "Keyword",
              "value": "shld"
            },
            {
              "$type": "Keyword",
              "value": "cp"
            },
            {
              "$type": "Keyword",
              "value": "cm"
            },
            {
              "$type": "Keyword",
              "value": "cnz"
            },
            {
              "$type": "Keyword",
              "value": "cnc"
            },
            {
              "$type": "Keyword",
              "value": "cz"
            },
            {
              "$type": "Keyword",
              "value": "cpo"
            },
            {
              "$type": "Keyword",
              "value": "cpe"
            },
            {
              "$type": "Keyword",
              "value": "cc"
            }
          ]
        }
      },
      "definesHiddenTokens": false,
      "entry": false,
      "fragment": false,
      "hiddenTokens": [],
      "parameters": [],
      "wildcard": false
    },
    {
      "$type": "ParserRule",
      "name": "Imm8Instruction",
      "inferredType": {
        "$type": "InferredType",
        "name": "Instr"
      },
      "definition": {
        "$type": "Group",
        "elements": [
          {
            "$type": "Assignment",
            "feature": "op",
            "operator": "=",
            "terminal": {
              "$type": "RuleCall",
              "rule": {
                "$ref": "#/rules@18"
              },
              "arguments": []
            }
          },
          {
            "$type": "Assignment",
            "feature": "arg1",
            "operator": "=",
            "terminal": {
              "$type": "RuleCall",
              "rule": {
                "$ref": "#/rules@25"
              },
              "arguments": []
            }
          }
        ]
      },
      "definesHiddenTokens": false,
      "entry": false,
      "fragment": false,
      "hiddenTokens": [],
      "parameters": [],
      "wildcard": false
    },
    {
      "$type": "ParserRule",
      "name": "Imm8Operation",
      "inferredType": {
        "$type": "InferredType",
        "name": "Operation"
      },
      "definition": {
        "$type": "Assignment",
        "feature": "opname",
        "operator": "=",
        "terminal": {
          "$type": "Alternatives",
          "elements": [
            {
              "$type": "Keyword",
              "value": "adi"
            },
            {
              "$type": "Keyword",
              "value": "aci"
            },
            {
              "$type": "Keyword",
              "value": "sui"
            },
            {
              "$type": "Keyword",
              "value": "sbi"
            },
            {
              "$type": "Keyword",
              "value": "ani"
            },
            {
              "$type": "Keyword",
              "value": "ori"
            },
            {
              "$type": "Keyword",
              "value": "xri"
            },
            {
              "$type": "Keyword",
              "value": "cpi"
            },
            {
              "$type": "Keyword",
              "value": "out"
            }
          ]
        }
      },
      "definesHiddenTokens": false,
      "entry": false,
      "fragment": false,
      "hiddenTokens": [],
      "parameters": [],
      "wildcard": false
    },
    {
      "$type": "ParserRule",
      "name": "NoArgInstruction",
      "inferredType": {
        "$type": "InferredType",
        "name": "Instr"
      },
      "definition": {
        "$type": "Assignment",
        "feature": "op",
        "operator": "=",
        "terminal": {
          "$type": "RuleCall",
          "rule": {
            "$ref": "#/rules@20"
          },
          "arguments": []
        }
      },
      "definesHiddenTokens": false,
      "entry": false,
      "fragment": false,
      "hiddenTokens": [],
      "parameters": [],
      "wildcard": false
    },
    {
      "$type": "ParserRule",
      "name": "NoArgOperation",
      "inferredType": {
        "$type": "InferredType",
        "name": "Operation"
      },
      "definition": {
        "$type": "Assignment",
        "feature": "opname",
        "operator": "=",
        "terminal": {
          "$type": "Alternatives",
          "elements": [
            {
              "$type": "Keyword",
              "value": "rlc"
            },
            {
              "$type": "Keyword",
              "value": "ral"
            },
            {
              "$type": "Keyword",
              "value": "rar"
            },
            {
              "$type": "Keyword",
              "value": "rrc"
            },
            {
              "$type": "Keyword",
              "value": "cma"
            },
            {
              "$type": "Keyword",
              "value": "stc"
            },
            {
              "$type": "Keyword",
              "value": "cmc"
            },
            {
              "$type": "Keyword",
              "value": "ret"
            },
            {
              "$type": "Keyword",
              "value": "rp"
            },
            {
              "$type": "Keyword",
              "value": "rm"
            },
            {
              "$type": "Keyword",
              "value": "rnz"
            },
            {
              "$type": "Keyword",
              "value": "rz"
            },
            {
              "$type": "Keyword",
              "value": "rpo"
            },
            {
              "$type": "Keyword",
              "value": "rpe"
            },
            {
              "$type": "Keyword",
              "value": "rnc"
            },
            {
              "$type": "Keyword",
              "value": "rc"
            },
            {
              "$type": "Keyword",
              "value": "nop"
            },
            {
              "$type": "Keyword",
              "value": "hlt"
            },
            {
              "$type": "Keyword",
              "value": "xchg"
            },
            {
              "$type": "Keyword",
              "value": "pchl"
            },
            {
              "$type": "Keyword",
              "value": "xthl"
            }
          ]
        }
      },
      "definesHiddenTokens": false,
      "entry": false,
      "fragment": false,
      "hiddenTokens": [],
      "parameters": [],
      "wildcard": false
    },
    {
      "$type": "ParserRule",
      "name": "AddrArgument",
      "definition": {
        "$type": "Alternatives",
        "elements": [
          {
            "$type": "Assignment",
            "feature": "number",
            "operator": "=",
            "terminal": {
              "$type": "RuleCall",
              "rule": {
                "$ref": "#/rules@32"
              },
              "arguments": []
            }
          },
          {
            "$type": "Assignment",
            "feature": "identifier",
            "operator": "=",
            "terminal": {
              "$type": "CrossReference",
              "type": {
                "$ref": "#/rules@2"
              },
              "terminal": {
                "$type": "RuleCall",
                "rule": {
                  "$ref": "#/rules@22"
                },
                "arguments": []
              },
              "deprecatedSyntax": false
            }
          }
        ]
      },
      "definesHiddenTokens": false,
      "entry": false,
      "fragment": false,
      "hiddenTokens": [],
      "parameters": [],
      "wildcard": false
    },
    {
      "$type": "TerminalRule",
      "name": "ID",
      "definition": {
        "$type": "RegexToken",
        "regex": "/[_a-zA-Z][a-zA-Z0-9._]*/"
      },
      "fragment": false,
      "hidden": false
    },
    {
      "$type": "ParserRule",
      "name": "Reg8",
      "definition": {
        "$type": "Assignment",
        "feature": "register",
        "operator": "=",
        "terminal": {
          "$type": "Alternatives",
          "elements": [
            {
              "$type": "Keyword",
              "value": "a"
            },
            {
              "$type": "Keyword",
              "value": "b"
            },
            {
              "$type": "Keyword",
              "value": "c"
            },
            {
              "$type": "Keyword",
              "value": "d"
            },
            {
              "$type": "Keyword",
              "value": "e"
            },
            {
              "$type": "Keyword",
              "value": "h"
            },
            {
              "$type": "Keyword",
              "value": "l"
            },
            {
              "$type": "Keyword",
              "value": "m"
            }
          ]
        }
      },
      "definesHiddenTokens": false,
      "entry": false,
      "fragment": false,
      "hiddenTokens": [],
      "parameters": [],
      "wildcard": false
    },
    {
      "$type": "ParserRule",
      "name": "Reg16",
      "definition": {
        "$type": "Assignment",
        "feature": "register",
        "operator": "=",
        "terminal": {
          "$type": "Alternatives",
          "elements": [
            {
              "$type": "Keyword",
              "value": "b"
            },
            {
              "$type": "Keyword",
              "value": "d"
            },
            {
              "$type": "Keyword",
              "value": "h"
            },
            {
              "$type": "Keyword",
              "value": "sp"
            },
            {
              "$type": "Keyword",
              "value": "psw"
            }
          ]
        }
      },
      "definesHiddenTokens": false,
      "entry": false,
      "fragment": false,
      "hiddenTokens": [],
      "parameters": [],
      "wildcard": false
    },
    {
      "$type": "ParserRule",
      "name": "Imm8",
      "definition": {
        "$type": "Alternatives",
        "elements": [
          {
            "$type": "Assignment",
            "feature": "number",
            "operator": "=",
            "terminal": {
              "$type": "RuleCall",
              "rule": {
                "$ref": "#/rules@32"
              },
              "arguments": []
            }
          },
          {
            "$type": "Assignment",
            "feature": "char",
            "operator": "=",
            "terminal": {
              "$type": "RuleCall",
              "rule": {
                "$ref": "#/rules@33"
              },
              "arguments": []
            }
          }
        ]
      },
      "definesHiddenTokens": false,
      "entry": false,
      "fragment": false,
      "hiddenTokens": [],
      "parameters": [],
      "wildcard": false
    },
    {
      "$type": "ParserRule",
      "name": "Imm16",
      "definition": {
        "$type": "Alternatives",
        "elements": [
          {
            "$type": "Assignment",
            "feature": "number",
            "operator": "=",
            "terminal": {
              "$type": "RuleCall",
              "rule": {
                "$ref": "#/rules@32"
              },
              "arguments": []
            }
          },
          {
            "$type": "Assignment",
            "feature": "identifier",
            "operator": "=",
            "terminal": {
              "$type": "CrossReference",
              "type": {
                "$ref": "#/rules@2"
              },
              "terminal": {
                "$type": "RuleCall",
                "rule": {
                  "$ref": "#/rules@22"
                },
                "arguments": []
              },
              "deprecatedSyntax": false
            }
          }
        ]
      },
      "definesHiddenTokens": false,
      "entry": false,
      "fragment": false,
      "hiddenTokens": [],
      "parameters": [],
      "wildcard": false
    },
    {
      "$type": "ParserRule",
      "name": "Directive",
      "definition": {
        "$type": "Group",
        "elements": [
          {
            "$type": "Assignment",
            "feature": "lhs",
            "operator": "=",
            "terminal": {
              "$type": "RuleCall",
              "rule": {
                "$ref": "#/rules@28"
              },
              "arguments": []
            },
            "cardinality": "?"
          },
          {
            "$type": "Assignment",
            "feature": "dir",
            "operator": "=",
            "terminal": {
              "$type": "RuleCall",
              "rule": {
                "$ref": "#/rules@29"
              },
              "arguments": []
            }
          },
          {
            "$type": "Assignment",
            "feature": "args",
            "operator": "+=",
            "terminal": {
              "$type": "RuleCall",
              "rule": {
                "$ref": "#/rules@28"
              },
              "arguments": []
            }
          },
          {
            "$type": "Group",
            "elements": [
              {
                "$type": "Keyword",
                "value": ","
              },
              {
                "$type": "Assignment",
                "feature": "args",
                "operator": "+=",
                "terminal": {
                  "$type": "RuleCall",
                  "rule": {
                    "$ref": "#/rules@28"
                  },
                  "arguments": []
                }
              }
            ],
            "cardinality": "*"
          }
        ]
      },
      "definesHiddenTokens": false,
      "entry": false,
      "fragment": false,
      "hiddenTokens": [],
      "parameters": [],
      "wildcard": false
    },
    {
      "$type": "ParserRule",
      "name": "DirectiveArgument",
      "definition": {
        "$type": "Alternatives",
        "elements": [
          {
            "$type": "Assignment",
            "feature": "number",
            "operator": "=",
            "terminal": {
              "$type": "RuleCall",
              "rule": {
                "$ref": "#/rules@32"
              },
              "arguments": []
            }
          },
          {
            "$type": "Assignment",
            "feature": "identifier",
            "operator": "=",
            "terminal": {
              "$type": "CrossReference",
              "type": {
                "$ref": "#/rules@2"
              },
              "terminal": {
                "$type": "RuleCall",
                "rule": {
                  "$ref": "#/rules@22"
                },
                "arguments": []
              },
              "deprecatedSyntax": false
            }
          }
        ]
      },
      "definesHiddenTokens": false,
      "entry": false,
      "fragment": false,
      "hiddenTokens": [],
      "parameters": [],
      "wildcard": false
    },
    {
      "$type": "ParserRule",
      "name": "DirectiveOperation",
      "definition": {
        "$type": "Assignment",
        "feature": "opname",
        "operator": "=",
        "terminal": {
          "$type": "Alternatives",
          "elements": [
            {
              "$type": "Keyword",
              "value": "org"
            },
            {
              "$type": "Keyword",
              "value": "equ"
            },
            {
              "$type": "Keyword",
              "value": "db"
            },
            {
              "$type": "Keyword",
              "value": "ds"
            },
            {
              "$type": "Keyword",
              "value": "dw"
            }
          ]
        }
      },
      "definesHiddenTokens": false,
      "entry": false,
      "fragment": false,
      "hiddenTokens": [],
      "parameters": [],
      "wildcard": false
    },
    {
      "$type": "TerminalRule",
      "name": "EOL",
      "definition": {
        "$type": "RegexToken",
        "regex": "/[\\\\r\\\\n]+/"
      },
      "fragment": false,
      "hidden": false
    },
    {
      "$type": "TerminalRule",
      "name": "COMMENT",
      "definition": {
        "$type": "RegexToken",
        "regex": "/;[^\\\\n\\\\r]*/"
      },
      "fragment": false,
      "hidden": false
    },
    {
      "$type": "TerminalRule",
      "name": "NUMBER",
      "type": {
        "$type": "ReturnType",
        "name": "number"
      },
      "definition": {
        "$type": "RegexToken",
        "regex": "/[0-9][0-9a-fA-F]*[h]?/"
      },
      "fragment": false,
      "hidden": false
    },
    {
      "$type": "TerminalRule",
      "name": "CHARACTER",
      "definition": {
        "$type": "RegexToken",
        "regex": "/'[ -~]'/"
      },
      "fragment": false,
      "hidden": false
    },
    {
      "$type": "TerminalRule",
      "name": "STRING",
      "definition": {
        "$type": "RegexToken",
        "regex": "/\\"(\\\\\\\\.|[^\\"\\\\\\\\])*\\"|'(\\\\\\\\.|[^'\\\\\\\\])*'/"
      },
      "fragment": false,
      "hidden": false
    },
    {
      "$type": "TerminalRule",
      "hidden": true,
      "name": "WS",
      "definition": {
        "$type": "RegexToken",
        "regex": "/[ \\\\t]/"
      },
      "fragment": false
    }
  ],
  "definesHiddenTokens": false,
  "hiddenTokens": [],
  "imports": [],
  "interfaces": [],
  "types": [],
  "usedGrammars": []
}`));
