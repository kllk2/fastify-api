import fastify from 'fastify';
import cors from '@fastify/cors';
import { initUnblockAPI } from '../src/unblock'; // 根据你的实际路径调整

const app = fastify({ logger: true });

// 注册 CORS（允许前端域名访问）
await app.register(cors, {
  origin: ['https://你的前端域名.vercel.app', 'http://localhost:5173'], // 根据实际情况修改
  methods: ['GET', 'POST'],
});

// 注册路由，加上 /api 前缀
app.register(initUnblockAPI, { prefix: '/api' });

// Vercel Serverless 处理器
export default async (req: any, res: any) => {
  await app.ready();
  app.server.emit('request', req, res);
};
