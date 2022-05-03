import * as http from 'http';

import async from 'async';
import { SNSEvent, SNSMessage } from 'aws-lambda';

const MAX_CONCURRENCY = 10;

type SnsHandler = {
  (event: SNSEvent): Promise<void>;
};

async function readBody(req: http.IncomingMessage): Promise<string> {
  let data = '';
  for await (const chunk of req) {
    data += chunk;
  }
  return data;
}

export async function localSnsListener(port: number, snsHandler: SnsHandler): Promise<void> {
  // Limit the number of items that are processed concurrently
  const workQueue = async.queue(async (notification: SNSMessage) => {
    try {
      await snsHandler({
        Records: [
          {
            EventVersion: '1.0',
            EventSubscriptionArn: 'arn:aws:sns:local:0',
            EventSource: 'aws:sns',
            Sns: notification,
          },
        ],
      });
    } catch (err) {
      console.error(err);
    }
  }, MAX_CONCURRENCY);

  const server = http.createServer(async (req, res) => {
    if (req.method !== 'POST') {
      res.statusCode = 405;
      res.end();
      return;
    }

    let body;
    try {
      const content = await readBody(req);
      body = JSON.parse(content);
    } catch (err) {
      console.error(err);
      res.statusCode = 400;
      res.end();
      return;
    }

    workQueue.push(body);

    res.end();
  });

  server.on('error', (err) => {
    console.error(err);
  });

  server.on('clientError', (err, socket) => {
    console.error(err);
    socket.end('HTTP/1.1 400 Bad Request\r\n\r\n');
  });

  server.listen(port, 'localhost', () => {
    console.log(`Listening for messages at http://localhost:${port}`);
  });
}
