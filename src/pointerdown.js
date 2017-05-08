// @flow
const hasPointer = window.PointerEvent !== undefined;
const hasTouch = window.TouchEvent !== undefined;
const eventName: string = hasPointer
    ? 'pointerdown'
    : hasTouch ? 'touchstart' : 'mousedown';

type Normalize = (event: Event & { touches?: MouseEvent[] }) => Event;
const normalize: Normalize = event => {
    if (!event.touches || !event.touches.length) {
        return event;
    }
    return event.touches[0];
};

type AddPointerDownListener = (Element, Function) => void;
const addPointerDownListener: AddPointerDownListener = (element, cb) => {
    element.addEventListener(eventName, event => {
        event.preventDefault();
        cb(normalize(event));
    });
};

module.exports = addPointerDownListener;
