import WebSocketAsPromised from "websocket-as-promised";

class SignalingChannel {
  constructor(url) {
    if (!("WebSocket" in window)) {
      throw new Error("The browser does not support WebSockets");
    }
    this.wsp = new WebSocketAsPromised(url, {
      packMessage: data => JSON.stringify(data),
      unpackMessage: message => JSON.parse(message)
    });
  }

  async open() {
    await this.wsp.open();
  }

  async send(request) {
    try {
      this.wsp.sendPacked(request);
    } catch (e) {
      console.error(e);
      throw e;
    }
  }

  async close() {
    await this.wsp.close();
  }

  addCloseListener(onClose) {
    this.wsp.onClose.addListener(event => {
      console.info(`WebSocket connection closed: ${event.reason}`);
      onClose(event);
    });
  }

  addErrorListener(onError) {
    this.wsp.onError.addListener(event => {
      console.error(event);
      onError(event);
    });
  }

  addMessageListener(onMessage) {
    this.wsp.onUnpackedMessage.addListener(onMessage);
  }

  static async create(url) {
    console.log("creating SignalingChannel: " + url);
    const signaling = new SignalingChannel(url);
    await signaling.open();
    return signaling;
  }
}

export default SignalingChannel;
