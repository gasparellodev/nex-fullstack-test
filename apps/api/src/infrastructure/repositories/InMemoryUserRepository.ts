import { User } from '@/domain/entities/User.js';
import type {
  CreateUserInput,
  IUserRepository,
} from '@/domain/repositories/IUserRepository.js';

/**
 * In-memory implementation of `IUserRepository` used by unit tests so the
 * use cases can be exercised without a database. It also serves as a Liskov
 * counter-example check for the Sequelize implementation.
 */
export class InMemoryUserRepository implements IUserRepository {
  private readonly users = new Map<string, User>();

  async create(input: CreateUserInput): Promise<User> {
    const now = new Date();
    const user = new User({
      ...input,
      deletedAt: null,
      createdAt: now,
      updatedAt: now,
    });
    this.users.set(user.id, user);
    return user;
  }

  async findById(id: string): Promise<User | null> {
    const user = this.users.get(id);
    return user && !user.isDeleted ? user : null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const normalised = email.trim().toLowerCase();
    for (const user of this.users.values()) {
      if (!user.isDeleted && user.email === normalised) return user;
    }
    return null;
  }

  async findByCpfHash(cpfHash: string): Promise<User | null> {
    for (const user of this.users.values()) {
      if (!user.isDeleted && user.cpfHash === cpfHash) return user;
    }
    return null;
  }

  async anonymise(id: string, anonymisedEmail: string): Promise<void> {
    const user = this.users.get(id);
    if (!user) return;
    this.users.set(
      id,
      new User({
        ...user,
        email: anonymisedEmail,
        cpfEncrypted: Buffer.alloc(0),
        cpfHash: `deleted:${id}`,
        deletedAt: new Date(),
        updatedAt: new Date(),
      }),
    );
  }

  // Test helper
  size(): number {
    return this.users.size;
  }
}
