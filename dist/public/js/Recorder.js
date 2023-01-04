import { Painter } from "./Painter.js";

function Recorder(context, ws) {
  const client = new Painter(context);

  const commands = [
    // 0: POINTER_DOWN: USER_ID(UINT8), EVENT_ID(UINT8), X(UINT16), Y(UINT16), COLOR_ID(UINT8)
    new DataView(new ArrayBuffer(1 + 1 + 2 + 2 + 1)),
    // 1: POINTER_UP: USER_ID(UINT8), EVENT_ID(UINT8)
    new DataView(new ArrayBuffer(1 + 1)),
    // 2: POINTER_MOVE_ABS: USER_ID(UINT8), EVENT_ID(UINT8), X(UINT16), Y(UINT16)
    new DataView(new ArrayBuffer(1 + 1 + 2 + 2)),
    // 3: POINTER_MOVE_DELTA_8_8: USER_ID(UINT8), EVENT_ID(UINT8), DX(INT8), DY(INT8)
    new DataView(new ArrayBuffer(1 + 1 + 1 + 1)),
    // 4: POINTER_MOVE_DELTA_X: USER_ID(UINT8), EVENT_ID(UINT8), DX(INT8)
    new DataView(new ArrayBuffer(1 + 1 + 1)),
    // 5: POINTER_MOVE_DELTA_Y: USER_ID(UINT8), EVENT_ID(UINT8), DY(INT8)
    new DataView(new ArrayBuffer(1 + 1 + 1)),
    // 6: POINTER_MOVE_DELTA_4_4: USER_ID(UINT8), EVENT_ID(UINT8), DXDY(UINT8)
    new DataView(new ArrayBuffer(1 + 1 + 1)),
  ];

  let cx = 0;
  let cy = 0;
  let ccolor = 0;

  function isNotInt8(value) {
    return value > 127 || value < -128;
  }

  function isInt4(value) {
    return value >= -8 && value <= 7;
  }

  return {
    down: function (x, y) {
      client.down(x, y, ccolor);

      let command = commands[0];
      command.setUint8(1, 0);
      command.setUint16(2, x);
      command.setUint16(4, y);
      command.setUint8(6, ccolor);

      cx = x;
      cy = y;

      if (ws.readyState === WebSocket.OPEN) {
        ws.send(command.buffer);
      }
    },
    up: function () {
      client.up();

      let command = commands[1];
      command.setUint8(1, 1);

      if (ws.readyState === WebSocket.OPEN) {
        ws.send(command.buffer);
      }
    },
    move: function (x, y) {
      client.move(x, y);

      let dx = x - cx;
      let dy = y - cy;

      let command;

      if (isNotInt8(dx) || isNotInt8(dy)) {
        command = commands[2];
        command.setUint8(1, 2);
        command.setUint16(2, x);
        command.setUint16(4, y);

      } else {
        if (isInt4(dx) && isInt4(dy)) {
          command = commands[6];
          command.setUint8(1, 6);
          command.setUint8(2, ((dx + 8) << 4) | (dy + 8));
        } else if (dx === 0) {
          command = commands[5];
          command.setUint8(1, 5);
          command.setInt8(2, dy);
        } else if (dy === 0) {
          command = commands[4];
          command.setUint8(1, 4);
          command.setInt8(2, dx);
        } else {
          command = commands[3];
          command.setUint8(1, 3);
          command.setInt8(2, dx);
          command.setInt8(3, dy);
        }
      }

      cx = x;
      cy = y;

      if (ws.readyState === WebSocket.OPEN) {
        ws.send(command.buffer);

        const md = dx * dx + dy * dy;

        if (md > 80000) {
          ws.close();
          client.up();
        }
      }
    },
    color: function (color) {
      ccolor = color;
    },
  };
}

export { Recorder };
