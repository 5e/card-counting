<script setup>
import { ref, computed, watch, onUnmounted } from 'vue'
import PlayingCard from './components/PlayingCard.vue'
import Blackjack from './components/Blackjack.vue'
import { createShoe, hiLoValue } from './utils/cards.js'

const mode = ref('trainer') // 'trainer' | 'blackjack'

const numDecks = ref(1)
const shoe = ref(createShoe(numDecks.value))
const history = ref([])
const runningCount = ref(0)
const userGuess = ref('')
const feedback = ref(null)
const showRunningCount = ref(false)
const autoPlay = ref(false)
const dealInterval = ref(1.5)
const stats = ref({ correct: 0, total: 0 })

let timer = null

const currentCard = computed(() => history.value[history.value.length - 1] ?? null)
const decksRemaining = computed(() => shoe.value.length / 52)
const accuracyPct = computed(() => {
  if (stats.value.total === 0) return 0
  return Math.round((stats.value.correct / stats.value.total) * 100)
})

const MAX_HISTORY_SHOWN = 20
const visibleHistory = computed(() => {
  const start = Math.max(history.value.length - MAX_HISTORY_SHOWN, 0)
  return history.value
    .slice(start)
    .map((card, i) => ({ card, index: start + i }))
    .reverse()
})

function newShoe() {
  stopAutoPlay()
  shoe.value = createShoe(numDecks.value)
  history.value = []
  runningCount.value = 0
  userGuess.value = ''
  feedback.value = null
}

function dealCard() {
  if (shoe.value.length === 0) {
    stopAutoPlay()
    return
  }
  const card = shoe.value.pop()
  runningCount.value += hiLoValue(card.rank)
  history.value.push(card)
  feedback.value = null
}

function startTimer() {
  clearInterval(timer)
  timer = setInterval(() => {
    if (shoe.value.length === 0) {
      stopAutoPlay()
      return
    }
    dealCard()
  }, dealInterval.value * 1000)
}

function stopAutoPlay() {
  autoPlay.value = false
  clearInterval(timer)
  timer = null
}

function toggleAutoPlay() {
  if (autoPlay.value) {
    stopAutoPlay()
  } else {
    autoPlay.value = true
    startTimer()
  }
}

watch(dealInterval, () => {
  if (autoPlay.value) startTimer()
})

watch(numDecks, () => {
  newShoe()
})

function checkCount() {
  if (userGuess.value === '') return
  const guess = Number(userGuess.value)
  const correct = guess === runningCount.value
  feedback.value = { correct, actual: runningCount.value }
  stats.value.total++
  if (correct) stats.value.correct++
  userGuess.value = ''
}

function resetStats() {
  stats.value = { correct: 0, total: 0 }
}

onUnmounted(() => {
  stopAutoPlay()
})
</script>

<template>
  <div class="app">
    <header class="header">
      <h1>Card Counting Trainer</h1>
      <p class="legend">
        <span class="legend-item plus">2-6 = +1</span>
        <span class="legend-item zero">7-9 = 0</span>
        <span class="legend-item minus">10-A = -1</span>
      </p>
      <div class="mode-switch">
        <button class="btn" :class="{ active: mode === 'trainer' }" @click="mode = 'trainer'">
          Counting Trainer
        </button>
        <button class="btn" :class="{ active: mode === 'blackjack' }" @click="mode = 'blackjack'">
          Play Blackjack
        </button>
      </div>
    </header>

    <main v-if="mode === 'blackjack'" class="layout-single">
      <Blackjack />
    </main>

    <main v-else class="layout">
      <section class="table-area">
        <div class="card-slot">
          <PlayingCard
            v-if="currentCard"
            :key="history.length"
            :rank="currentCard.rank"
            :suit="currentCard.suit"
          />
          <div v-else class="card-placeholder">Press Deal to start</div>
        </div>

        <div class="deal-controls">
          <button class="btn primary" @click="dealCard" :disabled="shoe.length === 0">
            Deal Card
          </button>
          <button class="btn" @click="toggleAutoPlay" :disabled="shoe.length === 0">
            {{ autoPlay ? 'Pause' : 'Auto Deal' }}
          </button>
        </div>

        <div class="speed-control">
          <label for="speed">Speed: {{ dealInterval.toFixed(2) }}s / card</label>
          <input
            id="speed"
            type="range"
            min="0.5"
            max="4"
            step="0.25"
            v-model.number="dealInterval"
          />
        </div>

        <p class="remaining">{{ shoe.length }} cards left &middot; ~{{ decksRemaining.toFixed(1) }} decks</p>
      </section>

      <section class="history-area">
        <h2>History</h2>
        <div class="history-strip">
          <p v-if="history.length === 0" class="empty-hint">Cards you've seen will appear here.</p>
          <PlayingCard
            v-for="item in visibleHistory"
            :key="item.index"
            :rank="item.card.rank"
            :suit="item.card.suit"
            size="small"
          />
        </div>
      </section>

      <section class="check-area">
        <h2>What's the running count?</h2>
        <form class="check-form" @submit.prevent="checkCount">
          <input
            type="number"
            v-model="userGuess"
            placeholder="Your count"
            inputmode="numeric"
          />
          <button class="btn primary" type="submit" :disabled="userGuess === ''">Check</button>
        </form>
        <p v-if="feedback" class="feedback" :class="feedback.correct ? 'correct' : 'incorrect'">
          <template v-if="feedback.correct">Correct! The running count is {{ feedback.actual }}.</template>
          <template v-else>Not quite - the running count is {{ feedback.actual }}.</template>
        </p>
      </section>

      <section class="settings-area">
        <h2>Settings</h2>
        <div class="setting-row">
          <label for="decks">Number of decks</label>
          <select id="decks" v-model.number="numDecks">
            <option v-for="n in [1, 2, 4, 6, 8]" :key="n" :value="n">{{ n }}</option>
          </select>
        </div>
        <div class="setting-row">
          <label for="showCount">
            <input id="showCount" type="checkbox" v-model="showRunningCount" />
            Show running count
          </label>
          <span v-if="showRunningCount" class="live-count">{{ runningCount }}</span>
        </div>
        <div class="setting-row buttons">
          <button class="btn" @click="newShoe">New Shoe</button>
          <button class="btn" @click="resetStats">Reset Stats</button>
        </div>
      </section>

      <section class="stats-area">
        <h2>Your Accuracy</h2>
        <p class="stats-line">
          {{ stats.correct }} / {{ stats.total }} correct
          <span v-if="stats.total > 0">({{ accuracyPct }}%)</span>
        </p>
      </section>
    </main>
  </div>
</template>

<style scoped>
.header {
  text-align: center;
  padding: 2rem 1rem 1rem;
}

.header h1 {
  font-size: 2rem;
  letter-spacing: 0.05em;
  margin-bottom: 0.75rem;
}

.legend {
  display: flex;
  justify-content: center;
  gap: 0.75rem;
  flex-wrap: wrap;
  font-size: 0.9rem;
}

.legend-item {
  padding: 0.25rem 0.75rem;
  border-radius: 999px;
  font-weight: 600;
}

.legend-item.plus {
  background: rgba(46, 204, 113, 0.15);
  color: #2ecc71;
  border: 1px solid rgba(46, 204, 113, 0.4);
}

.legend-item.zero {
  background: rgba(220, 220, 220, 0.1);
  color: #cccccc;
  border: 1px solid rgba(220, 220, 220, 0.3);
}

.legend-item.minus {
  background: rgba(231, 76, 60, 0.15);
  color: #e74c3c;
  border: 1px solid rgba(231, 76, 60, 0.4);
}

.mode-switch {
  display: flex;
  justify-content: center;
  gap: 0.75rem;
  margin-top: 1.25rem;
}

.mode-switch .btn.active {
  background: #d4af37;
  border-color: #d4af37;
  color: #1a1a1a;
}

.layout {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.25rem;
  max-width: 920px;
  margin: 0 auto;
  padding: 0 1rem 3rem;
}

.table-area,
.history-area,
.stats-area {
  grid-column: 1 / -1;
}

@media (max-width: 700px) {
  .layout {
    grid-template-columns: 1fr;
  }
}

.layout-single {
  max-width: 920px;
  margin: 0 auto;
  padding: 0 1rem 3rem;
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

.card-slot {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 182px;
}

.card-placeholder {
  width: 130px;
  height: 182px;
  border: 2px dashed rgba(255, 255, 255, 0.2);
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  font-size: 0.85rem;
  color: rgba(255, 255, 255, 0.5);
  padding: 0.5rem;
}

.deal-controls {
  display: flex;
  gap: 0.75rem;
}

.speed-control {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.85rem;
  width: 100%;
  max-width: 280px;
  color: rgba(255, 255, 255, 0.7);
}

.speed-control input[type='range'] {
  width: 100%;
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

.btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.btn.primary {
  background: #d4af37;
  border-color: #d4af37;
  color: #1a1a1a;
}

.btn.primary:hover:not(:disabled) {
  background: #e6c453;
}

.history-strip {
  display: flex;
  gap: 0.5rem;
  overflow-x: auto;
  padding-bottom: 0.5rem;
  min-height: 73px;
  align-items: center;
}

.empty-hint {
  font-size: 0.85rem;
  color: rgba(255, 255, 255, 0.5);
}

.check-form {
  display: flex;
  gap: 0.75rem;
}

.check-form input[type='number'] {
  flex: 1;
  min-width: 0;
  padding: 0.6rem 0.9rem;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.15);
  background: rgba(255, 255, 255, 0.08);
  color: #f5f5f0;
  font-size: 1rem;
}

.check-form input::placeholder {
  color: rgba(255, 255, 255, 0.4);
}

.feedback {
  margin-top: 0.75rem;
  font-weight: 600;
}

.feedback.correct {
  color: #2ecc71;
}

.feedback.incorrect {
  color: #e74c3c;
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

.stats-area {
  text-align: center;
}

.stats-line {
  font-size: 1.1rem;
}
</style>
