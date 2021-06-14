import fetchJson from './utils/fetch-json.js';

const BACKEND_URL = 'https://course-js.javascript.ru';

export default class SortableTable {
  element = null;
  subElements = {};
  data = [];
  loadStart = 0;
  loadLength = 30;

  pointerdownHandler = event => {
    const target = event.target.closest('[data-sortable = "true"]');

    if (!target) return;

    event.preventDefault();

    this.sorted.id = target.dataset.id;
    this.sorted.order = (target.dataset.order === 'desc') ? 'asc' : 'desc';

    Array.from(this.subElements.header.children).map(cell => cell.dataset.order = '');
    target.dataset.order = this.sorted.order;

    if (this.isSortLocally) {
      this.sortOnClient(this.sorted.id, this.sorted.order);
    } else {
      this.sortOnServer(this.sorted.id, this.sorted.order);
    }
  }

  scrollHandler = async event => {
    let scrollHeight = Math.max(
      document.body.scrollHeight, document.documentElement.scrollHeight,
      document.body.offsetHeight, document.documentElement.offsetHeight,
      document.body.clientHeight, document.documentElement.clientHeight
    );

    const firePointer = scrollHeight - document.documentElement.clientHeight;

    if (window.pageYOffset === firePointer) {
      this.loadStart = this.loadStart + this.loadLength;
      const loadedData = await this.loadData(this.sorted.id, this.sorted.order, this.loadStart, this.loadLength);

      this.subElements.body.innerHTML += this.getBodyRows(loadedData);
    }
  }

  constructor(headersConfig, {
    url = '',
    isSortLocally = false,
    sorted = {
      id: headersConfig.find(item => item.sortable).id,
      order: 'asc'
    }
  } = {}) {
    this.url = url;
    this.isSortLocally = isSortLocally;
    this.headerConfig = headersConfig;
    this.sorted = sorted;

    this.render();
  }

  async render() {
    const element = document.createElement('div');
    const {id, order} = this.sorted;

    element.innerHTML = this.getTable(this.data);
    this.element = element.firstElementChild;
    this.subElements = this.getSubElements(this.element);

    this.data = await this.loadData(id, order, this.loadStart, this.loadLength);

    if (this.data.length) {
      this.subElements.body.innerHTML = this.getBodyRows(this.data);
    } else {
      Array.from(this.subElements.header.children).map(cell => cell.dataset.order = '');
      this.showEmptyPlaceholder();
    }
    this.initEventListeners();
  }

  getTable(data) {
    return `
      <div class="sortable-table">
          ${this.getHeader()}
          ${this.getBody(data)}
          ${this.getLoading()}
          ${this.getEmptyPlaceholder()}
      </div>
    `;
  }

  getHeader() {
    return `
      <div data-element="header" class="sortable-table__header sortable-table__row">${this.getHeaderRow()}</div>
    `;
  }

  getHeaderRow() {
    return this.headerConfig.map(({id, sortable, title}) => {
      const order = (id === this.sorted.id) ? this.sorted.order : '';

      return `
        <div class="sortable-table__cell"
            data-id="${id}"
            data-sortable="${sortable}"
            data-order="${order}"
            <span>${title}</span>
            <span data-element="arrow" class="sortable-table__sort-arrow">
                <span class="sort-arrow"></span>
            </span>
        </div>
      `;
    }).join('');
  }

  getBody(data) {
    return `
      <div data-element="body" class="sortable-table__body">${this.getBodyRows(data)}</div>
    `;
  }

  getBodyRows(data) {
    return data.map((rowData) => {
      return `
        <a href="/products/${rowData.id}" class="sortable-table__row">${this.getBodyRow(rowData)}</a>
      `;
    }).join('');
  }

  getBodyRow(rowData) {
    return Array.from(this.headerConfig).map(({id, template}) => {
      if (template) {
        return template(rowData[id]);
      } else {
        return `<div class="sortable-table__cell">${rowData[id]}</div>`;
      }
    }).join('');
  }

  getLoading() {
    return `
      <div data-element="loading" class="loading-line sortable-table__loading-line"></div>
    `;
  }

  getEmptyPlaceholder() {
    return `
      <div data-element="emptyPlaceholder" class="sortable-table__empty-placeholder">
        <div>
          <p>No products satisfies your filter criteria</p>
          <button type="button" class="button-primary-outline">Reset all filters</button>
        </div>
      </div>
    `;
  }

  sortOnClient (id, order) {
    const sortedData = this.sort(id, order);

    this.subElements.body.innerHTML = this.getBodyRows(sortedData);
  }

  async sortOnServer (id, order) {
    this.loadStart = 0;

    const loadedData = await this.loadData(id, order, this.loadStart, this.loadLength);

    if (loadedData.length) {
      this.subElements.body.innerHTML = this.getBodyRows(loadedData);
    }
  }

  sort(id, order) {
    return Array.from(this.data).sort((productA, productB) => {
      const a = productA[id];
      const b = productB[id];
      const column = this.headerConfig.find(item => item.id === id);
      const {sortType, customSorting} = column;
      let result = null;

      switch (sortType) {
      case 'number':
        result = a - b;
        break;
      case 'string':
        result = a.localeCompare(b, ['ru-u-kf-upper', 'en-u-kf-upper']);
        break;
      case 'custom':
        result = customSorting(a, b);
        break;
      default:
        result = a - b;
      }

      if (order === 'asc') {
        return result;
      } else if (order === 'desc') {
        return -result;
      }
    });
  }

  getSubElements(parentElement) {
    const elements = parentElement.querySelectorAll('[data-element]');

    return [...elements].reduce((accum, subElement) => {
      accum[subElement.dataset.element] = subElement;

      return accum;
    }, {});
  }

  async loadData(sortId, sortOrder, start, length) {
    if (!this.url) return;

    this.setLoadingInd();

    const url = new URL(this.url, BACKEND_URL);
    url.searchParams.set('_sort', sortId);
    url.searchParams.set('_order', sortOrder);
    url.searchParams.set('_start', start.toString());
    url.searchParams.set('_end', (start + length).toString());

    let loadedData = [];
    try {
      loadedData = await fetchJson(url.href);
    } catch (err) {
      console.log(err);
    }
    this.removeLoadingInd();

    return loadedData;
  }

  setLoadingInd() {
    this.subElements.loading.style.display = 'block';
  }

  removeLoadingInd() {
    this.subElements.loading.style.display = 'none';
  }

  showEmptyPlaceholder() {
    this.subElements.emptyPlaceholder.style.display = 'block';
  }

  initEventListeners () {
    this.subElements.header.addEventListener('pointerdown', this.pointerdownHandler);
    window.addEventListener('scroll', this.scrollHandler);
  }

  remove () {
    if (this.element) {
      this.element.remove();
    }
  }

  destroy() {
    this.remove();
    this.element = null;
    this.subElements = {};
  }
}
