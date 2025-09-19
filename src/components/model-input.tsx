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
          <option value="demo.glb">demo</option>
        </select>
        <div role="alert" className="alert alert-warning">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6 shrink-0 stroke-current"
            fill="none"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
          <span>超过100M的模型，请从本地上传</span>
        </div>
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
