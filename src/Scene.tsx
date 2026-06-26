import { useRef, useMemo, createContext, useContext } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import {
  CELL_SIZE as CS, COLS, BOARD_WIDTH,
  LILY_PAD_POSITIONS, type Direction, type LaneConfig,
} from './gameConstants';
import type { GameObject } from './gameConstants';

/* ═══════════════ WORLD HELPERS ═══════════════ */
const S = 1 / CS;
const W = COLS;
const CX = W / 2;

function toX(v: number) { return v * S - CX; }
function toZ(v: number, totalRows: number) { return v * S - totalRows / 2; }

function laneY(type: string) {
  if (type === 'road') return 0.08;
  if (type === 'safe' || type === 'decoration') return 0.12;
  return -0.08;
}

/* ═══════════════ CLIPPING PLANES ═══════════════ */
const ClipContext = createContext<THREE.Plane[]>([]);
function useClip() { return useContext(ClipContext); }

function makeClipPlanes(totalRows: number) {
  const cz = totalRows / 2;
  return [
    new THREE.Plane(new THREE.Vector3(1, 0, 0), CX + 0.01),
    new THREE.Plane(new THREE.Vector3(-1, 0, 0), CX + 0.01),
    new THREE.Plane(new THREE.Vector3(0, 0, 1), cz + 0.01),
    new THREE.Plane(new THREE.Vector3(0, 0, -1), cz + 0.01),
  ];
}

/* ═══════════════ CAMERA FOLLOW ═══════════════ */
function CameraFollow({ frogZ, totalRows }: { frogZ: number; totalRows: number }) {
  const { camera } = useThree();
  const targetZ = useRef(0);

  useFrame(() => {
    if (totalRows <= 17) return; // small levels don't need follow

    // Smoothly track frog Z
    const desired = frogZ * 0.6; // partial follow
    targetZ.current += (desired - targetZ.current) * 0.05;
    const maxShift = (totalRows - 15) / 2 * 0.5;
    const clamped = Math.max(-maxShift, Math.min(maxShift, targetZ.current));

    camera.position.z = 6 + clamped;
    (camera as THREE.OrthographicCamera).updateProjectionMatrix();
  });

  return null;
}

/* ═══════════════ WATER ═══════════════ */
function WaterPlane({ totalRows }: { totalRows: number }) {
  const ref = useRef<THREE.Mesh>(null);
  const geoRef = useRef<THREE.PlaneGeometry>(null);
  const H = totalRows;

  useFrame(({ clock }) => {
    if (!geoRef.current) return;
    const pos = geoRef.current.attributes.position;
    const t = clock.getElapsedTime();
    for (let i = 0; i < pos.count; i++) {
      const px = pos.getX(i);
      const pz = pos.getZ(i);
      pos.setY(i, Math.sin(px * 2.5 + t * 1.6) * 0.02 + Math.cos(pz * 3 + t * 1.1) * 0.015);
    }
    pos.needsUpdate = true;
  });

  return (
    <mesh ref={ref} position={[0, -0.01, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
      <planeGeometry ref={geoRef} args={[W + 2, H + 2, 40, 24]} />
      <meshStandardMaterial color="#1565c0" emissive="#0d47a1" emissiveIntensity={0.05}
        roughness={0.15} metalness={0.3} transparent opacity={0.9} />
    </mesh>
  );
}

/* ═══════════════ BACKGROUND ═══════════════ */
function BackgroundFill() {
  return (
    <group>
      <mesh position={[0, -0.25, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[80, 80]} />
        <meshStandardMaterial color="#2e7d32" roughness={0.95} />
      </mesh>
    </group>
  );
}

/* ═══════════════ LANE TILES ═══════════════ */
function LaneTiles({ lanes, totalRows }: { lanes: LaneConfig[]; totalRows: number }) {
  return (
    <group>
      {lanes.map((lane, idx) => {
        const { type } = lane;
        if (type === 'river' || type === 'goal') return null;
        const gy = (totalRows - 1 - idx) * CS;
        const y = laneY(type);
        const z = toZ(gy + CS / 2, totalRows);
        const h = y + 0.08;
        let color = '#4caf50';
        if (type === 'road') color = '#424242';
        else if (type === 'decoration') color = '#2e7d32';

        return (
          <group key={idx}>
            <mesh position={[0, y - h / 2 + 0.005, z]} receiveShadow castShadow>
              <boxGeometry args={[W, h, 1]} />
              <meshStandardMaterial color={color} roughness={0.9} />
            </mesh>
            {type === 'road' && <RoadDetails gy={gy} y={y} totalRows={totalRows} />}
            {type === 'safe' && <GrassTufts gy={gy} y={y} seed={idx} totalRows={totalRows} />}
            {type === 'decoration' && <DecorationBushes gy={gy} y={y} totalRows={totalRows} />}
          </group>
        );
      })}
    </group>
  );
}

function RoadDetails({ gy, y, totalRows }: { gy: number; y: number; totalRows: number }) {
  const z = toZ(gy + CS / 2, totalRows);
  return (
    <group>
      {Array.from({ length: COLS }).map((_, i) => (
        <mesh key={i} position={[toX(i * CS + CS / 2), y + 0.003, z]}>
          <boxGeometry args={[0.4, 0.004, 0.04]} />
          <meshStandardMaterial color="#9e9e9e" roughness={0.8} />
        </mesh>
      ))}
      {[-0.46, 0.46].map((dz, i) => (
        <mesh key={`e${i}`} position={[0, y + 0.003, z + dz]}>
          <boxGeometry args={[W, 0.004, 0.03]} />
          <meshStandardMaterial color="#fdd835" emissive="#fdd835" emissiveIntensity={0.15} roughness={0.6} />
        </mesh>
      ))}
    </group>
  );
}

function GrassTufts({ gy, y, seed, totalRows }: { gy: number; y: number; seed: number; totalRows: number }) {
  const blades = useMemo(() => {
    const a: { x: number; z: number; h: number; r: number }[] = [];
    const rng = (s: number) => { let v = s; return () => { v = (v * 9301 + 49297) % 233280; return v / 233280; }; };
    const rand = rng(seed * 999 + 7);
    for (let i = 0; i < 60; i++) {
      a.push({ x: toX(rand() * BOARD_WIDTH), z: toZ(gy + rand() * CS, totalRows),
        h: 0.04 + rand() * 0.08, r: rand() * Math.PI });
    }
    return a;
  }, [gy, seed, totalRows]);

  return (
    <group>
      {blades.map((b, i) => (
        <mesh key={i} position={[b.x, y + b.h / 2, b.z]} rotation={[0, b.r, 0]}>
          <boxGeometry args={[0.02, b.h, 0.02]} />
          <meshStandardMaterial color="#7cb342" roughness={1} />
        </mesh>
      ))}
    </group>
  );
}

function DecorationBushes({ gy, y, totalRows }: { gy: number; y: number; totalRows: number }) {
  return (
    <group>
      {Array.from({ length: COLS }).map((_, col) => {
        if (LILY_PAD_POSITIONS.includes(col)) return null;
        const px = toX(col * CS + CS / 2);
        const pz = toZ(gy + CS / 2, totalRows);
        return (
          <group key={col} position={[px, y, pz]}>
            <mesh position={[0, 0.15, 0]} castShadow><cylinderGeometry args={[0.08, 0.12, 0.3, 6]} /><meshStandardMaterial color="#33691e" roughness={0.9} /></mesh>
            <mesh position={[0, 0.35, 0]} castShadow><sphereGeometry args={[0.3, 8, 6]} /><meshStandardMaterial color="#2e7d32" roughness={0.8} /></mesh>
            <mesh position={[0.08, 0.42, -0.05]} castShadow><sphereGeometry args={[0.2, 7, 5]} /><meshStandardMaterial color="#43a047" roughness={0.8} /></mesh>
          </group>
        );
      })}
    </group>
  );
}

/* ═══════════════ FROG 3D ═══════════════ */
function Frog3D({ frogX, frogZ, direction, isHopping, alive, laneType }: {
  frogX: number; frogZ: number; direction: Direction; isHopping: boolean; alive: boolean; laneType: string;
}) {
  const groupRef = useRef<THREE.Group>(null);

  // KEY FIX: frog sits ON TOP of logs/turtles, not inside them
  let baseY: number;
  if (laneType === 'river') {
    baseY = 0.28; // raised above log/turtle surface
  } else {
    baseY = laneY(laneType) + 0.01;
  }
  const hopArc = isHopping ? 0.2 : 0;
  const rot = direction === 'up' ? 0 : direction === 'right' ? -Math.PI / 2
    : direction === 'down' ? Math.PI : Math.PI / 2;

  useFrame(({ clock }) => {
    if (!groupRef.current || !alive) return;
    const b = 1 + Math.sin(clock.getElapsedTime() * 3.5) * 0.015;
    groupRef.current.scale.set(b, b, b);
  });

  if (!alive) return null;

  return (
    <group ref={groupRef} position={[frogX, baseY + hopArc, frogZ]} rotation={[0, rot, 0]}>
      {/* Shadow */}
      <mesh position={[0, -hopArc - baseY + laneY(laneType) + 0.005, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[isHopping ? 0.15 : 0.2, 12]} />
        <meshBasicMaterial color="black" transparent opacity={isHopping ? 0.1 : 0.18} side={THREE.DoubleSide} />
      </mesh>
      {/* Body */}
      <mesh position={[0, 0.1, 0]} castShadow><sphereGeometry args={[0.2, 14, 10]} /><meshStandardMaterial color="#43a047" roughness={0.5} metalness={0.05} /></mesh>
      <mesh position={[0, 0.06, 0.05]}><sphereGeometry args={[0.15, 10, 8]} /><meshStandardMaterial color="#a5d6a7" roughness={0.6} /></mesh>
      {/* Head */}
      <mesh position={[0, 0.16, -0.16]} castShadow><sphereGeometry args={[0.14, 12, 10]} /><meshStandardMaterial color="#66bb6a" roughness={0.45} /></mesh>
      <mesh position={[0, 0.13, -0.26]}><sphereGeometry args={[0.08, 10, 8]} /><meshStandardMaterial color="#81c784" roughness={0.5} /></mesh>
      {/* Nostrils */}
      <mesh position={[-0.03, 0.15, -0.32]}><sphereGeometry args={[0.015, 6, 6]} /><meshStandardMaterial color="#2e7d32" /></mesh>
      <mesh position={[0.03, 0.15, -0.32]}><sphereGeometry args={[0.015, 6, 6]} /><meshStandardMaterial color="#2e7d32" /></mesh>
      {/* Eyes */}
      {[-1, 1].map(side => (
        <group key={side}>
          <mesh position={[side * 0.1, 0.24, -0.14]} castShadow><sphereGeometry args={[0.07, 10, 8]} /><meshStandardMaterial color="#388e3c" roughness={0.5} /></mesh>
          <mesh position={[side * 0.1, 0.27, -0.18]}><sphereGeometry args={[0.055, 10, 8]} /><meshStandardMaterial color="#f5f5f5" roughness={0.3} /></mesh>
          <mesh position={[side * 0.1, 0.28, -0.225]}><sphereGeometry args={[0.035, 8, 8]} /><meshStandardMaterial color="#1b5e20" roughness={0.4} metalness={0.2} /></mesh>
          <mesh position={[side * 0.1, 0.28, -0.25]}><sphereGeometry args={[0.02, 8, 6]} /><meshStandardMaterial color="#0a0a0a" roughness={0.2} /></mesh>
          <mesh position={[side * 0.08, 0.3, -0.24]}><sphereGeometry args={[0.01, 6, 6]} /><meshStandardMaterial color="white" emissive="white" emissiveIntensity={0.5} /></mesh>
        </group>
      ))}
      {/* Front legs */}
      {[-1, 1].map(side => (
        <group key={`fl${side}`}>
          <mesh position={[side * 0.18, 0.04, -0.08]} rotation={[0, 0, side * 0.5]} castShadow><capsuleGeometry args={[0.035, 0.12, 4, 8]} /><meshStandardMaterial color="#43a047" roughness={0.7} /></mesh>
          <mesh position={[side * 0.26, 0, -0.12]}><sphereGeometry args={[0.04, 8, 6]} /><meshStandardMaterial color="#66bb6a" roughness={0.6} /></mesh>
        </group>
      ))}
      {/* Back legs */}
      {[-1, 1].map(side => (
        <group key={`bl${side}`}>
          <mesh position={[side * 0.15, 0.06, 0.1]} rotation={[isHopping ? -0.8 : 0.6, 0, side * 0.3]} castShadow><capsuleGeometry args={[0.04, 0.16, 4, 8]} /><meshStandardMaterial color="#388e3c" roughness={0.7} /></mesh>
          <mesh position={[side * 0.2, 0.02, isHopping ? 0.05 : 0.22]} rotation={[isHopping ? 0.4 : -0.3, 0, side * 0.2]}><capsuleGeometry args={[0.03, 0.12, 4, 8]} /><meshStandardMaterial color="#43a047" roughness={0.7} /></mesh>
          <mesh position={[side * 0.24, 0, isHopping ? 0.04 : 0.3]}><sphereGeometry args={[0.05, 8, 6]} /><meshStandardMaterial color="#66bb6a" roughness={0.6} /></mesh>
        </group>
      ))}
      {/* Spots */}
      {[[-0.06, 0.2, 0.02], [0.08, 0.22, -0.04], [-0.02, 0.18, 0.08]].map((p, i) => (
        <mesh key={i} position={p as [number, number, number]}><sphereGeometry args={[0.025, 6, 6]} /><meshStandardMaterial color="#2e7d32" roughness={0.8} transparent opacity={0.5} /></mesh>
      ))}
      <pointLight position={[0, 0.15, 0]} color="#66bb6a" intensity={0.6} distance={1.5} />
    </group>
  );
}

/* ═══════════════ VEHICLE (clipped) ═══════════════ */
const VCOL: Record<string, [string, string]> = {
  sedan: ['#42a5f5', '#1e88e5'], sports: ['#ab47bc', '#8e24aa'],
  taxi: ['#ffee58', '#f9a825'], truck: ['#ef5350', '#c62828'], bus: ['#5c6bc0', '#3949ab'],
};

function CM({ color, roughness = 0.25, metalness = 0.5, emissive, emissiveIntensity = 0, transparent = false, opacity = 1 }: {
  color: string; roughness?: number; metalness?: number; emissive?: string; emissiveIntensity?: number; transparent?: boolean; opacity?: number;
}) {
  const cp = useClip();
  return <meshStandardMaterial color={color} roughness={roughness} metalness={metalness}
    emissive={emissive} emissiveIntensity={emissiveIntensity}
    transparent={transparent} opacity={opacity} clippingPlanes={cp} clipShadows />;
}

function Vehicle3D({ item, variant, laneGy, goingRight, totalRows }: {
  item: GameObject; variant?: string; laneGy: number; goingRight: boolean; totalRows: number;
}) {
  const v = variant || 'sedan';
  const [c1, c2] = VCOL[v] || VCOL.sedan;
  const y = laneY('road');
  const w = item.width * S;
  const d = 0.7;
  const px = toX(item.x + item.width / 2);
  const pz = toZ(laneGy + CS / 2, totalRows);
  const angle = goingRight ? 0 : Math.PI;
  const bodyH = v === 'sports' ? 0.12 : v === 'truck' ? 0.22 : v === 'bus' ? 0.28 : 0.14;
  const cabH = v === 'sports' ? 0.06 : v === 'truck' ? 0 : v === 'bus' ? 0 : 0.12;

  return (
    <group position={[px, y, pz]} rotation={[0, angle, 0]}>
      <mesh position={[0, bodyH / 2, 0]} castShadow><boxGeometry args={[w * 0.93, bodyH, d]} /><CM color={c1} /></mesh>
      {v === 'truck' && <>
        <mesh position={[-w * 0.1, bodyH + 0.1, 0]} castShadow><boxGeometry args={[w * 0.55, 0.2, d * 0.88]} /><CM color={c2} roughness={0.4} metalness={0.3} /></mesh>
        <mesh position={[w * 0.33, bodyH / 2 + 0.06, 0]} castShadow><boxGeometry args={[w * 0.22, bodyH - 0.06, d * 0.82]} /><CM color="#e57373" roughness={0.35} metalness={0.4} /></mesh>
      </>}
      {v === 'bus' && <>
        {Array.from({ length: Math.max(1, Math.floor(w / 0.45) - 1) }).map((_, i) => (
          <mesh key={i} position={[-w * 0.35 + i * 0.45, bodyH * 0.65, d / 2 + 0.005]}><boxGeometry args={[0.25, bodyH * 0.45, 0.01]} /><CM color="#bbdefb" transparent opacity={0.55} roughness={0.05} metalness={0.6} /></mesh>
        ))}
        <mesh position={[0, bodyH * 0.3, d / 2 + 0.005]}><boxGeometry args={[w * 0.9, 0.04, 0.01]} /><CM color="#ffd54f" emissive="#ffd54f" emissiveIntensity={0.2} /></mesh>
      </>}
      {cabH > 0 && v !== 'truck' && v !== 'bus' && (
        <mesh position={[w * 0.02, bodyH + cabH / 2 - 0.01, 0]} castShadow><boxGeometry args={[w * 0.48, cabH, d * 0.72]} /><CM color={c2} /></mesh>
      )}
      {cabH > 0 && v !== 'truck' && v !== 'bus' && (
        <mesh position={[w * 0.27, bodyH + cabH / 2 - 0.01, 0]}><boxGeometry args={[0.02, cabH * 0.75, d * 0.56]} /><CM color="#90caf9" transparent opacity={0.55} roughness={0.05} metalness={0.8} /></mesh>
      )}
      {v === 'taxi' && <mesh position={[0, bodyH + cabH + 0.03, 0]} castShadow><boxGeometry args={[0.15, 0.06, 0.08]} /><CM color="#fff9c4" emissive="#ffeb3b" emissiveIntensity={1} /></mesh>}
      {/* Wheels */}
      {[[-0.36, -0.38], [-0.36, 0.38], [0.36, -0.38], [0.36, 0.38]].map(([wx, wz], i) => (
        <group key={i} position={[w * wx, 0, d * wz]}>
          <mesh rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[0.06, 0.06, 0.05, 12]} /><CM color="#212121" roughness={0.85} metalness={0.1} /></mesh>
        </group>
      ))}
      {/* Lights */}
      {[0.28, -0.28].map((dz, i) => (
        <mesh key={`hl${i}`} position={[w * 0.47, bodyH * 0.45, dz]}><sphereGeometry args={[0.035, 8, 8]} /><CM color="#fff9c4" emissive="#ffff00" emissiveIntensity={3} /></mesh>
      ))}
      {[0.28, -0.28].map((dz, i) => (
        <mesh key={`tl${i}`} position={[-w * 0.47, bodyH * 0.45, dz]}><sphereGeometry args={[0.03, 8, 8]} /><CM color="#ef5350" emissive="#ff1744" emissiveIntensity={2} /></mesh>
      ))}
    </group>
  );
}

/* ═══════════════ LOG (clipped) ═══════════════ */
function Log3D({ item, variant, laneGy, totalRows }: { item: GameObject; variant?: string; laneGy: number; totalRows: number }) {
  const cp = useClip();
  const w = item.width * S;
  const px = toX(item.x + item.width / 2);
  const pz = toZ(laneGy + CS / 2, totalRows);

  if (variant === 'turtle') {
    const count = Math.floor(item.width / CS);
    return (
      <group>
        {Array.from({ length: count }).map((_, i) => {
          const tx = toX(item.x + i * CS + CS / 2);
          return (
            <group key={i} position={[tx, 0.02, pz]}>
              <mesh castShadow><sphereGeometry args={[0.32, 12, 8, 0, Math.PI * 2, 0, Math.PI * 0.55]} /><meshStandardMaterial color="#43a047" roughness={0.55} metalness={0.1} clippingPlanes={cp} clipShadows /></mesh>
              <mesh position={[0, -0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}><circleGeometry args={[0.3, 10]} /><meshStandardMaterial color="#8d6e63" roughness={0.9} side={THREE.DoubleSide} clippingPlanes={cp} clipShadows /></mesh>
              <mesh position={[0, 0.06, -0.35]} castShadow><sphereGeometry args={[0.1, 10, 8]} /><meshStandardMaterial color="#81c784" roughness={0.6} clippingPlanes={cp} clipShadows /></mesh>
              <mesh position={[-0.04, 0.1, -0.42]}><sphereGeometry args={[0.025, 6, 6]} /><meshStandardMaterial color="#1b5e20" clippingPlanes={cp} clipShadows /></mesh>
              <mesh position={[0.04, 0.1, -0.42]}><sphereGeometry args={[0.025, 6, 6]} /><meshStandardMaterial color="#1b5e20" clippingPlanes={cp} clipShadows /></mesh>
              {[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([sx, sz], fi) => (
                <mesh key={fi} position={[sx * 0.3, -0.01, sz * 0.22]} rotation={[0.1, sx * 0.3, sz * 0.1]} castShadow><capsuleGeometry args={[0.04, 0.1, 4, 6]} /><meshStandardMaterial color="#66bb6a" roughness={0.7} clippingPlanes={cp} clipShadows /></mesh>
              ))}
            </group>
          );
        })}
      </group>
    );
  }

  return (
    <group position={[px, 0.04, pz]}>
      <mesh rotation={[0, 0, Math.PI / 2]} castShadow><cylinderGeometry args={[0.24, 0.28, w * 0.95, 14]} /><meshStandardMaterial color="#795548" roughness={0.85} clippingPlanes={cp} clipShadows /></mesh>
      {[-1, 1].map(side => (
        <mesh key={side} position={[side * w * 0.475, 0, 0]} rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[0.22, 0.22, 0.03, 12]} /><meshStandardMaterial color="#5d4037" roughness={0.9} clippingPlanes={cp} clipShadows /></mesh>
      ))}
      <mesh position={[w * 0.12, 0.22, 0.08]}><sphereGeometry args={[0.1, 6, 5, 0, Math.PI * 2, 0, Math.PI / 2]} /><meshStandardMaterial color="#81c784" roughness={1} transparent opacity={0.4} clippingPlanes={cp} clipShadows /></mesh>
    </group>
  );
}

/* ═══════════════ LILY PAD ═══════════════ */
function LilyPad3D({ col, gy, reached, totalRows }: { col: number; gy: number; reached: boolean; totalRows: number }) {
  const ref = useRef<THREE.Group>(null);
  const px = toX(col * CS + CS / 2);
  const pz = toZ(gy + CS / 2, totalRows);
  useFrame(({ clock }) => {
    if (!ref.current) return;
    ref.current.position.y = 0.01 + Math.sin(clock.getElapsedTime() * 1.2 + col) * 0.015;
  });
  return (
    <group ref={ref} position={[px, 0.01, pz]}>
      <mesh rotation={[-Math.PI / 2, 0, col * 0.5]}><circleGeometry args={[0.38, 24]} /><meshStandardMaterial color="#2e7d32" roughness={0.6} side={THREE.DoubleSide} /></mesh>
      <mesh position={[0, 0.005, 0]} rotation={[-Math.PI / 2, 0, col * 0.5]}><ringGeometry args={[0.05, 0.28, 16]} /><meshStandardMaterial color="#43a047" roughness={0.6} side={THREE.DoubleSide} /></mesh>
      {!reached && <Flower3D />}
      {reached && <MiniFrog3D />}
    </group>
  );
}

function Flower3D() {
  const ref = useRef<THREE.Group>(null);
  useFrame(({ clock }) => { if (ref.current) ref.current.rotation.y = clock.getElapsedTime() * 0.4; });
  return (
    <group ref={ref} position={[0.18, 0.06, -0.12]}>
      {[0, 72, 144, 216, 288].map((a, i) => (
        <mesh key={i} position={[Math.cos(a * Math.PI / 180) * 0.06, 0, Math.sin(a * Math.PI / 180) * 0.06]} rotation={[-Math.PI / 4, 0, a * Math.PI / 180]}>
          <sphereGeometry args={[0.04, 6, 6]} /><meshStandardMaterial color="#f8bbd0" emissive="#f48fb1" emissiveIntensity={0.3} roughness={0.5} /></mesh>
      ))}
      <mesh><sphereGeometry args={[0.035, 8, 8]} /><meshStandardMaterial color="#ffee58" emissive="#fdd835" emissiveIntensity={0.5} /></mesh>
      <mesh position={[0, -0.06, 0]}><cylinderGeometry args={[0.012, 0.012, 0.1, 4]} /><meshStandardMaterial color="#388e3c" /></mesh>
    </group>
  );
}

function MiniFrog3D() {
  return (
    <group position={[0, 0.06, 0]}>
      <mesh castShadow><sphereGeometry args={[0.14, 10, 8]} /><meshStandardMaterial color="#43a047" roughness={0.5} /></mesh>
      {[-1, 1].map(s => (
        <group key={s}>
          <mesh position={[s * 0.07, 0.1, -0.08]}><sphereGeometry args={[0.04, 8, 6]} /><meshStandardMaterial color="white" /></mesh>
          <mesh position={[s * 0.07, 0.11, -0.11]}><sphereGeometry args={[0.025, 6, 6]} /><meshStandardMaterial color="#1b5e20" /></mesh>
        </group>
      ))}
      <pointLight color="#66bb6a" intensity={0.3} distance={1} />
    </group>
  );
}

/* ═══════════════ DEATH PARTICLES ═══════════════ */
function DeathParticles({ fgx, fgz, isSplash, laneType }: { fgx: number; fgz: number; isSplash: boolean; laneType: string }) {
  const baseY = laneType === 'river' ? 0.1 : laneY(laneType) + 0.1;
  const particles = useMemo(() =>
    Array.from({ length: 16 }).map((_, i) => ({
      angle: (i / 16) * Math.PI * 2, speed: 0.015 + Math.random() * 0.01,
      ySpeed: 0.02 + Math.random() * 0.02, size: 0.03 + Math.random() * 0.03,
    })), []);
  const groupRef = useRef<THREE.Group>(null);
  const timeRef = useRef(0);
  useFrame((_, delta) => {
    if (!groupRef.current) return;
    timeRef.current += delta;
    const t = timeRef.current;
    groupRef.current.children.forEach((child, i) => {
      const p = particles[i]; if (!p) return;
      child.position.x = Math.cos(p.angle) * p.speed * t * 40;
      child.position.z = Math.sin(p.angle) * p.speed * t * 40;
      child.position.y = p.ySpeed * t * 30 - 4 * t * t;
      const s = Math.max(0, 1 - t * 1.8); child.scale.set(s, s, s);
    });
  });
  return (
    <group ref={groupRef} position={[fgx, baseY, fgz]}>
      {particles.map((p, i) => (
        <mesh key={i}><sphereGeometry args={[p.size, 6, 6]} /><meshStandardMaterial
          color={isSplash ? '#64b5f6' : '#ff8a65'} emissive={isSplash ? '#2196f3' : '#ff5722'}
          emissiveIntensity={2} transparent opacity={0.85} /></mesh>
      ))}
    </group>
  );
}

/* ═══════════════ SCENE EXPORT ═══════════════ */
export function GameScene({ frog, gameState, laneItems, deathAnimation, showSplash, laneConfigs, totalRows }: {
  frog: { pos: { x: number; y: number }; direction: Direction; isHopping: boolean; alive: boolean };
  gameState: { goalsReached: boolean[] };
  laneItems: GameObject[][];
  deathAnimation: boolean;
  showSplash: boolean;
  laneConfigs: LaneConfig[];
  totalRows: number;
}) {
  const clipPlanes = useMemo(() => makeClipPlanes(totalRows), [totalRows]);
  const goalRow = useMemo(() => {
    const idx = laneConfigs.findIndex(l => l.type === 'goal');
    return idx >= 0 ? (totalRows - 1 - idx) * CS : -1;
  }, [laneConfigs, totalRows]);

  const frogWorldX = toX(frog.pos.x + CS / 2);
  const frogWorldZ = toZ(frog.pos.y + CS / 2, totalRows);

  // Determine frog's current lane type
  const frogRow = totalRows - 1 - Math.round(frog.pos.y / CS);
  const frogLaneType = laneConfigs[Math.max(0, Math.min(frogRow, laneConfigs.length - 1))]?.type ?? 'safe';

  return (
    <ClipContext.Provider value={clipPlanes}>
      <CameraFollow frogZ={frogWorldZ} totalRows={totalRows} />

      {/* Lighting */}
      <ambientLight intensity={0.4} />
      <directionalLight position={[8, 12, -6]} intensity={1.3} castShadow
        shadow-mapSize-width={2048} shadow-mapSize-height={2048}
        shadow-camera-left={-10} shadow-camera-right={10}
        shadow-camera-top={12} shadow-camera-bottom={-12}
        shadow-camera-near={0.5} shadow-camera-far={40} shadow-bias={-0.001} />
      <directionalLight position={[-5, 8, 8]} intensity={0.35} color="#bbdefb" />
      <hemisphereLight args={['#87CEEB', '#33691e', 0.3]} />

      <BackgroundFill />

      <mesh position={[0, -0.2, 0]} receiveShadow>
        <boxGeometry args={[W + 0.5, 0.3, totalRows + 0.5]} />
        <meshStandardMaterial color="#1a472a" roughness={0.9} />
      </mesh>

      <WaterPlane totalRows={totalRows} />
      <LaneTiles lanes={laneConfigs} totalRows={totalRows} />

      {/* Lily pads */}
      {goalRow >= 0 && LILY_PAD_POSITIONS.map((col, i) => (
        <LilyPad3D key={i} col={col} gy={goalRow} reached={gameState.goalsReached[i]} totalRows={totalRows} />
      ))}

      {/* Lane items */}
      {laneConfigs.map((lane, idx) => {
        const items = laneItems[idx] || [];
        const gy = (totalRows - 1 - idx) * CS;
        return items.map((item, j) => {
          if (lane.type === 'road')
            return <Vehicle3D key={`v${idx}-${j}`} item={item} variant={item.variant} laneGy={gy} goingRight={lane.speed > 0} totalRows={totalRows} />;
          if (lane.type === 'river')
            return <Log3D key={`l${idx}-${j}`} item={item} variant={item.variant} laneGy={gy} totalRows={totalRows} />;
          return null;
        });
      })}

      {/* Frog */}
      <Frog3D frogX={frogWorldX} frogZ={frogWorldZ}
        direction={frog.direction} isHopping={frog.isHopping} alive={frog.alive}
        laneType={frogLaneType} />

      {/* Death particles */}
      {deathAnimation && !frog.alive && (
        <DeathParticles fgx={frogWorldX} fgz={frogWorldZ} isSplash={showSplash} laneType={frogLaneType} />
      )}
    </ClipContext.Provider>
  );
}
