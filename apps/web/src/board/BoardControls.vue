<script setup lang="ts">
import { onMounted, onUnmounted, watch } from 'vue'
import { OrbitControls } from '@tresjs/cientos'
import { useTres } from '@tresjs/core'
import { MOUSE, Vector3 } from 'three'
import { BOARD_CENTER, MAP_SIZE } from './layout'

const POLAR = 0.88
const AZIMUTH = Math.PI / 4
const TARGET: [number, number, number] = [BOARD_CENTER, 0, BOARD_CENTER]

const { camera, controls: tresControls } = useTres()

interface BoardOrbit {
  target: Vector3
  update: () => void
}

function controls(): BoardOrbit | null {
  const c = tresControls.value as unknown as BoardOrbit | null
  return c?.target && typeof c.update === 'function' ? c : null
}

function clampTarget(target: Vector3) {
  const pad = 3
  target.x = Math.min(MAP_SIZE - 1 - pad, Math.max(pad, target.x))
  target.y = 0
  target.z = Math.min(MAP_SIZE - 1 - pad, Math.max(pad, target.z))
}

function pan(dx: number, dz: number) {
  const cam = camera.value
  const c = controls()
  if (!cam || !c) return
  const forward = new Vector3()
  cam.getWorldDirection(forward)
  forward.y = 0
  if (forward.lengthSq() < 0.0001) forward.set(0, 0, -1)
  forward.normalize()
  const right = new Vector3().crossVectors(forward, new Vector3(0, 1, 0)).normalize()
  c.target.addScaledVector(right, dx)
  c.target.addScaledVector(forward, -dz)
  clampTarget(c.target)
  cam.position.addScaledVector(right, dx)
  cam.position.addScaledVector(forward, -dz)
  c.update()
}

function rotateYaw(delta: number) {
  const cam = camera.value
  const c = controls()
  if (!cam || !c) return
  const offset = cam.position.clone().sub(c.target)
  offset.applyAxisAngle(new Vector3(0, 1, 0), delta)
  cam.position.copy(c.target).add(offset)
  c.update()
}

function dolly(factor: number) {
  const cam = camera.value
  const c = controls()
  if (!cam || !c) return
  const offset = cam.position.clone().sub(c.target)
  offset.multiplyScalar(factor)
  const dist = offset.length()
  if (dist < 14 || dist > 32) return
  cam.position.copy(c.target).add(offset)
  c.update()
}

function resetView() {
  const cam = camera.value
  const c = controls()
  if (!cam || !c) return
  c.target.set(BOARD_CENTER, 0, BOARD_CENTER)
  const dist = 20
  cam.position.set(
    BOARD_CENTER + dist * Math.sin(POLAR) * Math.sin(AZIMUTH),
    dist * Math.cos(POLAR),
    BOARD_CENTER + dist * Math.sin(POLAR) * Math.cos(AZIMUTH),
  )
  c.update()
}

function isTypingTarget(el: EventTarget | null) {
  if (!(el instanceof HTMLElement)) return false
  const tag = el.tagName
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || el.isContentEditable
}

function onKey(e: KeyboardEvent) {
  if (e.metaKey || e.ctrlKey || e.altKey) return
  if (isTypingTarget(e.target)) return
  const step = e.shiftKey ? 2.4 : 1.2
  switch (e.key) {
    case 'ArrowUp':
    case 'w':
    case 'W':
      e.preventDefault()
      pan(0, -step)
      break
    case 'ArrowDown':
    case 's':
    case 'S':
      e.preventDefault()
      pan(0, step)
      break
    case 'ArrowLeft':
    case 'a':
    case 'A':
      e.preventDefault()
      pan(-step, 0)
      break
    case 'ArrowRight':
    case 'd':
    case 'D':
      e.preventDefault()
      pan(step, 0)
      break
    case 'q':
    case 'Q':
      e.preventDefault()
      rotateYaw(0.12)
      break
    case 'e':
    case 'E':
      e.preventDefault()
      rotateYaw(-0.12)
      break
    case '+':
    case '=':
      e.preventDefault()
      dolly(0.92)
      break
    case '-':
    case '_':
      e.preventDefault()
      dolly(1.08)
      break
    case 'Home':
      e.preventDefault()
      resetView()
      break
    default:
      break
  }
}

function onControlChange() {
  const c = controls()
  if (c?.target) clampTarget(c.target)
}

function applyMouseMap() {
  const c = tresControls.value as unknown as {
    mouseButtons?: { LEFT: number; MIDDLE: number; RIGHT: number }
    minAzimuthAngle?: number
    maxAzimuthAngle?: number
  } | null
  if (!c?.mouseButtons) return
  c.mouseButtons.LEFT = -1
  c.mouseButtons.MIDDLE = MOUSE.DOLLY
  c.mouseButtons.RIGHT = MOUSE.ROTATE
  c.minAzimuthAngle = -Infinity
  c.maxAzimuthAngle = Infinity
}

onMounted(() => {
  window.addEventListener('keydown', onKey)
  applyMouseMap()
  onUnmounted(() => window.removeEventListener('keydown', onKey))
})

watch(tresControls, () => applyMouseMap(), { immediate: true })
</script>

<template>
  <OrbitControls
    make-default
    :target="TARGET"
    :enable-damping="true"
    :damping-factor="0.12"
    :enable-pan="false"
    :enable-rotate="true"
    :rotate-speed="0.35"
    :min-polar-angle="POLAR - 0.08"
    :max-polar-angle="POLAR + 0.22"
    :min-distance="12"
    :max-distance="42"
    :zoom-speed="0.65"
    :mouse-buttons="{ LEFT: -1, MIDDLE: MOUSE.DOLLY, RIGHT: MOUSE.ROTATE }"
    @change="onControlChange"
  />
</template>
