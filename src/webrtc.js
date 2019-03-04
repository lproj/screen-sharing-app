import "webrtc-adapter";
import deferred from "deferred";
import SignalingChannel from "./signaling";

class WebrtcSession {
  constructor(url, options) {
    this.url = url;
    this.options = options;
  }

  setOnStreamCallback(onStream) {
    this.onStream = onStream;
  }

  setOnMessageCallback(onMessage) {
    this.onMessage = onMessage;
  }

  setOnCloseCallback(onClose) {
    this.onClose = onClose;
  }

  setOnDataChannelCallback(onDataChannel) {
    this.onDataChannel = onDataChannel;
  }

  async onSignalingMessage(msg) {
    var what = msg.what;
    var data = msg.data;

    console.dir(msg);

    switch (what) {
      case "offer":
        try {
          await this.pc.setRemoteDescription(
            new RTCSessionDescription(JSON.parse(data))
          );
          this.hasRemoteDesc.resolve();
          var mediaConstraints = {
            voiceActivityDetection: false,
            audio: false,
            video: false
          };
          await this.pc.setLocalDescription(
            await this.pc.createAnswer(mediaConstraints)
          );
          var request = {
            what: "answer",
            data: JSON.stringify(this.pc.localDescription)
          };
          console.dir(request);
          await this.signaling.send(request);
        } catch (e) {
          console.error(e);
          await this.signaling.close();
        }
        break;

      case "answer":
        break;

      case "message":
        if (this.onMessage) {
          this.onMessage(data);
        }
        break;

      case "iceCandidate": // received when trickle ice is used (see the "call" request)
        if (!data) {
          console.debug("ICE candidate gathering complete");
          break;
        }
        let candidate = new RTCIceCandidate(JSON.parse(data));
        await this.hasRemoteDesc.promise;
        await this.pc.addIceCandidate(candidate);
        console.debug(
          "added remote IceCandidate: " + JSON.stringify(candidate)
        );
        break;

      case "iceCandidates": // received when trickle ice is NOT used (see the "call" request)
        console.error("please enable trickle ICE");
        break;

      default:
        break;
    }
  }

  async onSignalingClose(event) {
    console.info("closing RTCPeerconnection...");
    await this.pc.close();
    if (this.onClose) {
      this.onClose(event);
    }
  }

  async onSignalingError(event) {
    await this.signaling.close();
  }

  async call() {
    const config = { iceServers: this.options.iceServers };
    this.pc = config.iceServers
      ? new RTCPeerConnection(config)
      : new RTCPeerConnection();
    this.hasRemoteDesc = deferred();

    this.pc.onicecandidate = async ({ candidate }) => {
      if (candidate) {
        var request = {
          what: "addIceCandidate",
          data: JSON.stringify(candidate)
        };
        console.dir(request);
        await this.signaling.send(request);
      } else {
        console.debug("end of local ICE candidates.");
      }
    };

    if (this.onStream) {
      this.pc.ontrack = async event => {
        await this.onStream(event.streams[0]);
      };
    }

    this.pc.onremovestream = function(event) {
      console.log("the stream has been removed");
    };

    this.pc.ondatachannel = event => {
      console.info("a data channel is available!");
      if (this.onDataChannel) {
        this.onDataChannel(event.channel);
      }
    };

    this.signaling = await SignalingChannel.create(this.url);
    this.signaling.addMessageListener(
      async msg => await this.onSignalingMessage(msg)
    );
    this.signaling.addCloseListener(
      async event => await this.onSignalingClose(event)
    );
    this.signaling.addErrorListener(
      async event => await this.onSignalingError(event)
    );

    var request = {
      what: "call",
      options: {
        // If forced, the hardware codec depends on the arch.
        // (e.g. it's H264 on the Raspberry Pi)
        // Make sure the browser supports the codec too.
        force_hw_vcodec: this.options.useH264,
        vformat: this.options.resolution /* 30=640x480, 30 fps */,
        trickle_ice: true
      }
    };
    console.dir(request);
    await this.signaling.send(request);
  }

  async hangup() {
    var request = {
      what: "hangup"
    };
    console.dir(request);
    await this.signaling.send(request);
  }
}

export default WebrtcSession;
