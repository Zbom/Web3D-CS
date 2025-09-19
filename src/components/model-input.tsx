import { useMutation } from "@tanstack/react-query";
import { useAtom, useSetAtom } from "jotai";
import { toast } from "sonner";
import { GLTFLoader } from "three/examples/jsm/Addons.js";
import {
  modelFileNameAtom,
  modelParsedAtom,
  theLongestEdgeLengthAtom,
} from "../shared-variables";
import { Box3, Mesh, Vector3 } from "three";

const ModelInput = () => {
  const [modelFileName, setModelFileName] = useAtom(modelFileNameAtom);

  const setModelParsed = useSetAtom(modelParsedAtom);

  const setTheLongestEdgeLength = useSetAtom(theLongestEdgeLengthAtom);

  const gltfLoader = new GLTFLoader();

  const { mutateAsync: processModelFile } = useMutation({
    mutationFn: async (file: File) => {
      const fileName = file.name;
      const buffer = await file.arrayBuffer();
      const gltf = await gltfLoader.parseAsync(buffer, "");
      const box = new Box3().setFromObject(gltf.scene);
      const center = box.getCenter(new Vector3());
      gltf.scene.traverse((child) => {
        if (child instanceof Mesh) {
          child.position.sub(center);
          child.userData = {
            canClip: true,
          };
        }
      });
      const edgeLength = box.max.distanceTo(box.min);
      return { fileName, gltf, edgeLength };
    },
    onSuccess: ({ fileName, gltf, edgeLength }) => {
      setModelFileName(fileName);
      setModelParsed(gltf.scene);
      setTheLongestEdgeLength(edgeLength);
    },
    onError: (error) => {
      console.error(error);
      toast.error(error.message);
    },
  });

  return (
    <div className="flex items-center gap-4">
      <input
        type="file"
        className="file-input"
        accept=".glb,.gltf"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) {
            processModelFile(file);
          }
          e.target.value = "";
        }}
      />
      {modelFileName && (
        <span className="badge whitespace-nowrap">
          当前文件：{modelFileName}
        </span>
      )}
    </div>
  );
};

export default ModelInput;
