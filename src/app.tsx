import { Canvas } from "@react-three/fiber";
import {
  AdaptiveDpr,
  AdaptiveEvents,
  CameraControls,
  Environment,
  GizmoHelper,
  GizmoViewport,
  PerspectiveCamera,
} from "@react-three/drei";
import Scene from "./scene";
import ModelInput from "./components/model-input";
import { Leva } from "leva";
import Legends from "./components/legends";
import ClipPlayground from "./components/clip-playground";
import { Perf } from "r3f-perf";
import KeyMonitor from "./components/key-monitor";
function App() {
  return (
    <div className="w-screen h-screen">
      <Canvas gl={{ localClippingEnabled: true, antialias: true }}>
        <AdaptiveDpr pixelated />
        <AdaptiveEvents />
        <Scene />
        <Environment preset="park" background blur={0.9} />
        <PerspectiveCamera
          makeDefault
          position={[0, 0, 1]}
          near={2}
          far={88888}
        />
        <CameraControls makeDefault />
        <ClipPlayground />
        <GizmoHelper>
          <GizmoViewport />
        </GizmoHelper>
        <Perf position="bottom-left" />
      </Canvas>
      <div className="fixed left-4 top-4">
        <ModelInput />
      </div>
      <div className="fixed left-4 top-32 w-[294px]">
        <Leva fill titleBar={{ drag: false, filter: false }} />
      </div>
      <div className="fixed right-4 top-4">
        <Legends />
      </div>
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2">
        <KeyMonitor />
      </div>
    </div>
  );
}

export default App;
