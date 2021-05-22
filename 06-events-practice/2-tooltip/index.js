class Tooltip {
  static #tooltipInstance = null;
  element = null;
  target = null;
  SHIFT = 5;

  constructor() {
    if (!Tooltip.#tooltipInstance) {
      Tooltip.#tooltipInstance = this;
    } else {
      return Tooltip.#tooltipInstance;
    }
  }

  initialize() {
    this.mousemoveHandler = this._mousemoveHandler.bind(this);
    this.pointeroverHandler = this._pointeroverHandler.bind(this);
    this.pointeroutHandler = this._pointeroutHandler.bind(this);
    this.initEventListeners();
  }

  initEventListeners() {
    document.addEventListener('pointerover', this.pointeroverHandler);
    document.addEventListener('pointerout', this.pointeroutHandler);
  }

  render() {
    this.element = document.createElement('div');
    this.element.className = 'tooltip';
    document.body.append(this.element);
  }

  _pointeroverHandler(event) {
    const target = event.target.closest('[data-tooltip]');

    if (!target) return;

    this.render();
    this.element.innerHTML = target.dataset.tooltip;
    this._moveTo(event.clientX, event.clientY);
    this.target = target;

    target.addEventListener('pointermove', this.mousemoveHandler);
  }

  _pointeroutHandler(event) {
    const target = event.target.closest('[data-tooltip]');

    if (!target) return;

    this.remove();
    this.target = null;
    target.removeEventListener('pointermove', this.mousemoveHandler);
  }

  _mousemoveHandler(event) {
    this._moveTo(event.clientX, event.clientY);
  }

  _moveTo(pageX, pageY) {
    this.element.style.left = pageX + this.SHIFT + 'px';
    this.element.style.top = pageY + this.SHIFT + 'px';
  }

  remove() {
    if (this.element) {
      this.element.remove();
    }
  }

  destroy() {
    this.remove();
    if (this.target) {
      this.target.removeEventListener('pointermove', this.mousemoveHandler);
    }
    document.removeEventListener('pointerover', this.pointeroverHandler);
    document.removeEventListener('pointerout', this.pointeroutHandler);
  }
}

export default Tooltip;
