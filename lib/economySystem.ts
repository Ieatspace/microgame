export type GoldWallet = {
  coins: number;
};

export function calculateGoldAward(baseGold: number, gainMultiplier = 1) {
  return Math.max(0, Math.round(baseGold * gainMultiplier));
}

export function grantGold(
  wallet: GoldWallet,
  baseGold: number,
  gainMultiplier = 1
) {
  const gold = calculateGoldAward(baseGold, gainMultiplier);
  wallet.coins += gold;
  return gold;
}

export function canSpendGold(wallet: GoldWallet, cost: number) {
  return wallet.coins >= cost;
}

export function spendGold(wallet: GoldWallet, cost: number) {
  if (!canSpendGold(wallet, cost)) {
    return false;
  }

  wallet.coins -= cost;
  return true;
}
