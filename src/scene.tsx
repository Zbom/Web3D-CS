import { useAtomValue } from "jotai";
import { button, useControls } from "leva";
import { useThree } from "@react-three/fiber";
import { Box3 } from "three";
import { useEffect } from "react";
import { modelParsedAtom, type UseThree } from "./shared-variables";

const Scene = () => {
  const modelParsed = useAtomValue(modelParsedAtom);

  const { controls }: UseThree = useThree();

  const handleFocus = () => {
    if (controls && modelParsed) {
      controls.fitToBox(new Box3().setFromObject(modelParsed), true);
    }
  };

  const { showModel } = useControls(
    {
      showModel: {
        label: "显示模型",
        value: true,
      },
      聚焦: button(() => handleFocus()),
    },
    [handleFocus]
  );

  useEffect(() => {
    handleFocus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modelParsed]);

  return <>{modelParsed && showModel && <primitive object={modelParsed} />}</>;
};

export default Scene;
