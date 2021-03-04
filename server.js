const http = require('http');
const path = require('path');
const Koa = require('koa');
const koaBody = require('koa-body');
const uuid = require('uuid');
const serve = require('koa-static');
const Router = require('@koa/router');
const { streamEvents } = require('http-event-stream');

const initCors = require('./cors');

const app = new Koa();
const router = new Router();

const publicDirPath = path.join(__dirname, '/public');

app.use(initCors);
app.use(
  koaBody({
    text: true,
    urlencoded: true,
    multipart: true,
    json: true,
  })
);

const events = require('./events');
const eventsLog = [];
const clients = [];

router.get('/sse', async (ctx) => {
  streamEvents(ctx.req, ctx.res, {
    async fetch(lastEventId) {
      const lastEventIndex = eventsLog.findIndex((elem) => elem.id === lastEventId);
      if (lastEventIndex !== -1) {
        const lastEvents = eventsLog.slice(lastEventIndex + 1, eventsLog.length);
        return lastEvents;
      }
      return [];
    },

    stream(sse) {
      if (eventsLog.length > 0) {
        eventsLog.forEach((event) => {
          sse.sendEvent(event);
        });
      }
      clients.push(sse);
      return () => {
        // не проверял, работает или нет
        const index = clients.findIndex((elem) => elem === sse);
        clients.splice(index, 1);
      };
    },
  });
  ctx.respond = false;
});

let interval;
startInterval();

function startInterval() {
  sendNewEvent(events[0]);
  interval = setInterval(sendEventInterval, 1000);
}

function sendEventInterval() {
  const randomEvent = getRandomEvent(events);
  sendNewEvent(randomEvent);

  if (eventsLog.length >= 50) {
    clearInterval(interval);
    setTimeout(() => (eventsLog.length = 0), 5000);
    setTimeout(startInterval, 10000);
  }
}

function sendNewEvent(event) {
  const newEvent = {
    id: uuid.v4(),
    data: JSON.stringify({ message: event.message, date: new Date() }),
    event: event.type,
  };
  eventsLog.push(newEvent);

  clients.forEach((sse) => {
    sse.sendEvent(newEvent);
  });
}

function getRandomEvent(events) {
  const randomNumber = Math.floor(Math.random() * 100) + 1;
  let sum = 0;
  for (let i = 0; i < events.length; i++) {
    sum += events[i].chance;
    if (randomNumber > sum) continue;
    return { ...events[i] };
  }
}

app.use(router.routes()).use(router.allowedMethods());
app.use(serve(publicDirPath));

const port = process.env.PORT || 7070;
http.createServer(app.callback()).listen(port);
