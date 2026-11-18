import { useEffect, useMemo, useRef } from "react";
import { View } from "react-native";
import {
  Atlas,
  Canvas,
  Circle,
  FilterMode,
  Group,
  MipmapMode,
  Skia,
  rect,
  useRSXformBuffer,
  usePictureAsTexture,
} from "react-native-skia";
import { useIsFocused } from "@react-navigation/native";
import {
  useDerivedValue,
  useFrameCallback,
  useReducedMotion,
  useSharedValue,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { tokens } from "../theme/tokens.js";

const { color } = tokens;

const CORE_COUNT = 220;
const RING_COUNT = 80;
const DOT_COUNT = CORE_COUNT + RING_COUNT;
const HOLE_RADIUS = 74;
const BASE_SPEED = 0.24;
const TILT = 0.42;
const TEX = 32;

// Creative Multi-Layer Geometry:
// 1. Core Spiral Vortex Sphere (CORE_COUNT points)
// 2. Dual Intersecting Orbital Rings (RING_COUNT points)
function buildCreativeOrbGeometry() {
  const pts = new Array(DOT_COUNT);
  const goldenAngle = Math.PI * (3 - Math.sqrt(5));

  // Layer 0: Core Fibonacci Spiral Sphere with latitude phase
  for (let i = 0; i < CORE_COUNT; i++) {
    const y = 1 - (i / (CORE_COUNT - 1)) * 2;
    const r = Math.sqrt(Math.max(0, 1 - y * y));
    const theta = goldenAngle * i;
    pts[i] = [Math.cos(theta) * r, y, Math.sin(theta) * r, 0];
  }

  // Layer 1 & 2: Dual Tilted Orbital Rings (Saturn / Atomic Plasma Rings)
  const halfRing = RING_COUNT / 2;
  for (let j = 0; j < RING_COUNT; j++) {
    const isSecondRing = j >= halfRing;
    const idx = isSecondRing ? j - halfRing : j;
    const angle = (idx / halfRing) * Math.PI * 2;
    const ringRadius = isSecondRing ? 1.22 : 1.12;
    const tiltAngle = isSecondRing ? -0.55 : 0.48;
    const cx0 = Math.cos(angle) * ringRadius;
    const cz0 = Math.sin(angle) * ringRadius;
    const ry = -cz0 * Math.sin(tiltAngle);
    const rz = cz0 * Math.cos(tiltAngle);
    pts[CORE_COUNT + j] = [cx0, ry, rz, isSecondRing ? 2 : 1];
  }

  return pts;
}

const BASE_PTS = buildCreativeOrbGeometry();

function projectAll(angle, swell, R, cx, cy) {
  const out = new Array(DOT_COUNT);
  const cosA = Math.cos(angle);
  const sinA = Math.sin(angle);
  const cosRev = Math.cos(-angle * 1.35);
  const sinRev = Math.sin(-angle * 1.35);
  const tilt = TILT + Math.sin(angle * 0.7) * 0.08;
  const cosT = Math.cos(tilt);
  const sinT = Math.sin(tilt);
  const rr = R * swell;

  for (let i = 0; i < DOT_COUNT; i++) {
    const p = BASE_PTS[i];
    const layer = p[3];

    // Dynamic breathing wave on core sphere particles
    const wave =
      layer === 0 ? 1 + Math.sin(p[1] * 6 + angle * 2.5) * 0.055 : 1;
    const px = p[0] * wave;
    const py = p[1] * wave;
    const pz = p[2] * wave;

    // Counter-rotate outer ring layer for multi-axis orbital effect
    const useCos = layer === 2 ? cosRev : cosA;
    const useSin = layer === 2 ? sinRev : sinA;

    const x1 = px * useCos + pz * useSin;
    const z1 = -px * useSin + pz * useCos;
    const y1 = py * cosT - z1 * sinT;
    const z2 = py * sinT + z1 * cosT;

    const depth = Math.max(0, Math.min(1, (z2 + 1.25) / 2.5));
    const s = 2.3 / (2.3 - z2);
    const sx = cx + x1 * rr * s;
    const sy = cy + y1 * rr * s;
    const hx = sx - cx;
    const hy = sy - cy;
    const hidden = hx * hx + hy * hy < HOLE_RADIUS * HOLE_RADIUS;

    const baseScale = layer === 0 ? 0.24 : 0.19;
    const sc = baseScale * (0.55 + 0.85 * depth) * swell;
    out[i] = hidden
      ? [0, 0, -10000, -10000]
      : [sc, 0, sx - (TEX / 2) * sc, sy - (TEX / 2) * sc];
  }
  return out;
}

export function TempOrb({
  tint = color.text,
  beatKey = 0,
  size = 200,
  dimmed = false,
}) {
  const reduceMotion = useReducedMotion();
  const focused = useIsFocused();
  const angleY = useSharedValue(0.6);
  const spinBoost = useSharedValue(0);
  const intensity = useSharedValue(0);
  const dimSV = useSharedValue(dimmed ? 1 : 0);
  const firstBeat = useRef(true);

  const R = (size * 0.72) / 2;
  const cx = size / 2;
  const cy = size / 2;

  // Upgraded glowing diamond-star & halo sprite texture
  const dotPicture = useMemo(() => {
    try {
      const recorder = Skia.PictureRecorder();
      const canvas = recorder.beginRecording(rect(0, 0, TEX, TEX));
      const outerPaint = Skia.Paint();
      outerPaint.setAntiAlias(true);
      outerPaint.setColor(Skia.Color("rgba(255, 255, 255, 0.32)"));
      canvas.drawCircle(TEX / 2, TEX / 2, TEX / 2 - 1, outerPaint);

      const corePaint = Skia.Paint();
      corePaint.setAntiAlias(true);
      corePaint.setColor(Skia.Color("white"));
      canvas.drawCircle(TEX / 2, TEX / 2, TEX * 0.32, corePaint);
      return recorder.finishRecordingAsPicture();
    } catch {
      return null;
    }
  }, []);
  const dotImg = usePictureAsTexture(dotPicture, { width: TEX, height: TEX });

  const sprites = useMemo(
    () => new Array(DOT_COUNT).fill(0).map(() => rect(0, 0, TEX, TEX)),
    []
  );

  const transforms = useRSXformBuffer(DOT_COUNT, (val, i) => {
    "worklet";
    const p = BASE_PTS[i];
    const layer = p[3];
    const a = angleY.value;
    const cosA = Math.cos(a);
    const sinA = Math.sin(a);
    const cosRev = Math.cos(-a * 1.35);
    const sinRev = Math.sin(-a * 1.35);
    const tilt = TILT + Math.sin(a * 0.7) * 0.08;
    const cosT = Math.cos(tilt);
    const sinT = Math.sin(tilt);
    const swell = 1 + 0.06 * intensity.value;
    const rr = R * swell;

    const wave =
      layer === 0 ? 1 + Math.sin(p[1] * 6 + a * 2.5) * 0.055 : 1;
    const px = p[0] * wave;
    const py = p[1] * wave;
    const pz = p[2] * wave;

    const useCos = layer === 2 ? cosRev : cosA;
    const useSin = layer === 2 ? sinRev : sinA;

    const x1 = px * useCos + pz * useSin;
    const z1 = -px * useSin + pz * useCos;
    const y1 = py * cosT - z1 * sinT;
    const z2 = py * sinT + z1 * cosT;

    const depth = Math.max(0, Math.min(1, (z2 + 1.25) / 2.5));
    const s = 2.3 / (2.3 - z2);
    const sx = cx + x1 * rr * s;
    const sy = cy + y1 * rr * s;
    const hx = sx - cx;
    const hy = sy - cy;
    if (hx * hx + hy * hy < HOLE_RADIUS * HOLE_RADIUS) {
      val.set(0, 0, -10000, -10000);
      return;
    }
    const baseScale = layer === 0 ? 0.24 : 0.19;
    const sc = baseScale * (0.55 + 0.85 * depth) * swell;
    val.set(sc, 0, sx - (TEX / 2) * sc, sy - (TEX / 2) * sc);
  });

  useEffect(() => {
    try {
      const initial = projectAll(0.6, 1, R, cx, cy);
      transforms.value = transforms.value.map((slot, i) => {
        slot.set(initial[i][0], initial[i][1], initial[i][2], initial[i][3]);
        return slot;
      });
    } catch {
      // buffer write unsupported — mapper pass will fill it instead
    }
  }, [transforms, R, cx, cy]);

  useEffect(() => {
    dimSV.set(withTiming(dimmed ? 1 : 0, { duration: 400 }));
  }, [dimmed, dimSV]);

  useEffect(() => {
    if (firstBeat.current) {
      firstBeat.current = false;
      return;
    }
    if (!beatKey || dimmed || reduceMotion) return;
    intensity.set(0);
    intensity.set(
      withSequence(
        withTiming(1, { duration: 140 }),
        withTiming(0.35, { duration: 180 }),
        withTiming(0.75, { duration: 120 }),
        withTiming(0, { duration: 320 })
      )
    );
    spinBoost.set(2.8);
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)?.catch?.(() => {});
    } catch {
      // haptics unsupported — visual beat still plays
    }
  }, [beatKey, dimmed, reduceMotion, intensity, spinBoost]);

  const frame = useFrameCallback((info) => {
    "worklet";
    const dt = Math.min(0.05, (info.timeSincePreviousFrame ?? 16) / 1000);
    spinBoost.value *= Math.pow(0.02, dt);
    angleY.value += dt * (BASE_SPEED + spinBoost.value);
  });

  useEffect(() => {
    frame.setActive(focused && !reduceMotion && !dimmed);
  }, [focused, reduceMotion, dimmed, frame]);

  const groupOpacity = useDerivedValue(() => 0.88 * (1 - 0.55 * dimSV.value));
  const innerRingRadius = useDerivedValue(
    () => HOLE_RADIUS - 4 + intensity.value * 6
  );
  const outerHaloRadius = useDerivedValue(
    () => R * 1.15 + Math.sin(angleY.value * 2) * 4 + intensity.value * 8
  );

  // Multi-tone gradient palette across core latitude & orbital rings
  const colors = useMemo(() => {
    const palette = new Array(DOT_COUNT);
    const primaryColor = Skia.Color(tint);
    const cyanAccent = Skia.Color("#0EA5E9");
    const indigoAccent = Skia.Color("#6366F1");
    const violetAccent = Skia.Color("#8B5CF6");

    for (let i = 0; i < DOT_COUNT; i++) {
      const p = BASE_PTS[i];
      const layer = p[3];
      if (layer === 1) {
        palette[i] = cyanAccent;
      } else if (layer === 2) {
        palette[i] = violetAccent;
      } else {
        const lat = Math.abs(p[1]);
        if (lat > 0.62) {
          palette[i] = indigoAccent;
        } else if (i % 3 === 0) {
          palette[i] = cyanAccent;
        } else {
          palette[i] = primaryColor;
        }
      }
    }
    return palette;
  }, [tint]);

  return (
    <View style={{ width: size, height: size }} accessible={false}>
      <Canvas style={{ width: size, height: size }}>
        <Group opacity={groupOpacity}>
          <Circle
            cx={cx}
            cy={cy}
            r={outerHaloRadius}
            color="rgba(56, 189, 248, 0.06)"
          />
          <Circle
            cx={cx}
            cy={cy}
            r={innerRingRadius}
            style="stroke"
            strokeWidth={1.5}
            color="rgba(99, 102, 241, 0.22)"
          />
          <Atlas
            image={dotImg}
            sprites={sprites}
            transforms={transforms}
            colors={colors}
            colorBlendMode="modulate"
            sampling={{ filter: FilterMode.Linear, mipmap: MipmapMode.Linear }}
          />
        </Group>
      </Canvas>
    </View>
  );
}
