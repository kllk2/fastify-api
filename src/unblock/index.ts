import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { SongUrlResult } from "./unblock";
import axios from "axios";
import getKuwoSongUrl from "./kuwo.js";
import getBodianSongUrl from "./bodian.js";
import getGequbaoSongUrl from "./gequbao.js";

/**
 * 直接获取 网易云云盘 链接
 * Thank @939163156
 * Power by GD音乐台(music.gdstudio.xyz)
 */
const getNeteaseSongUrl = async (id: number | string): Promise<SongUrlResult> => {
  try {
    if (!id) return { code: 404, url: null };
    const baseUrl = "https://music-api.gdstudio.xyz/api.php";
    const result = await axios.get(baseUrl, {
      params: { types: "url", id },
    });
    const songUrl = result.data.url;
    return { code: 200, url: songUrl };
  } catch (error) {
    return { code: 404, url: null };
  }
};

// 初始化 UnblockAPI
export const initUnblockAPI = async (fastify: FastifyInstance) => {
  // 主信息
  fastify.get("/unblock", (_, reply) => {
    reply.send({
      name: "UnblockAPI",
      description: "SPlayer UnblockAPI service",
      author: "@imsyy",
      content:
        "部分接口采用 @939163156 by GD音乐台(music.gdstudio.xyz)，仅供本人学习使用，不可传播下载内容，不可用于商业用途。",
    });
  });
  // netease
  fastify.get(
    "/unblock/netease",
    async (
      req: FastifyRequest<{ Querystring: { [key: string]: string } }>,
      reply: FastifyReply,
    ) => {
      const { id } = req.query;
      const result = await getNeteaseSongUrl(id);
      return reply.send(result);
    },
  );
  // kuwo
  fastify.get(
    "/unblock/kuwo",
    async (
      req: FastifyRequest<{ Querystring: { [key: string]: string } }>,
      reply: FastifyReply,
    ) => {
      const { keyword } = req.query;
      const result = await getKuwoSongUrl(keyword);
      return reply.send(result);
    },
  );
  // bodian
  fastify.get(
    "/unblock/bodian",
    async (
      req: FastifyRequest<{ Querystring: { [key: string]: string } }>,
      reply: FastifyReply,
    ) => {
      console.log("kllk fastify.get /unblock/bodian 被调用")
      const { keyword } = req.query;
      const result = await getBodianSongUrl(keyword);
      console.log("kllk fastify.get /unblock/bodian 结果:", result)
      return reply.send(result);
    },
  );
  // gequbao
  fastify.get(
    "/unblock/gequbao",
    async (
      req: FastifyRequest<{ Querystring: { [key: string]: string } }>,
      reply: FastifyReply,
    ) => {
      const { keyword } = req.query;
      const result = await getGequbaoSongUrl(keyword);
      return reply.send(result);
    },
  );

  fastify.get('/proxy/audio', async (req: FastifyRequest, reply: FastifyReply) => {
  const { url } = req.query as { url: string };
  if (!url) return reply.status(400).send({ error: 'Missing url' });

  const targetUrl = url;
  
  try {
    // 从目标 URL 提取源（用于 Referer 和 Origin）
    let targetOrigin = '';
    try {
      targetOrigin = new URL(targetUrl).origin;
    } catch {}

    // 构造请求头，专注音频类型
    const headers: Record<string, string> = {
      'User-Agent': req.headers['user-agent'] || 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'audio/mpeg,audio/*;q=0.9', // 只声明音频类型
      'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
      'Connection': 'keep-alive',
    };

    // 设置 Referer：优先客户端，否则用目标源
    if (req.headers.referer) {
      headers['Referer'] = req.headers.referer as string;
    } else if (targetOrigin) {
      headers['Referer'] = targetOrigin + '/';
    }

    // 设置 Origin
    if (targetOrigin) {
      headers['Origin'] = targetOrigin;
    }

    // 转发 Range 头（用于进度拖拽）
    if (req.headers.range) {
      headers['Range'] = req.headers.range as string;
    }

    const response = await axios({
      method: 'get',
      url: targetUrl,
      headers,
      responseType: 'stream',
      maxRedirects: 5,
      timeout: 30000,
    });

    // 构建返回头（保留 Content-Disposition 以触发下载）
    const responseHeaders: Record<string, string> = {
      'Content-Type': response.headers['content-type'] || 'audio/mpeg',
      'Cache-Control': response.headers['cache-control'] || 'public, max-age=3600',
      'Access-Control-Allow-Origin': req.headers.origin || '*',
      'Access-Control-Allow-Credentials': 'true',
      'Access-Control-Expose-Headers': 'Content-Range, Content-Length, Accept-Ranges',
    };

    if (response.headers['content-length']) {
      responseHeaders['Content-Length'] = response.headers['content-length'];
    }
    if (response.headers['content-range']) {
      responseHeaders['Content-Range'] = response.headers['content-range'];
    }
    if (response.headers['accept-ranges']) {
      responseHeaders['Accept-Ranges'] = response.headers['accept-ranges'];
    }
    if (response.headers['content-disposition']) {
      responseHeaders['Content-Disposition'] = response.headers['content-disposition'];
    }

    reply
      .status(response.status)
      .headers(responseHeaders);

    return reply.send(response.data);
  } catch (error) {
    console.error('代理音频失败:', error);
    if (axios.isAxiosError(error)) {
      if (error.response) {
        return reply.status(error.response.status).send({ error: `Upstream error: ${error.response.statusText}` });
      }
      if (error.request) {
        return reply.status(504).send({ error: 'Gateway timeout' });
      }
    }
    return reply.status(500).send({ error: 'Internal server error' });
  }
});


};
