function Painter(context, dom) {
  let dpr = window.devicePixelRatio;

  let c = document.createElement("canvas");
  c.width = 16 * dpr;
  c.height = 16 * dpr;
  c.style.position = "absolute";
  c.style.width = "16px";
  c.style.height = "16px";
  c.style.pointerEvents = "none";
  c.style.display = "none";

  let ctx = c.getContext("2d");
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(8 * dpr, 8 * dpr, 7, 0, Math.PI * 2);
  ctx.stroke();

  if (dom) dom.appendChild(c);

  let cx = null;
  let cy = null;
  let ccolor = null;
  let isNewLine = false;

  function draw(x1, y1, x2, y2) {
    if (isNewLine === true) {
      isNewLine = false;
      return;
    }

    let dx = x2 - x1;
    let dy = y2 - y1;
    let d = Math.sqrt(dx * dx + dy * dy) * 0.015;

    if (ccolor !== null) {
      context.beginPath();
      context.moveTo(x1, y1);
      context.lineTo(x2, y2);

      switch (ccolor) {
        case 0:
          context.strokeStyle = "rgba(0, 0, 0, " + (0.7 - d) + ")";
          break;
        case 1:
          context.strokeStyle = "rgba(0, 0, 238, " + (0.7 - d) + ")";
          break;
        case 2:
          context.strokeStyle = "rgba(0, 208, 0, " + (0.7 - d) + ")";
          break;
        case 3:
          context.strokeStyle = "rgba(238, 0, 238, " + (0.7 - d) + ")";
          break;
        case 4:
          context.strokeStyle = "rgba(238, 0, 0, " + (0.7 - d) + ")";
          break;
        case 5:
          context.strokeStyle = "rgba(119, 60, 0, " + (0.7 - d) + ")";
          break;
        case 6:
          context.strokeStyle = "rgba(238, 119, 0, " + (0.7 - d) + ")";
          break;
        case 7:
          context.strokeStyle = "rgba(238, 208, 0, " + (0.7 - d) + ")";
          break;
        case 8:
          context.strokeStyle = "rgba(238, 238, 238, " + (1 - d) + ")";
          break;
      }

      context.stroke();
    }
  }

  return {
    execute: function (data) {
      switch (data.getUint8(1)) {
        case 0: // POINTER_DOWN
          this.down(data.getUint16(2), data.getUint16(4), data.getUint8(6));
          break;

        case 1: // POINTER_UP
          this.up();
          break;

        case 2: // POINTER_MOVE_ABS
          this.move(data.getUint16(2), data.getUint16(4));
          break;

        case 3: // POINTER_DOWN_DELTA_8_8
          if (cx !== null) {
            this.move(cx + data.getInt8(2), cy + data.getInt8(3));
          }
          break;

        case 4: // POINTER_DOWN_DELTA_X
          if (cx !== null) {
            this.move(cx + data.getInt8(2), cy);
          }
          break;

        case 5: // POINTER_DOWN_DELTA_Y
          if (cx !== null) {
            this.move(cx, cy + data.getInt8(2));
          }
          break;

        case 6: // POINTER_DOWN_DELTA_4_4
          if (cx !== null) {
            this.move(
              cx + (data.getUint8(2) >> 4) - 8,
              cy + (data.getUint8(2) & 15) - 8
            );
          }
          break;

        case 8: // USER_DISCONNECT
          this.disconnect();
          break;
      }
    },
    move: function (x, y) {
      draw(cx, cy, x, y);

      cx = x;
      cy = y;

      //

      c.style.left = x / dpr - 8 + "px";
      c.style.top = y / dpr - 8 + "px";
    },
    down: function (x, y, color) {
      cx = x;
      cy = y;
      ccolor = color;

      //

      c.style.left = x / dpr - 8 + "px";
      c.style.top = y / dpr - 8 + "px";
      c.style.display = "";
    },
    up: function () {
      isNewLine = true;

      c.style.display = "none";
    },
    disconnect: function () {
      cx = null;
      cy = null;

      c.style.display = "none";
    },
  };
}

export { Painter };
