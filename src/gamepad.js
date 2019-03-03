class Gamepad {
  constructor(processEvents) {
    this.processEvents = processEvents;
    this.onGamepadConnected = this.onGamepadConnected.bind(this);
    this.onGamepadDisconnected = this.onGamepadDisconnected.bind(this);
    this.start = this.start.bind(this);
    this.stop = this.stop.bind(this);
    this.updateStatus = this.updateStatus.bind(this);
    this.clearCache = this.clearCache.bind(this);
    this.clearGamepad = this.clearGamepad.bind(this);
    this.capture = false;
  }

  updateStatus() {
    if (navigator.getGamepads().length) {
      var gp = navigator.getGamepads()[0];
    }
    if (!gp || !this.capture) {
      return;
    }
    const analogThreshold = 0.1;

    var changedButtons = [];
    for (var i = 0; i < gp.buttons.length; i++) {
      var val = gp.buttons[i].value;
      var pressed = gp.buttons[i].pressed;
      if (
        !this.buttonsCache[i] ||
        Math.abs(this.buttonsCache[i].value - val) > analogThreshold ||
        this.buttonsCache[i].pressed !== pressed
      ) {
        var button = { idx: i, pressed: pressed, value: val };
        changedButtons.push(button);
      }
      this.buttonsCache[i] = { value: val, pressed: pressed };
    }

    var changedAxes = [];
    for (i = 0; i < gp.axes.length; i++) {
      val = gp.axes[i];
      if (Math.abs(val) < analogThreshold) {
        val = 0;
      }
      if (
        !this.axesCache[i] ||
        Math.abs(this.axesCache[i].value - val) > analogThreshold ||
        (this.axesCache[i].value !== val && Math.abs(val) === 1)
      ) {
        var ax = { idx: i, value: val };
        changedAxes.push(ax);
      }
      this.axesCache[i] = { value: val };
    }

    window.requestAnimationFrame(this.updateStatus);

    var events = { buttons: changedButtons, axes: changedAxes };
    if (changedButtons.length || changedAxes.length) {
      console.log(events);
      this.processEvents(JSON.stringify(events));
    }
  }

  clearCache() {
    this.buttonsCache = [];
    this.axesCache = [];
  }

  clearGamepad() {
    // release buttons and sticks
    var buttons = [];
    for (var i = 0; i < this.buttonsCache.length; i++) {
      buttons.push({ idx: i, pressed: false, value: 0 });
    }
    var axes = [];
    for (i = 0; i < this.axesCache.length; i++) {
      axes.push({ idx: i, value: 0 });
    }
    var events = { buttons: buttons, axes: axes };
    this.processEvents(JSON.stringify(events));
  }

  start() {
    this.capture = true;
    this.clearCache();
    this.updateStatus();
  }

  stop() {
    this.clearGamepad();
    this.capture = false;
  }

  onGamepadConnected(e) {
    this.updateStatus();
    console.log("gamepad connected: " + e.gamepad.id);
  }

  onGamepadDisconnected(e) {
    this.clearGamepad();
    this.clearCache();
    console.log("gamepad disconnected");
  }
}

export default Gamepad;
