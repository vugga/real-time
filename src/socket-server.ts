import { Application } from 'express';
import { createServer, Server } from 'http';
import redis, { RedisClient } from 'redis';
import socketIo from 'socket.io';
import ioRedis from 'socket.io-redis';
import l from './log';


interface Props {
  express: {
    app: Application,
    port: number,
  },
  redis: {
    port?: number;
    ip: string;
    pass?: string;
  }
}

interface Returns {
  socketIo: SocketIO.Server,
  expressApp: Application
}

/**
 * Singleton class
 * For socket.io and express, graphql e.t.c
 * Extending Redis database
 */
export default class SocketServer {
  public static readonly PORT: number = 3000;
  // tslint:disable-next-line:variable-name
  private static _instance: SocketServer;
  private app: Application;
  private server: Server;
  private io: SocketIO.Server;
  private socket: any;
  private port: string | number;
  private redisApp = redis.createClient;

  private socketpub: RedisClient;
  private socketsub: RedisClient;

  public static get Instance() {
    // Do you need arguments? Make it a regular method instead.
    return this._instance || (this._instance = new this());
  }

  /**
   * init
   */
  public init({ express, redis }: Props): Returns {

    /** If already intialised */
    if (this.io) {
      return {
        socketIo: this.io,
        expressApp: this.app
      }
    }

    const { app: expressApp, port: expressPort } = express;
    const { ip: redisIp, port: redisPort = 6379, pass: redisPass = '' } = redis;

    this.socketpub = this.redisApp(redisPort, redisIp, {
      auth_pass: redisPass,
      return_buffers: true
    });

    this.socketsub = this.redisApp(redisPort, redisIp, {
      auth_pass: redisPass
    });

    this.app = expressApp; // set up express
    this.port = expressPort; // App port

    this.server = createServer(this.app); // this.createServer();
    this.io = socketIo(this.server); // this.sockets();

    // Listen
    this.server.listen(this.port, () => {
      l.info('Running server on port %s', this.port);
    });

    // Redis adapter
    // @ts-ignore
    this.io.adapter(ioRedis({ pubClient: this.socketpub, subClient: this.socketsub }));

    this.io.on('connect', (socket: any) => {
      l.info('Connected client on port %s.', this.port);

      this.socket = socket;

      socket.on('disconnect', () => {
        l.info('Client disconnected');
      });
    });

    return {
      socketIo: this.io,
      expressApp: this.app
    }

  }

  private constructor() {
  }

  public getApp(): Application {
    return this.app;
  }

  public getIo(): SocketIO.Server {
    return this.io;
  }

  public getSocket(): SocketIO.Socket {
    return this.socket;
  }
}
