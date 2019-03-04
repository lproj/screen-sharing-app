import React, { Component } from "react";
import {
  Button,
  PageHeader,
  Label,
  ControlLabel,
  FormControl,
  FormGroup,
  Panel,
  Checkbox,
  Tooltip,
  OverlayTrigger
} from "react-bootstrap";
import WebrtcSession from "./webrtc";
import Keyboard from "./keyboard";
import Gamepad from "./gamepad";
import "./App.css";

class SessionManager extends Component {
  constructor(props) {
    super(props);
    this.state = { isToggleOn: true };
    this.handleClick = this.handleClick.bind(this);
    this.requestFullscreen = this.requestFullscreen.bind(this);
    if (props.keyCapture) {
      this.enableKeyCapture();
    }
    if (props.gamepadCapture) {
      this.enableGamepadCapture();
    }
  }

  async requestFullscreen() {
    var elem = this.props.videoRef.current;
    if (elem.requestFullscreen) {
      await elem.requestFullscreen();
    } else if (elem.mozRequestFullScreen) {
      await elem.mozRequestFullScreen();
    } else if (elem.webkitRequestFullscreen) {
      await elem.webkitRequestFullscreen();
    } else if (elem.msRequestFullscreen) {
      await elem.msRequestFullscreen();
    }
  }

  async handleClick() {
    if (this.state.isToggleOn) {
      try {
        if (this.props.fullscreen) {
          this.requestFullscreen();
        }
        this.session = new WebrtcSession(this.props.url, this.props.options);
        this.session.setOnStreamCallback(this.props.onStream);
        this.session.setOnCloseCallback(() => {
          this.setState(state => ({ isToggleOn: true }));
          if (this.keyboard) {
            this.removeKeyboardListeners();
          }
        });
        this.session.setOnMessageCallback(msg => alert(msg));
        this.session.setOnDataChannelCallback(datachannel => {
          this.datachannel = datachannel;
          if (this.keyboard) {
            this.addKeyboardListeners();
          }
        });
        await this.session.call();
      } catch (e) {
        alert(e);
        throw e;
      }
      this.setState(state => ({ isToggleOn: false }));
    } else {
      await this.session.hangup();
    }
  }

  sendKeys(keys) {
    console.log(keys);
    this.datachannel.send(keys);
  }

  addKeyboardListeners() {
    window.addEventListener("keydown", this.keyboard.onKeyDown, true);
    window.addEventListener("keyup", this.keyboard.onKeyUp, true);
  }

  removeKeyboardListeners() {
    window.removeEventListener("keydown", this.keyboard.onKeyDown, true);
    window.removeEventListener("keyup", this.keyboard.onKeyUp, true);
  }

  enableKeyCapture() {
    this.keyboard = new Keyboard(keys => {
      this.sendKeys(keys);
    });
    if (this.datachannel) {
      this.addKeyboardListeners();
      console.info("key capture enabled");
    }
  }

  disableKeyCapture() {
    if (this.datachannel) {
      this.removeKeyboardListeners();
      console.info("key capture disabled");
    }
    this.keyboard = null;
  }

  sendGamepadEvents(events) {
    if (this.datachannel) {
      console.log(events);
      this.datachannel.send(events);
    }
  }

  enableGamepadCapture() {
    this.gamepad = new Gamepad(events => {
      this.sendGamepadEvents(events);
    });
    this.gamepad.start();
    window.addEventListener(
      "gamepadconnected",
      this.gamepad.onGamepadConnected,
      true
    );
    window.addEventListener(
      "gamepaddisconnected",
      this.gamepad.onGamepadDisconnected,
      true
    );
    console.info("gamepad capture enabled");
  }

  disableGamepadCapture() {
    this.gamepad.stop();
    window.removeEventListener(
      "gamepadconnected",
      this.gamepad.onGamepadConnected,
      true
    );
    window.removeEventListener(
      "gamepaddisconnected",
      this.gamepad.onGamepadDisconnected,
      true
    );
    console.info("gamepad capture disabled");
    this.gamepad = null;
  }

  render() {
    const tooltip = (
      <Tooltip id="tooltip">
        Start the screen sharing session. Keyboard events will then be sent to
        the remote peer.
      </Tooltip>
    );

    return (
      <OverlayTrigger placement="right" overlay={tooltip}>
        <Button onClick={this.handleClick} bsStyle="primary" bsSize="large">
          {this.state.isToggleOn ? "Start" : "Stop"}
        </Button>
      </OverlayTrigger>
    );
  }
}

class Url extends Component {
  constructor(props) {
    super(props);
    this.handleChange = this.handleChange.bind(this);
  }

  getValidationUrl() {
    try {
      new URL(this.props.url);
      return "success";
    } catch (_) {
      return "error";
    }
  }

  handleChange(e) {
    this.props.onUrlChange(e.target.value);
  }

  render() {
    const tooltip = (
      <Tooltip id="tooltip">
        You might need to fix the address or properly add 'user:password@' in
        the URL if the UV4L Streaming Server is password-protected
      </Tooltip>
    );
    return (
      <FormGroup className="Url" validationState={this.getValidationUrl()}>
        <ControlLabel>
          <span>{this.props.title}</span>
        </ControlLabel>
        <OverlayTrigger placement="top" overlay={tooltip}>
          <FormControl
            type="text"
            value={this.props.url}
            placeholder="e.g. ws://192.168.1.2:8090/stream/webrtc"
            onChange={this.handleChange}
            bsSize={this.props.size ? this.props.size : "small"}
          />
        </OverlayTrigger>
        <FormControl.Feedback />
      </FormGroup>
    );
  }
}

class Options extends Component {
  constructor(props) {
    super(props);
    this.handleChangeKeyCapture = this.handleChangeKeyCapture.bind(this);
    this.handleChangeGamepadCapture = this.handleChangeGamepadCapture.bind(
      this
    );
    this.handleChangeCodec = this.handleChangeCodec.bind(this);
    this.handleChangeResolution = this.handleChangeResolution.bind(this);
    this.handleChangeIceServers = this.handleChangeIceServers.bind(this);
    this.handleChangeFullscreen = this.handleChangeFullscreen.bind(this);
  }

  handleChangeKeyCapture(e) {
    this.props.onKeyCaptureChange(e.target.checked);
  }

  handleChangeGamepadCapture(e) {
    this.props.onGamepadCaptureChange(e.target.checked);
  }

  handleChangeFullscreen(e) {
    this.props.onFullscreenChange(e.target.checked);
  }

  handleChangeCodec(e) {
    this.props.options.useH264 = e.target.checked;
    this.props.onOptionsChange(this.props.options);
  }

  handleChangeResolution(e) {
    this.props.options.resolution = e.target.value;
    this.props.onOptionsChange(this.props.options);
  }

  handleChangeIceServers(e) {
    if (e.target.value === "") {
      this.props.options.iceServers = null;
      this.props.onOptionsChange(this.props.options);
    } else {
      try {
        this.props.options.iceServers = JSON.parse(e.target.value);
        this.props.onOptionsChange(this.props.options);
      } catch (e) {
        console.log(e);
      }
    }
  }

  render() {
    const tooltipCodec = <Tooltip id="tooltipCodec">Recommended</Tooltip>;
    const tooltipShareKeyboard = (
      <Tooltip id="tooltipShareKeyboard">
        Useful to get full control of the remote peer with your keyboard
      </Tooltip>
    );
    const tooltipShareGamepad = (
      <Tooltip id="tooltipShareGamepad">Share your local Gamepad</Tooltip>
    );
    const tooltipIceServers = (
      <Tooltip id="tooltipIceServers">
        WebRTC ICE Servers as standard JSON string.{" "}
        <strong>Leave the default value if you do not know</strong>
      </Tooltip>
    );
    const tooltipFullscreen = (
      <Tooltip id="tooltipFullscreen">
        Start in fullscreen mode in the browser
      </Tooltip>
    );
    return (
      <Panel id="panelElement" bsStyle="info">
        <Panel.Heading>
          <Panel.Title toggle>Options</Panel.Title>
        </Panel.Heading>
        <Panel.Body collapsible>
          <Checkbox
            checked={this.props.keyCapture}
            onChange={this.handleChangeKeyCapture}
          >
            <OverlayTrigger placement="top" overlay={tooltipShareKeyboard}>
              <span>Capture and send key strokes from your local keyboard</span>
            </OverlayTrigger>
          </Checkbox>
        </Panel.Body>
        <Panel.Body collapsible>
          <Checkbox
            checked={this.props.gamepadCapture}
            onChange={this.handleChangeGamepadCapture}
          >
            <OverlayTrigger placement="top" overlay={tooltipShareGamepad}>
              <span>Capture and send events from your local gamepad</span>
            </OverlayTrigger>
          </Checkbox>
        </Panel.Body>
        <Panel.Body collapsible>
          <Checkbox
            checked={this.props.options.useH264}
            onChange={this.handleChangeCodec}
          >
            <OverlayTrigger placement="top" overlay={tooltipCodec}>
              <span>Use H264 hardware acceleration</span>
            </OverlayTrigger>
          </Checkbox>
        </Panel.Body>
        <Panel.Body collapsible>
          <FormControl
            id="resolutionElement"
            componentClass="select"
            placeholder="resolution"
            onChange={this.handleChangeResolution}
            value={this.props.options.resolution}
            bsSize="small"
          >
            <option value="5">320x240 15 fps</option>
            <option value="10">320x240 30 fps</option>
            <option value="25">640x480 15 fps</option>
            <option value="30">640x480 30 fps</option>
            <option value="35">800x480 30 fps</option>
            <option value="40">960x720 30 fps</option>
            <option value="50">1024x768 30 fps</option>
            <option value="55">1280x720 15 fps</option>
            <option value="60">1280x720 30 fps</option>
            <option value="65">1280x768 15 fps</option>
            <option value="70">1280x768 30 fps</option>
            <option value="80">1280x960 30 fps</option>
            <option value="90">1600x768 30 fps</option>
            <option value="95">1640x1232 15 fps</option>
            <option value="97">1640x1232 30 fps</option>
            <option value="100">1920x1080 15 fps</option>
            <option value="105">1920x1080 30 fps</option>
          </FormControl>
        </Panel.Body>
        <Panel.Body collapsible>
          <Checkbox
            checked={this.props.fullscreen}
            onChange={this.handleChangeFullscreen}
          >
            <OverlayTrigger placement="top" overlay={tooltipFullscreen}>
              <span>Start in fullscreen mode</span>
            </OverlayTrigger>
          </Checkbox>
        </Panel.Body>
        <Panel.Body collapsible>
          <OverlayTrigger
            id="iceServersElement"
            placement="top"
            overlay={tooltipIceServers}
          >
            <FormControl
              type="text"
              value={JSON.stringify(this.props.options.iceServers)}
              placeholder="leave the default STUN server if you do not know"
              onChange={this.handleChangeIceServers}
              bsSize="small"
            />
          </OverlayTrigger>
        </Panel.Body>
      </Panel>
    );
  }
}

class ScreenSharing extends Component {
  constructor(props) {
    super(props);
    this.handleUrlChange = this.handleUrlChange.bind(this);
    this.handleOptionsChange = this.handleOptionsChange.bind(this);
    this.handleChangeKeyCapture = this.handleChangeKeyCapture.bind(this);
    this.handleChangeFullscreen = this.handleChangeFullscreen.bind(this);
    this.handleChangeGamepadCapture = this.handleChangeGamepadCapture.bind(
      this
    );
    this.onStream = this.onStream.bind(this);
    this.videoRef = React.createRef();
    this.sessionRef = React.createRef();
    this.state = {
      url: this.getDefaultUrl(), // e.g. "ws://192.168.1.10:9080/stream/webrtc",
      options: {
        useH264: true,
        resolution: "35",
        iceServers: [{ urls: ["stun:stun.l.google.com:19302"] }]
      },
      keyCapture: true,
      gamepadCapture: true,
      fullscreen: typeof window.orientation !== "undefined" // simple way to check if we are on a mobile
    };
  }

  getDefaultUrl() {
    if (window.location.hostname) {
      var address =
        window.location.hostname +
        ":" +
        (window.location.port ||
          (window.location.protocol === "https:" ? 443 : 80)) +
        "/";
      var protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      var url = protocol + "//" + address;
      return url;
    }
    return "";
  }

  handleUrlChange(url) {
    this.setState({ url });
  }

  handleOptionsChange(options) {
    this.setState({ options });
  }

  handleChangeKeyCapture(e) {
    this.setState({ keyCapture: !this.state.keyCapture });
    if (!this.state.keyCapture) {
      this.sessionRef.current.enableKeyCapture();
    } else {
      this.sessionRef.current.disableKeyCapture();
    }
  }

  handleChangeGamepadCapture(e) {
    this.setState({ gamepadCapture: !this.state.gamepadCapture });
    if (!this.state.gamepadCapture) {
      this.sessionRef.current.enableGamepadCapture();
    } else {
      this.sessionRef.current.disableGamepadCapture();
    }
  }

  handleChangeFullscreen(fullscreen) {
    this.setState({ fullscreen });
  }

  async onStream(stream) {
    this.videoRef.current.srcObject = stream;
    await this.videoRef.current.play();
  }

  render() {
    return (
      <div>
        <Url
          title="URL of the Web Service to call"
          url={this.state.url}
          onUrlChange={this.handleUrlChange}
        />
        <div>
          <video ref={this.videoRef} id="videoElement" autoPlay="" controls>
            Your browser does not support the video tag.
          </video>
        </div>
        <div>
          <Options
            options={this.state.options}
            onOptionsChange={this.handleOptionsChange}
            keyCapture={this.state.keyCapture}
            onKeyCaptureChange={this.handleChangeKeyCapture}
            gamepadCapture={this.state.gamepadCapture}
            onGamepadCaptureChange={this.handleChangeGamepadCapture}
            fullscreen={this.state.fullscreen}
            onFullscreenChange={this.handleChangeFullscreen}
          />
        </div>
        <SessionManager
          ref={this.sessionRef}
          url={this.state.url}
          keyCapture={this.state.keyCapture}
          gamepadCapture={this.state.gamepadCapture}
          options={this.state.options}
          onStream={this.onStream}
          videoRef={this.videoRef}
          fullscreen={this.state.fullscreen}
        />
      </div>
    );
  }
}

class App extends Component {
  render() {
    const tooltip = (
      <Tooltip id="tooltip">
        Share screen and speakers from an headless peer and control it with your
        local keyboard and gamepad!
      </Tooltip>
    );
    return (
      <div className="App">
        <PageHeader className="App-header">
          <OverlayTrigger placement="bottom" overlay={tooltip}>
            <Label>
              <span>WebRTC Screen/Speaker/Keyboard/Gamepad Sharing </span>
              <small>
                <a
                  className="App-link"
                  href="https://linux-projects.org"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <span>(info)</span>
                </a>
              </small>
            </Label>
          </OverlayTrigger>
        </PageHeader>
        <ScreenSharing />
      </div>
    );
  }
}

export default App;
