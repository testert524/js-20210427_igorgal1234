class Tooltip {
  static #tooltipInstance = null;
  element = null;
  target = null;

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
    console.log(event.currentTarget);
    this._moveTo(event.clientX, event.clientY);
  }

  _moveTo(pageX, pageY) {
    const shift = 5;

    this.element.style.left = pageX + shift + 'px';
    this.element.style.top = pageY + shift + 'px';
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
