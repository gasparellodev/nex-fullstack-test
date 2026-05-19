import type { UserRole } from '@nex/shared';

export interface UserProps {
  id: string;
  name: string;
  email: string;
  cpfEncrypted: Buffer;
  cpfHash: string;
  passwordHash: string;
  role: UserRole;
  consentAt: Date;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export class User {
  readonly id: string;
  readonly name: string;
  readonly email: string;
  readonly cpfEncrypted: Buffer;
  readonly cpfHash: string;
  readonly passwordHash: string;
  readonly role: UserRole;
  readonly consentAt: Date;
  readonly deletedAt: Date | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;

  constructor(props: UserProps) {
    this.id = props.id;
    this.name = props.name;
    this.email = props.email;
    this.cpfEncrypted = props.cpfEncrypted;
    this.cpfHash = props.cpfHash;
    this.passwordHash = props.passwordHash;
    this.role = props.role;
    this.consentAt = props.consentAt;
    this.deletedAt = props.deletedAt;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
  }

  get isAdmin(): boolean {
    return this.role === 'admin';
  }

  get isDeleted(): boolean {
    return this.deletedAt !== null;
  }
}
