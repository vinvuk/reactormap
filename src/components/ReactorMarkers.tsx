"use client";

import { useRef, useMemo } from "react";
import { useFrame, useThree, ThreeEvent } from "@react-three/fiber";
import * as THREE from "three";
import { Reactor, STATUS_CONFIG } from "@/lib/types";

/**
 * Visualization style options for reactor markers
 */
export type VisualizationStyle = "default" | "pins" | "plumes" | "dots" | "clean";

/**
 * Earth radius - must match Earth.tsx
 */
const EARTH_RADIUS = 2;

/**
 * Earth rotation offset to align with texture
 */
const EARTH_ROTATION_OFFSET = -Math.PI / 2;

/**
 * Offset above surface to prevent clipping
 */
const SURFACE_OFFSET = 0.025;

/**
 * Calculate size multiplier based on reactor capacity (MW)
 * Uses logarithmic scaling to prevent huge reactors from dominating
 * @param capacity - Reactor capacity in MW (null defaults to 500)
 * @returns Size multiplier between 0.6 and 1.6
 */
function getCapacityMultiplier(capacity: number | null): number {
  // Default to 500 MW if unknown
  const mw = capacity || 500;
  // Typical range: ~50 MW (small) to ~1700 MW (large)
  // Use log scale: min 0.6x at 50 MW, max 1.6x at 1700+ MW
  const minCapacity = 50;
  const maxCapacity = 1700;
  const minMultiplier = 0.6;
  const maxMultiplier = 1.6;

  // Clamp and normalize
  const clamped = Math.max(minCapacity, Math.min(maxCapacity, mw));
  const normalized = (Math.log(clamped) - Math.log(minCapacity)) /
                     (Math.log(maxCapacity) - Math.log(minCapacity));

  return minMultiplier + normalized * (maxMultiplier - minMultiplier);
}

/**
 * Convert latitude/longitude to 3D position on sphere
 * @param lat - Latitude in degrees
 * @param lon - Longitude in degrees
 * @param radius - Sphere radius
 * @returns THREE.Vector3 position
 */
function latLonToVector3(lat: number, lon: number, radius: number): THREE.Vector3 {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180) + EARTH_ROTATION_OFFSET;

  const x = -radius * Math.sin(phi) * Math.cos(theta);
  const y = radius * Math.cos(phi);
  const z = radius * Math.sin(phi) * Math.sin(theta);

  return new THREE.Vector3(x, y, z);
}

// ============================================================================
// SHARED TEXTURES
// ============================================================================

let glowTexture: THREE.Texture | null = null;
let ringTexture: THREE.Texture | null = null;
let smokeTexture: THREE.Texture | null = null;
let dotTexture: THREE.Texture | null = null;

function createGlowTexture(): THREE.Texture {
  const size = 64;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;

  const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  gradient.addColorStop(0, "rgba(255, 255, 255, 1)");
  gradient.addColorStop(0.3, "rgba(255, 255, 255, 0.8)");
  gradient.addColorStop(0.6, "rgba(255, 255, 255, 0.3)");
  gradient.addColorStop(1, "rgba(255, 255, 255, 0)");

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

function createRingTexture(): THREE.Texture {
  const size = 64;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;

  const centerX = size / 2;
  const centerY = size / 2;
  const outerRadius = size / 2 - 2;
  const innerRadius = size / 2 - 8;

  ctx.beginPath();
  ctx.arc(centerX, centerY, outerRadius, 0, Math.PI * 2);
  ctx.arc(centerX, centerY, innerRadius, 0, Math.PI * 2, true);
  ctx.fillStyle = "white";
  ctx.fill();

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

/**
 * Create a soft glow texture for reactor effect
 */
function createSmokeTexture(): THREE.Texture {
  const size = 128;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;

  const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  gradient.addColorStop(0, "rgba(255, 255, 255, 0.9)");
  gradient.addColorStop(0.2, "rgba(255, 255, 255, 0.6)");
  gradient.addColorStop(0.5, "rgba(255, 255, 255, 0.2)");
  gradient.addColorStop(1, "rgba(255, 255, 255, 0)");

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

/**
 * Create a clean flat dot texture with crisp edges
 */
function createDotTexture(): THREE.Texture {
  const size = 64;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;

  ctx.beginPath();
  ctx.arc(size / 2, size / 2, size / 2 - 4, 0, Math.PI * 2);
  ctx.fillStyle = "white";
  ctx.fill();

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

function getGlowTexture(): THREE.Texture {
  if (!glowTexture) glowTexture = createGlowTexture();
  return glowTexture;
}

function getRingTexture(): THREE.Texture {
  if (!ringTexture) ringTexture = createRingTexture();
  return ringTexture;
}

function getSmokeTexture(): THREE.Texture {
  if (!smokeTexture) smokeTexture = createSmokeTexture();
  return smokeTexture;
}

function getDotTexture(): THREE.Texture {
  if (!dotTexture) dotTexture = createDotTexture();
  return dotTexture;
}

// ============================================================================
// UI1: GEOMETRIC PINS - 3D cone pins pointing outward
// ============================================================================

interface PinMarkerProps {
  reactor: Reactor;
  isSelected: boolean;
  onClick: () => void;
  onHover: (hovering: boolean, screenPos?: { x: number; y: number }) => void;
  clusterCount?: number;
}

/**
 * UI1: Geometric 3D pin marker - physical map pin style
 */
function PinMarker({ reactor, isSelected, onClick, onHover }: PinMarkerProps) {
  const groupRef = useRef<THREE.Group>(null);
  const pinRef = useRef<THREE.Mesh>(null);
  const headRef = useRef<THREE.Mesh>(null);
  const { camera, gl } = useThree();

  const position = useMemo(() => {
    const surfacePos = latLonToVector3(reactor.latitude, reactor.longitude, EARTH_RADIUS);
    const normal = surfacePos.clone().normalize();
    return surfacePos.add(normal.multiplyScalar(SURFACE_OFFSET));
  }, [reactor.latitude, reactor.longitude]);

  const surfaceNormal = useMemo(() => position.clone().normalize(), [position]);

  const statusConfig = STATUS_CONFIG[reactor.status];
  const color = useMemo(() => new THREE.Color(statusConfig.color), [statusConfig.color]);

  const isOperational = reactor.status === "operational";
  const isUnderConstruction = reactor.status === "under_construction";
  const isActive = isOperational || isUnderConstruction;

  // Capacity-based size multiplier
  const capacityMult = getCapacityMultiplier(reactor.capacity);

  // Pin dimensions based on status and capacity
  const basePinHeight = isOperational ? 0.08 : isUnderConstruction ? 0.06 : isSelected ? 0.05 : 0.035;
  const baseHeadRadius = isOperational ? 0.018 : isUnderConstruction ? 0.014 : isSelected ? 0.012 : 0.008;
  const pinHeight = basePinHeight * capacityMult;
  const headRadius = baseHeadRadius * capacityMult;

  useFrame((state) => {
    if (!groupRef.current) return;

    const time = state.clock.elapsedTime;
    const cameraDir = camera.position.clone().normalize();
    const dotProduct = surfaceNormal.dot(cameraDir);
    const isVisible = dotProduct > -0.1;
    groupRef.current.visible = isVisible;

    if (!isVisible) return;

    // Orient pin to point outward from Earth surface
    groupRef.current.lookAt(position.clone().multiplyScalar(2));

    // Bounce animation for active reactors
    if (pinRef.current && headRef.current) {
      const bounce = isOperational
        ? Math.sin(time * 6) * 0.01
        : isUnderConstruction
        ? Math.sin(time * 4) * 0.005
        : 0;

      pinRef.current.position.z = bounce;
      headRef.current.position.z = pinHeight + bounce;

      // Pulse the head size
      const pulse = isOperational
        ? 1 + Math.sin(time * 5) * 0.2
        : isUnderConstruction
        ? 1 + Math.sin(time * 3) * 0.1
        : isSelected
        ? 1 + Math.sin(time * 2) * 0.08
        : 1;

      headRef.current.scale.setScalar(pulse);
    }
  });

  const handlePointerOver = (event: ThreeEvent<PointerEvent>) => {
    event.stopPropagation();
    document.body.style.cursor = "pointer";
    const vector = position.clone();
    vector.project(camera);
    const x = (vector.x * 0.5 + 0.5) * gl.domElement.clientWidth;
    const y = (-vector.y * 0.5 + 0.5) * gl.domElement.clientHeight;
    onHover(true, { x, y });
  };

  const handlePointerOut = () => {
    document.body.style.cursor = "auto";
    onHover(false);
  };

  const handleClick = (event: ThreeEvent<MouseEvent>) => {
    event.stopPropagation();
    onClick();
  };

  return (
    <group ref={groupRef} position={position}>
      {/* Click target */}
      <mesh onClick={handleClick} onPointerOver={handlePointerOver} onPointerOut={handlePointerOut}>
        <sphereGeometry args={[0.04, 8, 8]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>

      {/* Pin stem - thin cylinder */}
      <mesh ref={pinRef} position={[0, 0, pinHeight / 2]}>
        <cylinderGeometry args={[0.003, 0.003, pinHeight, 8]} />
        <meshBasicMaterial color={color} transparent opacity={0.8} />
      </mesh>

      {/* Pin head - sphere */}
      <mesh ref={headRef} position={[0, 0, pinHeight]}>
        <sphereGeometry args={[headRadius, 16, 16]} />
        <meshBasicMaterial color={color} />
      </mesh>

      {/* Glow around head for active reactors */}
      {isActive && (
        <sprite position={[0, 0, pinHeight]} scale={[headRadius * 6, headRadius * 6, 1]}>
          <spriteMaterial
            map={getGlowTexture()}
            color={color}
            transparent
            opacity={0.6}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </sprite>
      )}

      {/* Selection ring */}
      {isSelected && (
        <mesh position={[0, 0, 0.001]} rotation={[Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.025, 0.03, 32]} />
          <meshBasicMaterial color={color} transparent opacity={0.6} side={THREE.DoubleSide} />
        </mesh>
      )}
    </group>
  );
}

// ============================================================================
// UI2: ENERGY PLUMES - Animated glow rising effect
// ============================================================================

interface PlumeMarkerProps {
  reactor: Reactor;
  isSelected: boolean;
  onClick: () => void;
  onHover: (hovering: boolean, screenPos?: { x: number; y: number }) => void;
  clusterCount?: number;
}

/**
 * UI2: Energy plume marker - animated glow rising effect
 */
function PlumeMarker({ reactor, isSelected, onClick, onHover }: PlumeMarkerProps) {
  const groupRef = useRef<THREE.Group>(null);
  const plume1Ref = useRef<THREE.Sprite>(null);
  const plume2Ref = useRef<THREE.Sprite>(null);
  const plume3Ref = useRef<THREE.Sprite>(null);
  const baseRef = useRef<THREE.Sprite>(null);
  const { camera, gl } = useThree();

  const position = useMemo(() => {
    const surfacePos = latLonToVector3(reactor.latitude, reactor.longitude, EARTH_RADIUS);
    const normal = surfacePos.clone().normalize();
    return surfacePos.add(normal.multiplyScalar(SURFACE_OFFSET));
  }, [reactor.latitude, reactor.longitude]);

  const surfaceNormal = useMemo(() => position.clone().normalize(), [position]);

  const statusConfig = STATUS_CONFIG[reactor.status];
  const color = useMemo(() => new THREE.Color(statusConfig.color), [statusConfig.color]);

  const isOperational = reactor.status === "operational";
  const isUnderConstruction = reactor.status === "under_construction";
  const isActive = isOperational || isUnderConstruction;

  // Capacity-based size multiplier
  const capacityMult = getCapacityMultiplier(reactor.capacity);

  // Base size varies by status and capacity
  const statusSize = isOperational ? 0.04 : isUnderConstruction ? 0.032 : isSelected ? 0.026 : 0.02;
  const baseSize = statusSize * capacityMult;

  useFrame((state) => {
    if (!groupRef.current) return;

    const time = state.clock.elapsedTime;
    const cameraDir = camera.position.clone().normalize();
    const dotProduct = surfaceNormal.dot(cameraDir);
    const isVisible = dotProduct > -0.1;
    groupRef.current.visible = isVisible;

    if (!isVisible) return;

    const edgeFade = Math.min(1, (dotProduct + 0.1) * 2);

    // Animate base glow
    if (baseRef.current) {
      const pulse = isActive ? 1 + Math.sin(time * 3) * 0.15 : 1;
      baseRef.current.scale.set(baseSize * pulse, baseSize * pulse, 1);
      (baseRef.current.material as THREE.SpriteMaterial).opacity = 0.9 * edgeFade;
    }

    // Animate rising plumes (only for active reactors)
    if (isActive) {
      const animatePlume = (
        ref: React.RefObject<THREE.Sprite | null>,
        offset: number,
        speed: number,
        maxHeight: number
      ) => {
        if (!ref.current) return;

        const phase = ((time * speed + offset) % 1);
        const height = phase * maxHeight * capacityMult;
        const scale = baseSize * (0.8 + phase * 1.5);
        const opacity = (1 - phase) * 0.5 * edgeFade;

        // Position plume above base, rising outward
        const normal = surfaceNormal.clone().multiplyScalar(height);
        ref.current.position.copy(normal);
        ref.current.scale.set(scale, scale, 1);
        (ref.current.material as THREE.SpriteMaterial).opacity = opacity;
      };

      const plumeSpeed = isOperational ? 0.8 : 0.5;
      const plumeHeight = isOperational ? 0.12 : 0.08;

      animatePlume(plume1Ref, 0, plumeSpeed, plumeHeight);
      animatePlume(plume2Ref, 0.33, plumeSpeed, plumeHeight);
      animatePlume(plume3Ref, 0.66, plumeSpeed, plumeHeight);
    }
  });

  const handlePointerOver = (event: ThreeEvent<PointerEvent>) => {
    event.stopPropagation();
    document.body.style.cursor = "pointer";
    const vector = position.clone();
    vector.project(camera);
    const x = (vector.x * 0.5 + 0.5) * gl.domElement.clientWidth;
    const y = (-vector.y * 0.5 + 0.5) * gl.domElement.clientHeight;
    onHover(true, { x, y });
  };

  const handlePointerOut = () => {
    document.body.style.cursor = "auto";
    onHover(false);
  };

  const handleClick = (event: ThreeEvent<MouseEvent>) => {
    event.stopPropagation();
    onClick();
  };

  return (
    <group ref={groupRef} position={position}>
      {/* Click target */}
      <mesh onClick={handleClick} onPointerOver={handlePointerOver} onPointerOut={handlePointerOut}>
        <sphereGeometry args={[0.04, 8, 8]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>

      {/* Base hot spot */}
      <sprite ref={baseRef} scale={[baseSize, baseSize, 1]}>
        <spriteMaterial
          map={getGlowTexture()}
          color={color}
          transparent
          opacity={0.9}
          depthWrite={false}
        />
      </sprite>

      {/* Rising energy plumes - only for active */}
      {isActive && (
        <>
          <sprite ref={plume1Ref}>
            <spriteMaterial
              map={getSmokeTexture()}
              color={color}
              transparent
              opacity={0.4}
              blending={THREE.AdditiveBlending}
              depthWrite={false}
            />
          </sprite>
          <sprite ref={plume2Ref}>
            <spriteMaterial
              map={getSmokeTexture()}
              color={color}
              transparent
              opacity={0.4}
              blending={THREE.AdditiveBlending}
              depthWrite={false}
            />
          </sprite>
          <sprite ref={plume3Ref}>
            <spriteMaterial
              map={getSmokeTexture()}
              color={color}
              transparent
              opacity={0.4}
              blending={THREE.AdditiveBlending}
              depthWrite={false}
            />
          </sprite>
        </>
      )}

      {/* Selection indicator */}
      {isSelected && (
        <sprite scale={[baseSize * 2.5, baseSize * 2.5, 1]}>
          <spriteMaterial
            map={getRingTexture()}
            color={color}
            transparent
            opacity={0.7}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </sprite>
      )}
    </group>
  );
}

// ============================================================================
// UI3: MINIMAL DOTS - Clean flat circles, modern data viz style
// ============================================================================

interface DotMarkerProps {
  reactor: Reactor;
  isSelected: boolean;
  onClick: () => void;
  onHover: (hovering: boolean, screenPos?: { x: number; y: number }) => void;
  clusterCount?: number;
}

/**
 * UI3: Minimal dot marker - clean, flat, modern data visualization
 * Uses minimal surface offset to appear grounded on Earth
 */
function DotMarker({ reactor, isSelected, onClick, onHover }: DotMarkerProps) {
  const groupRef = useRef<THREE.Group>(null);
  const dotRef = useRef<THREE.Sprite>(null);
  const glowRef = useRef<THREE.Sprite>(null);
  const shadowRef = useRef<THREE.Sprite>(null);
  const { camera, gl } = useThree();

  // Minimal offset - just enough to prevent z-fighting, dots sit on surface
  const DOT_SURFACE_OFFSET = 0.008;

  const position = useMemo(() => {
    const surfacePos = latLonToVector3(reactor.latitude, reactor.longitude, EARTH_RADIUS);
    const normal = surfacePos.clone().normalize();
    return surfacePos.add(normal.multiplyScalar(DOT_SURFACE_OFFSET));
  }, [reactor.latitude, reactor.longitude]);

  const surfaceNormal = useMemo(() => position.clone().normalize(), [position]);

  const statusConfig = STATUS_CONFIG[reactor.status];
  const color = useMemo(() => new THREE.Color(statusConfig.color), [statusConfig.color]);

  const isOperational = reactor.status === "operational";
  const isUnderConstruction = reactor.status === "under_construction";

  // Capacity-based size multiplier
  const capacityMult = getCapacityMultiplier(reactor.capacity);

  // Size based on status and capacity
  const baseDotSize = isSelected ? 0.022 : 0.016;
  const dotSize = baseDotSize * capacityMult;

  useFrame((state) => {
    if (!groupRef.current) return;

    const time = state.clock.elapsedTime;
    const cameraDir = camera.position.clone().normalize();
    const dotProduct = surfaceNormal.dot(cameraDir);
    const isVisible = dotProduct > -0.1;
    groupRef.current.visible = isVisible;

    if (!isVisible) return;

    const edgeFade = Math.min(1, (dotProduct + 0.1) * 2);

    // Minimal, subtle animation - dots stay crisp
    if (dotRef.current) {
      (dotRef.current.material as THREE.SpriteMaterial).opacity = edgeFade;
    }

    // Subtle breathing glow for active
    if (glowRef.current) {
      const breathe = isOperational
        ? 1.5 + Math.sin(time * 2) * 0.3
        : isUnderConstruction
        ? 1.3 + Math.sin(time * 1.5) * 0.2
        : 1.2;

      glowRef.current.scale.set(dotSize * breathe, dotSize * breathe, 1);

      const glowOpacity = isOperational ? 0.5 : isUnderConstruction ? 0.4 : isSelected ? 0.3 : 0.2;
      (glowRef.current.material as THREE.SpriteMaterial).opacity = glowOpacity * edgeFade;
    }

    // Shadow stays constant, just fades at edges
    if (shadowRef.current) {
      (shadowRef.current.material as THREE.SpriteMaterial).opacity = 0.25 * edgeFade;
    }
  });

  const handlePointerOver = (event: ThreeEvent<PointerEvent>) => {
    event.stopPropagation();
    document.body.style.cursor = "pointer";
    const vector = position.clone();
    vector.project(camera);
    const x = (vector.x * 0.5 + 0.5) * gl.domElement.clientWidth;
    const y = (-vector.y * 0.5 + 0.5) * gl.domElement.clientHeight;
    onHover(true, { x, y });
  };

  const handlePointerOut = () => {
    document.body.style.cursor = "auto";
    onHover(false);
  };

  const handleClick = (event: ThreeEvent<MouseEvent>) => {
    event.stopPropagation();
    onClick();
  };

  return (
    <group ref={groupRef} position={position}>
      {/* Click target */}
      <mesh onClick={handleClick} onPointerOver={handlePointerOver} onPointerOut={handlePointerOut}>
        <sphereGeometry args={[0.03, 8, 8]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>

      {/* Shadow underneath - grounds the dot visually */}
      <sprite ref={shadowRef} scale={[dotSize * 1.8, dotSize * 1.8, 1]}>
        <spriteMaterial
          map={getGlowTexture()}
          color="#000000"
          transparent
          opacity={0.25}
          depthWrite={false}
        />
      </sprite>

      {/* Subtle outer glow */}
      <sprite ref={glowRef} scale={[dotSize * 1.5, dotSize * 1.5, 1]}>
        <spriteMaterial
          map={getGlowTexture()}
          color={color}
          transparent
          opacity={0.3}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </sprite>

      {/* Clean flat dot */}
      <sprite ref={dotRef} scale={[dotSize, dotSize, 1]}>
        <spriteMaterial
          map={getDotTexture()}
          color={color}
          transparent
          opacity={1}
          depthWrite={false}
        />
      </sprite>

      {/* Selection: thin ring outline matching status color */}
      {isSelected && (
        <sprite scale={[dotSize * 2.2, dotSize * 2.2, 1]}>
          <spriteMaterial
            map={getRingTexture()}
            color={color}
            transparent
            opacity={0.9}
            depthWrite={false}
          />
        </sprite>
      )}
    </group>
  );
}

// ============================================================================
// UI4: CLEAN CLUSTERED - Uniform size, no animation, with clustering
// ============================================================================

interface CleanMarkerProps {
  reactor: Reactor;
  isSelected: boolean;
  onClick: () => void;
  onHover: (hovering: boolean, screenPos?: { x: number; y: number }) => void;
  clusterCount?: number;
}

/**
 * UI4: Clean static marker - uniform size, no animation, color-only differentiation
 */
function CleanMarker({ reactor, isSelected, onClick, onHover, clusterCount = 1 }: CleanMarkerProps) {
  const groupRef = useRef<THREE.Group>(null);
  const dotRef = useRef<THREE.Sprite>(null);
  const glowRef = useRef<THREE.Sprite>(null);
  const { camera, gl } = useThree();

  const DOT_SURFACE_OFFSET = 0.01;

  const position = useMemo(() => {
    const surfacePos = latLonToVector3(reactor.latitude, reactor.longitude, EARTH_RADIUS);
    const normal = surfacePos.clone().normalize();
    return surfacePos.add(normal.multiplyScalar(DOT_SURFACE_OFFSET));
  }, [reactor.latitude, reactor.longitude]);

  const surfaceNormal = useMemo(() => position.clone().normalize(), [position]);

  const statusConfig = STATUS_CONFIG[reactor.status];
  const color = useMemo(() => new THREE.Color(statusConfig.color), [statusConfig.color]);

  // Uniform base size - only selected state changes size
  // Cluster size scales with sqrt of count for visual balance
  const baseSize = 0.012;
  const clusterScale = clusterCount > 1 ? Math.sqrt(clusterCount) * 0.7 : 1;
  const dotSize = isSelected ? baseSize * 1.5 * clusterScale : baseSize * clusterScale;

  useFrame(() => {
    if (!groupRef.current) return;

    const cameraDir = camera.position.clone().normalize();
    const dotProduct = surfaceNormal.dot(cameraDir);
    const isVisible = dotProduct > -0.1;
    groupRef.current.visible = isVisible;

    if (!isVisible) return;

    // Edge fade only - no animation
    const edgeFade = Math.min(1, (dotProduct + 0.1) * 2);

    if (dotRef.current) {
      (dotRef.current.material as THREE.SpriteMaterial).opacity = edgeFade;
    }

    if (glowRef.current) {
      (glowRef.current.material as THREE.SpriteMaterial).opacity = 0.4 * edgeFade;
    }
  });

  const handlePointerOver = (event: ThreeEvent<PointerEvent>) => {
    event.stopPropagation();
    document.body.style.cursor = "pointer";
    const vector = position.clone();
    vector.project(camera);
    const x = (vector.x * 0.5 + 0.5) * gl.domElement.clientWidth;
    const y = (-vector.y * 0.5 + 0.5) * gl.domElement.clientHeight;
    onHover(true, { x, y });
  };

  const handlePointerOut = () => {
    document.body.style.cursor = "auto";
    onHover(false);
  };

  const handleClick = (event: ThreeEvent<MouseEvent>) => {
    event.stopPropagation();
    onClick();
  };

  return (
    <group ref={groupRef} position={position}>
      {/* Click target - larger for clusters */}
      <mesh onClick={handleClick} onPointerOver={handlePointerOver} onPointerOut={handlePointerOut}>
        <sphereGeometry args={[0.025 * clusterScale, 8, 8]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>

      {/* Subtle glow - slightly larger for clusters */}
      <sprite ref={glowRef} scale={[dotSize * 2, dotSize * 2, 1]}>
        <spriteMaterial
          map={getGlowTexture()}
          color={color}
          transparent
          opacity={0.4}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </sprite>

      {/* Clean flat dot - uniform size */}
      <sprite ref={dotRef} scale={[dotSize, dotSize, 1]}>
        <spriteMaterial
          map={getDotTexture()}
          color={color}
          transparent
          opacity={1}
          depthWrite={false}
        />
      </sprite>

      {/* Selection ring */}
      {isSelected && (
        <sprite scale={[dotSize * 2.5, dotSize * 2.5, 1]}>
          <spriteMaterial
            map={getRingTexture()}
            color={color}
            transparent
            opacity={0.8}
            depthWrite={false}
          />
        </sprite>
      )}
    </group>
  );
}

// ============================================================================
// DEFAULT STYLE (Original implementation)
// ============================================================================

interface DefaultMarkerProps {
  reactor: Reactor;
  isSelected: boolean;
  onClick: () => void;
  onHover: (hovering: boolean, screenPos?: { x: number; y: number }) => void;
  clusterCount?: number;
}

/**
 * Default reactor marker (original implementation)
 */
function DefaultMarker({ reactor, isSelected, onClick, onHover }: DefaultMarkerProps) {
  const groupRef = useRef<THREE.Group>(null);
  const spriteRef = useRef<THREE.Sprite>(null);
  const glowRef = useRef<THREE.Sprite>(null);
  const pulseRef = useRef<THREE.Sprite>(null);
  const { camera, gl } = useThree();

  const position = useMemo(() => {
    const surfacePos = latLonToVector3(reactor.latitude, reactor.longitude, EARTH_RADIUS);
    const normal = surfacePos.clone().normalize();
    return surfacePos.add(normal.multiplyScalar(SURFACE_OFFSET));
  }, [reactor.latitude, reactor.longitude]);

  const surfaceNormal = useMemo(() => position.clone().normalize(), [position]);

  const statusConfig = STATUS_CONFIG[reactor.status];
  const color = useMemo(() => new THREE.Color(statusConfig.color), [statusConfig.color]);

  const isOperational = reactor.status === "operational";
  const isUnderConstruction = reactor.status === "under_construction";
  const isActive = isOperational || isUnderConstruction;

  // Capacity-based size multiplier
  const capacityMult = getCapacityMultiplier(reactor.capacity);

  // Size based on status and capacity
  const statusSize = isOperational ? 0.035 : isUnderConstruction ? 0.028 : isSelected ? 0.024 : 0.018;
  const baseSize = statusSize * capacityMult;

  useFrame((state) => {
    if (!groupRef.current) return;

    const time = state.clock.elapsedTime;
    const cameraDir = camera.position.clone().normalize();
    const dotProduct = surfaceNormal.dot(cameraDir);
    const isVisible = dotProduct > -0.1;
    groupRef.current.visible = isVisible;

    if (!isVisible) return;

    const edgeFade = Math.min(1, (dotProduct + 0.1) * 2);

    if (spriteRef.current) {
      const pulse = isOperational
        ? 1 + Math.sin(time * 4) * 0.2
        : isUnderConstruction
        ? 1 + Math.sin(time * 2) * 0.1
        : isSelected
        ? 1 + Math.sin(time * 2) * 0.08
        : 1;

      const size = baseSize * pulse;
      spriteRef.current.scale.set(size, size, 1);
      (spriteRef.current.material as THREE.SpriteMaterial).opacity = 0.95 * edgeFade;
    }

    if (glowRef.current) {
      const glowPulse = isOperational
        ? 2.0 + Math.sin(time * 3) * 0.4
        : isActive
        ? 1.8 + Math.sin(time * 2) * 0.3
        : 1.6;

      const glowSize = baseSize * glowPulse;
      glowRef.current.scale.set(glowSize, glowSize, 1);

      const glowOpacity = isOperational ? 0.7 + Math.sin(time * 5) * 0.2 : isActive ? 0.5 : 0.4;
      (glowRef.current.material as THREE.SpriteMaterial).opacity = glowOpacity * edgeFade;
    }

    if (pulseRef.current && isActive) {
      const phase = (time * (isOperational ? 1.0 : 0.5)) % 1;
      const ringSize = baseSize * (1.2 + phase * 2);
      const opacity = (1 - phase) * 0.5 * edgeFade;

      pulseRef.current.scale.set(ringSize, ringSize, 1);
      (pulseRef.current.material as THREE.SpriteMaterial).opacity = opacity;
    }
  });

  const handlePointerOver = (event: ThreeEvent<PointerEvent>) => {
    event.stopPropagation();
    document.body.style.cursor = "pointer";
    const vector = position.clone();
    vector.project(camera);
    const x = (vector.x * 0.5 + 0.5) * gl.domElement.clientWidth;
    const y = (-vector.y * 0.5 + 0.5) * gl.domElement.clientHeight;
    onHover(true, { x, y });
  };

  const handlePointerOut = () => {
    document.body.style.cursor = "auto";
    onHover(false);
  };

  const handleClick = (event: ThreeEvent<MouseEvent>) => {
    event.stopPropagation();
    onClick();
  };

  return (
    <group ref={groupRef} position={position}>
      <mesh onClick={handleClick} onPointerOver={handlePointerOver} onPointerOut={handlePointerOut}>
        <sphereGeometry args={[0.03, 8, 8]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>

      <sprite ref={glowRef} scale={[baseSize * 2, baseSize * 2, 1]}>
        <spriteMaterial
          map={getGlowTexture()}
          color={color}
          transparent
          opacity={0.5}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </sprite>

      <sprite ref={spriteRef} scale={[baseSize, baseSize, 1]}>
        <spriteMaterial map={getGlowTexture()} color={color} transparent opacity={0.95} depthWrite={false} />
      </sprite>

      {isActive && (
        <sprite ref={pulseRef} scale={[baseSize * 1.5, baseSize * 1.5, 1]}>
          <spriteMaterial
            map={getRingTexture()}
            color={color}
            transparent
            opacity={0.5}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </sprite>
      )}

      {isSelected && (
        <sprite scale={[baseSize * 1.8, baseSize * 1.8, 1]}>
          <spriteMaterial
            map={getRingTexture()}
            color={color}
            transparent
            opacity={0.7}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </sprite>
      )}
    </group>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

interface ReactorMarkersProps {
  reactors: Reactor[];
  selectedReactor: Reactor | null;
  onSelectReactor: (reactor: Reactor | null) => void;
  visibleStatuses: Set<string>;
  onHoverReactor?: (
    reactor: { name: string; status: string } | null,
    screenPos: { x: number; y: number } | null
  ) => void;
  visualStyle?: VisualizationStyle;
}

/**
 * Status priority for determining "best" reactor at a location
 * Higher number = higher priority (shown on hover/click)
 */
const STATUS_PRIORITY: Record<string, number> = {
  operational: 6,
  under_construction: 5,
  planned: 4,
  suspended: 3,
  shutdown: 2,
  cancelled: 1,
};

/**
 * Container component for all reactor markers with style variants
 * @param visualStyle - "default" | "pins" | "plumes" | "dots"
 */
export function ReactorMarkers({
  reactors,
  selectedReactor,
  onSelectReactor,
  visibleStatuses,
  onHoverReactor,
  visualStyle = "default",
}: ReactorMarkersProps) {
  const filteredReactors = useMemo(
    () => reactors.filter((r) => visibleStatuses.has(r.status)),
    [reactors, visibleStatuses]
  );

  /**
   * Build a map of location key -> all reactors at that location
   */
  const locationClusters = useMemo(() => {
    const clusters = new Map<string, Reactor[]>();
    for (const reactor of filteredReactors) {
      // Round to 3 decimal places for clustering (~100m precision)
      const key = `${reactor.latitude.toFixed(3)},${reactor.longitude.toFixed(3)}`;
      const existing = clusters.get(key) || [];
      existing.push(reactor);
      clusters.set(key, existing);
    }
    return clusters;
  }, [filteredReactors]);

  /**
   * Get the best (highest priority) reactor at a given location
   */
  const getBestReactorAtLocation = useMemo(() => {
    return (reactor: Reactor): Reactor => {
      const key = `${reactor.latitude.toFixed(3)},${reactor.longitude.toFixed(3)}`;
      const cluster = locationClusters.get(key) || [reactor];

      // Sort by status priority (highest first), then by capacity (highest first)
      const sorted = [...cluster].sort((a, b) => {
        const priorityDiff = (STATUS_PRIORITY[b.status] || 0) - (STATUS_PRIORITY[a.status] || 0);
        if (priorityDiff !== 0) return priorityDiff;
        return (b.capacity || 0) - (a.capacity || 0);
      });

      return sorted[0];
    };
  }, [locationClusters]);

  /**
   * Get cluster info for hover display
   */
  const getClusterHoverInfo = useMemo(() => {
    return (reactor: Reactor): { name: string; status: string; count: number } => {
      const key = `${reactor.latitude.toFixed(3)},${reactor.longitude.toFixed(3)}`;
      const cluster = locationClusters.get(key) || [reactor];
      const bestReactor = getBestReactorAtLocation(reactor);

      // Use plant name (without unit number) if multiple reactors
      let displayName = bestReactor.name;
      if (cluster.length > 1) {
        // Extract base name (remove unit numbers like -1, Unit 1, etc.)
        displayName = bestReactor.name.replace(/[-\s]*(Unit\s*)?\d+$/i, '').trim();
        if (!displayName) displayName = bestReactor.name;
      }

      return {
        name: cluster.length > 1 ? `${displayName} (${cluster.length} units)` : bestReactor.name,
        status: bestReactor.status,
        count: cluster.length,
      };
    };
  }, [locationClusters, getBestReactorAtLocation]);

  const MarkerComponent = useMemo(() => {
    switch (visualStyle) {
      case "pins":
        return PinMarker;
      case "plumes":
        return PlumeMarker;
      case "dots":
        return DotMarker;
      case "clean":
        return CleanMarker;
      default:
        return DefaultMarker;
    }
  }, [visualStyle]);

  /**
   * For clean style, render one marker per cluster location
   * For other styles, render individual markers
   */
  const clusteredData = useMemo(() => {
    if (visualStyle !== "clean") {
      // Non-clustered: one marker per reactor
      return filteredReactors.map((reactor) => ({
        reactor,
        clusterCount: 1,
        isCluster: false,
      }));
    }

    // Clustered: one marker per location
    const result: { reactor: Reactor; clusterCount: number; isCluster: boolean }[] = [];
    const processedLocations = new Set<string>();

    for (const reactor of filteredReactors) {
      const key = `${reactor.latitude.toFixed(3)},${reactor.longitude.toFixed(3)}`;
      if (processedLocations.has(key)) continue;

      processedLocations.add(key);
      const cluster = locationClusters.get(key) || [reactor];
      const bestReactor = getBestReactorAtLocation(reactor);

      result.push({
        reactor: bestReactor,
        clusterCount: cluster.length,
        isCluster: cluster.length > 1,
      });
    }

    return result;
  }, [filteredReactors, visualStyle, locationClusters, getBestReactorAtLocation]);

  return (
    <group>
      {clusteredData.map(({ reactor, clusterCount }) => (
        <MarkerComponent
          key={`${reactor.latitude.toFixed(3)}-${reactor.longitude.toFixed(3)}`}
          reactor={reactor}
          isSelected={selectedReactor?.id === reactor.id}
          clusterCount={clusterCount}
          onClick={() => {
            if (selectedReactor?.id === reactor.id) {
              onSelectReactor(null);
            } else {
              // Select the best reactor at this location
              const bestReactor = getBestReactorAtLocation(reactor);
              onSelectReactor(bestReactor);
            }
          }}
          onHover={(hovering, screenPos) => {
            if (onHoverReactor) {
              if (hovering && screenPos) {
                // Show cluster info with best status
                const hoverInfo = getClusterHoverInfo(reactor);
                onHoverReactor({ name: hoverInfo.name, status: hoverInfo.status }, screenPos);
              } else {
                onHoverReactor(null, null);
              }
            }
          }}
        />
      ))}
    </group>
  );
}
