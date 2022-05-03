import async from 'async';
import { QueueSqs } from '../src/queue';

export async function senderHandler(): Promise<void> {
  const queueUrl = process.env.QUEUE_URL;

  const messages: string[] = ['message-1', 'message-2'];

  const sqsQueue = new QueueSqs(queueUrl || '');

  await async.eachSeries(messages, async (message: string) => {
    const queue = async.queue<{ message: string }>(async (event) => {
      await sqsQueue.push(JSON.stringify(event));
    });

    queue.push({ message });

    if (queue.length() > 0) {
      await queue.drain();
    }
  });
}

senderHandler()
  .then(() => {
    // Need to call exit because of knex connection pool
    process.exit(0);
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
