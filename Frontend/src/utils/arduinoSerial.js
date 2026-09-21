let arduinoPort = null;
let arduinoWriter = null;

export async function connectArduino(onMessage) {
  if (arduinoPort && arduinoWriter) {
    if (onMessage) onMessage("Already connected to Arduino.");
    return true;
  }
  try {
    if (!navigator.serial) {
      if (onMessage) onMessage("Web Serial API not supported by this browser.");
      return false;
    }
    arduinoPort = await navigator.serial.requestPort();
    await arduinoPort.open({ baudRate: 9600 });

    // Board reset buffer
    await new Promise(resolve => setTimeout(resolve, 2000));
    arduinoWriter = arduinoPort.writable.getWriter();
    if (onMessage) onMessage("Connected to Arduino LED alert device.");
    return true;
  } catch (err) {
    console.error("Arduino connection failed:", err);
    if (onMessage) onMessage(`Failed to connect: ${err.message || err.name}`);
    return false;
  }
}

export async function sendToArduino(message, onMessage) {
  if (!arduinoWriter) {
    console.warn("Arduino not connected yet.");
    if (onMessage) onMessage("LED device not connected — click 'Connect LED Alert Device' first.");
    return false;
  }
  try {
    const encoder = new TextEncoder();
    await arduinoWriter.write(encoder.encode(message + "\n"));
    return true;
  } catch (err) {
    console.error("Error sending to Arduino:", err);
    if (onMessage) onMessage("Lost connection to LED device — please reconnect.");
    try {
      arduinoWriter.releaseLock();
    } catch (e) {}
    arduinoWriter = null;
    arduinoPort = null;
    return false;
  }
}

export function isArduinoConnected() {
  return !!(arduinoPort && arduinoWriter);
}
