export const RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K']
export const SUITS = ['♠', '♥', '♦', '♣']

const LOW_CARDS = ['2', '3', '4', '5', '6']
const NEUTRAL_CARDS = ['7', '8', '9']

// Hi-Lo counting system: 2-6 = +1, 7-9 = 0, 10-A = -1
export function hiLoValue(rank) {
  if (LOW_CARDS.includes(rank)) return 1
  if (NEUTRAL_CARDS.includes(rank)) return 0
  return -1
}

export function createShoe(numDecks) {
  const shoe = []
  for (let d = 0; d < numDecks; d++) {
    for (const suit of SUITS) {
      for (const rank of RANKS) {
        shoe.push({ rank, suit })
      }
    }
  }
  return shuffle(shoe)
}

export function blackjackValue(hand) {
  let total = 0
  let aces = 0
  for (const card of hand) {
    if (card.rank === 'A') {
      aces++
      total += 11
    } else if (['K', 'Q', 'J'].includes(card.rank)) {
      total += 10
    } else {
      total += Number(card.rank)
    }
  }
  while (total > 21 && aces > 0) {
    total -= 10
    aces--
  }
  return total
}

export function isBlackjack(hand) {
  return hand.length === 2 && blackjackValue(hand) === 21
}

function shuffle(deck) {
  const arr = [...deck]
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}
