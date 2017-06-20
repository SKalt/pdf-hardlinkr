// A web-oriented es6 script to link to points within pdfs
// This is a work-in-progress / proof-of-concept. Hence, nearly all this code is
// adapted/taken from the examples at https://mozilla.github.io/pdf.js/examples/
/* eslint-disable no-alert, no-console, no-debugger */
// pdfjs init
import PDFJS from 'pdfjs-dist';
import { parse } from 'query-string';
console.log(PDFJS);
const base = location.host + location.pathname;
PDFJS.disableWorker = true;
PDFJS.workerSrc = `//${base.replace(/\/[^\/]+\.html/, '')}/build/pdf.worker.min.js`;
// ^ this assignment doesn't work and I don't know why, but I added 
// pdf-linkr.worker.min.js to ./build .  PDFJS points to that as a default.
console.log(PDFJS.workerSrc);
// If absolute URL from the remote server is provided, configure the CORS
// header on that server.

const hash = parse(location.hash); // use #page=num as in standard pdf
const search = parse(location.search);
console.log(search);
const {file, x, y} = search;
const {page} = hash;
const params = {file, x, y, page};
for (let param in params){
  if (!param){
    alert(`missing ${param}`);
    throw new Error('missing required urlencoded search parameter ' + param);
  }
}
console.log({file, x, y, page});

function drawCircle(num) {
  if (num === page){
    ctx.globalCompositeOperation = 'source-out';
    ctx.fillStyle = 'rgba(231, 13, 13, 0.45)';
    ctx.beginPath();
    const {height, width} = canvas;
    const _x = Number(x) * width;
    const _y = Number(y) * height;
    ctx.arc(_x, _y, 10, 0, 2 * Math.PI, true);
    ctx.fill();
  }
}

var pdfDoc = null,
  pageNum = page,
  pageRendering = false,
  pageNumPending = null,
  scale = 2,
  canvas = document.getElementById('the-canvas'),
  ctx = canvas.getContext('2d');
/**
 * Get page info from document, resize canvas accordingly, and render page.
 * @param num Page number.
 */
function renderPage(num) {
  pageRendering = true;
  // Using promise to fetch the page
  // Update page counters
  document.getElementById('page_num').textContent = pageNum;
  return pdfDoc.getPage(num).then(function(page) {
    var viewport = page.getViewport(scale);
    canvas.height = viewport.height;
    canvas.width = viewport.width;

    // Render PDF page into canvas context
    var renderContext = {
      canvasContext: ctx,
      viewport: viewport
    };
    var renderTask = page.render(renderContext);
    
    // Wait for rendering to finish
    renderTask.promise.then(function() {
      let pageLink = `${base}?file=${encodeURIComponent(file)}#page=${num}`;
      document.getElementById('page-link-to-copy').text(pageLink);
      if (num == page){
        drawCircle(num);
      }
      pageRendering = false;
      if (pageNumPending !== null) {
        // New page rendering is pending
        renderPage(pageNumPending);
        pageNumPending = null;
      }
    });
  });
}

//TODO: scrollTop <-> window innerWidth, innerHeight =>
// https://developer.mozilla.org/en-US/docs/Web/API/GlobalEventHandlers/onresize

/**
 * If another page rendering in progress, waits until the rendering is
 * finised. Otherwise, executes rendering immediately.
 */
function queueRenderPage(num) {
  if (pageRendering) {
    pageNumPending = num;
  } else {
    renderPage(num);
  }
}

/**
 * Displays previous page.
 */
function onPrevPage() {
  if (pageNum <= 1) {
    return;
  }
  pageNum--;
  queueRenderPage(pageNum);
}
document.getElementById('prev').addEventListener('click', onPrevPage);

/**
 * Displays next page.
 */
function onNextPage() {
  if (pageNum >= pdfDoc.numPages) {
    return;
  }
  pageNum++;
  queueRenderPage(pageNum);
}
document.getElementById('next').addEventListener('click', onNextPage);

/* -------------------------------- main ------------------------------------ */
/**
 * Asynchronously downloads PDF.
 */
PDFJS.getDocument(file).then(
  function(pdfDoc_) {
    pdfDoc = pdfDoc_;
    document.getElementById('page_count').textContent = pdfDoc.numPages;

    // Initial/first page rendering
    renderPage(pageNum);
  }
);
