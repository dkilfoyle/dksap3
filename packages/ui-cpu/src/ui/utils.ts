export const fprint = (x: number, f: number) => {
  if (x == undefined) return "??";
  switch (f) {
    case 2:
      return x.toString(f).padStart(8, "0");
    case 8:
      return x.toString(f).padStart(3, "0");
    case 10:
      return x.toString(f).padStart(3, "0");
    case 16:
      return x.toString(f).padStart(2, "0").toUpperCase();
    default:
      throw Error("fprint invalid format");
  }
};

export const getNextFormat = (f: number) => {
  switch (f) {
    case 8:
      return 10;
    case 10:
      return 16;
    case 16:
      return 8;
    default:
      throw Error("fprint invalid format");
  }
};
