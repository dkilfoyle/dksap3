export const getBit = (x: number, bit: number) => (x >> bit) & 1;
export const isOn = (x: number, bit: number) => (getBit(x, bit) == 0 ? 0 : 1);
export const setBit = (x: number, bit: number) => x | (1 << bit);
export const clearBit = (x: number, bit: number) => x & ~(1 << bit);
export const updateBit = (x: number, bit: number, value: number) => {
  // Normalized bit value.
  const bitValueNormalized = value ? 1 : 0;

  // Init clear mask.
  const clearMask = ~(1 << bit);

  // Clear bit value and then set it up to required value.
  return (x & clearMask) | (bitValueNormalized << bit);
};

export const combineBits = (bits: number[]) => {
  const x = 0;
  for (let i = 0; i < bits.length; i++) if (bits[i]) setBit(x, i);
  return x;
};
export const getBits = (x: number, bits: number | number[]) => {
  const [hi, lo] = Array.isArray(bits) ? bits : [bits, bits];
  return (x >> lo) & ((1 << (hi - lo + 1)) - 1);
};
export const setBits = (x: number, bits: number | number[], value = 1) => {
  const [hi, lo] = Array.isArray(bits) ? bits : [bits, bits];
  for (let i = lo; i <= hi; i++) {
    if (isOn(value, i - lo)) x |= 1 << i;
    else x &= ~(1 << i);
  }
  return x;
};

export const hi = (x: number) => (x >> 8) & 0xff;
export const lo = (x: number) => x & 0xff;
