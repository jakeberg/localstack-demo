import { QueueSqs } from '../src/queue';

export async function queueHandler(): Promise<void> {
  const queueUrl = process.env.QUEUE_URL;

  const appScanQueue = new QueueSqs(queueUrl || '');

  let eventJson = await appScanQueue.pop();
  while (eventJson) {
    console.log(eventJson);

    eventJson = await appScanQueue.pop();
  }
}

queueHandler()
  .then(() => {
    process.exit(0);
  })
  .catch((err) => console.error(err));
