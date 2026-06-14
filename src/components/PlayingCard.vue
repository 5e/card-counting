<script setup>
defineProps({
  rank: { type: String, required: true },
  suit: { type: String, required: true },
  size: { type: String, default: 'normal' }, // 'normal' | 'small'
})

const RED_SUITS = ['♥', '♦']
</script>

<template>
  <div class="playing-card" :class="[size, { red: RED_SUITS.includes(suit) }]">
    <span class="corner top-left">
      <span class="rank">{{ rank }}</span>
      <span class="suit">{{ suit }}</span>
    </span>
    <span class="center-suit">{{ suit }}</span>
    <span class="corner bottom-right">
      <span class="rank">{{ rank }}</span>
      <span class="suit">{{ suit }}</span>
    </span>
  </div>
</template>

<style scoped>
.playing-card {
  width: 130px;
  height: 182px;
  background: #fdfdfd;
  border-radius: 10px;
  border: 1px solid #d8d8d8;
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.35);
  position: relative;
  color: #1a1a1a;
  display: flex;
  align-items: center;
  justify-content: center;
  user-select: none;
  flex-shrink: 0;
}

.playing-card.red {
  color: #c0272d;
}

.corner {
  position: absolute;
  display: flex;
  flex-direction: column;
  align-items: center;
  line-height: 1.1;
  font-weight: 700;
}

.corner.top-left {
  top: 10px;
  left: 10px;
}

.corner.bottom-right {
  bottom: 10px;
  right: 10px;
  transform: rotate(180deg);
}

.corner .rank {
  font-size: 1.3rem;
}

.corner .suit {
  font-size: 1.1rem;
}

.center-suit {
  font-size: 4rem;
}

/* Small variant used for the history strip */
.playing-card.small {
  width: 52px;
  height: 73px;
  border-radius: 6px;
}

.playing-card.small .corner {
  top: 4px !important;
  left: 4px !important;
  bottom: auto !important;
  right: auto !important;
}

.playing-card.small .corner.bottom-right {
  top: auto !important;
  bottom: 4px !important;
  right: 4px !important;
  left: auto !important;
}

.playing-card.small .corner .rank {
  font-size: 0.6rem;
}

.playing-card.small .corner .suit {
  font-size: 0.55rem;
}

.playing-card.small .center-suit {
  font-size: 1.5rem;
}
</style>
