export interface ICpfIndex {
  /** Compute a deterministic, peppered hash usable as a unique index in MySQL. */
  compute(cpfDigits: string): string;
}
