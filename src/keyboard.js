class Keyboard {
  constructor(processKeys) {
    this.processKeys = processKeys;
    this.onKeyDown = this.onKeyDown.bind(this);
    this.onKeyUp = this.onKeyUp.bind(this);
    this.keys = [];
  }

  convertKeycodes(arr) {
    const map = {
      Space: 57,
      Enter: 28,
      Tab: 15,
      Escape: 1,
      Backspace: 14,
      ControlLeft: 29,
      ControlRight: 97,
      AltLeft: 56,
      AltRight: 100,
      CapsLock: 58,
      NumLock: 69,
      ShiftLeft: 42,
      ShiftRight: 54,
      KeyA: 30,
      KeyB: 48,
      KeyC: 46,
      KeyD: 32,
      KeyE: 18,
      KeyF: 33,
      KeyG: 34,
      KeyH: 35,
      KeyI: 23,
      KeyJ: 36,
      KeyK: 37,
      KeyL: 38,
      KeyM: 50,
      KeyN: 49,
      KeyO: 24,
      KeyP: 25,
      KeyQ: 16,
      KeyR: 19,
      KeyS: 31,
      KeyT: 20,
      KeyU: 22,
      KeyV: 47,
      KeyW: 17,
      KeyX: 45,
      KeyY: 21,
      KeyZ: 44,
      Digit1: 2,
      Digit2: 3,
      Digit3: 4,
      Digit4: 5,
      Digit5: 6,
      Digit6: 7,
      Digit7: 8,
      Digit8: 9,
      Digit9: 10,
      Digit0: 11,
      Semicolon: 39,
      Equal: 13,
      Comma: 51,
      Slash: 53,
      Period: 52,
      Backslash: 43,
      Backquote: 41,
      BracketLeft: 26,
      BracketRight: 27,
      Minus: 12,
      Quote: 40,
      F1: 59,
      F2: 60,
      F3: 61,
      F4: 62,
      F5: 63,
      F6: 64,
      F7: 65,
      F8: 66,
      F9: 67,
      F10: 68,
      F11: 87,
      F12: 88,
      ArrowLeft: 105,
      ArrowUp: 103,
      ArrowRight: 106,
      ArrowDown: 108,
      Insert: 110,
      Delete: 111,
      Home: 102,
      End: 107,
      PageUp: 104,
      PageDown: 109,
      NumpadDecimal: 83,
      Numpad0: 82,
      Numpad1: 79,
      Numpad2: 80,
      Numpad3: 81,
      Numpad4: 75,
      Numpad5: 76,
      Numpad6: 77,
      Numpad7: 71,
      Numpad8: 72,
      Numpad9: 73,
      NumpadAdd: 78,
      NumpadSubtract: 74,
      NumpadMultiply: 55,
      NumpadDivide: 98,
      NumpadEnter: 96
    };

    var convertedKeys = [];
    arr.forEach(function(a) {
      if (map[a] !== undefined) convertedKeys.push(map[a]);
    });
    return convertedKeys;
  }

  onKeyDown(e) {
    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation();
    this.keys = this.keys.filter(function(c) {
      return (
        c === "ShiftLeft" ||
        c === "ShiftRight" ||
        c === "ControlRight" ||
        c === "ControlLeft" ||
        c === "AltRight" ||
        c === "AltLeft"
      );
    });
    this.keys.push(e.code);
    var keysArray = this.convertKeycodes(this.keys);
    if (this.processKeys && keysArray.length) {
      var keycodes = {
        keycodes: keysArray,
        key: e.key,
        keyUnicode: e.key.length <= 1 ? e.key.charCodeAt(0) : 0
      };
      this.processKeys(JSON.stringify(keycodes));
    }
  }

  onKeyUp(e) {
    //console.log("keyup");
    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation();
    this.keys = this.keys.filter(function(c) {
      return c !== e.code;
    });
  }
}

export default Keyboard;
