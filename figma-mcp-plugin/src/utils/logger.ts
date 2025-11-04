// Log output function (only logs needed for UI)
export function logToUI(message: string, type: 'log' | 'error' = 'log') {
  try {
    figma.ui.postMessage({
      type: type === 'error' ? 'error' : 'log',
      message: message,
    });
  } catch (e) {
    console.error('Error sending message to UI:', e);
  }
}

