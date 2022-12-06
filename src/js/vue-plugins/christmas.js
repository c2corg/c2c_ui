import confetti from 'canvas-confetti';
import dayjs from 'dayjs';

const duration = 60 * 1000; // 1 minute snow
const animationEnd = Date.now() + duration;
let skew = 1;

function randomInRange(min, max) {
  return Math.random() * (max - min) + min;
}

function frame() {
  const timeLeft = animationEnd - Date.now();
  const ticks = Math.max(200, 500 * (timeLeft / duration));
  skew = Math.max(0.8, skew - 0.001);

  confetti({
    particleCount: 1,
    startVelocity: 0,
    ticks,
    origin: {
      x: Math.random(),
      // since particles fall down, skew start toward the top
      y: Math.random() * skew - 0.2,
    },
    colors: ['#ededed'],
    shapes: ['circle'],
    gravity: randomInRange(0.4, 0.6),
    scalar: randomInRange(0.4, 1),
    drift: randomInRange(-0.4, 0.4),
  });

  if (timeLeft > 0) {
    requestAnimationFrame(frame);
  }
}

export default function install(Vue) {
  const christmasVm = new Vue({
    name: 'Christmas',

    data() {
      return { christmasTime: false };
    },

    created() {
      const now = dayjs();
      this.christmasTime = now.isAfter('2022-12-22', 'day') && now.isBefore('2022-12-26', 'day');
      if (this.christmasTime) {
        // add snow
        frame();
      }
    },

    methods: {
      isChristmasTime() {
        return this.christmasTime;
      },
    },
  });

  Vue.prototype.$christmas = christmasVm;
}
