import type { ITransactionRepository } from '@/domain/repositories/ITransactionRepository.js';
import type { WalletDto } from '@nex/shared';

export class GetWalletBalance {
  constructor(private readonly transactions: ITransactionRepository) {}

  async execute(userId: string): Promise<WalletDto> {
    const balancePoints = await this.transactions.sumApprovedPointsByUser(userId);
    return { balancePoints };
  }
}
