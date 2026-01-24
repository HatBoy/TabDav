/**
 * WebDav客户端封装
 * 使用原生fetch API，在Service Worker中更好地支持CORS
 */

import { WEBDAV_TIMEOUT } from '../constants';
import { settingsService } from './settingsService';
// 使用 index.ts 的动态翻译，支持所有语言
import { t } from '../i18n';

/**
 * WebDav客户端类
 */
export class WebDavClient {
  private baseUrl: string;
  private username: string;
  private password: string;
  private syncPath: string;

  constructor(url: string, username: string, password: string) {
    // 解析URL
    const urlObj = new URL(url.replace(/\/$/, ''));
    this.baseUrl = `${urlObj.protocol}//${urlObj.host}`;
    this.username = username;
    this.password = password;

    // 从URL中提取同步路径
    this.syncPath = urlObj.pathname.replace(/\/$/, '') || '/';
  }

  /**
   * 发送HTTP请求
   */
  private async request<T = unknown>(options: {
    method: string;
    url: string;
    body?: string;
    headers?: Record<string, string>;
  }): Promise<{ success: boolean; data?: T; status?: number; error?: string }> {
    // 构建完整URL
    let urlPath = options.url;
    if (this.syncPath && !urlPath.startsWith(this.syncPath)) {
      urlPath = `${this.syncPath}/${urlPath}`.replace(/\/+/g, '/').replace(/\/$/, '');
    }
    const fullUrl = `${this.baseUrl}${urlPath}`.replace(/\/+/g, '/');

    const headers: Record<string, string> = {
      'User-Agent': 'TabDav/1.0',
      ...options.headers,
    };

    // 计算Authorization头
    const authString = `${this.username}:${this.password}`;
    const authBase64 = btoa(authString);
    headers['Authorization'] = `Basic ${authBase64}`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), WEBDAV_TIMEOUT);

    try {
      const response = await fetch(fullUrl, {
        method: options.method,
        headers,
        body: options.body,
        signal: controller.signal,
        mode: 'cors',
      });

      clearTimeout(timeoutId);

      // 读取响应文本
      const text = await response.text();

      // 尝试解析JSON
      let data: T | undefined;
      try {
        data = text ? JSON.parse(text) : undefined;
      } catch {
        // 非JSON响应，使用原始文本
        data = text as unknown as T;
      }

      if (response.ok) {
        return { success: true, data, status: response.status };
      } else {
        return { success: false, status: response.status, error: text };
      }
    } catch (error) {
      clearTimeout(timeoutId);
      const err = error as Error;
      if (err.name === 'AbortError') {
        return { success: false, error: t('webdav.timeout') };
      }
      return { success: false, error: err.message };
    }
  }

  /**
   * 测试连接
   */
  async testConnection(): Promise<{ success: boolean; message: string; status?: number }> {
    try {
      // 构建测试URL
      const testPath = this.syncPath || '/';

      // 尝试PROPFIND请求验证连接（简化请求体）
      const result = await this.request({
        method: 'PROPFIND',
        url: testPath,
        headers: {
          Depth: '0',
          'Content-Type': 'text/xml',
        },
        body: '',
      });

      if (result.success) {
        return {
          success: true,
          message: t('webdav.success'),
          status: result.status,
        };
      }

      // 处理错误响应
      const status = result.status || 0;
      let errorMessage = result.error || t('webdav.failed');

      // 根据状态码返回友好错误信息
      if (status === 401) {
        errorMessage = t('webdav.authFailed');
      } else if (status === 403) {
        errorMessage = t('webdav.forbidden');
      } else if (status === 404) {
        errorMessage = t('webdav.notFound');
      } else if (status === 405) {
        errorMessage = t('webdav.methodNotAllowed');
      } else if (status === 0) {
        errorMessage = t('webdav.networkFailed');
      }

      return {
        success: false,
        message: errorMessage,
        status,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : t('webdav.unknownError');
      return {
        success: false,
        message: t('webdav.connectionException', { error: message }),
      };
    }
  }

  /**
   * 获取存储配额
   */
  async getStorageQuota(): Promise<{ used: number; available: number } | null> {
    try {
      const result = await this.request({
        method: 'PROPFIND',
        url: this.syncPath || '/',
        headers: {
          Depth: '0',
          'Content-Type': 'application/xml',
        },
        body: '<?xml version="1.0"?><d:propfind xmlns:d="DAV:" xmlns:q="DAV:"><q:quota-available-bytes/><q:quota-used-bytes/></d:propfind>',
      });

      if (!result.success || !result.data) {
        return null;
      }

      const text = String(result.data);
      const quotaAvailable = this.parseQuotaResponse(text, 'quota-available-bytes');
      const quotaUsed = this.parseQuotaResponse(text, 'quota-used-bytes');

      return {
        used: quotaUsed || 0,
        available: quotaAvailable || -1,
      };
    } catch {
      return null;
    }
  }

  /**
   * 检查文件是否存在
   */
  async exists(path: string): Promise<boolean> {
    const result = await this.request({
      method: 'HEAD',
      url: path,
    });
    return result.success;
  }

  /**
   * 上传数据
   */
  async upload(data: string, path: string): Promise<{ success: boolean; message: string }> {
    const result = await this.request({
      method: 'PUT',
      url: path,
      headers: {
        'Content-Type': 'application/json',
      },
      body: data,
    });

    if (result.success) {
      return { success: true, message: t('webdav.uploadSuccess') };
    }

    return {
      success: false,
      message: this.getErrorMessage(result.status || 0, result.error),
    };
  }

  /**
   * 下载数据
   */
  async download(path: string): Promise<{ success: boolean; data?: string; message: string }> {
    const result = await this.request({
      method: 'GET',
      url: path,
    });

    if (result.success) {
      // 确保返回的是字符串（request可能已将JSON解析为对象）
      let data: string;
      if (typeof result.data === 'string') {
        data = result.data;
      } else if (result.data === undefined) {
        data = '';
      } else {
        // 已经是对象，序列化为字符串
        data = JSON.stringify(result.data);
      }
      return {
        success: true,
        data,
        message: t('webdav.downloadSuccess'),
      };
    }

    return {
      success: false,
      message: this.getErrorMessage(result.status || 0, result.error),
    };
  }

  /**
   * 创建目录
   */
  async mkdir(path: string): Promise<{ success: boolean; message: string }> {
    const result = await this.request({
      method: 'MKCOL',
      url: path,
    });

    if (result.success) {
      return { success: true, message: t('webdav.mkdirSuccess') };
    }

    return {
      success: false,
      message: this.getErrorMessage(result.status || 0, result.error),
    };
  }

  /**
   * 删除文件
   */
  async delete(path: string): Promise<{ success: boolean; message: string }> {
    const result = await this.request({
      method: 'DELETE',
      url: path,
    });

    if (result.success) {
      return { success: true, message: t('webdav.deleteSuccess') };
    }

    return {
      success: false,
      message: this.getErrorMessage(result.status || 0, result.error),
    };
  }

  /**
   * 列出目录内容
   */
  async list(path: string): Promise<{ success: boolean; files?: string[]; message: string }> {
    const result = await this.request({
      method: 'PROPFIND',
      url: path,
      headers: {
        Depth: '1',
        'Content-Type': 'application/xml',
      },
      body: '<?xml version="1.0"?><d:propfind xmlns:d="DAV:"><d:prop><d:displayname/></d:prop></d:propfind>',
    });

    if (!result.success || !result.data) {
      return {
        success: false,
        message: this.getErrorMessage(result.status || 0, result.error),
      };
    }

    const files = this.parseListResponse(String(result.data));
    return {
      success: true,
      files,
      message: t('webdav.listSuccess'),
    };
  }

  /**
   * 获取数据文件路径
   */
  getDataPath(): string {
    return `${this.syncPath}/data.json`;
  }

  /**
   * 获取备份文件路径
   */
  getBackupPath(): string {
    return `${this.syncPath}/data.json.backup`;
  }

  /**
   * 解析配额响应
   */
  private parseQuotaResponse(data: string, tag: string): number | null {
    if (!data) return null;
    const match = data.match(new RegExp(`<${tag}>(\\d+)</${tag}>`));
    return match ? parseInt(match[1], 10) : null;
  }

  /**
   * 解析列表响应
   */
  private parseListResponse(data: string): string[] {
    if (!data) return [];
    const files: string[] = [];
    const matches = data.matchAll(/<d:href>([^<]+)<\/d:href>/g);
    for (const match of matches) {
      const href = match[1];
      const filename = href.split('/').pop();
      if (filename && filename !== '' && !filename.startsWith('.')) {
        files.push(filename);
      }
    }
    return files;
  }

  /**
   * 获取错误消息
   */
  private getErrorMessage(status: number, error?: string): string {
    if (status === 0) {
      return error || t('webdav.networkError');
    }

    switch (status) {
      case 400:
        return t('webdav.badRequest');
      case 401:
        return t('webdav.authFailed');
      case 403:
        return t('webdav.forbidden');
      case 404:
        return t('webdav.resourceNotFound');
      case 405:
        return t('webdav.methodNotSupported');
      case 407:
        return t('webdav.proxyAuthRequired');
      case 501:
        return t('webdav.notImplemented');
      case 507:
        return t('webdav.insufficientStorage');
      default:
        return error || t('webdav.serverError', { status: String(status) });
    }
  }
}

/**
 * 从设置创建WebDav客户端
 * 使用静态导入 settingsService，避免 Vite 动态导入产生的预加载器在 Service Worker 中访问 window/document
 */
export async function createClientFromSettings(): Promise<WebDavClient | null> {
  const settings = await settingsService.getWebDavSettings();

  if (!settings.url || !settings.username || !settings.password) {
    return null;
  }

  return new WebDavClient(settings.url, settings.username, settings.password);
}
