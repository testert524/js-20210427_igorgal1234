const DEFAULT_TOP_SHIFT = 5;

export default class SortableList {
  element = null;
  draggable = null;
  placeholder = null;
  pointerShift = {};

  pointerdownHandler = event => {
    const target = event.target;
    const grabHandle = target.closest('[data-grab-handle]');
    const deleteHandle = target.closest('[data-delete-handle]');

    if (grabHandle) {
      this.grabListItem(event);
      this.initEventListeners();
    }

    if (deleteHandle) {
      target.closest('.sortable-list__item').remove();
    }
  };

  mousemoveHandler = event => {
    this.move(this.draggable, event.clientX, event.clientY);

    const draggableBottom = this.draggable.getBoundingClientRect().bottom;

    const prev = this.placeholder.previousElementSibling;
    const next = this.placeholder.nextElementSibling;

    const isPrevAppropriate = prev && prev !== this.draggable;
    const isNextAppropriate = next && next !== this.draggable;

    if (isPrevAppropriate && (prev.getBoundingClientRect().bottom + DEFAULT_TOP_SHIFT > draggableBottom)) {
      this.placeholder.replaceWith(prev);
      prev.before(this.placeholder);
    } else if (isNextAppropriate && (next.getBoundingClientRect().bottom - DEFAULT_TOP_SHIFT < draggableBottom)) {
      this.placeholder.replaceWith(next);
      next.after(this.placeholder);
    }
  };

  pointerupHandler = event => {
    document.removeEventListener('mousemove', this.mousemoveHandler, true);
    document.removeEventListener('pointerup', this.pointerupHandler, true);
    document.removeEventListener('selectionchange', this.selectionchangeHandler, true);

    this.placeholder.replaceWith(this.draggable);

    this.draggable.style = '';
    this.draggable.classList.remove('sortable-list__item_dragging');

    this.draggable = null;
    this.placeholder = null;
    this.pointerShift = {};
  };

  selectionchangeHandler = () => {
    document.getSelection().empty();
  };

  constructor({items = []} = {}) {
    this.items = items;

    this.render();
    this.initEventListeners();
  }

  render() {
    this.element = document.createElement('ul');
    this.element.className = 'sortable-list' ;
    this.element.innerHTML = [...this.items].map(item => {
      item.classList.add('sortable-list__item');

      return item.outerHTML;
    }).join('');
  }

  initEventListeners() {
    this.element.addEventListener('pointerdown', this.pointerdownHandler, true);

    if (this.draggable) {
      document.addEventListener('mousemove', this.mousemoveHandler, true);
      document.addEventListener('pointerup', this.pointerupHandler, true);
      document.addEventListener('selectionchange', this.selectionchangeHandler, true);
    }
  }

  grabListItem(event) {
    const draggable = event.target.closest('.sortable-list__item');
    const placeholder = document.createElement('div');

    const draggableStyles = getComputedStyle(draggable);
    const styles = {
      height: draggableStyles.height,
      width: draggableStyles.width
    };

    this.pointerShift = this.getPointerShift(draggable, event);

    draggable.classList.add('sortable-list__item_dragging');
    placeholder.className = 'sortable-list__placeholder';

    this.applyStyles(placeholder, styles);
    this.applyStyles(draggable, styles);

    draggable.before(placeholder);
    this.element.append(draggable);

    draggable.ondragstart = () => false;

    this.move(draggable, event.clientX, event.clientY);

    this.draggable = draggable;
    this.placeholder = placeholder;
  }

  applyStyles(element, styles) {
    Object.entries(styles).forEach(appliedStyle => {
      element.style[appliedStyle[0]] = appliedStyle[1];
    });
  }

  getPointerShift(draggable, event) {
    const draggableBCR = draggable.getBoundingClientRect();

    return {
      shiftX: event.clientX - draggableBCR.left,
      shiftY: event.clientY - draggableBCR.top
    };
  }

  move(element, clientX, clientY) {
    element.style.left = clientX - this.pointerShift.shiftX + 'px';
    element.style.top = clientY - this.pointerShift.shiftY + DEFAULT_TOP_SHIFT + 'px';
  }

  remove() {
    if (this.element) {
      this.element.remove();
    }
  }

  destroy() {
    this.remove();
    this.element = null;
    document.removeEventListener('mousemove', this.mousemoveHandler, true);
    document.removeEventListener('pointerup', this.pointerupHandler, true);
    document.removeEventListener('selectionchange', this.selectionchangeHandler, true);
  }
}
