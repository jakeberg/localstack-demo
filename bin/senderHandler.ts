import async from 'async';
import { QueueSqs } from '../src/queue';

export async function senderHandler(): Promise<void> {
  const queueUrl = process.env.QUEUE_URL;

  const ids: string[] = ['id-1', 'id-2'];

  const sqsQueue = new QueueSqs(queueUrl || '');

  await async.eachSeries(ids, async (appId: string) => {
    const queue = async.queue<{ appId: string }>(async (event) => {
      await sqsQueue.push(JSON.stringify(event));
    });

    queue.push({ appId });

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
