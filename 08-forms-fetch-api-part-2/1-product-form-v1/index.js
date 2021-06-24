import escapeHtml from './utils/escape-html.js';
import fetchJson from './utils/fetch-json.js';

const IMGUR_CLIENT_ID = '28aaa2e823b03b1';
const BACKEND_URL = 'https://course-js.javascript.ru';

const DEFAULT_PRICE = 100;
const DEFAULT_DISCOUNT = 0;
const DEFAULT_QUANTITY = 1;

export default class ProductForm {
  element = null;
  subElements = [];
  product = {};

  loadImage = event => {
    const loadImgButton = event.target;
    const input = document.createElement('input');

    input.type = 'file';

    input.dispatchEvent(new MouseEvent("click"));

    input.onchange = async event => {
      const imgFile = event.target.files[0];

      loadImgButton.classList.add('is-loading');

      const response = await this.uploadToImgur(imgFile);

      loadImgButton.classList.remove('is-loading');

      if (response && response.data) {
        const img = {
          source: imgFile.name,
          url: response.data.link
        };
        this.setImgToProduct(this.product, img);
        this.pushToImagesList(img);
      }
    };
  };

  removeImage = event => {
    if (!event.target.dataset.hasOwnProperty('deleteHandle')) return;

    const imageItem = event.target.closest('li');
    const url = imageItem.querySelector('[name = url]').value;
    const source = imageItem.querySelector('[name = source]').value;

    this.removeImgFromProduct(this.product, {url, source});
    imageItem.remove();
  };

  save = async () => {
    const form = this.subElements.productForm;

    if (!this.validateForm(form)) return;

    let method = 'PUT';
    let event = 'product-saved';

    if (this.product.id) {
      method = 'PATCH';
      event = 'product-updated';
    }

    this.fillObjectWithForm(this.product, form);

    try {
      const url = new URL('api/rest/products', BACKEND_URL);
      const params = {
        method: method,
        headers: {
          'Content-type': 'application/json;charset=utf-8'
        },
        body: JSON.stringify(this.product)
      };

      const response = await fetchJson(url.href, params);

      this.element.dispatchEvent(new CustomEvent(event, {
        detail: { event: event }
      }));
    } catch (error) {
      console.log('error', error);
    }
  }

  constructor (productId = null) {
    this.productId = productId;
  }

  async render () {
    const wrapper = document.createElement('div');

    wrapper.innerHTML = this.getForm();
    this.element = wrapper.firstElementChild;
    this.subElements = this.getSubElements(this.element);

    this.initEventListeners();
    const data = await this.loadData(this.productId);

    this.product = data.product;

    this.fillCatSelect(data.categories, this.product.subcategory);

    if (this.product.id) {
      this.fillFormWithObject(this.subElements.productForm, this.product);
    } else {
      this.fillFormWithDefaults(this.subElements.productForm);
    }

    if (this.product.hasOwnProperty('images')) {
      this.fillImages(this.product.images);
    }

    return this.element;
  }

  initEventListeners() {
    const formEls = this.subElements.productForm.elements;

    this.subElements.productForm.addEventListener('submit', event => event.preventDefault());
    this.subElements.imageListContainer.addEventListener('pointerdown', this.removeImage);
    formEls.uploadImage.addEventListener('pointerdown', this.loadImage);
    formEls.save.addEventListener('pointerdown', this.save);
  }

  validateForm(form) {
    let isValid = true;

    Array.from(form.elements).forEach(element => {
      if (!element.validity.valid) {
        isValid = false;
      }
    });

    return isValid;
  }

  async uploadToImgur(img) {
    const headers = new Headers();
    headers.append("Authorization", `Client-ID ${IMGUR_CLIENT_ID}`);

    const formData = new FormData();
    formData.append('image', img);

    const requestOptions = {
      method: 'POST',
      headers: headers,
      body: formData,
      redirect: 'follow'
    };

    try {
      return await fetchJson("https://api.imgur.com/3/image", requestOptions);
    } catch (error) {
      console.log('error', error);
    }
  }

  setImgToProduct(product, img) {
    if (product.images) {
      product.images.push(img);
    } else {
      product.images = [img];
    }
  }

  pushToImagesList(img) {
    const list = this.subElements.imageListContainer.querySelector('.sortable-list');

    list.insertAdjacentHTML('beforeend', this.getImageLine(img));
  }

  removeImgFromProduct(product, img) {
    const index = product.images.findIndex(image => {
      if (image.source === img.source && image.url === img.url) {
        return true;
      }
    });

    product.images.splice(index, 1);
  }

  fillObjectWithForm(object, form) {
    const formEls = form.elements;

    object.title = formEls.title.value;
    object.description = formEls.description.value;
    object.price = Number(formEls.price.value);
    object.discount = Number(formEls.discount.value);
    object.quantity = Number(formEls.quantity.value);
    object.status = Number(formEls.status.value);
    object.subcategory = formEls.subcategory.value;
  }

  fillFormWithObject(form, object) {
    const formEls = form.elements;

    formEls.title.value = object.title;
    formEls.description.value = object.description;
    formEls.price.value = object.price.toString();
    formEls.discount.value = object.discount.toString();
    formEls.quantity.value = object.quantity.toString();
    formEls.status.value = object.status.toString();
  }

  fillFormWithDefaults(form) {
    const formEls = form.elements;

    formEls.price.value = DEFAULT_PRICE;
    formEls.discount.value = DEFAULT_DISCOUNT;
    formEls.quantity.value = DEFAULT_QUANTITY;
  }

  fillImages(images) {
    this.subElements.imageListContainer.querySelector('.sortable-list').innerHTML = this.getImageList(images);
  }

  fillCatSelect(categories, selectedValue) {
    const formEls = this.subElements.productForm.elements;

    if (!categories.length) return;

    formEls.subcategory.innerHTML = this.getCatSelectOptions(categories);

    if (selectedValue) {
      formEls.subcategory.value = selectedValue;
    } else {
      formEls.subcategory.selectedIndex = 0;
    }
  }

  getCatSelectOptions(categoriesArray) {
    return categoriesArray.map(category => {
      if (category.subcategories) {
        return category.subcategories.map(subcategory => {
          return `<option value="${subcategory.id}">${category.title} > ${subcategory.title}</option>`;
        }).join('');
      }
    }).join('');
  }

  async loadData(id = null) {
    try {
      let [categories, product] = await Promise.all([
        this.getProductDataPromise(id),
        this.getCategoriesPromise()
      ]);

      return {product: product[0], categories};
    } catch (err) {
      console.log(err);
    }
  }

  async getProductDataPromise(id) {
    if (id) {
      const productUrl = new URL('api/rest/products', BACKEND_URL);
      productUrl.searchParams.append('id', id);

      return fetchJson(productUrl.href);
    } else {
      return Promise.resolve([{}]);
    }
  }

  async getCategoriesPromise() {
    const categoriesUrl = new URL('api/rest/categories', BACKEND_URL);
    categoriesUrl.searchParams.append('_sort', 'weight');
    categoriesUrl.searchParams.append('_refs', 'subcategory');

    return fetchJson(categoriesUrl.href);
  }

  getSubElements(element) {
    const subElements = Array.from(element.querySelectorAll('[data-element]'));

    return subElements.reduce((result, subElement) => {
      result[subElement.dataset.element] = subElement;

      return result;
    }, {});
  }

  getImageLine(image) {
    return `
      <li class="products-edit__imagelist-item sortable-list__item" style="">
        <input type="hidden" name="url" value="${escapeHtml(image.url)}">
        <input type="hidden" name="source" value="${escapeHtml(image.source)}">
        <span>
            <img src="icon-grab.svg" data-grab-handle="" alt="grab">
            <img class="sortable-table__cell-img" alt="Image" src="${escapeHtml(image.url)}">
            <span>${escapeHtml(image.source)}</span>
        </span>
        <button type="button">
          <img src="icon-trash.svg" data-delete-handle="" alt="delete">
        </button>
      </li>`;
  }

  getImageList(imagesArray) {
    if (imagesArray.length) {
      return imagesArray.map(image => {
        return this.getImageLine(image);
      }).join('');
    } else {
      return '';
    }
  }

  getForm() {
    return `
      <div class="product-form">
        <form data-element="productForm" class="form-grid">
          <div class="form-group form-group__half_left">
            <fieldset>
              <label class="form-label">Название товара</label>
              <input id="title" required="" type="text" name="title" class="form-control" placeholder="Название товара">
            </fieldset>
          </div>
          <div class="form-group form-group__wide">
            <label class="form-label">Описание</label>
            <textarea id="description" required="" class="form-control" name="description" data-element="productDescription" placeholder="Описание товара"></textarea>
          </div>
          <div class="form-group form-group__wide" data-element="sortable-list-container">
            <label class="form-label">Фото</label>
            <div data-element="imageListContainer"><ul class="sortable-list"></ul></div>
            <button type="button" name="uploadImage" class="button-primary-outline"><span>Загрузить</span></button>
          </div>
          <div class="form-group form-group__half_left">
            <label class="form-label">Категория</label>
            <select class="form-control" name="subcategory" id="subcategory"></select>
          </div>
          <div class="form-group form-group__half_left form-group__two-col">
            <fieldset>
              <label class="form-label">Цена ($)</label>
              <input id="price" equired="" type="number" name="price" class="form-control" placeholder="100">
            </fieldset>
            <fieldset>
              <label class="form-label">Скидка ($)</label>
              <input id="discount" required="" type="number" name="discount" class="form-control" placeholder="0">
            </fieldset>
          </div>
          <div class="form-group form-group__part-half">
            <label class="form-label">Количество</label>
            <input id="quantity" required="" type="number" class="form-control" name="quantity" placeholder="1">
          </div>
          <div class="form-group form-group__part-half">
            <label class="form-label">Статус</label>
            <select id="status" class="form-control" name="status">
              <option value="1">Активен</option>
              <option value="0">Неактивен</option>
            </select>
          </div>
          <div class="form-buttons">
            <button type="submit" name="save" class="button-primary-outline">
              Сохранить товар
            </button>
          </div>
        </form>
      </div>`;
  }

  remove() {
    if (this.element) {
      this.element.remove();
    }
  }

  destroy() {
    this.remove();
    this.element = null;
    this.subElements = [];
    this.product = {};
  }
}
