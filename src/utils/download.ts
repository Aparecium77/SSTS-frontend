import type { AxiosResponse } from "axios";

export type DownloadResponse = Blob | ArrayBuffer | AxiosResponse<Blob | ArrayBuffer> | { data?: Blob | ArrayBuffer };

const JSON_MIME_RE = /application\/json|text\/json|text\/plain/i;

const getResponseData = (response: DownloadResponse) => {
  if (response instanceof Blob || response instanceof ArrayBuffer) return response;
  return response.data;
};

const readJsonMessage = async (blob: Blob) => {
  if (!JSON_MIME_RE.test(blob.type)) return "";
  try {
    const payload = JSON.parse(await blob.text());
    return payload?.message || payload?.msg || payload?.error || "";
  } catch {
    return "";
  }
};

export const toDownloadBlob = async (response: DownloadResponse, mimeType: string) => {
  const data = getResponseData(response);
  if (!data) {
    throw new Error("导出接口未返回文件内容");
  }

  const blob = data instanceof Blob ? data : new Blob([data], { type: mimeType });
  const errorMessage = await readJsonMessage(blob);
  if (errorMessage) {
    throw new Error(errorMessage);
  }
  return blob.type === mimeType ? blob : new Blob([blob], { type: mimeType });
};

export const saveBlob = (blob: Blob, fileName: string) => {
  if ("msSaveOrOpenBlob" in navigator) {
    return window.navigator.msSaveOrOpenBlob(blob, fileName);
  }

  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.style.display = "none";
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};
