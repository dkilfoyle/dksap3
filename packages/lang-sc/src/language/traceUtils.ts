import { TraceRegion, TextRegion } from "langium/generate";

// Zero based
export interface ILangiumPos {
  line: number;
  character: number;
}

export class ZeroPos implements ILangiumPos {
  constructor(public line: number, public character: number) {}
  static FromMonaco(pos: { lineNumber: number; column: number }) {
    return new ZeroPos(pos.lineNumber - 1, pos.column - 1);
  }
  static FromVsCode(pos: { line: number; character: number }) {
    return new ZeroPos(pos.line, pos.character);
  }
  static FromTextRegion(region: TextRegion, rangeEnd: "start" | "end" = "start") {
    if (!region.range) throw Error("ZeroPos.FromTexTregion TextRegion.range is invalid");
    return new ZeroPos(region.range[rangeEnd].line, region.range[rangeEnd].character);
  }
  static FromLangium(pos: ILangiumPos) {
    return new ZeroPos(pos.line, pos.character);
  }
  isBefore(other: ZeroPos) {
    if (this.line < other.line) return true;
    if (this.line == other.line && this.character < other.character) return true;
    return false;
  }
  isBeforeOrEqual(other: ZeroPos) {
    if (this.line < other.line) return true;
    if (this.line == other.line && this.character <= other.character) return true;
    return false;
  }
}

const isRegionContainingRange = (regionStart: ZeroPos, regionEnd: ZeroPos, rangeStart: ZeroPos, rangeEnd?: ZeroPos) => {
  // region           -------------------
  // range                  -------------
  if (rangeStart.isBeforeOrEqual(regionEnd) && !rangeStart.isBefore(regionStart)) {
    if (rangeEnd) {
      return rangeEnd.isBeforeOrEqual(regionEnd);
    } else return true;
  }
};

export const findFirstCodingLineAtOrAfter = (region: "source" | "target", node: TraceRegion, line: number): TraceRegion | undefined => {
  if (!node.sourceRegion) return undefined;
  const start = region == "source" ? ZeroPos.FromTextRegion(node.sourceRegion, "start") : ZeroPos.FromTextRegion(node.targetRegion, "start");
  const end = region == "source" ? ZeroPos.FromTextRegion(node.sourceRegion, "end") : ZeroPos.FromTextRegion(node.targetRegion, "end");

  if (start.line == line) {
    // console.log(`found region starting on line ${line}`, node, node.sourceRegion!.range!.start, node.sourceRegion!.range!.end);
    return node;
  }

  if (node.children && line >= start.line && line <= end.line) {
    // node contains line
    // console.log("testing node", node.sourceRegion, node.children);
    const closest = node.children?.reduce<{ closestChild: TraceRegion | undefined; closestLength: number }>(
      (accum, currentChild) => {
        // console.log("testing child", currentChild.sourceRegion?.range?.start, currentChild.sourceRegion?.range?.end);
        const n = findFirstCodingLineAtOrAfter(region, currentChild, line);
        if (n && n.sourceRegion!.range!.start.line >= line) {
          const distance = n.sourceRegion!.range!.start.line - line;
          // console.log("found child", n, distance);
          if (distance < accum.closestLength) {
            accum.closestChild = n;
            accum.closestLength = distance;
          }
        }
        return accum;
      },
      { closestChild: undefined, closestLength: 10000 }
    );
    return closest.closestChild || node;
  } else return node.sourceRegion.range!.start!.line >= line ? node : undefined;
};

export const findSmallestMatchingRegion = (
  region: "source" | "target",
  node: TraceRegion,
  startPos: ZeroPos,
  endPos?: ZeroPos
): TraceRegion | undefined => {
  if (!node.sourceRegion) return undefined;
  const start = region == "source" ? ZeroPos.FromTextRegion(node.sourceRegion, "start") : ZeroPos.FromTextRegion(node.targetRegion, "start");
  const end = region == "source" ? ZeroPos.FromTextRegion(node.sourceRegion, "end") : ZeroPos.FromTextRegion(node.targetRegion, "end");

  if (isRegionContainingRange(start, end, startPos, endPos)) {
    if (!node.children) {
      return node;
    }
    const smallest = node.children?.reduce<{ smallestChild: TraceRegion | undefined; smallestLength: number }>(
      (accum, currentChild) => {
        const n = findSmallestMatchingRegion(region, currentChild, startPos, endPos);
        if (n !== undefined && n.sourceRegion?.length && n.sourceRegion.length < accum.smallestLength) {
          accum.smallestLength = n.sourceRegion.length;
          accum.smallestChild = n;
        }
        return accum;
      },
      { smallestChild: undefined, smallestLength: 10000 }
    );

    return smallest.smallestChild || node;
  }
};

export const doIfInside = (regionSelector: "source" | "target", node: TraceRegion, pos: ZeroPos, todo: (textRegion: TraceRegion) => void) => {
  if (!node.sourceRegion) return undefined;

  const region = regionSelector == "source" ? node.sourceRegion : node.targetRegion;

  if (isRegionContainingRange(ZeroPos.FromLangium(region.range!.start), ZeroPos.FromLangium(region.range!.end), pos, pos)) {
    todo(node);
    if (node.children) {
      node.children.forEach((child) => doIfInside(regionSelector, child, pos, todo));
    }
  }
};
