import { getRpcURL } from "../Client";

interface Subscription {
  payload: Payload;
  callback: (e: any) => void;
}

interface Payload {
  jsonrpc: string;
  method: string;
  id: number;
  params: {
      query: string;
  }
}

const buildSubscribePayload = (id: number, query: string): Payload => {
  return {
    jsonrpc: "2.0",
    method: "subscribe",
    id: id,
    params: {
        query: query
    }
  };
}

const buildUnsubscribePayload = (id: number, query: string): Payload => {
  return {
    jsonrpc: "2.0",
    method: "unsubscribe",
    id: id,
    params: {
        query: query
    }
  };
}

const rpc = getRpcURL();
const wsAddress = `${rpc}/websocket`;

const STATE_CONNECTING = 0;
const STATE_OPEN = 1;
const STATE_CLOSING = 2;
const STATE_CLOSED = 3;

class TendermintWebsocket {

  private webScoket: WebSocket|null = null;
  private subscriptions: Map<number,Subscription> = new Map();

  private getWs(): WebSocket {
    if (this.webScoket === null) {
      this.webScoket = new WebSocket(wsAddress);
      this.addEventHandlers(this.webScoket);
    } else if (this.webScoket.readyState >= STATE_CLOSING) {
      this.webScoket = new WebSocket(wsAddress);
      this.addEventHandlers(this.webScoket);
    }

    return this.webScoket;
  }

  private handleMessage(e: any) {
    if (e.result === undefined || e.id === undefined) {
      return;
    }

    const subscription = this.subscriptions.get(e.id);
    if (subscription === undefined) {
      return;
    }

    subscription.callback(e);
  }

  private addEventHandlers(ws: WebSocket) {
    ws.onopen = () => {
      for (const [key, value] of this.subscriptions.entries()) {
        ws.send(JSON.stringify(value.payload));
      }
    }

    ws.onclose = () => {
      console.log("listener: closed connection");
    }

    ws.onerror = (e) => {
      console.error("listener: error observed:", e);
    };

    ws.onmessage = (e) => {
      const decoded = JSON.parse(e.data);
      this.handleMessage(decoded);
    };
  }

  subscribe(id: number, query: string, callback: (e: any) => void) {
    
    const payload = buildSubscribePayload(id, query);
    if (this.subscriptions.has(id)) {
      this.unsubscribe(id);
    }

    //always set it before calling getWs()
    this.subscriptions.set(id, {
      callback: callback,
      payload: payload,
    });

    const ws = this.getWs();

    if (ws.readyState === STATE_OPEN) {
      ws.send(JSON.stringify(payload));
    }
  }

  unsubscribe(id: number) {
    const subscription = this.subscriptions.get(id);
    if (subscription === undefined) {
      return;
    }
    
    //always set it before calling getWs()
    this.subscriptions.delete(id);
    const ws = this.getWs();

    if (ws.readyState === STATE_OPEN) {
      const payload = subscription.payload;
      payload.method = "unsubscribe";
      ws.send(JSON.stringify(payload));
    }
  }
}

const TmWebSocket = new TendermintWebsocket();

export default TmWebSocket;
