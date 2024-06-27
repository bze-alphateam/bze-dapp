import { callbacksMultiCall } from "./Helper";
import TmWebSocket from "./WebSocket";

const SUB_ID_RECIPIENT = 1;
const SUB_ID_SENDER = 2;

const subscriptionQueryRecipient = (address: string): string => `tm.event = 'Tx' AND transfer.recipient = '${address}'`;
const subscriptionQuerySender = (address: string): string => `tm.event = 'Tx' AND transfer.sender = '${address}'`;

class Listener {
  private isStarted: boolean = false;
  private address: string = "";
  private callbacks: (() => void)[] = [];

  setAddress(address: string) {
    if (this.address === address) {
      return;
    }

    if (this.isStarted) {
      this.stop();
    }

    this.address = address;
  }

  clearCallbacks() {
    this.callbacks = [];
  }

  addOnSendAndReceiveCallback(cb: () => void): void {
    this.callbacks.push(cb);
  }

  onSendAndReceiveEvent(): void {
    callbacksMultiCall(this.callbacks);
  }

  start(): void {
    if (this.isStarted) {
      console.log("address listener: already started.");
      return;
    }

    if (this.address !== "") {
      TmWebSocket.subscribe(SUB_ID_RECIPIENT, subscriptionQueryRecipient(this.address), (e: any) => {this.onSendAndReceiveEvent()});
      TmWebSocket.subscribe(SUB_ID_SENDER, subscriptionQuerySender(this.address), (e: any) => {this.onSendAndReceiveEvent()});

      this.isStarted = true;
      console.log("address listener: started");
    }
  }

  stop(): void {
    if (!this.isStarted) {
      console.log("address listener: already stopped");
      return;
    }

    TmWebSocket.unsubscribe(SUB_ID_RECIPIENT);
    TmWebSocket.unsubscribe(SUB_ID_SENDER);

    this.isStarted = false;
    console.log("address listener: stopped");
  }
}
const AddressBalanceListener = new Listener();

export default AddressBalanceListener;
