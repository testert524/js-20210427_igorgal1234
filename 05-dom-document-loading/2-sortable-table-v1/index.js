export default class SortableTable {
  element = null;
  subElements = {};

  constructor(headerConfig = [], data = []) {
    this.headerConfig = headerConfig;
    this.data = data;

    this.render();
    this.initEventListeners();
  }

  render() {
    const element = document.createElement('div');

    element.innerHTML = this.template;
    this.element = element.firstElementChild;

    this.subElements = this.getSubElements(element);
  }

  getSubElements(parentElement) {
    const elements = parentElement.querySelectorAll(['data-element']);

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
        <div class="sortable-table__cell" data-id="${cell.id}" data-sortable="${cell.sortable}" data-order="${cell.order}">
            <span>${cell.title}</span>
        </div>
      `;
    }).join('');
  }

  get body() {
    return this.data.map((row) => {
      let result = `<a href="/products/${row.id}" class="sortable-table__row">`;

      for (const cellConfig of this.headerConfig) {
        if (cellConfig.hasOwnProperty('template')) {
          result += cellConfig.template(row[cellConfig.id]);
        } else {
          result += `<div class="sortable-table__cell">${row[cellConfig.id]}</div>`;
        }
      }
      result += `</a>`;

      return result;
    }).join('');
  }

  initEventListeners () {
    // NOTE: в данном методе добавляем обработчики событий, если они есть
  }

  remove () {
    this.element.remove();
  }

  destroy() {
    this.remove();
    // NOTE: удаляем обработчики событий, если они есть
  }
}

