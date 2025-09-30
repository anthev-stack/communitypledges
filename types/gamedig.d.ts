declare module 'gamedig' {
  export function query(options: {
    type: string;
    host: string;
    port?: number;
    timeout?: number;
  }): Promise<{
    name: string;
    map: string;
    password: boolean;
    maxplayers: number;
    players: Array<{
      name: string;
      score?: number;
    }>;
    bots: Array<{
      name: string;
      score?: number;
    }>;
    connect: string;
    ping: number;
  }>;
}
