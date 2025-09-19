import { useThree } from "@react-three/fiber";
import { Mesh, Object3D, type Object3DEventMap } from "three";
import { CENTER, MeshBVH } from "three-mesh-bvh";
import type { UseThree } from "../shared-variables";

export type BvhFilter = (item: Object3D<Object3DEventMap>) => boolean;

const useBvh = () => {
  const { scene }: UseThree = useThree();

  const buildBvh = (filter: BvhFilter) => {
    scene.traverse((item) => {
      if (filter(item)) {
        const boundsTree = new MeshBVH((item as Mesh).geometry, {
          maxDepth: 40,
          strategy: CENTER,
        });
        (item as Mesh).geometry.boundsTree = boundsTree;
      }
    });
  };

  return { buildBvh };
};

export default useBvh;
