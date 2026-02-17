import fastify from 'fastify';
import cors from '@fastify/cors';
import { initUnblockAPI } from '../src/unblock';

const app = fastify({ logger: true });

try {
  // 注册 CORS
  await app.register(cors, {
    origin: ['https://s-player4.vercel.app', 'http://localhost:5173','http://localhost:14558'],
    methods: ['GET', 'POST'],
    credentials: true
  });

  // 注册路由，加上 /api 前缀（必须 await）
  await app.register(initUnblockAPI, { prefix: '/api' });

} catch (err) {
  console.error('启动时注册失败:', err);
}

// Vercel Serverless 处理器
export default async (req: any, res: any) => {
  await app.ready();   // 确保所有插件和路由都已就绪
  app.server.emit('request', req, res);
};
