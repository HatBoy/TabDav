/**
 * TabDav Content Script
 * 注入到页面中获取页面信息
 */

/**
 * 获取当前页面信息
 */
function getPageInfo(): PageInfo {
  const metaTags = Array.from(document.getElementsByTagName('meta'));

  return {
    url: window.location.href,
    title: document.title,
    favicon: getFavicon(),
    description: getMetaContent('description', metaTags),
    keywords: getMetaContent('keywords', metaTags),
    ogImage: getMetaContent('og:image', metaTags),
    canonicalUrl: getCanonicalUrl(),
    loadTime: performance.now()
  };
}

/**
 * 获取Favicon
 */
function getFavicon(): string | undefined {
  // 尝试获取link标签中的favicon
  const link = document.querySelector<HTMLLinkElement>('link[rel="icon"], link[rel="shortcut icon"]');
  if (link?.href) {
    return link.href;
  }

  // 尝试获取默认favicon
  const url = new URL(window.location.href);
  return `${url.origin}/favicon.ico`;
}

/**
 * 获取meta标签内容
 */
function getMetaContent(name: string, metaTags: HTMLMetaElement[]): string | undefined {
  const meta = metaTags.find(
    (m) => m.name === name || (m as HTMLMetaElement).getAttribute('property') === name
  );
  return meta?.content;
}

/**
 * 获取canonical URL
 */
function getCanonicalUrl(): string | undefined {
  const link = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  return link?.href;
}

// 监听来自background的消息
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === 'GET_PAGE_INFO') {
    const info = getPageInfo();
    sendResponse({ success: true, data: info });
  }
  return true;
});

// 导出类型
interface PageInfo {
  url: string;
  title: string;
  favicon?: string;
  description?: string;
  keywords?: string;
  ogImage?: string;
  canonicalUrl?: string;
  loadTime: number;
}

export type { PageInfo };
export { getPageInfo };
