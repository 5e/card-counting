<script setup>
import { ref, computed } from 'vue'
import PlayingCard from './PlayingCard.vue'
import { createShoe, hiLoValue, blackjackValue, isBlackjack } from '../utils/cards.js'

const numDecks = ref(1)
const shoe = ref(createShoe(numDecks.value))
const runningCount = ref(0)
const showRunningCount = ref(false)

const playerHand = ref([])
const dealerHand = ref([])
const phase = ref('idle') // idle | player-turn | dealer-turn | round-over
const message = ref('')
const bankroll = ref(0) // running win/loss tally (in "units")

const playerTotal = computed(() => blackjackValue(playerHand.value))
const dealerTotal = computed(() => blackjackValue(dealerHand.value))
const dealerShownTotal = computed(() => {
  if (phase.value === 'player-turn' && dealerHand.value.length > 0) {
    return blackjackValue([dealerHand.value[0]])
  }
  return dealerTotal.value
})

const decksRemaining = computed(() => Math.max(shoe.value.length / 52, 0.5))
const trueCount = computed(() => {
  return Math.round((runningCount.value / decksRemaining.value) * 2) / 2
})

function reshuffleIfLow() {
  if (shoe.value.length < 15) {
    shoe.value = createShoe(numDecks.value)
    runningCount.value = 0
  }
}

function drawCard({ countNow = true } = {}) {
  reshuffleIfLow()
  const card = shoe.value.pop()
  if (countNow) runningCount.value += hiLoValue(card.rank)
  return card
}

function newShoeAndReset() {
  shoe.value = createShoe(numDecks.value)
  runningCount.value = 0
  playerHand.value = []
  dealerHand.value = []
  phase.value = 'idle'
  message.value = ''
}

function revealHoleCard() {
  const holeCard = dealerHand.value[1]
  if (holeCard) runningCount.value += hiLoValue(holeCard.rank)
}

function deal() {
  playerHand.value = [drawCard(), drawCard()]
  dealerHand.value = [drawCard(), drawCard({ countNow: false })]
  message.value = ''

  if (isBlackjack(playerHand.value) || isBlackjack(dealerHand.value)) {
    revealHoleCard()
    phase.value = 'round-over'
    settleRound()
  } else {
    phase.value = 'player-turn'
  }
}

function hit() {
  if (phase.value !== 'player-turn') return
  playerHand.value.push(drawCard())
  if (playerTotal.value > 21) {
    revealHoleCard()
    phase.value = 'round-over'
    message.value = 'Bust! You lose.'
    bankroll.value -= 1
  }
}

function stand() {
  if (phase.value !== 'player-turn') return
  phase.value = 'dealer-turn'
  playDealer()
}

function playDealer() {
  revealHoleCard()
  while (dealerTotal.value < 17) {
    dealerHand.value.push(drawCard())
  }
  phase.value = 'round-over'
  settleRound()
}

function settleRound() {
  const playerBJ = isBlackjack(playerHand.value)
  const dealerBJ = isBlackjack(dealerHand.value)
  const pTotal = playerTotal.value
  const dTotal = dealerTotal.value

  if (playerBJ && dealerBJ) {
    message.value = 'Push - both blackjack.'
  } else if (playerBJ) {
    message.value = 'Blackjack! You win.'
    bankroll.value += 1.5
  } else if (dealerBJ) {
    message.value = 'Dealer has blackjack. You lose.'
    bankroll.value -= 1
  } else if (pTotal > 21) {
    message.value = 'Bust! You lose.'
    bankroll.value -= 1
  } else if (dTotal > 21) {
    message.value = 'Dealer busts! You win.'
    bankroll.value += 1
  } else if (pTotal > dTotal) {
    message.value = 'You win!'
    bankroll.value += 1
  } else if (pTotal < dTotal) {
    message.value = 'Dealer wins.'
    bankroll.value -= 1
  } else {
    message.value = 'Push.'
  }
}

function resetBankroll() {
  bankroll.value = 0
}
</script>

<template>
  <div class="blackjack">
    <section class="table-area">
      <div class="hand-block">
        <h3>Dealer {{ phase === 'player-turn' ? '' : `(${dealerShownTotal})` }}</h3>
        <div class="hand-row">
          <p v-if="dealerHand.length === 0" class="empty-hint">Press Deal to start a round.</p>
          <template v-for="(card, i) in dealerHand" :key="'d' + i">
            <div v-if="i === 1 && phase === 'player-turn'" class="card-back"></div>
            <PlayingCard v-else :rank="card.rank" :suit="card.suit" />
          </template>
        </div>
      </div>

      <div class="hand-block">
        <h3>You {{ playerHand.length ? `(${playerTotal})` : '' }}</h3>
        <div class="hand-row">
          <PlayingCard
            v-for="(card, i) in playerHand"
            :key="'p' + i"
            :rank="card.rank"
            :suit="card.suit"
          />
        </div>
      </div>

      <p v-if="message" class="message">{{ message }}</p>

      <div class="controls">
        <button class="btn primary" @click="deal" v-if="phase === 'idle' || phase === 'round-over'">
          Deal
        </button>
        <template v-if="phase === 'player-turn'">
          <button class="btn primary" @click="hit">Hit</button>
          <button class="btn" @click="stand">Stand</button>
        </template>
      </div>

      <p class="remaining">{{ shoe.length }} cards left in shoe</p>
    </section>

    <section class="settings-area">
      <h2>Settings</h2>
      <div class="setting-row">
        <label for="bjDecks">Number of decks</label>
        <select id="bjDecks" v-model.number="numDecks" @change="newShoeAndReset">
          <option v-for="n in [1, 2, 4, 6, 8]" :key="n" :value="n">{{ n }}</option>
        </select>
      </div>
      <div class="setting-row">
        <label for="bjShowCount">
          <input id="bjShowCount" type="checkbox" v-model="showRunningCount" />
          Show running count
        </label>
        <span v-if="showRunningCount" class="live-count">{{ runningCount }}</span>
      </div>
      <div class="setting-row" v-if="showRunningCount && numDecks > 1">
        <span>True count</span>
        <span class="live-count">{{ trueCount }}</span>
      </div>
      <div class="setting-row">
        <span>Bankroll (units)</span>
        <span class="live-count" :class="{ negative: bankroll < 0 }">{{ bankroll.toFixed(1) }}</span>
      </div>
      <div class="setting-row buttons">
        <button class="btn" @click="newShoeAndReset">New Shoe</button>
        <button class="btn" @click="resetBankroll">Reset Bankroll</button>
      </div>
    </section>
  </div>
</template>

<style scoped>
.blackjack {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 1.25rem;
  align-items: start;
}

@media (max-width: 700px) {
  .blackjack {
    grid-template-columns: 1fr;
  }
}

section {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  padding: 1.25rem;
}

section h2 {
  font-size: 0.85rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: #d4af7a;
  margin-bottom: 0.9rem;
}

.table-area {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

.hand-block {
  width: 100%;
  text-align: center;
}

.hand-block h3 {
  font-size: 0.85rem;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: rgba(255, 255, 255, 0.7);
  margin-bottom: 0.5rem;
}

.hand-row {
  display: flex;
  justify-content: center;
  flex-wrap: nowrap;
  min-height: 182px;
  align-items: center;
}

.hand-row > *:not(:first-child) {
  margin-left: -55px;
}

.empty-hint {
  font-size: 0.85rem;
  color: rgba(255, 255, 255, 0.5);
}

.card-back {
  width: 130px;
  height: 182px;
  border-radius: 10px;
  flex-shrink: 0;
  background: repeating-linear-gradient(
    45deg,
    #2a3f6b,
    #2a3f6b 8px,
    #324a7d 8px,
    #324a7d 16px
  );
  border: 1px solid #1a2747;
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.35);
}

.message {
  font-weight: 700;
  font-size: 1.05rem;
  color: #d4af37;
}

.controls {
  display: flex;
  gap: 0.75rem;
}

.remaining {
  font-size: 0.85rem;
  color: rgba(255, 255, 255, 0.6);
}

.btn {
  padding: 0.6rem 1.4rem;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.15);
  background: rgba(255, 255, 255, 0.08);
  color: #f5f5f0;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s, transform 0.1s;
}

.btn:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.15);
}

.btn:active:not(:disabled) {
  transform: scale(0.97);
}

.btn.primary {
  background: #d4af37;
  border-color: #d4af37;
  color: #1a1a1a;
}

.btn.primary:hover:not(:disabled) {
  background: #e6c453;
}

.setting-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
  font-size: 0.9rem;
}

.setting-row label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
}

.setting-row select {
  padding: 0.4rem 0.6rem;
  border-radius: 6px;
  border: 1px solid rgba(255, 255, 255, 0.15);
  background: rgba(255, 255, 255, 0.08);
  color: #f5f5f0;
}

.setting-row.buttons {
  gap: 0.75rem;
  justify-content: flex-start;
}

.live-count {
  color: #d4af37;
  font-weight: 700;
  font-size: 1.1rem;
}

.live-count.negative {
  color: #e74c3c;
}
</style>
