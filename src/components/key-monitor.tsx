import { useAtomValue } from "jotai";
import { latestClipWastedTimeAtom } from "../shared-variables";

const KeyMonitor = () => {
  const latestClipWastedTime = useAtomValue(latestClipWastedTimeAtom);

  return (
    <>
      {Boolean(latestClipWastedTime) && (
        <div className="flex items-center">
          <span className="badge font-mono text-xs">
            当前剪切执行耗时：≈{latestClipWastedTime.toFixed(2)}ms
          </span>
        </div>
      )}
    </>
  );
};

export default KeyMonitor;
