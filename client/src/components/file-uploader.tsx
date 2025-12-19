import { useCallback, useMemo, useState } from "react";
import { useDropzone, type Accept, type FileRejection } from "react-dropzone";
import { useNotifications } from "@/hooks/use-notifications";
import { cn } from "@/lib/utils";

type FileUploaderProps = {
  accept?: string | string[] | Accept;
  maxSize?: number;
  multiple?: boolean;
  captureCamera?: boolean;
  onUpload?: (files: File[]) => Promise<void> | void;
  label?: string;
  helperText?: string;
};

type UploadState = "idle" | "uploading" | "done" | "error";

type UploadFile = {
  id: string;
  file: File;
  preview?: string;
  status: UploadState;
  error?: string;
};

const formatBytes = (bytes: number) => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};

export function FileUploader({
  accept,
  maxSize = 10 * 1024 * 1024,
  multiple = true,
  captureCamera = false,
  onUpload,
  label = "Upload files",
  helperText
}: FileUploaderProps) {
  const { showToast } = useNotifications();
  const [items, setItems] = useState<UploadFile[]>([]);

  const acceptConfig = useMemo<Accept | undefined>(() => {
    if (!accept) return undefined;
    if (typeof accept === "object" && !Array.isArray(accept)) return accept as Accept;
    const list = Array.isArray(accept) ? accept : [accept];
    return list.reduce<Accept>((acc, cur) => ({ ...acc, [cur]: [] }), {});
  }, [accept]);

  const handleUpload = useCallback(
    async (files: File[]) => {
      setItems((prev) =>
        prev.map((entry) => (files.find((f) => f.name === entry.file.name) ? { ...entry, status: "uploading" } : entry))
      );
      try {
        await onUpload?.(files);
        setItems((prev) =>
          prev.map((entry) =>
            files.find((f) => f.name === entry.file.name) ? { ...entry, status: "done", error: undefined } : entry
          )
        );
        showToast({ type: "success", message: "Files uploaded", description: `${files.length} file(s) ready` });
      } catch (error) {
        console.error(error);
        setItems((prev) =>
          prev.map((entry) =>
            files.find((f) => f.name === entry.file.name) ? { ...entry, status: "error", error: "Upload failed" } : entry
          )
        );
        showToast({ type: "error", message: "Upload failed", description: "Please try again" });
      }
    },
    [onUpload, showToast]
  );

  const onDrop = useCallback(
    async (acceptedFiles: File[], rejections: FileRejection[]) => {
      if (rejections.length) {
        showToast({ type: "error", message: "Some files were rejected", description: rejections[0].errors[0].message });
      }

      const next: UploadFile[] = acceptedFiles.map((file) => ({
        id: `${file.name}-${file.size}-${file.lastModified}`,
        file,
        preview: file.type.startsWith("image/") ? URL.createObjectURL(file) : undefined,
        status: "idle"
      }));

      const filtered = next.filter((item) => {
        if (item.file.size > maxSize) {
          showToast({ type: "error", message: `${item.file.name} is too large`, description: `Max ${formatBytes(maxSize)}` });
          return false;
        }
        return true;
      });

      if (!filtered.length) return;
      setItems((prev) => [...filtered, ...prev].slice(0, 12));
      await handleUpload(filtered.map((entry) => entry.file));
    },
    [handleUpload, maxSize, showToast]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: acceptConfig,
    maxSize,
    multiple,
    useFsAccessApi: false // better cross-browser support
  });

  return (
    <div className="space-y-4">
      <div
        {...getRootProps()}
        className={cn(
          "flex cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-[#2a2a2a] bg-[#0c0c0c] px-6 py-10 text-center transition hover:border-[#cfe0ad]/60 hover:bg-[#111]",
          isDragActive && "border-[#cfe0ad] bg-[#111]"
        )}
      >
        <input
          {...getInputProps({
            capture: captureCamera ? "environment" : undefined
          })}
        />
        <p className="text-lg font-semibold text-white">{label}</p>
        <p className="mt-2 text-sm text-[#b7b7b7]">
          Drag & drop or tap to browse {multiple ? "files" : "a file"} {accept ? `(${Array.isArray(accept) ? accept.join(", ") : "supported types"})` : ""}
        </p>
        <p className="mt-1 text-xs text-[#8a8a8a]">
          Max size {formatBytes(maxSize)} {captureCamera ? " - Camera supported" : ""}
        </p>
        {helperText && <p className="mt-3 text-sm text-[#cfcfcf]">{helperText}</p>}
      </div>

      {items.length > 0 && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {items.map((item) => (
            <div
              key={item.id}
              className="flex items-center gap-4 rounded-xl border border-[#1f1f1f] bg-[#0a0a0a] p-3 text-sm text-white"
            >
              <div className="h-14 w-14 overflow-hidden rounded-lg border border-[#1f1f1f] bg-[#151515]">
                {item.preview ? (
                  <img src={item.preview} alt={item.file.name} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-xs text-[#b7b7b7]">FILE</div>
                )}
              </div>
              <div className="flex flex-1 flex-col">
                <div className="flex items-center gap-2">
                  <span className="font-semibold">{item.file.name}</span>
                  <span className="text-xs text-[#a9a9a9]">{formatBytes(item.file.size)}</span>
                </div>
                <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-[#1c1c1c]">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all",
                      item.status === "done" ? "bg-[#cfe0ad] w-full" : item.status === "uploading" ? "bg-[#cfe0ad] w-3/4" : item.status === "error" ? "bg-red-400 w-1/3" : "bg-[#2d2d2d] w-1/5"
                    )}
                  />
                </div>
                <p className="text-xs text-[#8a8a8a]">
                  {item.status === "uploading" && "Uploading..."}
                  {item.status === "done" && "Uploaded"}
                  {item.status === "error" && (item.error ?? "Upload failed")}
                  {item.status === "idle" && "Queued"}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
