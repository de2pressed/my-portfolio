const ADMIN_SEQUENCE = "de2pressed";

function isTypingSurface(element: Element | null) {
  if (!element) {
    return false;
  }

  const tagName = element.tagName.toLowerCase();
  return (
    tagName === "input" ||
    tagName === "textarea" ||
    tagName === "select" ||
    (element as HTMLElement).isContentEditable
  );
}

export function createAdminKeyListener(onComplete: () => void) {
  let buffer = "";

  return (event: KeyboardEvent) => {
    if (isTypingSurface(document.activeElement)) {
      buffer = "";
      return;
    }

    if (event.key.length !== 1) {
      return;
    }

    buffer = `${buffer}${event.key.toLowerCase()}`.slice(-ADMIN_SEQUENCE.length);

    if (buffer === ADMIN_SEQUENCE) {
      buffer = "";
      onComplete();
    }
  };
}
