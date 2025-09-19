import { useAtomValue } from "jotai";
import { modelFileNameAtom, modelParsedAtom } from "../shared-variables";
import { useQuery } from "@tanstack/react-query";
import { Mesh } from "three";
import { toast } from "sonner";

const Legends = () => {
  const modelFileName = useAtomValue(modelFileNameAtom);

  const modelParsed = useAtomValue(modelParsedAtom);

  const {
    isPending,
    isError,
    error,
    data: legends,
  } = useQuery({
    enabled: !!modelParsed,
    queryKey: ["legends", modelFileName],
    queryFn: async () => {
      const legends: { uuid: string; name: string; color: string }[] = [];
      modelParsed?.traverse((child) => {
        if (child instanceof Mesh) {
          legends.push({
            uuid: child.uuid,
            name: child.name,
            color: child.material.color.getHexString(),
          });
        }
      });
      return legends;
    },
  });

  if (isPending) {
    return <></>;
  }

  if (isError) {
    console.error(error);
    toast.error(error.message);
    return <></>;
  }

  return (
    <>
      {legends.length && (
        <div className="grid grid-cols-2 gap-2 w-72 max-h-96 overflow-y-auto pb-16">
          {legends.map((legend) => {
            return (
              <div
                key={legend.uuid}
                className="badge flex items-center gap-2 tooltip tooltip-bottom w-full"
                data-tip={legend.name}
              >
                <div
                  className="w-4 h-4 rounded-full border"
                  style={{ backgroundColor: `#${legend.color}` }}
                ></div>
                <span className="w-full flex-1 line-clamp-1 font-mono">
                  {legend.name}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
};

export default Legends;
