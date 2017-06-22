// A web-oriented es6 script to link to points within pdfs
// This is a work-in-progress / proof-of-concept. Hence, nearly all this code is
// adapted/taken from the examples at https://mozilla.github.io/pdf.js/examples/
/* eslint-disable no-alert, no-console, no-debugger */
// pdfjs init
if (ENV !== 'production') {
  document.write(
    '<script src="http://' + (location.host || 'localhost').split(':')[0] +
      ':35729/livereload.js?snipver=1"></' + 'script>'
  );
}

import PDFJS from 'pdfjs-dist';
import { parse } from 'query-string';
/* -------------------------------------init--------------------------------- */
const base = location.host + location.pathname;
PDFJS.workerSrc = `//${base.replace(/\/[^\/]+\.html/, '')}/build/` +
  'pdf.worker.min.js';
// ^ this assignment doesn't work and I don't know why, but I added 
// pdf-linkr.worker.min.js to ./build .  PDFJS points to that as a default.

const hash = parse(location.hash); // use #page=num as in standard pdf
const search = parse(location.search);
var {file, x, y} = search;
var page = Number(hash.page);
var params = {x, y, page};
if (!file){
  file = encodeURI(
    prompt(
      'please enter a url to a readily-available pdf',
      'https://arxiv.org/pdf/1504.05140.pdf'
    )
  );
  page = 1;
}
var pdfDoc = null,
  pageNum = Number(page),
  pageRendering = false,
  pageNumPending = null,
  scale = 1.5,
  canvas = document.getElementById('the-canvas'),
  ctx = canvas.getContext('2d');
/*--------------------------circle-drawing functions--------------------------*/
function setCircleAttr (circle, attr, val) {
  circle.setAttribute(attr, parseInt(val));
}
const positionCircle = (circle, x, y) => {
  setCircleAttr(circle, 'r', 20);
  setCircleAttr(circle, 'cx', x);
  setCircleAttr(circle, 'cy', y);
};
/**
 * Draws a circle at the point on the pdf specified in the url
 * @param {} num
 */
function drawLinkCircle(num){
  console.log('drawCircle');
  let circle = document.getElementById('link-marker');
  if (num === params.page){
    const {height, width} = canvas;
    const _x = Number(x) * width;
    const _y = Number(y) * height;
    positionCircle(circle, _x, _y);
  } else {
    setCircleAttr(circle, 'r', 0);
  }
}
/**
 * Draws a circle on at the point of a click on the pdf
 * @param {} e
 */
function drawClickCircle(e){
  console.log(e);
  let circle = document.getElementById('click-marker');
  let div = document.getElementById('container');
  //note svg, canvas, and div cover each other exactly
  let [offsetX, offsetY] = [div.offsetLeft, div.offsetTop];
  let [clickX, clickY] = [e.clientX - offsetX, e.clientY - offsetY];
  let canvas = document.getElementById('the-canvas');
  let  [_x, _y] = [clickX / canvas.width , clickY / canvas.height];
  positionCircle(circle, clickX, clickY);
  let textbox = document.getElementById('point-link-to-copy');
  let pageNum = document.getElementById('page_num').textContent;
  textbox.value = `http://${base}?x=${_x}&y=${_y}` +
    `&file=${encodeURIComponent(file)}#page=${pageNum}`;
}

/*
function drawCircleCanvas(num) {
  console.log('drawCircle');
  let _ctx = document.getElementById('the-canvas').getContext('2d');
  if (num === params.page){
    _ctx.globalCompositeOperation = 'destination-over';
    _ctx.fillStyle = 'rgba(231, 13, 13, 0.45)';
    _ctx.beginPath();
    const {height, width} = canvas;
    const _x = Number(x) * width;
    const _y = Number(y) * height;
    
    _ctx.arc(_x, _y, 10, 0, 2 * Math.PI, true);
    _ctx.fill();
  }
} */
/* pdf rendering from example, mostly */
/**
 * Get page info from document, resize canvas accordingly, and render page.
 * @param num Page number.
 */
function renderPage(num) {
  console.log('renderPage');
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
      let pageLink = `${file}#page=${num}`;
      document.getElementById('page-link-to-copy').value = pageLink;
      pageRendering = false;
      if (pageNumPending !== null) {
        // New page rendering is pending
        renderPage(pageNumPending);
        pageNumPending = null;
      }
    });
  }).then(()=>{
    console.log('then', num);
    drawLinkCircle(num);
  });
}

//TODO: scrollTop <-> window innerWidth, innerHeight =>
// https://developer.mozilla.org/en-US/docs/Web/API/GlobalEventHandlers/onresize

/**
 * If another page rendering in progress, waits until the rendering is
 * finised. Otherwise, executes rendering immediately.
 */
function queueRenderPage(num) {
  console.log('queueRenderPage');
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
  console.log('onPrevPage');
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
  console.log('onNextPage');
  if (pageNum >= pdfDoc.numPages) {
    return;
  }
  pageNum++;
  queueRenderPage(pageNum);
}
document.getElementById('next').addEventListener('click', onNextPage);
document.getElementById('svg-cover').addEventListener('click', drawClickCircle);
function copy(e){
  let toCopy = document.querySelector(e.target.dataset.toCopy);
  toCopy.select();
  try {
    document.execCommand('copy');
  } catch (err){
    alert('Press Ctrl+C to copy the link');
  }
}
const makeCopyable = (id) => {
  let el = document.getElementById(id);
  el.addEventListener('click', copy);
};
makeCopyable('copy-point-link');
makeCopyable('copy-page-link');


/* -------------------------------- main ------------------------------------ */
/**
 * Asynchronously downloads PDF.
 */
PDFJS.getDocument(file).then(
  function(pdfDoc_) {
    pdfDoc = pdfDoc_;
    document.getElementById('page_count').textContent = pdfDoc.numPages;
    document.getElementById('point-link-to-copy').value = base;
    renderPage(pageNum);
  }
);
