import { callbacksMultiCallMultiArgs, filterEventsFromWs } from "./Helper";
import {
    parseRaffleLostEvent,
    parseRaffleWinnerEvent
} from "@/utils";
import TmWebSocket from "./WebSocket";
import {RaffleLostEvent, RaffleWinnerEvent} from "@bze/bzejs/types/codegen/beezee/burner/events";

const raffleLostEventQuery = () => `tm.event = 'NewBlock' AND bze.burner.v1.RaffleLostEvent.denom EXISTS`;
const raffleWinEventQuery = () => `tm.event = 'NewBlock' AND bze.burner.v1.RaffleWinnerEvent.denom EXISTS`;

const SUB_ID_RAFFLE_LOST = 10;
const SUB_ID_RAFFLE_WINNER = 11;

const TYPE_RAFFLE_LOST_EVENT = 'bze.burner.v1.RaffleLostEvent';
const TYPE_RAFFLE_WINNER_EVENT = 'bze.burner.v1.RaffleWinnerEvent';

class Listener {
  private isStarted: boolean = false;
  private raffleLostCallbacks: ((event: RaffleLostEvent) => void)[] = [];
  private raffleWinnerCallbacks: ((event: RaffleWinnerEvent) => void)[] = [];

  clearAllCallbacks(): void {
    this.raffleLostCallbacks = [];
    this.raffleWinnerCallbacks = [];
  }

  addRaffleLostCallback(cb: (event: RaffleLostEvent) => void): void {
    this.raffleLostCallbacks.push(cb);
  }

  addRaffleWinnerCallback(cb: (event: RaffleWinnerEvent) => void): void {
    this.raffleWinnerCallbacks.push(cb);
  }

  private onRaffleLost(e: any): void {
    const ev = filterEventsFromWs(e, TYPE_RAFFLE_LOST_EVENT, parseRaffleLostEvent);
    callbacksMultiCallMultiArgs(this.raffleLostCallbacks ?? [], ev);
  }

  private onRaffleWinner(e: any): void {
    const ev = filterEventsFromWs(e, TYPE_RAFFLE_WINNER_EVENT, parseRaffleWinnerEvent);
    callbacksMultiCallMultiArgs(this.raffleWinnerCallbacks ?? [], ev);
  }

  start(): void {
    if (this.isStarted) {
      console.log("already started");
      return;
    }

    TmWebSocket.subscribe(SUB_ID_RAFFLE_LOST, raffleLostEventQuery(), (e: any) => {this.onRaffleLost(e)});
    TmWebSocket.subscribe(SUB_ID_RAFFLE_WINNER, raffleWinEventQuery(), (e: any) => {this.onRaffleWinner(e)});

    this.isStarted = true;
  }

  stop(): void {
    if (!this.isStarted) {
      return;
    }

    TmWebSocket.unsubscribe(SUB_ID_RAFFLE_LOST);
    TmWebSocket.unsubscribe(SUB_ID_RAFFLE_WINNER);

    this.isStarted = false;
  }
}

const RaffleListener = new Listener();

export default RaffleListener;
