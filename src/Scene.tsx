import { useRef, useMemo, useEffect, createContext, useContext } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import {
  CELL_SIZE as CS, COLS, BOARD_WIDTH,
  LILY_PAD_POSITIONS, type LaneConfig, type LevelModifier,
} from './gameConstants';
import type { GameObject } from './gameConstants';
import type { BonusItem, FrogState } from './gameCore';
import {
  computeBoardScreenSpanZoom,
  computeGroundCameraOffsetForScreenY,
  isMobileCameraViewport,
} from './viewMath';

/* ═══════════════ WORLD HELPERS ═══════════════ */
const S = 1 / CS;
const W = COLS;
const CX = W / 2;
const LANE_SURFACE_Y = {
  road: 0.08,
  safe: 0.12,
  decoration: 0.12,
  river: -0.08,
} as const;
const LANE_TILE_HEIGHT = 0.08;
const FROG_RIVER_LIFT = 0.28;
const FROG_HOP_ARC = 0.2;
const FROG_GROUND_OFFSET = 0.01;
const WATER_Y = -0.01;
const WATER_EDGE_OVERLAP = 0.04;
const WATER_COLOR = '#0045A0';
const LEVEL_BACKGROUND = '#072615';
const BOARD_PLINTH_Y = -0.2;
const BOARD_PLINTH_HEIGHT = 0.3;
const BOARD_PLINTH_MARGIN = 0.5;
const FROG_SHADOW_Y = -0.27;
const ROAD_MARKING_Y_OFFSET = 0.018;
const ROAD_MARKING_HEIGHT = 0.006;
const CAMERA_BASE_Y = 8;
const CAMERA_BASE_X = 6;
const CAMERA_BASE_Z = 6;
const CAMERA_BASE_ZOOM = 55;
const CAMERA_FOLLOW_DAMPING = 4.5;
const CAMERA_MODE_DAMPING = 6;
const CAMERA_FOLLOW_X_SCALE = 0.42;
const CAMERA_FOLLOW_SCALE = 0.72;
const CAMERA_FOLLOW_DEAD_ZONE = 0.18;
const MOBILE_CAMERA_DEAD_ZONE = 0.04;
const MOBILE_BOARD_SCREEN_WIDTHS = 1.5;
const MOBILE_UP_SCREEN_Y = 2 / 3;
const MOBILE_DOWN_SCREEN_Y = 0.5;
const MOBILE_GROUND_VERTICAL_PROJECTION = CAMERA_BASE_Y / Math.hypot(CAMERA_BASE_Y, CAMERA_BASE_Z);
const CAMERA_SIDE_SAFE_X_DESKTOP = 0.2;
const CAMERA_BOTTOM_SAFE_Z_DESKTOP = 0.75;

function toX(v: number) { return v * S - CX; }
function toZ(v: number, totalRows: number) { return v * S - totalRows / 2; }

function laneY(type: string) {
  return LANE_SURFACE_Y[type as keyof typeof LANE_SURFACE_Y] ?? LANE_SURFACE_Y.river;
}

/* ═══════════════ CLIPPING PLANES ═══════════════ */
const ClipContext = createContext<THREE.Plane[]>([]);
function useClip() { return useContext(ClipContext); }

function DebugBox({ size, color = '#00e5ff' }: { size: [number, number, number]; color?: string }) {
  return (
    <mesh>
      <boxGeometry args={size} />
      <meshBasicMaterial color={color} wireframe transparent opacity={0.9} />
    </mesh>
  );
}

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
function CameraFollow({ frogRef, totalRows }: { frogRef: React.MutableRefObject<FrogState>; totalRows: number }) {
  const { camera, size } = useThree();
  const targetX = useRef(0);
  const targetZ = useRef(0);
  const initialized = useRef(false);
  const verticalDirection = useRef<'up' | 'down'>('up');
  const mobileQuaternion = useMemo(() => {
    const referenceCamera = new THREE.OrthographicCamera();
    referenceCamera.position.set(0, CAMERA_BASE_Y, CAMERA_BASE_Z);
    referenceCamera.lookAt(0, 0, 0);
    return referenceCamera.quaternion.clone();
  }, []);
  const desktopQuaternion = useMemo(() => {
    const referenceCamera = new THREE.OrthographicCamera();
    referenceCamera.position.set(CAMERA_BASE_X, CAMERA_BASE_Y, CAMERA_BASE_Z);
    referenceCamera.lookAt(0, 0, 0);
    return referenceCamera.quaternion.clone();
  }, []);

  useEffect(() => {
    targetX.current = 0;
    targetZ.current = 0;
  }, [totalRows]);

  useFrame((_, delta) => {
    const mobile = isMobileCameraViewport(size.width, size.height);
    const frog = frogRef.current;
    if (frog.direction === 'up' || frog.direction === 'down') {
      verticalDirection.current = frog.direction;
    }
    const frogX = toX(frog.pos.x + CS / 2);
    const frogZ = toZ(frog.pos.y + CS / 2, totalRows);
    const targetZoom = mobile
      ? computeBoardScreenSpanZoom(
          size.width,
          BOARD_WIDTH * S,
          MOBILE_BOARD_SCREEN_WIDTHS,
          CAMERA_BASE_ZOOM,
        )
      : CAMERA_BASE_ZOOM;
    const mobileScreenY = verticalDirection.current === 'down'
      ? MOBILE_DOWN_SCREEN_Y
      : MOBILE_UP_SCREEN_Y;
    const mobileGroundOffset = computeGroundCameraOffsetForScreenY(
      size.height,
      targetZoom,
      mobileScreenY,
      MOBILE_GROUND_VERTICAL_PROJECTION,
    );
    const sideSafeOffset = mobile ? 0 : CAMERA_SIDE_SAFE_X_DESKTOP;
    const bottomSafeOffset = mobile ? 0 : CAMERA_BOTTOM_SAFE_Z_DESKTOP;
    const desiredX = mobile
      ? frogX
      : frogX * CAMERA_FOLLOW_X_SCALE + sideSafeOffset;
    const deadZone = mobile ? MOBILE_CAMERA_DEAD_ZONE : CAMERA_FOLLOW_DEAD_ZONE;
    const deltaX = desiredX - targetX.current;
    const softenedTargetX = Math.abs(deltaX) <= deadZone
      ? targetX.current
      : desiredX - Math.sign(deltaX) * deadZone;

    const desiredZ = mobile
      ? frogZ - mobileGroundOffset
      : frogZ * CAMERA_FOLLOW_SCALE + bottomSafeOffset;
    const deltaZ = desiredZ - targetZ.current;
    const softenedTargetZ = Math.abs(deltaZ) <= deadZone
      ? targetZ.current
      : desiredZ - Math.sign(deltaZ) * deadZone;

    const followAlpha = 1 - Math.exp(-CAMERA_FOLLOW_DAMPING * delta);
    if (!initialized.current) {
      targetX.current = softenedTargetX;
      targetZ.current = softenedTargetZ;
    } else {
      targetX.current += (softenedTargetX - targetX.current) * followAlpha;
      targetZ.current += (softenedTargetZ - targetZ.current) * followAlpha;
    }

    const maxShiftX = mobile
      ? BOARD_WIDTH * S / 2
      : Math.max(0.8, BOARD_WIDTH * S * 0.16);
    const maxShiftZ = mobile
      ? Math.max(1.2, totalRows / 2 - 0.5 + Math.abs(mobileGroundOffset))
      : Math.max(1.2, (totalRows - 11) / 2 * 0.6);
    const clampedX = Math.max(-maxShiftX, Math.min(maxShiftX, targetX.current));
    const clampedZ = Math.max(-maxShiftZ, Math.min(maxShiftZ, targetZ.current));
    const targetBaseX = mobile ? 0 : CAMERA_BASE_X;
    const desiredCameraX = targetBaseX + clampedX;
    const desiredCameraZ = CAMERA_BASE_Z + clampedZ;

    if (!initialized.current) {
      camera.position.set(desiredCameraX, CAMERA_BASE_Y, desiredCameraZ);
      camera.quaternion.copy(mobile ? mobileQuaternion : desktopQuaternion);
      camera.zoom = targetZoom;
      initialized.current = true;
    } else {
      const modeAlpha = 1 - Math.exp(-CAMERA_MODE_DAMPING * delta);
      camera.position.x += (desiredCameraX - camera.position.x) * modeAlpha;
      camera.position.y += (CAMERA_BASE_Y - camera.position.y) * modeAlpha;
      camera.position.z += (desiredCameraZ - camera.position.z) * modeAlpha;
      camera.quaternion.slerp(mobile ? mobileQuaternion : desktopQuaternion, modeAlpha);
      camera.zoom += (targetZoom - camera.zoom) * modeAlpha;
    }
    camera.updateProjectionMatrix();
  });

  return null;
}

/* ═══════════════ WATER ═══════════════ */
interface RiverSection {
  startIndex: number;
  endIndex: number;
  z: number;
  height: number;
  firstLaneZ: number;
  laneFlows: [number, number, number, number];
}

function WaterSection({
  section,
  reducedMotion,
}: {
  section: RiverSection;
  reducedMotion: boolean;
}) {
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uWorldZ: { value: section.z },
    uSeed: { value: section.startIndex * 1.37 },
    uFirstLaneZ: { value: section.firstLaneZ },
    uLaneCount: { value: section.height },
    uLaneFlows: { value: new THREE.Vector4(...section.laneFlows) },
    uReducedMotion: { value: reducedMotion ? 1 : 0 },
  }), [reducedMotion, section]);

  useEffect(() => {
    if (materialRef.current) {
      materialRef.current.uniforms.uReducedMotion.value = reducedMotion ? 1 : 0;
    }
  }, [reducedMotion]);

  useFrame(({ clock }) => {
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = clock.getElapsedTime();
    }
  });

  return (
    <mesh position={[0, WATER_Y, section.z]} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[W, section.height + WATER_EDGE_OVERLAP]} />
      <shaderMaterial
        ref={materialRef}
        uniforms={uniforms}
        vertexShader={`
          uniform float uWorldZ;
          varying vec2 vWaterPosition;

          void main() {
            vWaterPosition = vec2(position.x, uWorldZ - position.y);
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `}
        fragmentShader={`
          uniform float uTime;
          uniform float uSeed;
          uniform float uFirstLaneZ;
          uniform float uLaneCount;
          uniform vec4 uLaneFlows;
          uniform float uReducedMotion;
          varying vec2 vWaterPosition;

          float hash21(vec2 point) {
            point = fract(point * vec2(123.34, 456.21));
            point += dot(point, point + 45.32);
            return fract(point.x * point.y);
          }

          float valueNoise(vec2 point) {
            vec2 cell = floor(point);
            vec2 local = fract(point);
            local = local * local * (3.0 - 2.0 * local);
            float a = hash21(cell);
            float b = hash21(cell + vec2(1.0, 0.0));
            float c = hash21(cell + vec2(0.0, 1.0));
            float d = hash21(cell + vec2(1.0, 1.0));
            return mix(mix(a, b, local.x), mix(c, d, local.x), local.y);
          }

          vec2 sampleCurrent(float signedFlow) {
            float motion = 1.0 - uReducedMotion;
            float flow = uTime * signedFlow * motion;
            vec2 broadUv = vec2(
              (vWaterPosition.x - flow) * 0.34 + uSeed,
              vWaterPosition.y * 1.35
            );
            float broad = valueNoise(broadUv);

            vec2 detailUv = vec2(
              (vWaterPosition.x - flow * 1.35) * 0.72 + uSeed * 0.47,
              vWaterPosition.y * 4.8 + broad * 0.7
            );
            return vec2(broad, valueNoise(detailUv));
          }

          vec2 sampleLaneCurrent() {
            float lanePosition = clamp(
              uFirstLaneZ - vWaterPosition.y,
              0.0,
              max(0.0, uLaneCount - 1.0)
            );

            if (lanePosition < 1.0) {
              float blend = smoothstep(0.38, 0.62, lanePosition);
              return mix(sampleCurrent(uLaneFlows.x), sampleCurrent(uLaneFlows.y), blend);
            }
            if (lanePosition < 2.0) {
              float blend = smoothstep(1.38, 1.62, lanePosition);
              return mix(sampleCurrent(uLaneFlows.y), sampleCurrent(uLaneFlows.z), blend);
            }

            float blend = smoothstep(2.38, 2.62, lanePosition);
            return mix(sampleCurrent(uLaneFlows.z), sampleCurrent(uLaneFlows.w), blend);
          }

          void main() {
            vec3 deep = vec3(0.0, 0.2705882353, 0.6274509804);
            vec3 mid = vec3(0.0156862745, 0.3215686275, 0.7098039216);
            vec3 highlight = vec3(0.1058823529, 0.4666666667, 0.8509803922);

            vec2 current = sampleLaneCurrent();
            float broad = current.x;
            float detail = current.y;
            float currentBand = 0.5 + 0.5 * sin(
              vWaterPosition.y * 10.0 + broad * 2.4 + detail * 1.2
            );
            float streak = smoothstep(0.72, 0.94, detail + currentBand * 0.18);
            float depthVariation = (broad - 0.5) * 0.16;

            vec3 color = mix(deep, mid, 0.32 + depthVariation);
            color = mix(color, highlight, streak * 0.32);
            gl_FragColor = vec4(color, 1.0);
          }
        `}
      />
    </mesh>
  );
}

function StaticWaterLane({ z }: { z: number }) {
  return (
    <mesh position={[0, WATER_Y, z]} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[W, 1 + WATER_EDGE_OVERLAP]} />
      <meshBasicMaterial color={WATER_COLOR} toneMapped={false} />
    </mesh>
  );
}

function WaterPlane({ lanes, totalRows, reducedMotion }: { lanes: LaneConfig[]; totalRows: number; reducedMotion: boolean }) {
  const { sections, goalWaterZ } = useMemo(() => {
    const result: RiverSection[] = [];
    let startIndex = -1;

    const addSection = (endIndex: number) => {
      if (startIndex < 0) return;
      const sectionLanes = lanes.slice(startIndex, endIndex);
      const firstGy = (totalRows - 1 - startIndex) * CS;
      const lastGy = (totalRows - endIndex) * CS;
      const firstZ = toZ(firstGy + CS / 2, totalRows);
      const lastZ = toZ(lastGy + CS / 2, totalRows);
      const flows = sectionLanes.map((lane) => {
        const speed = Math.min(1.3, Math.max(0.55, Math.abs(lane.speed) * 0.65));
        return speed * (Math.sign(lane.speed) || 1);
      });
      const lastFlow = flows.at(-1) ?? 0;

      result.push({
        startIndex,
        endIndex,
        z: (firstZ + lastZ) / 2,
        height: sectionLanes.length,
        firstLaneZ: firstZ,
        laneFlows: [
          flows[0] ?? lastFlow,
          flows[1] ?? lastFlow,
          flows[2] ?? lastFlow,
          flows[3] ?? lastFlow,
        ],
      });
      startIndex = -1;
    };

    lanes.forEach((lane, index) => {
      if (lane.type === 'river') {
        if (startIndex < 0) startIndex = index;
        return;
      }
      addSection(index);
    });
    addSection(lanes.length);

    const goalIndex = lanes.findIndex(lane => lane.type === 'goal');
    const goalGy = goalIndex >= 0 ? (totalRows - 1 - goalIndex) * CS : 0;

    return {
      sections: result,
      goalWaterZ: goalIndex >= 0 ? toZ(goalGy + CS / 2, totalRows) : null,
    };
  }, [lanes, totalRows]);

  return (
    <group>
      {sections.map(section => (
        <WaterSection
          key={`water-${section.startIndex}-${section.endIndex}`}
          section={section}
          reducedMotion={reducedMotion}
        />
      ))}
      {goalWaterZ !== null && <StaticWaterLane z={goalWaterZ} />}
    </group>
  );
}

/* ═══════════════ BACKGROUND ═══════════════ */
function BackgroundFill() {
  return (
    <group>
      <mesh position={[0, -0.25, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[80, 80]} />
        <meshStandardMaterial color={LEVEL_BACKGROUND} roughness={0.95} />
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
        const h = y + LANE_TILE_HEIGHT;
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
        <mesh key={i} position={[toX(i * CS + CS / 2), y + ROAD_MARKING_Y_OFFSET, z]}>
          <boxGeometry args={[0.4, ROAD_MARKING_HEIGHT, 0.04]} />
          <meshStandardMaterial color="#9e9e9e" roughness={0.8} depthWrite={false} />
        </mesh>
      ))}
      {[-0.46, 0.46].map((dz, i) => (
        <mesh key={`e${i}`} position={[0, y + ROAD_MARKING_Y_OFFSET, z + dz]}>
          <boxGeometry args={[W, ROAD_MARKING_HEIGHT, 0.03]} />
          <meshStandardMaterial color="#fdd835" emissive="#fdd835" emissiveIntensity={0.15} roughness={0.6} depthWrite={false} />
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

  const instancedRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  useEffect(() => {
    if (!instancedRef.current) return;
    blades.forEach((b, i) => {
      dummy.position.set(b.x, y + b.h / 2, b.z);
      dummy.rotation.set(0, b.r, 0);
      dummy.scale.set(1, b.h, 1);
      dummy.updateMatrix();
      instancedRef.current!.setMatrixAt(i, dummy.matrix);
    });
    instancedRef.current.instanceMatrix.needsUpdate = true;
  }, [blades, dummy, y]);

  return (
    <instancedMesh ref={instancedRef} args={[undefined, undefined, blades.length]}>
      <boxGeometry args={[0.02, 1, 0.02]} />
      <meshStandardMaterial color="#7cb342" roughness={1} />
    </instancedMesh>
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
function Frog3D({ frogRef, laneConfigs, totalRows, showCollisionBoxes, reducedMotion, shieldActive, slowTimeActive, currentAnchorActive, superHopActive }: {
  frogRef: React.MutableRefObject<FrogState>;
  laneConfigs: LaneConfig[];
  totalRows: number;
  showCollisionBoxes: boolean;
  reducedMotion: boolean;
  shieldActive: boolean;
  slowTimeActive: boolean;
  currentAnchorActive: boolean;
  superHopActive: boolean;
}) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    const frog = frogRef.current;
    const frogRow = totalRows - 1 - Math.round(frog.pos.y / CS);
    const laneType = laneConfigs[Math.max(0, Math.min(frogRow, laneConfigs.length - 1))]?.type ?? 'safe';
    const baseY = laneType === 'river' ? FROG_RIVER_LIFT : laneY(laneType) + FROG_GROUND_OFFSET;
    const hopArc = reducedMotion ? 0 : frog.isHopping ? FROG_HOP_ARC : 0;
    const rot = frog.direction === 'up' ? 0 : frog.direction === 'right' ? -Math.PI / 2
      : frog.direction === 'down' ? Math.PI : Math.PI / 2;
    const b = reducedMotion ? 1 : 1 + Math.sin(clock.getElapsedTime() * 3.5) * 0.015;
    groupRef.current.visible = frog.alive;
    groupRef.current.position.set(
      toX(frog.pos.x + CS / 2),
      baseY + hopArc,
      toZ(frog.pos.y + CS / 2, totalRows),
    );
    groupRef.current.rotation.set(0, rot, 0);
    groupRef.current.scale.set(b, b, b);
  });

  return (
    <group ref={groupRef}>
      {showCollisionBoxes && <DebugBox size={[0.56, 0.58, 0.56]} color="#22d3ee" />}
      {/* Shadow */}
      <mesh position={[0, FROG_SHADOW_Y, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.2, 12]} />
        <meshBasicMaterial color="black" transparent opacity={0.18} side={THREE.DoubleSide} />
      </mesh>
      {/* Body */}
      <mesh position={[0, 0.1, 0]} castShadow><sphereGeometry args={[0.2, 14, 10]} /><meshStandardMaterial color="#43a047" roughness={0.5} metalness={0.05} /></mesh>
      <mesh position={[0, 0.06, 0.05]}><sphereGeometry args={[0.15, 10, 8]} /><meshStandardMaterial color="#a5d6a7" roughness={0.6} /></mesh>
      {shieldActive && (
        <group>
          <mesh position={[0, 0.12, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.42, 0.04, 10, 20]} />
            <meshStandardMaterial color="#fbbf24" emissive="#f59e0b" emissiveIntensity={1.8} transparent opacity={0.85} />
          </mesh>
          <pointLight color="#fbbf24" intensity={1.1} distance={2} />
        </group>
      )}
      {slowTimeActive && (
        <group>
          <mesh position={[0, 0.1, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.52, 0.03, 8, 24]} />
            <meshStandardMaterial color="#93c5fd" emissive="#60a5fa" emissiveIntensity={1.1} transparent opacity={0.7} />
          </mesh>
          <pointLight color="#60a5fa" intensity={0.9} distance={2.4} />
        </group>
      )}
      {currentAnchorActive && (
        <group>
          <mesh position={[0, 0.04, 0]}>
            <cylinderGeometry args={[0.02, 0.02, 0.28, 10]} />
            <meshStandardMaterial color="#5eead4" emissive="#14b8a6" emissiveIntensity={1} />
          </mesh>
          <mesh position={[0, -0.1, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.18, 0.02, 8, 18]} />
            <meshStandardMaterial color="#99f6e4" emissive="#14b8a6" emissiveIntensity={0.7} transparent opacity={0.8} />
          </mesh>
          <pointLight color="#14b8a6" intensity={0.7} distance={2} />
        </group>
      )}
      {superHopActive && (
        <group>
          <mesh position={[0, 0.02, 0]}>
            <torusGeometry args={[0.58, 0.025, 8, 24]} />
            <meshStandardMaterial color="#fde68a" emissive="#f59e0b" emissiveIntensity={1.1} transparent opacity={0.8} />
          </mesh>
          <mesh position={[0, 0.28, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <coneGeometry args={[0.08, 0.18, 10]} />
            <meshStandardMaterial color="#fbbf24" emissive="#f59e0b" emissiveIntensity={1.2} />
          </mesh>
          <mesh position={[0, 0.12, 0]} rotation={[0, 0, 0]}>
            <coneGeometry args={[0.08, 0.18, 10]} />
            <meshStandardMaterial color="#fbbf24" emissive="#f59e0b" emissiveIntensity={1.2} />
          </mesh>
          <pointLight color="#f59e0b" intensity={0.95} distance={2.6} />
        </group>
      )}
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
          <mesh position={[side * 0.15, 0.06, 0.1]} rotation={[0.6, 0, side * 0.3]} castShadow><capsuleGeometry args={[0.04, 0.16, 4, 8]} /><meshStandardMaterial color="#388e3c" roughness={0.7} /></mesh>
          <mesh position={[side * 0.2, 0.02, 0.22]} rotation={[-0.3, 0, side * 0.2]}><capsuleGeometry args={[0.03, 0.12, 4, 8]} /><meshStandardMaterial color="#43a047" roughness={0.7} /></mesh>
          <mesh position={[side * 0.24, 0, 0.3]}><sphereGeometry args={[0.05, 8, 6]} /><meshStandardMaterial color="#66bb6a" roughness={0.6} /></mesh>
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

function Vehicle3D({ item, itemIndex, rowIndex, variant, laneGy, goingRight, totalRows, laneItemsRef, showCollisionBoxes }: {
  item: GameObject; itemIndex: number; rowIndex: number; variant?: string; laneGy: number; goingRight: boolean; totalRows: number; laneItemsRef: React.MutableRefObject<GameObject[][]>; showCollisionBoxes: boolean;
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
  const groupRef = useRef<THREE.Group>(null);

  useFrame(() => {
    if (!groupRef.current) return;
    const runtimeItem = laneItemsRef.current[rowIndex]?.[itemIndex];
    if (!runtimeItem) return;
    groupRef.current.position.set(toX(runtimeItem.x + runtimeItem.width / 2), y, pz);
    groupRef.current.rotation.y = angle;
  });

  return (
    <group ref={groupRef} position={[px, y, pz]} rotation={[0, angle, 0]}>
      {showCollisionBoxes && <DebugBox size={[w * 0.98, bodyH + (cabH > 0 ? cabH : 0.08) + 0.18, d * 0.98]} color="#f59e0b" />}
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
function Log3D({ item, itemIndex, rowIndex, variant, laneGy, totalRows, laneItemsRef, showCollisionBoxes }: { item: GameObject; itemIndex: number; rowIndex: number; variant?: string; laneGy: number; totalRows: number; laneItemsRef: React.MutableRefObject<GameObject[][]>; showCollisionBoxes: boolean }) {
  const cp = useClip();
  const w = item.width * S;
  const px = toX(item.x + item.width / 2);
  const pz = toZ(laneGy + CS / 2, totalRows);
  const y = variant === 'turtle' ? 0.02 : 0.04;
  const groupRef = useRef<THREE.Group>(null);

  useFrame(() => {
    if (!groupRef.current) return;
    const runtimeItem = laneItemsRef.current[rowIndex]?.[itemIndex];
    if (!runtimeItem) return;
    groupRef.current.position.set(toX(runtimeItem.x + runtimeItem.width / 2), y, pz);
  });

  if (variant === 'turtle') {
    const count = Math.max(1, Math.round(w));
    return (
      <group ref={groupRef} position={[px, y, pz]}>
        {Array.from({ length: count }).map((_, i) => {
          const tx = i + 0.5 - w / 2;
          return (
            <group key={i} position={[tx, 0, 0]}>
              {showCollisionBoxes && <DebugBox size={[0.72, 0.42, 0.72]} color="#38bdf8" />}
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
    <group ref={groupRef} position={[px, y, pz]}>
      {showCollisionBoxes && <DebugBox size={[w * 0.98, 0.55, 0.56]} color="#38bdf8" />}
      <mesh rotation={[0, 0, Math.PI / 2]} castShadow><cylinderGeometry args={[0.24, 0.28, w * 0.95, 14]} /><meshStandardMaterial color="#795548" roughness={0.85} clippingPlanes={cp} clipShadows /></mesh>
      {[-1, 1].map(side => (
        <mesh key={side} position={[side * w * 0.475, 0, 0]} rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[0.22, 0.22, 0.03, 12]} /><meshStandardMaterial color="#5d4037" roughness={0.9} clippingPlanes={cp} clipShadows /></mesh>
      ))}
      <mesh position={[w * 0.12, 0.22, 0.08]}><sphereGeometry args={[0.1, 6, 5, 0, Math.PI * 2, 0, Math.PI / 2]} /><meshStandardMaterial color="#81c784" roughness={1} transparent opacity={0.4} clippingPlanes={cp} clipShadows /></mesh>
    </group>
  );
}

/* ═══════════════ LILY PAD ═══════════════ */
function LilyPad3D({ col, gy, reached, totalRows, showCollisionBoxes, reducedMotion }: { col: number; gy: number; reached: boolean; totalRows: number; showCollisionBoxes: boolean; reducedMotion: boolean }) {
  const ref = useRef<THREE.Group>(null);
  const px = toX(col * CS + CS / 2);
  const pz = toZ(gy + CS / 2, totalRows);
  useFrame(({ clock }) => {
    if (!ref.current) return;
    ref.current.position.y = reducedMotion ? 0.01 : 0.01 + Math.sin(clock.getElapsedTime() * 1.2 + col) * 0.015;
  });
  return (
    <group ref={ref} position={[px, 0.01, pz]}>
      {showCollisionBoxes && <DebugBox size={[0.9, 0.12, 0.9]} color="#84cc16" />}
      <mesh rotation={[-Math.PI / 2, 0, col * 0.5]}><circleGeometry args={[0.38, 24]} /><meshStandardMaterial color="#2e7d32" roughness={0.6} side={THREE.DoubleSide} /></mesh>
      <mesh position={[0, 0.005, 0]} rotation={[-Math.PI / 2, 0, col * 0.5]}><ringGeometry args={[0.05, 0.28, 16]} /><meshStandardMaterial color="#43a047" roughness={0.6} side={THREE.DoubleSide} /></mesh>
      {!reached && <Flower3D reducedMotion={reducedMotion} />}
      {reached && <MiniFrog3D />}
    </group>
  );
}

function Flower3D({ reducedMotion }: { reducedMotion: boolean }) {
  const ref = useRef<THREE.Group>(null);
  useFrame(({ clock }) => { if (ref.current) ref.current.rotation.y = reducedMotion ? 0 : clock.getElapsedTime() * 0.4; });
  return (
    <group ref={ref} position={[0, 0.06, 0]} scale={1.5}>
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

function BonusPickup3D({ item, totalRows, reducedMotion }: { item: BonusItem; totalRows: number; reducedMotion: boolean }) {
  const ref = useRef<THREE.Group>(null);
  const px = toX(item.x + CS / 2);
  const pz = toZ(item.y + CS / 2, totalRows);
  const isSlowTime = item.kind === 'slowTime';
  const isCurrentAnchor = item.kind === 'currentAnchor';
  const isSuperHop = item.kind === 'superHop';
  const isFly = item.kind === 'fly';
  const mainColor = isSlowTime ? '#60a5fa' : isCurrentAnchor ? '#14b8a6' : isSuperHop ? '#f59e0b' : isFly ? '#facc15' : '#fbbf24';
  const emissiveColor = isSlowTime ? '#3b82f6' : isCurrentAnchor ? '#0f766e' : isSuperHop ? '#ea580c' : isFly ? '#ca8a04' : '#f59e0b';
  const ringColor = isSlowTime ? '#bfdbfe' : isCurrentAnchor ? '#99f6e4' : isSuperHop ? '#fde68a' : isFly ? '#fef08a' : '#fde68a';

  useFrame(({ clock }) => {
    if (!ref.current) return;
    const t = clock.getElapsedTime();
    ref.current.rotation.y = reducedMotion ? 0 : t * 1.8;
    ref.current.position.y = 0.18 + (reducedMotion ? 0 : Math.sin(t * 2.2) * 0.04);
  });

  return (
    <group ref={ref} position={[px, 0.18, pz]}>
      {isSlowTime ? (
        <>
          <mesh castShadow>
            <sphereGeometry args={[0.11, 14, 10]} />
            <meshStandardMaterial color={mainColor} emissive={emissiveColor} emissiveIntensity={0.75} roughness={0.25} metalness={0.25} />
          </mesh>
          <mesh position={[0, 0.03, 0]}>
            <torusGeometry args={[0.18, 0.02, 10, 24]} />
            <meshStandardMaterial color={ringColor} emissive={emissiveColor} emissiveIntensity={0.45} transparent opacity={0.9} side={THREE.DoubleSide} />
          </mesh>
          <mesh position={[0, 0.03, 0]}>
            <boxGeometry args={[0.015, 0.1, 0.015]} />
            <meshStandardMaterial color="#eff6ff" emissive="#eff6ff" emissiveIntensity={0.4} />
          </mesh>
          <mesh position={[0.05, 0.03, 0]}>
            <boxGeometry args={[0.08, 0.015, 0.015]} />
            <meshStandardMaterial color="#eff6ff" emissive="#eff6ff" emissiveIntensity={0.4} />
          </mesh>
          <pointLight color={mainColor} intensity={0.8} distance={1.9} />
        </>
      ) : isCurrentAnchor ? (
        <>
          <mesh castShadow>
            <boxGeometry args={[0.11, 0.12, 0.03]} />
            <meshStandardMaterial color={mainColor} emissive={emissiveColor} emissiveIntensity={0.8} roughness={0.3} metalness={0.18} />
          </mesh>
          <mesh position={[0, -0.11, 0]}>
            <torusGeometry args={[0.1, 0.02, 10, 18, Math.PI]} />
            <meshStandardMaterial color={ringColor} emissive={emissiveColor} emissiveIntensity={0.45} transparent opacity={0.9} side={THREE.DoubleSide} />
          </mesh>
          <mesh position={[0, -0.02, 0]}>
            <cylinderGeometry args={[0.018, 0.018, 0.18, 10]} />
            <meshStandardMaterial color={ringColor} emissive={emissiveColor} emissiveIntensity={0.5} />
          </mesh>
          <pointLight color={mainColor} intensity={0.75} distance={1.8} />
        </>
      ) : isSuperHop ? (
        <>
          <mesh castShadow>
            <coneGeometry args={[0.1, 0.16, 10]} />
            <meshStandardMaterial color={mainColor} emissive={emissiveColor} emissiveIntensity={1} roughness={0.3} metalness={0.16} />
          </mesh>
          <mesh position={[0, 0.12, 0]} rotation={[Math.PI, 0, 0]}>
            <coneGeometry args={[0.08, 0.14, 10]} />
            <meshStandardMaterial color={ringColor} emissive={emissiveColor} emissiveIntensity={0.8} roughness={0.3} metalness={0.16} />
          </mesh>
          <mesh position={[0, -0.1, 0]}>
            <torusGeometry args={[0.14, 0.02, 8, 18]} />
            <meshStandardMaterial color={ringColor} emissive={emissiveColor} emissiveIntensity={0.4} transparent opacity={0.85} side={THREE.DoubleSide} />
          </mesh>
          <pointLight color={mainColor} intensity={0.85} distance={2} />
        </>
      ) : isFly ? (
        <>
          <mesh castShadow>
            <sphereGeometry args={[0.1, 12, 10]} />
            <meshStandardMaterial color={mainColor} emissive={emissiveColor} emissiveIntensity={0.95} roughness={0.3} metalness={0.12} />
          </mesh>
          <mesh position={[-0.12, 0.03, 0.04]} rotation={[0, 0.2, -0.3]}>
            <boxGeometry args={[0.12, 0.02, 0.16]} />
            <meshStandardMaterial color={ringColor} emissive={emissiveColor} emissiveIntensity={0.55} transparent opacity={0.8} />
          </mesh>
          <mesh position={[0.12, 0.03, -0.04]} rotation={[0, -0.2, 0.3]}>
            <boxGeometry args={[0.12, 0.02, 0.16]} />
            <meshStandardMaterial color={ringColor} emissive={emissiveColor} emissiveIntensity={0.55} transparent opacity={0.8} />
          </mesh>
          <mesh position={[0, -0.1, 0]}>
            <torusGeometry args={[0.13, 0.018, 8, 18]} />
            <meshStandardMaterial color={ringColor} emissive={emissiveColor} emissiveIntensity={0.35} transparent opacity={0.85} side={THREE.DoubleSide} />
          </mesh>
          <pointLight color={mainColor} intensity={0.85} distance={2} />
        </>
      ) : (
        <>
          <mesh castShadow>
            <icosahedronGeometry args={[0.12, 0]} />
            <meshStandardMaterial color={mainColor} emissive={emissiveColor} emissiveIntensity={0.9} roughness={0.35} metalness={0.2} />
          </mesh>
          <mesh position={[0, -0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[0.16, 0.26, 24]} />
            <meshStandardMaterial color={ringColor} emissive={emissiveColor} emissiveIntensity={0.25} transparent opacity={0.8} side={THREE.DoubleSide} />
          </mesh>
          <pointLight color={mainColor} intensity={0.7} distance={1.8} />
        </>
      )}
    </group>
  );
}

function RainOverlay({ totalRows, reducedMotion }: { totalRows: number; reducedMotion: boolean }) {
  const drops = useMemo(() => {
    const rng = (s: number) => { let v = s; return () => { v = (v * 9301 + 49297) % 233280; return v / 233280; }; };
    const rand = rng(44);
    return Array.from({ length: 28 }).map(() => ({
      x: (rand() - 0.5) * (W + 1.8),
      z: (rand() - 0.5) * (totalRows + 1.8),
      speed: 0.5 + rand() * 0.7,
      length: 0.12 + rand() * 0.2,
    }));
  }, [totalRows]);

  const groupRef = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    const t = clock.getElapsedTime();
    groupRef.current.children.forEach((child, i) => {
      const drop = drops[i];
      if (!drop) return;
      child.position.y = 2.8 - ((t * drop.speed) % 3.3);
    });
  });

  return (
    <group ref={groupRef} position={[0, 0, 0]}>
      {drops.map((drop, i) => (
        <mesh key={i} position={[drop.x, 2.8, drop.z]} rotation={[-0.3, 0, 0]}>
          <boxGeometry args={[0.01, drop.length, 0.01]} />
          <meshBasicMaterial color="#cbd5e1" transparent opacity={reducedMotion ? 0.08 : 0.18} />
        </mesh>
      ))}
    </group>
  );
}

/* ═══════════════ DEATH PARTICLES ═══════════════ */
function DeathParticles({ frogRef, isSplash, totalRows, reducedMotion }: { frogRef: React.MutableRefObject<FrogState>; isSplash: boolean; totalRows: number; reducedMotion: boolean }) {
  const particles = useMemo(() =>
    Array.from({ length: 16 }).map((_, i) => ({
      angle: (i / 16) * Math.PI * 2, speed: 0.015 + Math.random() * 0.01,
      ySpeed: 0.02 + Math.random() * 0.02, size: 0.03 + Math.random() * 0.03,
    })), []);
  const groupRef = useRef<THREE.Group>(null);
  const timeRef = useRef(0);
  useFrame((_, delta) => {
    if (!groupRef.current) return;
    const frog = frogRef.current;
    timeRef.current += delta;
    const t = reducedMotion ? 0 : timeRef.current;
    groupRef.current.position.set(
      toX(frog.pos.x + CS / 2),
      0.1,
      toZ(frog.pos.y + CS / 2, totalRows),
    );
    groupRef.current.children.forEach((child, i) => {
      const p = particles[i]; if (!p) return;
      child.position.x = Math.cos(p.angle) * p.speed * t * 40;
      child.position.z = Math.sin(p.angle) * p.speed * t * 40;
      child.position.y = p.ySpeed * t * 30 - 4 * t * t;
      const s = Math.max(0, 1 - t * 1.8); child.scale.set(s, s, s);
    });
  });
  return (
    <group ref={groupRef} position={[toX(frogRef.current.pos.x + CS / 2), 0.1, toZ(frogRef.current.pos.y + CS / 2, totalRows)]}>
      {particles.map((p, i) => (
        <mesh key={i}><sphereGeometry args={[p.size, 6, 6]} /><meshStandardMaterial
          color={isSplash ? '#64b5f6' : '#ff8a65'} emissive={isSplash ? '#2196f3' : '#ff5722'}
          emissiveIntensity={2} transparent opacity={0.85} /></mesh>
      ))}
    </group>
  );
}

/* ═══════════════ SCENE EXPORT ═══════════════ */
export function GameScene({ frogRef, gameState, laneItems, laneItemsRef, levelModifiers = [], bonusItems, shieldActive, slowTimeActive, currentAnchorActive, superHopActive, deathAnimation, showSplash, laneConfigs, totalRows, showCollisionBoxes = false, reducedMotion = false }: {
  frogRef: React.MutableRefObject<FrogState>;
  gameState: { goalsReached: boolean[] };
  laneItems: GameObject[][];
  laneItemsRef: React.MutableRefObject<GameObject[][]>;
  levelModifiers?: LevelModifier[];
  bonusItems: BonusItem[];
  shieldActive: boolean;
  slowTimeActive: boolean;
  currentAnchorActive: boolean;
  superHopActive: boolean;
  deathAnimation: boolean;
  showSplash: boolean;
  laneConfigs: LaneConfig[];
  totalRows: number;
  showCollisionBoxes?: boolean;
  reducedMotion?: boolean;
}) {
  const clipPlanes = useMemo(() => makeClipPlanes(totalRows), [totalRows]);
  const modifierSet = useMemo(() => new Set(levelModifiers), [levelModifiers]);
  const isNightTraffic = modifierSet.has('nightTraffic');
  const isRain = modifierSet.has('rain');
  const goalRow = useMemo(() => {
    const idx = laneConfigs.findIndex(l => l.type === 'goal');
    return idx >= 0 ? (totalRows - 1 - idx) * CS : -1;
  }, [laneConfigs, totalRows]);

  return (
    <ClipContext.Provider value={clipPlanes}>
      <CameraFollow frogRef={frogRef} totalRows={totalRows} />

      {/* Lighting */}
      <ambientLight intensity={isNightTraffic || isRain ? 0.25 : 0.4} />
      <directionalLight position={[8, 12, -6]} intensity={isNightTraffic ? 0.9 : 1.3} castShadow
        shadow-mapSize-width={2048} shadow-mapSize-height={2048}
        shadow-camera-left={-10} shadow-camera-right={10}
        shadow-camera-top={12} shadow-camera-bottom={-12}
        shadow-camera-near={0.5} shadow-camera-far={40} shadow-bias={-0.001} />
      <directionalLight position={[-5, 8, 8]} intensity={isNightTraffic ? 0.25 : 0.35} color="#bbdefb" />
      <hemisphereLight args={['#87CEEB', '#33691e', 0.3]} />

      {isRain && <RainOverlay totalRows={totalRows} reducedMotion={reducedMotion} />}

      <BackgroundFill />

      <mesh position={[0, BOARD_PLINTH_Y, 0]} receiveShadow>
        <boxGeometry args={[W + BOARD_PLINTH_MARGIN, BOARD_PLINTH_HEIGHT, totalRows + BOARD_PLINTH_MARGIN]} />
        <meshStandardMaterial color="#1a472a" roughness={0.9} />
      </mesh>

      <WaterPlane lanes={laneConfigs} totalRows={totalRows} reducedMotion={reducedMotion} />
      <LaneTiles lanes={laneConfigs} totalRows={totalRows} />

      {/* Lily pads */}
      {goalRow >= 0 && LILY_PAD_POSITIONS.map((col, i) => (
        <LilyPad3D key={i} col={col} gy={goalRow} reached={gameState.goalsReached[i]} totalRows={totalRows} showCollisionBoxes={showCollisionBoxes} reducedMotion={reducedMotion} />
      ))}

      {/* Lane items */}
      {laneConfigs.map((lane, idx) => {
        const items = laneItems[idx] || [];
        const gy = (totalRows - 1 - idx) * CS;
        return items.map((item, j) => {
          if (lane.type === 'road')
            return <Vehicle3D key={`v${idx}-${j}`} item={item} itemIndex={j} rowIndex={idx} variant={item.variant} laneGy={gy} goingRight={lane.speed > 0} totalRows={totalRows} laneItemsRef={laneItemsRef} showCollisionBoxes={showCollisionBoxes} />;
          if (lane.type === 'river')
            return <Log3D key={`l${idx}-${j}`} item={item} itemIndex={j} rowIndex={idx} variant={item.variant} laneGy={gy} totalRows={totalRows} laneItemsRef={laneItemsRef} showCollisionBoxes={showCollisionBoxes} />;
          return null;
        });
      })}

      {/* Bonus pickups */}
      {bonusItems.map((item, i) => (
        !item.collected && <BonusPickup3D key={`b${i}`} item={item} totalRows={totalRows} reducedMotion={reducedMotion} />
      ))}

      {/* Frog */}
      <Frog3D frogRef={frogRef} laneConfigs={laneConfigs} totalRows={totalRows} showCollisionBoxes={showCollisionBoxes} reducedMotion={reducedMotion} shieldActive={shieldActive} slowTimeActive={slowTimeActive} currentAnchorActive={currentAnchorActive} superHopActive={superHopActive} />

      {/* Death particles */}
      {deathAnimation && !frogRef.current.alive && (
        <DeathParticles frogRef={frogRef} isSplash={showSplash} totalRows={totalRows} reducedMotion={reducedMotion} />
      )}
    </ClipContext.Provider>
  );
}
