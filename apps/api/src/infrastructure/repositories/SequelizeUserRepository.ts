import { User } from '@/domain/entities/User.js';
import type {
  CreateUserInput,
  IUserRepository,
} from '@/domain/repositories/IUserRepository.js';
import { UserModel } from '@/infrastructure/db/models/UserModel.js';

function toEntity(model: UserModel): User {
  return new User({
    id: model.id,
    name: model.name,
    email: model.email,
    cpfEncrypted: model.cpfEncrypted,
    cpfHash: model.cpfHash,
    passwordHash: model.passwordHash,
    role: model.role,
    consentAt: model.consentAt,
    deletedAt: model.deletedAt,
    createdAt: model.get('createdAt') as Date,
    updatedAt: model.get('updatedAt') as Date,
  });
}

export class SequelizeUserRepository implements IUserRepository {
  async create(input: CreateUserInput): Promise<User> {
    const row = await UserModel.create({
      id: input.id,
      name: input.name,
      email: input.email,
      cpfEncrypted: input.cpfEncrypted,
      cpfHash: input.cpfHash,
      passwordHash: input.passwordHash,
      role: input.role,
      consentAt: input.consentAt,
    });
    return toEntity(row);
  }

  async findById(id: string): Promise<User | null> {
    const row = await UserModel.findByPk(id);
    return row ? toEntity(row) : null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const row = await UserModel.findOne({
      where: { email: email.trim().toLowerCase() },
    });
    return row ? toEntity(row) : null;
  }

  async findByCpfHash(cpfHash: string): Promise<User | null> {
    const row = await UserModel.findOne({ where: { cpfHash } });
    return row ? toEntity(row) : null;
  }

  async anonymise(id: string, anonymisedEmail: string): Promise<void> {
    await UserModel.update(
      {
        email: anonymisedEmail,
        cpfEncrypted: Buffer.alloc(0),
        cpfHash: `deleted:${id}`,
      },
      { where: { id } },
    );
    await UserModel.destroy({ where: { id } });
  }
}
