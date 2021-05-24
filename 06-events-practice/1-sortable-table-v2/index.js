export default class SortableTable {
  element = null;
  subElements = {};

  constructor(headersConfig, {
    data = [],
    sorted = {}
  } = {}) {
    this.headerConfig = headersConfig;
    this.data = data;
    this.sorted = sorted;
    this.pointerdownHandler = this._pointerdownHandler.bind(this);

    this.render();
    this.initEventListeners();
  }

  render() {
    const element = document.createElement('div');

    element.innerHTML = this.template;
    this.element = element.firstElementChild;

    this.subElements = this.getSubElements(this.element);

    this.sort(this.sorted.id, this.sorted.order);
  }

  getSubElements(parentElement) {
    const elements = parentElement.querySelectorAll('[data-element]');

    return [...elements].reduce((accum, subElement) => {
      accum[subElement.dataset.element] = subElement;

      return accum;
    }, {});
  }

  get template() {
    return `
      <div data-element="productsContainer" class="products-list__container">
        <div class="sortable-table">
            <div data-element="header" class="sortable-table__header sortable-table__row">${this.header}</div>
            <div data-element="body" class="sortable-table__body">${this.body}</div>
            <div data-element="loading" class="loading-line sortable-table__loading-line"></div>
            <div data-element="emptyPlaceholder" class="sortable-table__empty-placeholder">
              <div>
                <p>No products satisfies your filter criteria</p>
                <button type="button" class="button-primary-outline">Reset all filters</button>
              </div>
            </div>
        </div>
      </div>
    `;
  }

  get header() {
    return this.headerConfig.map((cell) => {
      return `
        <div class="sortable-table__cell"
            data-id="${cell.id}"
            data-sortable="${cell.sortable}"
            data-order=""
            data-sort-type="${cell.sortType}">
            <span>${cell.title}</span>
        </div>
      `;
    }).join('');
  }

  get body() {
    return this.data.map((row) => {
      let result = `<a href="/products/${row.id}" class="sortable-table__row">`;

      result += Array.from(this.headerConfig).map((cellConfig) => {
        if (cellConfig.hasOwnProperty('template')) {
          return cellConfig.template(row[cellConfig.id]);
        } else {
          return `<div class="sortable-table__cell" data-id="${cellConfig.id}">${row[cellConfig.id]}</div>`;
        }
      }).join('');

      result += `</a>`;

      return result;
    }).join('');
  }

  sort(field, order) {
    let sortableCell = null;
    const sortArrow = `
        <span data-element="arrow" class="sortable-table__sort-arrow">
          <span class="sort-arrow"></span>
        </span>`;

    Array.from(this.subElements.header.children).map((cell) => {
      const arrow = cell.querySelector('[data-element = arrow]');

      cell.dataset.order = '';
      if (arrow) {
        arrow.remove();
      }
      if (cell.dataset.id === field) {
        sortableCell = cell;
      }
    });

    if (!sortableCell.dataset.sortable) return;

    sortableCell.dataset.order = order;
    sortableCell.insertAdjacentHTML('beforeend', sortArrow);

    const sorted = Array.from(this.subElements.body.children).sort((elemA, elemB) => {
      const a = elemA.querySelector('[data-id = ' + field + ']').innerHTML;
      const b = elemB.querySelector('[data-id = ' + field + ']').innerHTML;
      let result = null;

      switch (sortableCell.dataset.sortType) {
      case 'number':
        result = a - b;
        break;
      case 'string':
        result = a.localeCompare(b, ['ru-u-kf-upper', 'en-u-kf-upper']);
        break;
      }

      if (order === 'asc') {
        return result;
      } else if (order === 'desc') {
        return -result;
      }
    });
    this.subElements.body.innerHTML = '';
    this.subElements.body.append(...sorted);
  }


  initEventListeners () {
    this.element.addEventListener('pointerdown', this.pointerdownHandler);
  }

  _pointerdownHandler(event) {
    const target = event.target.closest('.sortable-table__cell');

    if (target && target.dataset.sortable === 'true') {
      event.preventDefault();

      const order = (target.dataset.order === 'desc') ? 'asc' : 'desc';

      this.sort(target.dataset.id, order);
    }
  }

  remove () {
    if (this.element) {
      this.element.remove();
    }
  }

  destroy() {
    this.element.removeEventListener('pointerdown', this.pointerdownHandler);
    this.remove();
    this.subElements = {};
  }
}
