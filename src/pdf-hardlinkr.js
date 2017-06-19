// A web-oriented es6 script to link to points within pdfs
// This is a work-in-progress / proof-of-concept. Hence, nearly all this code is
// adapted/taken from the examples at https://mozilla.github.io/pdf.js/examples/

// pdfjs init
import * from 'pdfjs-dist';
import {parse} from 'query-string';

// If absolute URL from the remote server is provided, configure the CORS
// header on that server.

const hash = parse(location.hash) // use #page=num as in standard pdf
const search = parse(location.search)
const {file, x, y} = search;
const {page} = hash;
for (let thing in {file, x, y, page}){
  if (!thing){
    alert(`missing {thing}`);
    throw new Error('missing required urlencoded search parameter ' + thing);
  }
}

function drawCircle() {
  ctx.globalCompositeOperation = 'source-out';
  ctx.fillStyle = 'rgba(231, 13, 13, 0.45)';
  ctx.beginPath();
  const {height, width} = canvas;
  const _x = x * width;
  const _y = y * height;
  ctx.arc(x, y, 10, 0, 2 * Math.PI;, true);
  ctx.fill();
}

// The workerSrc property shall be specified. // TODO: check this works
PDFJS.workerSrc = '//mozilla.github.io/pdf.js/build/pdf.worker.js';

var pdfDoc = null,
  pageNum = page,
  pageRendering = false,
  pageNumPending = null,
  scale = 2,
  canvas = document.getElementById('the-canvas'),
  ctx = canvas.getContext('2d'),

/**
 * Get page info from document, resize canvas accordingly, and render page.
 * @param num Page number.
 */
function renderPage(num) {
  pageRendering = true;
  // Using promise to fetch the page
  pdfDoc.getPage(num).then(function(page) {
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
      if (num == page){
	drawCircle();
      }
      pageRendering = false;
      if (pageNumPending !== null) {
        // New page rendering is pending
        renderPage(pageNumPending);
        pageNumPending = null;
      }
    });
  });

  // Update page counters
  document.getElementById('page_num').textContent = pageNum;
}

