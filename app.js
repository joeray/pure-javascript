let result = {};
let currentPage = 0;
let amountPages = 0;
let pageSearch = 1;
let searched = '';
function request(param, page) {
  page = parseInt(page) + 1;
  return new Promise((resolve, reject) => {
    let xhr = new XMLHttpRequest();
    xhr.open("GET", `http://www.omdbapi.com/?apikey=2065290d&&s=${param}&page=${page}`, true);
    xhr.send();
    xhr.onload = () => {
      if (xhr.status != 200) {
      } else {
        resolve(xhr.response);
      }
    }
    xhr.onerror = () => {
      reject('Server not available');
    }
  })
}

const template = document.createElement('template');
template.innerHTML = `
  <style>
    p {
      color: white;
    }
    .card {
      width: 99%;
      height: 350px;
      position: relative;
      background: white;
    }
    #title {
      position: absolute;
      bottom: 0;
      width: 100%;
      background-image: linear-gradient(rgba(0,0,0, 0.2), grey);
      height: 22%;
      color: white;
      padding: 0 10px;
      box-sizing: border-box;
      font-weight: bold;
      font-size: 20px;
      display: -webkit-box;
      -webkit-box-align: center;
      -webkit-line-clamp: 3;
      line-height: 1.3;
      overflow: hidden;
    }
    .see-more {
      position: absolute;
      right: 7px;
      bottom: 5px;
      background: black;
      line-height: 1;
      padding: 0px 2px;
      font-size: 12px;
      cursor: pointer;
    }
    .more {
      width:100%;
      height: 40%;
      background: rgba(0, 0, 0, 0.5);
      position:absolute;
      bottom: 0;
      padding: 1px 5px;
      box-sizing: border-box;
    }
    .hide {
      display:none; 
    }
    .show {
      display:block; 
    }
    video {
      margin-top: -18px;
      margin-left: 2px;
    }
    #sample {
      cursor: pointer;
    }
  </style>
  <div class="card">
    <div id="title"><span class="see-more">+</span></div>
    <img id="poster" width="100%">
    <div id="more" class="more hide">
    <p class="type"></p>
    <p class="year"></p>
    <p class="imdbID"></p>
    <p id="sample">View sample ></p>
    </div>
    <video width="99%" height="350" class="hide" controls>
      <source src="http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4" type="video/mp4">
      Your browser does not support the video tag.
    </video>
  </div>
`;

window.document.addEventListener('DOMContentLoaded', function () {
  const url = window.location.href;
  let urlSections = url.split('?');
  if (urlSections[1]) {
    currentPage = urlSections[1].split('=')[1];
    search(localStorage.searched, currentPage);
  } else {
    search('movie', 0);
  }
});

function search(value, page, remain) {
  localStorage.searched = value;
  request(value, page)
    .then((res) => {
      if (!remain) {
        document.querySelector('.main').innerHTML = '';
      }
      const result = JSON.parse(res);
      fillContent(result.Search, page);
      getAmountPages(result.totalResults);
      fillPagination(amountPages);
    })
    .catch((err) => {
      document.querySelector('.main').insertAdjacentHTML('afterbegin', err);
    })
}

function getAmountPages(totalResults) {
  const prevAmountPages = amountPages;
  amountPages = (totalResults % 10 > 0) ? Math.round(totalResults / 10) + 1 : totalResults / 10;
  if (isNaN(amountPages)) { amountPages = prevAmountPages; }
  return amountPages;
}

function fillPagination(account) {
  document.querySelector('.pagination').innerHTML = '';
  for (let i = 0; i < account; i++) {
    document.querySelector('.pagination')
      .insertAdjacentHTML('beforeend', `<a href="index.html?page=${i}">${i}</a> `);
  }
}

function resizeObs() {
  var options = {
    root: document.querySelector('.main'),
    rootMargin: '0px',
    threshold: 1.0
  }

  var observer = new IntersectionObserver(callback, options);
  var target = document.querySelectorAll('single-movie');
  for (const ind in target) {
    if (typeof target[ind] === 'object' && ind == target.length - 1) {
      observer.observe(target[ind]);
    }
  }

  function callback(entries) {
    entries.forEach(entry => {
      if (entry.intersectionRatio > 0) {
        currentPage = parseInt(currentPage) + 1;
        if (currentPage <= amountPages && amountPages !== NaN) {
          search(localStorage.searched, currentPage, true);
        }
      }
    });
  };
}

function fillContent(splicedResult) {
  for (const ind in splicedResult) {
    document.querySelector('.main').insertAdjacentHTML('beforeend',
      `<single-movie 
          data-poster=${JSON.stringify(splicedResult[ind].Poster)} 
          title="${splicedResult[ind].Title}"
          data-year="${splicedResult[ind].Year}"
          data-type="${splicedResult[ind].Type}"
          data-imdb="${splicedResult[ind].imdbID}"
          >
        </single-movie>`);
  }
  resizeObs();
}

class SingleMovie extends HTMLElement {
  constructor() {
    super();
    this._shadowRoot = this.attachShadow({ 'mode': 'open' });
    this._shadowRoot.appendChild(template.content.cloneNode(true));
  }

  static get properties() {
    return {
      title: { type: String },
      poster: { type: String },
      year: { type: String },
      type: { type: String },
      imdb: { type: String },
    };
  }

  connectedCallback() {
    this.shadowRoot.querySelector('.card').setAttribute('style',
    `background-image: url(${this.dataset.poster}); 
    background-repeat: no-repeat;
    background-position: center; 
    background-size: cover;
    `);
    this.shadowRoot.querySelector('#title').insertAdjacentHTML('afterbegin', this.title);
    this.shadowRoot.querySelector('.more .type').textContent = 'Type: ' + this.dataset.type;
    this.shadowRoot.querySelector('.more .year').textContent = 'Year: ' + this.dataset.year;
    this.shadowRoot.querySelector('.more .imdbID').textContent = 'Imdb ID: ' + this.dataset.imdb;
    
    this.shadowRoot.querySelector('#title .see-more').addEventListener('click', () => {
      this.shadowRoot.querySelector('.card #more').classList.toggle("hide");
    });
    this.shadowRoot.querySelector('.card #more').addEventListener('click', () => {
      this.shadowRoot.querySelector('.card #more').classList.toggle("hide");
    });
    this.shadowRoot.querySelector('#sample').addEventListener('click', () => {
      this.shadowRoot.querySelector('video').classList.toggle("hide");
    });
    this.shadowRoot.querySelector('video').addEventListener('click', () => {
      this.shadowRoot.querySelector('video').classList.toggle("hide");
    });
  }
}

customElements.define('single-movie', SingleMovie);
