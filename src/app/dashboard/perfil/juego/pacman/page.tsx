'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

// ── Laberinto ─────────────────────────────────────────────────────────────────
// # = pared, . = pellet (cepillado), o = power pellet (pasta dental), ' ' = vacío, P = player, G = enemigo
const MAZE: string[] = [
  '###########',
  '#o...#...o#',
  '#.##.#.##.#',
  '#.........#',
  '#.##.#.##.#',
  '#....#....#',
  '##.#####.##',
  '#....#....#',
  '#.##.#.##.#',
  '#.........#',
  '#.##.#.##.#',
  '#o...#...o#',
  '###########',
]

const COLS = MAZE[0].length  // 11
const ROWS = MAZE.length     // 13
const CELL = 28              // px

type Dir = 'up' | 'down' | 'left' | 'right' | 'none'
type Point = { r: number; c: number }
type Enemy = { r: number; c: number; dir: Dir; color: string; scared: boolean }

function cloneMaze(): string[][] {
  return MAZE.map(row => row.split(''))
}

function dirVec(d: Dir): [number, number] {
  if (d === 'up') return [-1, 0]
  if (d === 'down') return [1, 0]
  if (d === 'left') return [0, -1]
  if (d === 'right') return [0, 1]
  return [0, 0]
}

function canMove(grid: string[][], r: number, c: number): boolean {
  if (r < 0 || r >= ROWS || c < 0 || c >= COLS) return false
  return grid[r][c] !== '#'
}

function oppositeDir(d: Dir): Dir {
  if (d === 'up') return 'down'
  if (d === 'down') return 'up'
  if (d === 'left') return 'right'
  if (d === 'right') return 'left'
  return 'none'
}

export default function PacmanDentiPage() {
  const router = useRouter()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [estado, setEstado] = useState<'intro' | 'jugando' | 'ganaste' | 'perdiste'>('intro')
  const [puntaje, setPuntaje] = useState(0)
  const [vidas, setVidas] = useState(3)
  const [mejorPuntaje, setMejorPuntaje] = useState(0)
  const [recompensaGuardada, setRecompensaGuardada] = useState(false)

  // Refs para el game loop (evitar re-renders por frame)
  const gridRef = useRef<string[][]>(cloneMaze())
  const playerRef = useRef<Point>({ r: 6, c: 5 })          // centro
  const playerDirRef = useRef<Dir>('none')
  const playerNextDirRef = useRef<Dir>('none')
  const enemiesRef = useRef<Enemy[]>([])
  const powerTimerRef = useRef<number>(0)                  // frames de power-up
  const pelletsRef = useRef<number>(0)
  const frameRef = useRef<number>(0)
  const rafRef = useRef<number | null>(null)
  const tickRef = useRef<number>(0)

  // Cargar mejor puntaje de localStorage
  useEffect(() => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem('pacman_denti_best') : null
    if (saved) setMejorPuntaje(parseInt(saved, 10) || 0)
  }, [])

  // Inicializa una partida
  const resetPartida = useCallback(() => {
    const g = cloneMaze()
    gridRef.current = g
    playerRef.current = { r: 6, c: 5 }
    playerDirRef.current = 'none'
    playerNextDirRef.current = 'none'
    enemiesRef.current = [
      { r: 1, c: 1,  dir: 'right', color: '#ef4444', scared: false }, // rojo caries
      { r: 1, c: 9,  dir: 'left',  color: '#f59e0b', scared: false }, // azúcar
      { r: 11, c: 1, dir: 'right', color: '#ec4899', scared: false }, // chicle
    ]
    let pellets = 0
    for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
      if (g[r][c] === '.' || g[r][c] === 'o') pellets++
    }
    pelletsRef.current = pellets
    powerTimerRef.current = 0
    frameRef.current = 0
    tickRef.current = 0
    setPuntaje(0)
    setVidas(3)
    setRecompensaGuardada(false)
  }, [])

  const iniciar = useCallback(() => {
    resetPartida()
    setEstado('jugando')
  }, [resetPartida])

  // Perder una vida o game over
  const perderVida = useCallback(() => {
    setVidas(v => {
      const nv = v - 1
      if (nv <= 0) {
        setEstado('perdiste')
        return 0
      }
      // reset posiciones pero no el maze
      playerRef.current = { r: 6, c: 5 }
      playerDirRef.current = 'none'
      playerNextDirRef.current = 'none'
      enemiesRef.current = [
        { r: 1, c: 1,  dir: 'right', color: '#ef4444', scared: false },
        { r: 1, c: 9,  dir: 'left',  color: '#f59e0b', scared: false },
        { r: 11, c: 1, dir: 'right', color: '#ec4899', scared: false },
      ]
      powerTimerRef.current = 0
      return nv
    })
  }, [])

  // Guardar recompensa (logro) en Supabase al ganar
  const guardarRecompensa = useCallback(async (puntos: number) => {
    if (recompensaGuardada) return
    setRecompensaGuardada(true)
    // Update mejor puntaje local
    if (puntos > mejorPuntaje) {
      setMejorPuntaje(puntos)
      if (typeof window !== 'undefined') localStorage.setItem('pacman_denti_best', String(puntos))
    }
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      // Inserta un logro "Héroe Pac-Denti" si no existe aún
      const { data: existe } = await supabase.from('logros')
        .select('id')
        .eq('parent_id', user.id)
        .eq('tipo', 'pacman_denti')
        .maybeSingle()
      if (!existe) {
        await supabase.from('logros').insert({
          parent_id: user.id,
          tipo: 'pacman_denti',
          nombre: '¡Héroe Pac-Denti!',
          descripcion: 'Superó el reto del laberinto de Denti',
          icono: '🏆',
          fecha_ganado: new Date().toISOString(),
        })
      }
    } catch (e) {
      console.error('No se pudo guardar el logro:', e)
    }
  }, [mejorPuntaje, recompensaGuardada])

  // Ganar: todos los pellets recogidos
  useEffect(() => {
    if (estado === 'ganaste') {
      guardarRecompensa(puntaje + 500) // bonus por ganar
      setPuntaje(prev => prev + 500)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [estado])

  // ── Controles teclado ────────────────────────────────────────────────────
  useEffect(() => {
    if (estado !== 'jugando') return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') playerNextDirRef.current = 'up'
      else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') playerNextDirRef.current = 'down'
      else if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') playerNextDirRef.current = 'left'
      else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') playerNextDirRef.current = 'right'
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [estado])

  // ── Controles swipe ──────────────────────────────────────────────────────
  useEffect(() => {
    if (estado !== 'jugando') return
    const canvas = canvasRef.current
    if (!canvas) return
    let startX = 0, startY = 0
    const onStart = (e: TouchEvent) => {
      const t = e.touches[0]
      startX = t.clientX
      startY = t.clientY
    }
    const onEnd = (e: TouchEvent) => {
      const t = e.changedTouches[0]
      const dx = t.clientX - startX
      const dy = t.clientY - startY
      if (Math.abs(dx) < 18 && Math.abs(dy) < 18) return
      if (Math.abs(dx) > Math.abs(dy)) {
        playerNextDirRef.current = dx > 0 ? 'right' : 'left'
      } else {
        playerNextDirRef.current = dy > 0 ? 'down' : 'up'
      }
    }
    canvas.addEventListener('touchstart', onStart, { passive: true })
    canvas.addEventListener('touchend', onEnd, { passive: true })
    return () => {
      canvas.removeEventListener('touchstart', onStart)
      canvas.removeEventListener('touchend', onEnd)
    }
  }, [estado])

  // ── Game loop ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (estado !== 'jugando') return
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const MOVE_EVERY = 10 // frames por paso de grid (~6 pasos/s a 60fps)

    const step = () => {
      frameRef.current++
      tickRef.current++

      // Mover player solo cada MOVE_EVERY frames
      if (tickRef.current % MOVE_EVERY === 0) {
        const g = gridRef.current
        // Intentar cambiar a la dirección next si es posible
        const [nr, nc] = dirVec(playerNextDirRef.current)
        const p = playerRef.current
        if (playerNextDirRef.current !== 'none' && canMove(g, p.r + nr, p.c + nc)) {
          playerDirRef.current = playerNextDirRef.current
        }
        // Mover en la dirección actual
        const [dr, dc] = dirVec(playerDirRef.current)
        const nextR = p.r + dr
        const nextC = p.c + dc
        if (canMove(g, nextR, nextC)) {
          playerRef.current = { r: nextR, c: nextC }
          // Recoger pellet
          const cell = g[nextR][nextC]
          if (cell === '.') {
            g[nextR][nextC] = ' '
            pelletsRef.current--
            setPuntaje(prev => prev + 10)
          } else if (cell === 'o') {
            g[nextR][nextC] = ' '
            pelletsRef.current--
            powerTimerRef.current = 60 * 6 // 6 segundos a 60fps
            enemiesRef.current.forEach(en => { en.scared = true })
            setPuntaje(prev => prev + 50)
          }
          if (pelletsRef.current === 0) {
            setEstado('ganaste')
          }
        }

        // Mover enemigos — ligeramente más lento
        if (tickRef.current % (MOVE_EVERY + 2) === 0) {
          enemiesRef.current = enemiesRef.current.map(en => {
            // Opciones de movimiento disponibles
            const opciones: Dir[] = (['up','down','left','right'] as Dir[]).filter(d => {
              if (d === oppositeDir(en.dir)) return false // no se da media vuelta
              const [ddr, ddc] = dirVec(d)
              return canMove(g, en.r + ddr, en.c + ddc)
            })
            let newDir = en.dir
            // Si hay intersección, escogemos con sesgo hacia player (o huir si scared)
            if (opciones.length > 0) {
              // Intenta continuar en la misma dirección
              const [cdr, cdc] = dirVec(en.dir)
              const canContinue = canMove(g, en.r + cdr, en.c + cdc)
              if (!canContinue || Math.random() < 0.35) {
                // Escoge dirección
                if (Math.random() < 0.6) {
                  // Pseudo-IA: hacia/lejos del player
                  const player = playerRef.current
                  const scored = opciones.map(d => {
                    const [xr, xc] = dirVec(d)
                    const dist = Math.abs((en.r + xr) - player.r) + Math.abs((en.c + xc) - player.c)
                    return { d, score: en.scared ? -dist : dist }
                  })
                  scored.sort((a, b) => a.score - b.score)
                  newDir = scored[0].d
                } else {
                  newDir = opciones[Math.floor(Math.random() * opciones.length)]
                }
              }
            } else {
              // Sin salida (dead end) - da media vuelta
              newDir = oppositeDir(en.dir)
            }
            const [edr, edc] = dirVec(newDir)
            const nr2 = en.r + edr
            const nc2 = en.c + edc
            if (canMove(g, nr2, nc2)) {
              return { ...en, r: nr2, c: nc2, dir: newDir }
            }
            return { ...en, dir: newDir }
          })
        }

        // Colisión player vs enemigo
        const pp = playerRef.current
        for (let i = 0; i < enemiesRef.current.length; i++) {
          const en = enemiesRef.current[i]
          if (en.r === pp.r && en.c === pp.c) {
            if (en.scared) {
              // come al enemigo — vuelve a un rincón
              const corners = [{r:1,c:1},{r:1,c:9},{r:11,c:1},{r:11,c:9}]
              const corner = corners[Math.floor(Math.random()*corners.length)]
              enemiesRef.current[i] = { ...en, r: corner.r, c: corner.c, scared: false, dir: 'down' }
              setPuntaje(prev => prev + 200)
            } else {
              perderVida()
              break
            }
          }
        }

        // Tick del power timer
        if (powerTimerRef.current > 0) {
          powerTimerRef.current--
          if (powerTimerRef.current === 0) {
            enemiesRef.current.forEach(en => { en.scared = false })
          }
        }
      }

      // ── Render ──────────────────────────────────────────────────────────
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      // fondo
      ctx.fillStyle = '#0c4a6e'
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      const g = gridRef.current
      for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
          const x = c * CELL
          const y = r * CELL
          const cell = g[r][c]
          if (cell === '#') {
            // pared
            ctx.fillStyle = '#0ea5e9'
            ctx.strokeStyle = '#7dd3fc'
            ctx.lineWidth = 2
            ctx.fillRect(x + 2, y + 2, CELL - 4, CELL - 4)
            ctx.strokeRect(x + 2, y + 2, CELL - 4, CELL - 4)
          } else if (cell === '.') {
            // pellet (pequeño)
            ctx.fillStyle = '#fef3c7'
            ctx.beginPath()
            ctx.arc(x + CELL/2, y + CELL/2, 2.5, 0, Math.PI * 2)
            ctx.fill()
          } else if (cell === 'o') {
            // power pellet (tubo de pasta)
            const pulse = Math.sin(frameRef.current * 0.15) * 2
            ctx.fillStyle = '#10b981'
            ctx.beginPath()
            ctx.arc(x + CELL/2, y + CELL/2, 7 + pulse, 0, Math.PI * 2)
            ctx.fill()
            ctx.fillStyle = 'white'
            ctx.beginPath()
            ctx.arc(x + CELL/2, y + CELL/2, 3, 0, Math.PI * 2)
            ctx.fill()
          }
        }
      }

      // Dibuja enemigos
      enemiesRef.current.forEach(en => {
        const x = en.c * CELL + CELL/2
        const y = en.r * CELL + CELL/2
        const scared = en.scared
        const wobble = powerTimerRef.current > 0 && powerTimerRef.current < 120 && Math.floor(frameRef.current/6) % 2 === 0
        const fill = scared ? (wobble ? '#ffffff' : '#1e3a8a') : en.color
        ctx.fillStyle = fill
        // cuerpo
        ctx.beginPath()
        ctx.arc(x, y - 2, CELL/2 - 3, Math.PI, 0)
        ctx.lineTo(x + CELL/2 - 3, y + CELL/2 - 4)
        // dientes de caries (zigzag inferior)
        const teeth = 3
        const w = (CELL - 6) / teeth
        for (let i = 0; i < teeth; i++) {
          const tx = x + CELL/2 - 3 - (i * w)
          ctx.lineTo(tx - w/2, y + CELL/2 - 8)
          ctx.lineTo(tx - w, y + CELL/2 - 4)
        }
        ctx.closePath()
        ctx.fill()
        // ojos
        ctx.fillStyle = 'white'
        ctx.beginPath()
        ctx.arc(x - 4, y - 3, 3, 0, Math.PI * 2)
        ctx.arc(x + 4, y - 3, 3, 0, Math.PI * 2)
        ctx.fill()
        ctx.fillStyle = scared ? '#ef4444' : '#1e293b'
        ctx.beginPath()
        ctx.arc(x - 4, y - 3, 1.5, 0, Math.PI * 2)
        ctx.arc(x + 4, y - 3, 1.5, 0, Math.PI * 2)
        ctx.fill()
      })

      // Dibuja player (Denti)
      {
        const p = playerRef.current
        const x = p.c * CELL + CELL/2
        const y = p.r * CELL + CELL/2
        const mouthOpen = (Math.sin(frameRef.current * 0.25) + 1) / 2  // 0..1
        const ang = 0.2 + mouthOpen * 0.4  // media abertura

        let rot = 0
        if (playerDirRef.current === 'right') rot = 0
        else if (playerDirRef.current === 'down') rot = Math.PI / 2
        else if (playerDirRef.current === 'left') rot = Math.PI
        else if (playerDirRef.current === 'up') rot = -Math.PI / 2

        ctx.save()
        ctx.translate(x, y)
        ctx.rotate(rot)
        // cuerpo (blanco diente)
        ctx.fillStyle = '#ffffff'
        ctx.beginPath()
        ctx.arc(0, 0, CELL/2 - 2, ang, Math.PI * 2 - ang)
        ctx.lineTo(0, 0)
        ctx.closePath()
        ctx.fill()
        // contorno
        ctx.strokeStyle = '#0369a1'
        ctx.lineWidth = 2
        ctx.stroke()
        ctx.restore()
        // Ojo
        ctx.fillStyle = '#0c4a6e'
        const eyeOffset = { x: 0, y: -6 }
        if (playerDirRef.current === 'right') { eyeOffset.x = 2; eyeOffset.y = -6 }
        else if (playerDirRef.current === 'left') { eyeOffset.x = -2; eyeOffset.y = -6 }
        else if (playerDirRef.current === 'up') { eyeOffset.x = 0; eyeOffset.y = -8 }
        else if (playerDirRef.current === 'down') { eyeOffset.x = 0; eyeOffset.y = 4 }
        ctx.beginPath()
        ctx.arc(x + eyeOffset.x, y + eyeOffset.y, 2, 0, Math.PI * 2)
        ctx.fill()
      }

      rafRef.current = requestAnimationFrame(step)
    }

    rafRef.current = requestAnimationFrame(step)
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [estado, perderVida])

  const dir = (d: Dir) => () => { playerNextDirRef.current = d }

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-900 via-sky-800 to-blue-950 text-white">
      <div className="max-w-md mx-auto px-4 pt-6 pb-28">

        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <button onClick={() => router.back()} className="w-10 h-10 flex items-center justify-center rounded-full bg-white/10 text-white active:scale-95">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M15 19l-7-7 7-7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </button>
          <h1 className="font-black text-lg">Pac-Denti</h1>
          <div className="px-3 py-1 text-[10px] rounded-full bg-yellow-400 text-yellow-900 font-black">BETA</div>
        </div>

        {/* HUD */}
        <div className="flex items-center justify-between mb-3 px-1">
          <div className="text-sm font-black">
            <span className="text-yellow-300">★</span> {puntaje}
            <span className="ml-3 text-xs text-white/60">Best: {mejorPuntaje}</span>
          </div>
          <div className="flex gap-1">
            {Array.from({ length: 3 }).map((_, i) => (
              <span key={i} className={`text-lg ${i < vidas ? '' : 'opacity-20 grayscale'}`}>🦷</span>
            ))}
          </div>
        </div>

        {/* Canvas + overlays */}
        <div className="relative mx-auto" style={{ width: COLS * CELL, maxWidth: '100%' }}>
          <canvas
            ref={canvasRef}
            width={COLS * CELL}
            height={ROWS * CELL}
            className="rounded-2xl shadow-2xl border-2 border-sky-400/40 bg-sky-950 w-full"
            style={{ imageRendering: 'pixelated', touchAction: 'none' }}
          />

          {estado === 'intro' && (
            <div className="absolute inset-0 bg-sky-900/95 rounded-2xl flex flex-col items-center justify-center p-4 text-center">
              <div className="text-5xl mb-2">🦷</div>
              <h2 className="font-black text-xl mb-2">¡Ayuda a Denti!</h2>
              <p className="text-sm text-white/80 leading-snug mb-3">
                Come los <span className="text-yellow-300 font-bold">cepillados</span> y la <span className="text-green-300 font-bold">pasta dental</span>.
                Evita las <span className="text-red-300 font-bold">caries</span>.
              </p>
              <p className="text-xs text-white/60 mb-4">Con pasta dental puedes comer caries por 6 seg 💪</p>
              <button onClick={iniciar}
                className="bg-gradient-to-br from-yellow-400 to-orange-400 text-yellow-900 font-black py-3 px-8 rounded-2xl text-base shadow-xl active:scale-95">
                ▶ Jugar
              </button>
            </div>
          )}

          {estado === 'ganaste' && (
            <div className="absolute inset-0 bg-emerald-900/95 rounded-2xl flex flex-col items-center justify-center p-4 text-center">
              <div className="text-6xl mb-2 animate-bounce">🏆</div>
              <h2 className="font-black text-2xl mb-1">¡GANASTE!</h2>
              <p className="text-sm text-emerald-200 mb-1">Puntaje: <b className="text-yellow-300">{puntaje}</b></p>
              <p className="text-xs text-emerald-300 mb-4">🎖️ Logro desbloqueado: Héroe Pac-Denti</p>
              <div className="flex gap-2">
                <button onClick={iniciar} className="bg-white text-emerald-700 font-black py-2.5 px-5 rounded-2xl text-sm active:scale-95">
                  🔁 Otra vez
                </button>
                <button onClick={() => router.back()} className="bg-white/10 border border-white/20 text-white font-black py-2.5 px-5 rounded-2xl text-sm active:scale-95">
                  Volver
                </button>
              </div>
            </div>
          )}

          {estado === 'perdiste' && (
            <div className="absolute inset-0 bg-red-900/95 rounded-2xl flex flex-col items-center justify-center p-4 text-center">
              <div className="text-6xl mb-2">💔</div>
              <h2 className="font-black text-xl mb-1">¡Las caries ganaron!</h2>
              <p className="text-sm text-red-200 mb-4">Puntaje: <b className="text-yellow-300">{puntaje}</b></p>
              <div className="flex gap-2">
                <button onClick={iniciar} className="bg-yellow-400 text-yellow-900 font-black py-2.5 px-5 rounded-2xl text-sm active:scale-95">
                  🔁 Reintentar
                </button>
                <button onClick={() => router.back()} className="bg-white/10 border border-white/20 text-white font-black py-2.5 px-5 rounded-2xl text-sm active:scale-95">
                  Volver
                </button>
              </div>
            </div>
          )}
        </div>

        {/* D-pad móvil */}
        {estado === 'jugando' && (
          <div className="mt-5 mx-auto w-40 grid grid-cols-3 grid-rows-3 gap-1 select-none">
            <div />
            <button onTouchStart={dir('up')} onClick={dir('up')}
              className="bg-white/10 border border-white/20 rounded-xl h-12 text-white text-xl font-black active:bg-white/20">▲</button>
            <div />
            <button onTouchStart={dir('left')} onClick={dir('left')}
              className="bg-white/10 border border-white/20 rounded-xl h-12 text-white text-xl font-black active:bg-white/20">◀</button>
            <div className="h-12 rounded-xl bg-yellow-400/20 border border-yellow-400/30 flex items-center justify-center text-lg">🦷</div>
            <button onTouchStart={dir('right')} onClick={dir('right')}
              className="bg-white/10 border border-white/20 rounded-xl h-12 text-white text-xl font-black active:bg-white/20">▶</button>
            <div />
            <button onTouchStart={dir('down')} onClick={dir('down')}
              className="bg-white/10 border border-white/20 rounded-xl h-12 text-white text-xl font-black active:bg-white/20">▼</button>
            <div />
          </div>
        )}

        <p className="text-center text-white/40 text-[11px] mt-4">
          Controles: flechas / WASD en PC · swipe o D-pad en móvil
        </p>
      </div>
    </div>
  )
}
