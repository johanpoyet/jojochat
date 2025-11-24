<script setup>
</script>

<template>
  <div class="typing-indicator">
    <div class="typing-bubble">
      <span class="dot"></span>
      <span class="dot"></span>
      <span class="dot"></span>
    </div>
  </div>
</template>

<style scoped>
.typing-indicator {
  display: flex;
  justify-content: flex-start;
  padding: 8px 16px;
  animation: fadeIn 0.3s ease-in;
}

.typing-bubble {
  background: #e5e5ea;
  border-radius: 18px;
  padding: 12px 16px;
  display: flex;
  align-items: center;
  gap: 4px;
}

.dot {
  width: 8px;
  height: 8px;
  background: #8d8d93;
  border-radius: 50%;
  animation: wave 1.4s ease-in-out infinite;
}

.dot:nth-child(2) {
  animation-delay: 0.2s;
}

.dot:nth-child(3) {
  animation-delay: 0.4s;
}

@keyframes wave {
  0%, 60%, 100% {
    transform: translateY(0);
    opacity: 0.7;
  }
  30% {
    transform: translateY(-8px);
    opacity: 1;
  }
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(5px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
