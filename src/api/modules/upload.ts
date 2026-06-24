/**
 * 简单的前端 mock 上传实现：将文件转换为 data URL 并在内存中保存映射。
 */
const fileStore = new Map<string, string>();

const wait = <T>(value: T, timeout = 180) =>
  new Promise<T>(resolve => {
    window.setTimeout(() => resolve(value), timeout);
  });

export const uploadFileMock = async (file: File) => {
  const fileId = `file-${Date.now()}`;
  const reader = new FileReader();

  const dataUrl: string = await new Promise((resolve, reject) => {
    reader.onerror = () => reject(new Error("读取文件失败"));
    reader.onload = () => resolve(reader.result as string);
    reader.readAsDataURL(file);
  });

  fileStore.set(fileId, dataUrl);

  return wait({ fileId, url: dataUrl });
};

export const getFileUrlMock = (fileId?: string) => {
  if (!fileId) return undefined;
  return fileStore.get(fileId);
};

export default uploadFileMock;
import { Upload } from "@/api/interface/index";
import { PORT1 } from "@/api/config/servicePort";
import http from "@/api";

/**
 * @name 文件上传模块
 */
// 图片上传
export const uploadImg = (params: FormData) => {
  return http.post<Upload.ResFileUrl>(PORT1 + `/file/upload/img`, params, { cancel: false });
};

// 视频上传
export const uploadVideo = (params: FormData) => {
  return http.post<Upload.ResFileUrl>(PORT1 + `/file/upload/video`, params, { cancel: false });
};
