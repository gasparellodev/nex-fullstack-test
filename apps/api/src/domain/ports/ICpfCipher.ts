export interface ICpfCipher {
  /** Encrypt a normalized CPF (digits only). Returns ciphertext as a Buffer. */
  encrypt(cpfDigits: string): Buffer;
  /** Decrypt a ciphertext blob produced by `encrypt`. Returns the original digits. */
  decrypt(ciphertext: Buffer): string;
}
