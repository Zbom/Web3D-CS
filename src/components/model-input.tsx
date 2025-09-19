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
import type { ChangeEvent } from "react";

const ModelInput = () => {
  const [modelFileName, setModelFileName] = useAtom(modelFileNameAtom);

  const setModelParsed = useSetAtom(modelParsedAtom);

  const setTheLongestEdgeLength = useSetAtom(theLongestEdgeLengthAtom);

  const gltfLoader = new GLTFLoader();

  const { mutateAsync: processModelFile } = useMutation({
    mutationFn: async (payload: {
      fileName: string;
      fileBuffer: ArrayBuffer;
    }) => {
      const gltf = await gltfLoader.parseAsync(payload.fileBuffer, "");
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
      return { fileName: payload.fileName, gltf, edgeLength };
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

  const handleExampleFileChange = async (e: ChangeEvent<HTMLSelectElement>) => {
    try {
      const fileName = e.target.value;
      const file = await fetch(
        `https://raw.githubusercontent.com/Zbom/Web3D-CS/refs/heads/main/models/${fileName}`
      );
      const buffer = await file.arrayBuffer();
      processModelFile({ fileName, fileBuffer: buffer });
    } catch (error) {
      console.error(error);
      toast.error("无法加载示例文件");
    }
  };

  return (
    <div className="flex gap-4">
      <div className="flex flex-col gap-4">
        <input
          type="file"
          className="file-input"
          accept=".glb,.gltf"
          onChange={async (e) => {
            const file = e.target.files?.[0];
            if (file) {
              const buffer = await file.arrayBuffer();
              processModelFile({
                fileName: file.name,
                fileBuffer: buffer,
              });
            }
            e.target.value = "";
          }}
        />
        <select
          defaultValue="选择示例文件"
          className="select"
          onChange={handleExampleFileChange}
        >
          <option disabled={true}>选择示例文件</option>
          <option value="37861.glb">37861</option>
          <option value="39124.glb">39124</option>
          <option value="293454.glb">293454</option>
          <option value="372112.glb">372112</option>
          <option value="441708.glb">441708</option>
        </select>
      </div>
      {modelFileName && (
        <span className="badge whitespace-nowrap">
          当前文件：{modelFileName}
        </span>
      )}
    </div>
  );
};

export default ModelInput;
