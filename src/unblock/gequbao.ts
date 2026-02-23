import { SongUrlResult } from "./unblock";
import axios from "axios";
import { randomBytes } from "crypto";

/**
 * 搜索歌曲获取 ID
 * @param keyword 搜索关键词
 * @returns 歌曲 ID 或 null
 */
const search = async (keyword: string): Promise<string | null> => {
  try {
    const searchUrl = `https://www.gequbao.com/s/${encodeURIComponent(keyword)}`;
    const { data } = await axios.get(searchUrl);

    // 匹配第一个歌曲链接 /music/12345
    // <a href="/music/17165" target="_blank" class="music-link d-block">
    const match = data.match(
      /<a href="\/music\/(\d+)" target="_blank" class="music-link d-block">/,
    );
    if (match && match[1]) {
      return match[1];
    }
    return null;
  } catch (error) {
    return null;
  }
};

/**
 * 获取播放 ID
 * @param id 歌曲 ID
 * @returns 播放 ID 或 null
 */
const getPlayId = async (id: string): Promise<string | null> => {
  try {
    const url = `https://www.gequbao.com/music/${id}`;
    const { data } = await axios.get(url);

    // 匹配 window.appData 中的 play_id
    // "play_id":"EFwMVSQDBgsBQV5WBCUDAVkCSQ9WX3kFXV9XEl0KBSEaVldTR19NVndQVlhXRl5cUA=="
    const match = data.match(/"play_id":"(.*?)"/);
    if (match && match[1]) {
      return match[1];
    }
    return null;
  } catch (error) {
    return null;
  }
};

/**
 * 获取歌曲 URL
 * @param keyword 搜索关键词
 * @returns 包含歌曲 URL 的结果对象
 */
const getGequbaoSongUrl = async (keyword: string, clientIp?: string): Promise<SongUrlResult> => {
  try {
    if (!keyword) return { code: 404, url: null };

    // 1. 获取 ID
    const id = await search(keyword);
    if (!id) return { code: 404, url: null };

    // 2. 获取 play_id
    const playId = await getPlayId(id);
    if (!playId) return { code: 404, url: null };

    // 3. 获取播放链接
    const url = "https://www.gequbao.com/api/play-url";
    const headers : Record<string, string>= {
      accept: "application/json, text/javascript, */*; q=0.01",
      "accept-language": "zh-CN,zh;q=0.9",
      "cache-control": "no-cache",
      "content-type": "application/x-www-form-urlencoded; charset=UTF-8",
      pragma: "no-cache",
      priority: "u=1, i",
      "sec-ch-ua": '"Chromium";v="142", "Google Chrome";v="142", "Not_A Brand";v="99"',
      "sec-ch-ua-mobile": "?0",
      "sec-ch-ua-platform": '"Windows"',
      "sec-fetch-dest": "empty",
      "sec-fetch-mode": "cors",
      "sec-fetch-site": "same-origin",
      "x-requested-with": "XMLHttpRequest",
      cookie: `server_name_session=${randomBytes(16).toString("hex")}`,
      Referer: `https://www.gequbao.com/music/${id}`,
    };

    // 如果传入了 clientIp，添加 X-Real-IP 头
    if (clientIp) {
      headers['X-Real-IP'] = clientIp;
    }

    const body = `id=${encodeURIComponent(playId)}`;

    const { data } = await axios.post(url, body, { headers });

    if (data.code === 1 && data.data && data.data.url) {
      return { code: 200, url: data.data.url };
    }

    return { code: 404, url: null };
  } catch (error) {
    return { code: 404, url: null };
  }
};

export default getGequbaoSongUrl;
