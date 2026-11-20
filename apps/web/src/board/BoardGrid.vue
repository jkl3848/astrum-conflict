<script setup lang="ts">
import { computed, onMounted, onUnmounted } from 'vue'
import { Billboard } from '@tresjs/cientos'
import { useTres } from '@tresjs/core'
import { CanvasTexture, Plane, Raycaster, Vector2, Vector3 } from 'three'
import { useGameStore } from '../stores/game'
import { MAP_SIZE, TILE_SIZE, cellKey, isMapTileSeam, isStartingZone } from './layout'
import type { ReachCell } from '../stores/game'

const emit = defineEmits<{ cell: [x: number, y: number] }>()
const store = useGameStore()
const { camera, renderer } = useTres()

const BOARD_MID = MAP_SIZE / 2 - 0.5
const raycaster = new Raycaster()
const ndc = new Vector2()
const hit = new Vector3()
const ground = new Plane(new Vector3(0, 1, 0), 0)
let pointerDown: { x: number; y: number } | null = null
const texCache = new Map<string, CanvasTexture>()

function canvasEl() {
  const r = renderer.value as { domElement?: HTMLCanvasElement } | undefined
  return r?.domElement ?? document.querySelector('canvas')
}

function onPointerDown(e: PointerEvent) {
  if (e.button !== 0) return
  pointerDown = { x: e.clientX, y: e.clientY }
}

function onPointerUp(e: PointerEvent) {
  if (e.button !== 0 || !pointerDown) return
  const dx = e.clientX - pointerDown.x
  const dy = e.clientY - pointerDown.y
  pointerDown = null
  if (dx * dx + dy * dy > 25) return
  const cam = camera.value
  const el = canvasEl()
  if (!cam || !el) return
  const rect = el.getBoundingClientRect()
  if (rect.width <= 0 || rect.height <= 0) return
  ndc.x = ((e.clientX - rect.left) / rect.width) * 2 - 1
  ndc.y = -((e.clientY - rect.top) / rect.height) * 2 + 1
  raycaster.setFromCamera(ndc, cam)
  if (!raycaster.ray.intersectPlane(ground, hit)) return
  const x = Math.round(hit.x)
  const y = Math.round(hit.z)
  if (x < 0 || y < 0 || x >= MAP_SIZE || y >= MAP_SIZE) return
  emit('cell', x, y)
}

onMounted(() => {
  const el = canvasEl()
  if (!el) return
  el.addEventListener('pointerdown', onPointerDown)
  el.addEventListener('pointerup', onPointerUp)
  onUnmounted(() => {
    el.removeEventListener('pointerdown', onPointerDown)
    el.removeEventListener('pointerup', onPointerUp)
  })
})

function chipTexture(label: string, fill: string) {
  const key = `${label}|${fill}`
  const cached = texCache.get(key)
  if (cached) return cached
  const canvas = document.createElement('canvas')
  canvas.width = 64
  canvas.height = 64
  const ctx = canvas.getContext('2d')!
  ctx.clearRect(0, 0, 64, 64)
  ctx.fillStyle = fill
  ctx.beginPath()
  ctx.arc(32, 32, 26, 0, Math.PI * 2)
  ctx.fill()
  ctx.lineWidth = 5
  ctx.strokeStyle = '#111'
  ctx.stroke()
  ctx.fillStyle = '#111'
  ctx.font = '700 26px system-ui, sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(label, 32, 34)
  const tex = new CanvasTexture(canvas)
  tex.needsUpdate = true
  texCache.set(key, tex)
  return tex
}

function reachColor(cell: ReachCell) {
  if (cell.free) return '#5ee98a'
  if (cell.energyCost <= 1) return '#f0b429'
  if (cell.energyCost === 2) return '#e08918'
  return '#c45f0d'
}

const reachByKey = computed(() => {
  const map = new Map<string, ReachCell>()
  for (const c of store.reachCells) map.set(c.key, c)
  return map
})

const cells = computed(() => {
  const reach = reachByKey.value
  return Array.from({ length: MAP_SIZE * MAP_SIZE }, (_, i) => {
    const x = i % MAP_SIZE
    const y = Math.floor(i / MAP_SIZE)
    const info = reach.get(cellKey(x, y))
    let color = (x + y) % 2 === 0 ? '#efe8dc' : '#c5d0d8'
    if (isMapTileSeam(x, y)) color = (x + y) % 2 === 0 ? '#d5dbe3' : '#b7c2cc'
    if (isStartingZone(x, y, 'A')) color = '#2f9d98'
    if (isStartingZone(x, y, 'B')) color = '#d15a5a'
    if (info) color = reachColor(info)
    return { i, x, y, reachable: Boolean(info), color }
  })
})

const markers = computed(() =>
  store.reachCells
    .filter((c) => !c.free)
    .map((c) => ({
      key: c.key,
      x: c.x,
      y: c.y,
      tex: chipTexture(String(c.energyCost), '#f0b429'),
    })),
)

const tileLines = computed(() => {
  const lines: { key: string; position: [number, number, number]; args: [number, number, number] }[] = []
  for (let t = 0; t <= MAP_SIZE; t += TILE_SIZE) {
    lines.push({
      key: `v-${t}`,
      position: [t - 0.5, 0.04, BOARD_MID],
      args: [0.07, 0.03, MAP_SIZE],
    })
    lines.push({
      key: `h-${t}`,
      position: [BOARD_MID, 0.04, t - 0.5],
      args: [MAP_SIZE, 0.03, 0.07],
    })
  }
  return lines
})
</script>

<template>
  <TresGroup>
    <TresMesh :rotation-x="-Math.PI / 2" :position="[BOARD_MID, -0.04, BOARD_MID]" receive-shadow>
      <TresPlaneGeometry :args="[MAP_SIZE + 0.2, MAP_SIZE + 0.2]" />
      <TresMeshBasicMaterial color="#5f6a76" />
    </TresMesh>

    <TresMesh
      v-for="c in cells"
      :key="`${c.i}-${c.color}`"
      :position="[c.x, c.reachable ? 0.02 : 0, c.y]"
      :rotation-x="-Math.PI / 2"
      receive-shadow
    >
      <TresPlaneGeometry :args="[0.94, 0.94]" />
      <TresMeshBasicMaterial :color="c.color" />
    </TresMesh>

    <Billboard
      v-for="m in markers"
      :key="`chip-${m.key}`"
      :position="[m.x, 0.42, m.y]"
    >
      <TresMesh>
        <TresPlaneGeometry :args="[0.42, 0.42]" />
        <TresMeshBasicMaterial :map="m.tex" :transparent="true" :depth-test="true" />
      </TresMesh>
    </Billboard>

    <TresMesh
      v-for="line in tileLines"
      :key="line.key"
      :position="line.position"
    >
      <TresBoxGeometry :args="line.args" />
      <TresMeshBasicMaterial color="#2c333c" />
    </TresMesh>
  </TresGroup>
</template>
