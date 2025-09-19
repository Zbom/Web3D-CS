import type { CameraControls } from "@react-three/drei";
import { atom } from "jotai";
import type { Object3D, Object3DEventMap } from "three";
import type { RootState as FiberState } from "@react-three/fiber";

export type UseThree = {
  controls: CameraControls;
} & FiberState;

export const modelParsedAtom = atom<Object3D<Object3DEventMap> | null>(null);

export const modelFileNameAtom = atom<string | null>(null);

export const theLongestEdgeLengthAtom = atom<number>(0);

export const latestClipWastedTimeAtom = atom<number>(0);
