<template>
  <section
    ref="bridgeRef"
    class="pixel-section-bridge"
    :class="{
      'pixel-section-bridge--no-before': !props.overlapBefore,
      'pixel-section-bridge--no-after': !props.overlapAfter,
    }"
    :style="{
      '--bridge-from': props.from,
      '--bridge-middle': props.middle,
      '--bridge-to': props.to,
    }"
    aria-hidden="true"
  >
    <div class="pixel-section-bridge__relay">
      <span class="pixel-section-bridge__rail pixel-section-bridge__rail--one"></span>
      <span class="pixel-section-bridge__rail pixel-section-bridge__rail--two"></span>
      <span class="pixel-section-bridge__rail pixel-section-bridge__rail--three"></span>

      <span
        v-for="packet in 3"
        :key="packet"
        class="pixel-section-bridge__packet"
        :class="`pixel-section-bridge__packet--${packet}`"
      >
        <PixelPattern
          class="pixel-section-bridge__plane"
          :pattern="planePattern"
          :palette="planePalette"
        />
      </span>
    </div>
  </section>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import gsap from 'gsap'
import { PixelPattern } from '../../base/pixel'

/**
 * 定义相邻章节缓冲带的渐变颜色和双向覆盖范围。
 */
interface PixelSectionBridgeProps {
  // 上一个章节在缓冲带起点处的真实背景色。
  from: string
  // 缓冲带中央用于建立轻微层次的浅色。
  middle: string
  // 下一个章节在缓冲带终点处的真实背景色。
  to: string
  // 是否向上覆盖前一个章节以淡出其背景图层。
  overlapBefore?: boolean
  // 是否向下覆盖后一个章节以淡入其背景图层。
  overlapAfter?: boolean
}

// 当前缓冲带使用的稳定渐变和覆盖方向配置。
const props = withDefaults(defineProps<PixelSectionBridgeProps>(), {
  overlapBefore: true,
  overlapAfter: true,
})

// 侧视飞机轮廓以左侧尾翼、下压机翼和右侧机头明确表达传递方向。
const planePattern = [
  '.a...........',
  '.aa....bb....',
  'aaaabbbbbccc.',
  'aaaaaaaaacccc',
  '....bbbb.....',
  '...bbbb......',
  '..bb.........',
] as const
// 飞机由站点现有蓝、青、粉三色构成，并保持每格内部为纯色。
const planePalette = {
  a: '#7892e4',
  b: '#6fc4bf',
  c: '#e1a5c6',
}
// 三组数据包使用不同距离和节奏，避免缓冲带呈现机械复制感。
const packetMotions = [
  { x: 84, duration: 10 },
  { x: 112, duration: 13 },
  { x: 70, duration: 11.5 },
] as const
// 缓冲带根节点限定 GSAP 查询和动画回收范围。
const bridgeRef = ref<HTMLElement | null>(null)
// GSAP 上下文负责统一销毁循环补间并恢复元素状态。
let animationContext: gsap.Context | undefined

// 组件挂载后仅在允许动态效果时启动像素数据交接动画。
onMounted(() => {
  // 当前缓冲带是所有局部轨道和数据包的查询边界。
  const bridge = bridgeRef.value

  if (!bridge || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    return
  }

  // 上下文回调只创建当前缓冲带内部的循环补间。
  animationContext = gsap.context(() => createBridgeAnimations(bridge), bridge)
})

// 组件卸载时停止循环并清除 GSAP 写入的行内变换。
onUnmounted(() => {
  animationContext?.revert()
  animationContext = undefined
})

/**
 * 创建轨道流动与数据包步进动画，保持所有位移落在整像素节奏上。
 */
function createBridgeAnimations(bridge: HTMLElement) {
  // 三个数据包分别运行独立的大范围慢速步进位移。
  const packets = gsap.utils.toArray<HTMLElement>('.pixel-section-bridge__packet', bridge)
  // 断开的轨道共享相同循环周期，形成稳定的数据流方向。
  const rails = gsap.utils.toArray<HTMLElement>('.pixel-section-bridge__rail', bridge)

  packets.forEach(animateRelayPacket)

  gsap.to(rails, {
    backgroundPositionX: '84px',
    duration: 14,
    ease: 'steps(12)',
    repeat: -1,
  })
}

/**
 * 按所在轨道为单个数据包分配位移距离和循环时长。
 */
function animateRelayPacket(packet: HTMLElement, index: number) {
  // 当前数据包使用与其视觉位置对应的固定运动参数。
  const motion = packetMotions[index] ?? packetMotions[0]

  gsap.to(packet, {
    x: motion.x,
    duration: motion.duration,
    ease: 'steps(7)',
    force3D: true,
    repeat: -1,
    yoyo: true,
  })
}
</script>

<style scoped>
.pixel-section-bridge {
  position: relative;
  z-index: 3;
  isolation: isolate;
  width: 100%;
  height: clamp(240px, 22vh, 320px);
  overflow: visible;
  pointer-events: none;
}

.pixel-section-bridge::before {
  position: absolute;
  z-index: 0;
  top: -72px;
  right: 0;
  bottom: -72px;
  left: 0;
  content: "";
  background: linear-gradient(
    180deg,
    var(--bridge-from) 0%,
    var(--bridge-from) 12%,
    var(--bridge-middle) 50%,
    var(--bridge-to) 88%,
    var(--bridge-to) 100%
  );
  -webkit-mask-image: linear-gradient(
    180deg,
    transparent 0%,
    #000000 8%,
    #000000 92%,
    transparent 100%
  );
  mask-image: linear-gradient(
    180deg,
    transparent 0%,
    #000000 8%,
    #000000 92%,
    transparent 100%
  );
  -webkit-mask-repeat: no-repeat;
  mask-repeat: no-repeat;
}

.pixel-section-bridge__relay {
  --relay-one-y: 34%;
  --relay-two-y: 64%;
  --relay-three-y: 43%;
  position: absolute;
  z-index: 1;
  inset: 0;
  overflow: hidden;
}

.pixel-section-bridge__rail {
  --rail-color: #aebde9;
  position: absolute;
  height: 6px;
  opacity: 0.52;
  background-image:
    linear-gradient(90deg, var(--rail-color) 0 4px, transparent 4px),
    linear-gradient(90deg, #ffffff 0 6px, transparent 6px);
  background-position: 1px 1px, 0 0;
  background-repeat: repeat-x;
  background-size: 14px 4px, 14px 6px;
}

.pixel-section-bridge__rail::before,
.pixel-section-bridge__rail::after {
  position: absolute;
  top: -2px;
  width: 10px;
  aspect-ratio: 1;
  box-sizing: border-box;
  content: "";
  border: 1px solid #ffffff;
  background: var(--rail-color);
}

.pixel-section-bridge__rail::before {
  left: -10px;
}

.pixel-section-bridge__rail::after {
  right: -10px;
}

.pixel-section-bridge__rail--one {
  top: var(--relay-one-y);
  left: 8%;
  width: 31%;
}

.pixel-section-bridge__rail--two {
  --rail-color: #8bcac4;
  top: var(--relay-two-y);
  left: 35%;
  width: 30%;
}

.pixel-section-bridge__rail--three {
  --rail-color: #e2abc8;
  top: var(--relay-three-y);
  right: 8%;
  width: 27%;
}

.pixel-section-bridge__packet {
  position: absolute;
  display: block;
  width: 0;
  height: 0;
  will-change: transform;
}

.pixel-section-bridge__packet--1 {
  top: calc(var(--relay-one-y) + 3px);
  left: 21%;
}

.pixel-section-bridge__packet--2 {
  top: calc(var(--relay-two-y) + 3px);
  left: 45%;
}

.pixel-section-bridge__packet--3 {
  top: calc(var(--relay-three-y) + 3px);
  right: 20%;
}

.pixel-section-bridge__plane {
  position: absolute;
  top: 0;
  left: 0;
  width: clamp(96px, 6.7vw, 142px);
  max-width: none;
  transform: translate(-50%, -50%);
}

.pixel-section-bridge--no-before::before {
  top: 0;
  -webkit-mask-image: linear-gradient(
    180deg,
    #000000 0%,
    #000000 80%,
    transparent 100%
  );
  mask-image: linear-gradient(
    180deg,
    #000000 0%,
    #000000 80%,
    transparent 100%
  );
}

.pixel-section-bridge--no-after::before {
  bottom: 0;
  -webkit-mask-image: linear-gradient(
    180deg,
    transparent 0%,
    #000000 20%,
    #000000 100%
  );
  mask-image: linear-gradient(
    180deg,
    transparent 0%,
    #000000 20%,
    #000000 100%
  );
}

.pixel-section-bridge--no-before.pixel-section-bridge--no-after::before {
  -webkit-mask-image: none;
  mask-image: none;
}

@media (max-width: 820px) {
  .pixel-section-bridge {
    height: clamp(116px, 14vh, 176px);
  }

  .pixel-section-bridge::before {
    top: -44px;
    bottom: -44px;
  }

  .pixel-section-bridge--no-before::before {
    top: 0;
  }

  .pixel-section-bridge--no-after::before {
    bottom: 0;
  }

  .pixel-section-bridge__rail--one {
    left: 5%;
    width: 34%;
  }

  .pixel-section-bridge__rail--two {
    left: 31%;
    width: 34%;
  }

  .pixel-section-bridge__rail--three {
    right: 5%;
    width: 31%;
  }

  .pixel-section-bridge__packet--1 {
    left: 12%;
  }

  .pixel-section-bridge__packet--2 {
    left: 39%;
  }

  .pixel-section-bridge__packet--3 {
    right: 12%;
  }
}
</style>
